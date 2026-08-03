"""Re-import a generated GLB, replace packed textures, and export a mobile candidate."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import bpy


MAX_TEXTURE_DIMENSION = 1024


def script_args() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.armatures,
        bpy.data.materials,
        bpy.data.images,
        bpy.data.cameras,
        bpy.data.lights,
    ):
        for datablock in list(collection):
            if datablock.users == 0:
                collection.remove(datablock)


def safe_filename(name: str, index: int) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "-", name).strip("-.")
    return f"{index:02d}-{cleaned or 'texture'}.png"


def image_nodes_for(target: bpy.types.Image) -> list[bpy.types.ShaderNodeTexImage]:
    nodes: list[bpy.types.ShaderNodeTexImage] = []
    for material in bpy.data.materials:
        if not material.use_nodes or material.node_tree is None:
            continue
        for node in material.node_tree.nodes:
            if node.type == "TEX_IMAGE" and node.image == target:
                nodes.append(node)
    return nodes


def optimize_images(directory: Path) -> list[dict[str, object]]:
    directory.mkdir(parents=True, exist_ok=True)
    report: list[dict[str, object]] = []
    scene = bpy.context.scene
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.compression = 85

    source_images = [
        image
        for image in list(bpy.data.images)
        if image.name not in {"Render Result", "Viewer Node"}
    ]

    for index, source_image in enumerate(source_images):
        width, height = int(source_image.size[0]), int(source_image.size[1])
        if width <= 0 or height <= 0:
            try:
                _ = source_image.pixels[0]
            except Exception as error:
                raise RuntimeError(f"Could not load texture {source_image.name}: {error}") from error
            width, height = int(source_image.size[0]), int(source_image.size[1])
        if width <= 0 or height <= 0:
            raise RuntimeError(f"Texture has no dimensions: {source_image.name}")

        target_width, target_height = width, height
        resized = max(width, height) > MAX_TEXTURE_DIMENSION
        if resized:
            ratio = MAX_TEXTURE_DIMENSION / max(width, height)
            target_width = max(1, round(width * ratio))
            target_height = max(1, round(height * ratio))
            source_image.scale(target_width, target_height)

        optimized_path = directory / safe_filename(source_image.name, index)
        original_filepath = source_image.filepath
        original_colorspace = source_image.colorspace_settings.name
        original_alpha_mode = source_image.alpha_mode
        source_image.filepath_raw = str(optimized_path)
        source_image.file_format = "PNG"
        source_image.save()
        if not optimized_path.is_file() or optimized_path.stat().st_size == 0:
            raise RuntimeError(f"Could not save optimized texture: {optimized_path}")

        replacement = bpy.data.images.load(str(optimized_path), check_existing=False)
        replacement.name = f"{source_image.name}__mobile"
        replacement.colorspace_settings.name = original_colorspace
        replacement.alpha_mode = original_alpha_mode

        users = image_nodes_for(source_image)
        if not users:
            bpy.data.images.remove(replacement, do_unlink=True)
            raise RuntimeError(f"Texture is not referenced by any material node: {source_image.name}")
        for node in users:
            node.image = replacement

        old_name = source_image.name
        bpy.data.images.remove(source_image, do_unlink=True)
        report.append(
            {
                "name": old_name,
                "replacement": replacement.name,
                "materialNodeUsers": len(users),
                "originalFilepath": original_filepath,
                "optimizedFilepath": str(optimized_path),
                "original": [width, height],
                "exported": [target_width, target_height],
                "resized": resized,
                "optimizedBytes": optimized_path.stat().st_size,
            }
        )

    if not report:
        raise RuntimeError("No embedded GLB textures were loaded for optimization")

    remaining_packed = [image.name for image in bpy.data.images if image.packed_file]
    if remaining_packed:
        raise RuntimeError(f"Packed images remain after material replacement: {remaining_packed}")
    return report


def main() -> None:
    args = script_args()
    if len(args) != 4:
        raise SystemExit(
            "Usage: blender -b --python optimize_glb_candidate.py -- "
            "INPUT.glb OUTPUT.glb TEXTURE_WORKDIR CANDIDATE_REPORT.json"
        )

    source_path = Path(args[0]).resolve()
    optimized_path = Path(args[1]).resolve()
    texture_directory = Path(args[2]).resolve()
    candidate_report_path = Path(args[3]).resolve()
    if not source_path.is_file():
        raise FileNotFoundError(source_path)

    clear_scene()
    bpy.ops.import_scene.gltf(filepath=str(source_path))
    imported_objects = list(bpy.context.scene.objects)
    if not any(obj.type == "ARMATURE" for obj in imported_objects):
        raise RuntimeError("Re-imported GLB has no armature")
    if not any(obj.type == "MESH" for obj in imported_objects):
        raise RuntimeError("Re-imported GLB has no meshes")

    texture_report = optimize_images(texture_directory)
    bpy.ops.object.select_all(action="SELECT")
    optimized_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(optimized_path),
        export_format="GLB",
        use_selection=True,
        export_animations=False,
        export_yup=True,
        export_apply=True,
    )
    if not optimized_path.is_file() or optimized_path.stat().st_size < 1024:
        raise RuntimeError("Optimized GLB export did not produce a valid file")

    report = json.loads(candidate_report_path.read_text(encoding="utf-8"))
    report["texturePolicy"] = {
        "maxDimension": MAX_TEXTURE_DIMENSION,
        "stage": "post-export-reimport",
        "materialImagesReplaced": True,
        "images": texture_report,
    }
    report["unoptimizedGlbBytes"] = source_path.stat().st_size
    report["glbBytes"] = optimized_path.stat().st_size
    candidate_report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"Replaced and optimized {len(texture_report)} packed textures")
    print(f"Unoptimized GLB: {source_path.stat().st_size} bytes")
    print(f"Optimized GLB: {optimized_path.stat().st_size} bytes")


if __name__ == "__main__":
    main()
