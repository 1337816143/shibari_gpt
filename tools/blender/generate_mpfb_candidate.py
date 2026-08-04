"""Create a fully clothed adult female MPFB candidate, export GLB, and render QA views."""

from __future__ import annotations

import importlib
import json
import math
import os
import sys
from pathlib import Path

import bpy
from mathutils import Vector


MAX_TEXTURE_DIMENSION = 1024

WARDROBES = {
    "sports-original": {
        "asset": "female_sportsuit01.mhclo",
        "presentation": "neutral-sportswear-midriff",
        "description": "short athletic top, leggings, and shoes; abdomen remains visible",
    },
    "casual-original": {
        "asset": "female_casualsuit01.mhclo",
        "presentation": "neutral-fully-clothed",
        "description": "short-sleeve shirt, long trousers, and shoes",
    },
}


def dynamic_import(package_suffix: str, key: str):
    for module_name in list(sys.modules):
        if module_name.endswith(package_suffix):
            module = importlib.import_module(module_name)
            if not hasattr(module, key):
                raise AttributeError(f"Module {module_name} has no {key}")
            return getattr(module, key)
    raise RuntimeError(f"No loaded module ends with {package_suffix}")


def script_args() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def first_asset(asset_service, subdir: str, candidates: list[str], required: bool = True) -> tuple[str | None, str | None]:
    for candidate in candidates:
        path = asset_service.find_asset_absolute_path(candidate, asset_subdir=subdir)
        if path:
            return candidate, path
    if required:
        raise FileNotFoundError(f"No {subdir} asset found from candidates: {candidates}")
    return None, None


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.armatures, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def hierarchy(root, object_service) -> list[bpy.types.Object]:
    return [root, *object_service.get_list_of_children(root)]


def world_bounds(objects: list[bpy.types.Object]) -> tuple[Vector, Vector]:
    points: list[Vector] = []
    for obj in objects:
        if obj.type != "MESH":
            continue
        points.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    if not points:
        raise RuntimeError("Export hierarchy has no mesh bounds")
    minimum = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    maximum = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    return minimum, maximum


def point_camera(camera: bpy.types.Object, target: Vector) -> None:
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()


def optimize_textures(max_dimension: int = MAX_TEXTURE_DIMENSION) -> list[dict[str, object]]:
    report: list[dict[str, object]] = []
    for image in bpy.data.images:
        if image.name in {"Render Result", "Viewer Node"} or not image.has_data:
            continue
        width, height = int(image.size[0]), int(image.size[1])
        if width <= 0 or height <= 0:
            continue
        target_width, target_height = width, height
        if max(width, height) > max_dimension:
            scale = max_dimension / max(width, height)
            target_width = max(1, round(width * scale))
            target_height = max(1, round(height * scale))
            image.scale(target_width, target_height)
        report.append(
            {
                "name": image.name,
                "original": [width, height],
                "exported": [target_width, target_height],
                "source": image.source,
            }
        )
    return report


def setup_render_scene(objects: list[bpy.types.Object], output_dir: Path) -> None:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 640
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.world.color = (0.035, 0.045, 0.047)

    minimum, maximum = world_bounds(objects)
    center = (minimum + maximum) * 0.5
    size = maximum - minimum
    radius = max(size.x, size.y, size.z) * 0.78
    ground_z = minimum.z

    bpy.ops.mesh.primitive_plane_add(size=max(size.x, size.y) * 3.5, location=(center.x, center.y, ground_z - 0.005))
    ground = bpy.context.object
    ground.name = "QA_Ground"
    material = bpy.data.materials.new("QA_Ground_Material")
    material.diffuse_color = (0.07, 0.09, 0.09, 1.0)
    ground.data.materials.append(material)

    def add_area(name: str, location: tuple[float, float, float], energy: float, size_value: float) -> None:
        data = bpy.data.lights.new(name, type="AREA")
        data.energy = energy
        data.shape = "DISK"
        data.size = size_value
        light = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(light)
        light.location = location
        point_camera(light, center)

    add_area("QA_Key", (center.x + radius * 1.8, center.y - radius * 2.1, center.z + radius * 1.5), 1300, radius * 1.2)
    add_area("QA_Fill", (center.x - radius * 1.6, center.y - radius * 1.2, center.z + radius * 0.8), 750, radius)
    add_area("QA_Rim", (center.x, center.y + radius * 2.0, center.z + radius * 1.4), 1000, radius)

    camera_data = bpy.data.cameras.new("QA_Camera")
    camera_data.lens = 58
    camera = bpy.data.objects.new("QA_Camera", camera_data)
    bpy.context.collection.objects.link(camera)
    scene.camera = camera

    views = {
        "front": Vector((0, -1, 0)),
        "back": Vector((0, 1, 0)),
        "left": Vector((-1, 0, 0)),
        "right": Vector((1, 0, 0)),
    }
    distance = radius * 3.1
    for label, direction in views.items():
        camera.location = center + direction * distance + Vector((0, 0, size.z * 0.03))
        point_camera(camera, center + Vector((0, 0, size.z * 0.02)))
        scene.render.filepath = str(output_dir / f"preview-{label}.png")
        bpy.ops.render.render(write_still=True)

    bpy.data.objects.remove(ground, do_unlink=True)


def select_hierarchy(objects: list[bpy.types.Object]) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.hide_viewport = False
        obj.hide_render = False
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]


def write_report(
    output_dir: Path,
    glb_path: Path,
    objects: list[bpy.types.Object],
    assets: list[dict[str, str]],
    texture_report: list[dict[str, object]],
    variant: str,
    presentation: str,
) -> None:
    meshes = [obj for obj in objects if obj.type == "MESH"]
    armatures = [obj for obj in objects if obj.type == "ARMATURE"]
    report = {
        "generator": "Blender 4.5 LTS + MPFB",
        "candidateStatus": "technical-review",
        "adultPresentation": True,
        "presentation": presentation,
        "variant": variant,
        "parameters": {
            "gender": 0.0,
            "age": 0.62,
            "muscle": 0.46,
            "weight": 0.50,
            "height": 0.53,
            "proportions": 0.44,
        },
        "assets": assets,
        "texturePolicy": {
            "maxDimension": MAX_TEXTURE_DIMENSION,
            "images": texture_report,
        },
        "objectCount": len(objects),
        "meshCount": len(meshes),
        "armatureCount": len(armatures),
        "vertexCount": sum(len(obj.data.vertices) for obj in meshes),
        "polygonCount": sum(len(obj.data.polygons) for obj in meshes),
        "materialCount": len({material.name for obj in meshes for material in obj.data.materials if material}),
        "boneCount": sum(len(obj.data.bones) for obj in armatures),
        "glbBytes": glb_path.stat().st_size,
        "objectTypes": {obj.name: obj.type for obj in objects},
    }
    (output_dir / "candidate-report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")


def main() -> None:
    args = script_args()
    if len(args) != 2:
        raise SystemExit(
            "Usage: blender -b --python generate_mpfb_candidate.py -- OUTPUT_DIR "
            "{sports-original|casual-original}"
        )

    output_dir = Path(args[0]).resolve()
    variant = args[1]
    wardrobe = WARDROBES.get(variant)
    if wardrobe is None:
        raise ValueError(f"Unsupported wardrobe variant: {variant}")
    output_dir.mkdir(parents=True, exist_ok=True)
    glb_path = output_dir / "shibari-adult-female-candidate.glb"

    human_service = dynamic_import("mpfb.services.humanservice", "HumanService")
    asset_service = dynamic_import("mpfb.services.assetservice", "AssetService")
    export_service = dynamic_import("mpfb.services.exportservice", "ExportService")
    object_service = dynamic_import("mpfb.services.objectservice", "ObjectService")
    target_service = dynamic_import("mpfb.services.targetservice", "TargetService")
    human_properties = dynamic_import("mpfb.entities.objectproperties", "HumanObjectProperties")

    clear_scene()
    basemesh = human_service.create_human()
    basemesh.name = "ShibariAdultFemaleCandidate"

    parameters = {
        "gender": 0.0,
        "age": 0.62,
        "muscle": 0.46,
        "weight": 0.50,
        "height": 0.53,
        "proportions": 0.44,
        "cupsize": 0.40,
        "firmness": 0.50,
        "african": 0.333,
        "asian": 0.333,
        "caucasian": 0.334,
    }
    for key, value in parameters.items():
        human_properties.set_value(key, value, entity_reference=basemesh)
    target_service.reapply_macro_details(basemesh)

    skin_name, skin_path = first_asset(
        asset_service,
        "skins",
        ["middleage_caucasian_female.mhmat", "young_caucasian_female.mhmat", "middleage_asian_female.mhmat"],
    )
    human_service.set_character_skin(skin_path, basemesh, skin_type="GAMEENGINE")
    human_service.add_builtin_rig(basemesh, "game_engine")

    requested_assets = [
        ("Eyes", "eyes", ["low-poly.mhclo"]),
        ("Eyebrows", "eyebrows", ["eyebrow001.mhclo"]),
        ("Eyelashes", "eyelashes", ["eyelashes01.mhclo"]),
        ("Teeth", "teeth", ["teeth_base.mhclo"]),
        ("Hair", "hair", ["ponytail01.mhclo", "short02.mhclo", "long01.mhclo"]),
        ("Clothes", "clothes", [wardrobe["asset"]]),
    ]
    added_assets: list[dict[str, str]] = [{"type": "Skin", "file": skin_name or "", "path": skin_path or ""}]
    for asset_type, subdir, candidates in requested_assets:
        filename, asset_path = first_asset(asset_service, subdir, candidates, required=True)
        human_service.add_mhclo_asset(asset_path, basemesh, asset_type=asset_type, material_type="GAMEENGINE")
        added_assets.append({"type": asset_type, "file": filename or "", "path": asset_path or ""})

    shoe_name, shoe_path = first_asset(
        asset_service,
        "clothes",
        ["shoes01.mhclo", "female_shoes01.mhclo", "female_sneakers01.mhclo", "female_boots01.mhclo"],
        required=False,
    )
    if shoe_path:
        human_service.add_mhclo_asset(shoe_path, basemesh, asset_type="Clothes", material_type="GAMEENGINE")
        added_assets.append({"type": "Shoes", "file": shoe_name or "", "path": shoe_path})

    texture_report = optimize_textures()

    export_root = export_service.create_character_copy(basemesh, name_suffix="_export")
    export_basemesh = object_service.find_object_of_type_amongst_nearest_relatives(export_root, "Basemesh")
    if export_basemesh is None:
        raise RuntimeError("Could not find export basemesh")
    export_service.bake_modifiers_remove_helpers(
        export_basemesh,
        bake_masks=True,
        bake_subdiv=True,
        remove_helpers=True,
        also_proxy=True,
    )

    export_objects = hierarchy(export_root, object_service)
    setup_render_scene(export_objects, output_dir)
    select_hierarchy(export_objects)

    bpy.ops.export_scene.gltf(
        filepath=str(glb_path),
        export_format="GLB",
        use_selection=True,
        export_animations=False,
        export_yup=True,
        export_apply=True,
    )
    if not glb_path.is_file() or glb_path.stat().st_size < 1024:
        raise RuntimeError("GLB export did not produce a valid file")

    write_report(
        output_dir,
        glb_path,
        export_objects,
        added_assets,
        texture_report,
        variant,
        wardrobe["presentation"],
    )
    (output_dir / "SOURCE.md").write_text(
        "# MPFB adult female candidate\n\n"
        "Generated with Blender 4.5 LTS and MPFB from the MakeHuman system-assets pack.\n"
        "The generated model and MakeHuman core/system assets are CC0.\n"
        f"Variant: {variant}.\n"
        f"Clothing asset: {wardrobe['asset']} ({wardrobe['description']}).\n"
        "This original-quality candidate retains source texture resolution.\n"
        "Status: technical candidate only; not a reviewed teaching model.\n",
        encoding="utf-8",
    )
    (output_dir / "LICENSE.txt").write_text(
        "CC0 1.0 Universal — generated MakeHuman/MPFB character and system assets.\n"
        "https://creativecommons.org/publicdomain/zero/1.0/\n",
        encoding="utf-8",
    )
    print(f"Generated candidate: {glb_path} ({glb_path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
