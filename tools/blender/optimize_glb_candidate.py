"""Re-import a generated GLB, downscale loaded textures, and export a mobile candidate."""

from __future__ import annotations

import json
import re
import shutil
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


def optimize_images(directory: Path) -> list[dict[str, object]]:
    directory.mkdir(parents=True, exist_ok=True)
    report: list[dict[str, object]] = []
    scene = bpy.context.scene
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.compression = 85

    for index, image in enumerate(list(bpy.data.images)):
        if image.name in {"Render Result", "Viewer Node"}:
            continue

        width, height = int(image.size[0]), int(image.size[1])
        if width <= 0 or height <= 0:
            try:
                _ = image.pixels[0]
            except Exception as error:
                raise RuntimeError(f"Could not load texture {image.name}: {error}") from error
            width, height = int(image.size[0]), int(image.size[1])
        if width <= 0 or height <= 0:
            raise RuntimeError(f"Texture has no dimensions: {image.name}")

        target_width, target_height = width, height
        resized = max(width, height) > MAX_TEXTURE_DIMENSION
        if resized:
            ratio = MAX_TEXTURE_DIMENSION / max(width, height)
            target_width = max(1, round(width * ratio))
            target_height = max(1, round(height * ratio))
            image.scale(target_width, target_height)

        optimized_path = directory / safe_filename(image.name, index)
        original_filepath = image.filepath
        image.filepath_raw = str(optimized_path)
        image.file_format = "PNG"
        image.save()
        image.filepath = str(optimized_path)
        image.reload()

        report.append(
            {
                "name": image.name,
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
        "images": texture_report,
    }
    report["unoptimizedGlbBytes"] = source_path.stat().st_size
    report["glbBytes"] = optimized_path.stat().st_size
    candidate_report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"Optimized {len(texture_report)} textures")
    print(f"Unoptimized GLB: {source_path.stat().st_size} bytes")
    print(f"Optimized GLB: {optimized_path.stat().st_size} bytes")


if __name__ == "__main__":
    main()
