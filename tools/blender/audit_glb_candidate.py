"""Audit an exported GLB using only the Python standard library."""

from __future__ import annotations

import argparse
import json
import struct
import sys
from pathlib import Path


GLB_MAGIC = b"glTF"
JSON_CHUNK = 0x4E4F534A
BIN_CHUNK = 0x004E4942


def png_dimensions(data: bytes) -> tuple[int, int]:
    if not data.startswith(b"\x89PNG\r\n\x1a\n") or len(data) < 24:
        raise ValueError("Invalid PNG payload")
    return struct.unpack(">II", data[16:24])


def jpeg_dimensions(data: bytes) -> tuple[int, int]:
    if not data.startswith(b"\xff\xd8"):
        raise ValueError("Invalid JPEG payload")
    offset = 2
    while offset + 4 <= len(data):
        if data[offset] != 0xFF:
            offset += 1
            continue
        while offset < len(data) and data[offset] == 0xFF:
            offset += 1
        if offset >= len(data):
            break
        marker = data[offset]
        offset += 1
        if marker in {0xD8, 0xD9}:
            continue
        if offset + 2 > len(data):
            break
        length = struct.unpack(">H", data[offset : offset + 2])[0]
        if length < 2 or offset + length > len(data):
            break
        if marker in {0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF}:
            if length < 7:
                break
            height, width = struct.unpack(">HH", data[offset + 3 : offset + 7])
            return width, height
        offset += length
    raise ValueError("JPEG dimensions not found")


def image_dimensions(mime_type: str, data: bytes) -> tuple[int, int]:
    if mime_type == "image/png":
        return png_dimensions(data)
    if mime_type in {"image/jpeg", "image/jpg"}:
        return jpeg_dimensions(data)
    raise ValueError(f"Unsupported embedded image type: {mime_type}")


def read_glb(path: Path) -> tuple[dict, bytes, int]:
    payload = path.read_bytes()
    if len(payload) < 20:
        raise ValueError("GLB is too small")
    magic, version, declared_length = struct.unpack_from("<4sII", payload, 0)
    if magic != GLB_MAGIC:
        raise ValueError(f"Unexpected GLB magic: {magic!r}")
    if version != 2:
        raise ValueError(f"Unexpected glTF version: {version}")
    if declared_length != len(payload):
        raise ValueError(f"Declared GLB length {declared_length} differs from {len(payload)}")

    offset = 12
    json_payload = None
    binary_payload = b""
    while offset < len(payload):
        chunk_length, chunk_type = struct.unpack_from("<II", payload, offset)
        offset += 8
        chunk = payload[offset : offset + chunk_length]
        offset += chunk_length
        if chunk_type == JSON_CHUNK:
            json_payload = json.loads(chunk.decode("utf-8").rstrip("\x00 \t\r\n"))
        elif chunk_type == BIN_CHUNK:
            binary_payload = chunk
    if json_payload is None:
        raise ValueError("GLB does not contain a JSON chunk")
    return json_payload, binary_payload, len(payload)


def audit(path: Path, max_bytes: int, max_texture_dimension: int) -> dict:
    gltf, binary, byte_length = read_glb(path)
    buffer_views = gltf.get("bufferViews", [])
    images = []
    for index, image in enumerate(gltf.get("images", [])):
        if "bufferView" not in image:
            raise ValueError(f"Image {index} is external; the candidate must be self-contained")
        view = buffer_views[image["bufferView"]]
        start = view.get("byteOffset", 0)
        end = start + view["byteLength"]
        data = binary[start:end]
        mime_type = image.get("mimeType", "")
        width, height = image_dimensions(mime_type, data)
        images.append(
            {
                "index": index,
                "name": image.get("name", f"image-{index}"),
                "mimeType": mime_type,
                "bytes": len(data),
                "width": width,
                "height": height,
            }
        )

    skins = gltf.get("skins", [])
    joint_count = sum(len(skin.get("joints", [])) for skin in skins)
    report = {
        "glbBytes": byte_length,
        "sceneCount": len(gltf.get("scenes", [])),
        "nodeCount": len(gltf.get("nodes", [])),
        "meshCount": len(gltf.get("meshes", [])),
        "skinCount": len(skins),
        "jointCount": joint_count,
        "animationCount": len(gltf.get("animations", [])),
        "materialCount": len(gltf.get("materials", [])),
        "textureCount": len(gltf.get("textures", [])),
        "imageCount": len(images),
        "embeddedImageBytes": sum(image["bytes"] for image in images),
        "maxTextureDimension": max((max(image["width"], image["height"]) for image in images), default=0),
        "images": images,
    }

    if report["sceneCount"] < 1:
        raise ValueError("Candidate has no scene")
    if report["meshCount"] < 6:
        raise ValueError(f"Candidate has too few meshes: {report['meshCount']}")
    if report["skinCount"] < 1 or report["jointCount"] < 40:
        raise ValueError(f"Candidate rig is incomplete: {report['skinCount']} skins, {report['jointCount']} joints")
    if report["maxTextureDimension"] > max_texture_dimension:
        raise ValueError(
            f"Texture exceeds {max_texture_dimension} pixels: {report['maxTextureDimension']}"
        )
    if byte_length > max_bytes:
        raise ValueError(f"Candidate exceeds the {max_bytes}-byte budget: {byte_length} bytes")
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description="Audit a self-contained MPFB GLB candidate")
    parser.add_argument("model", type=Path)
    parser.add_argument("report", type=Path)
    parser.add_argument("--max-bytes", type=int, default=12 * 1024 * 1024)
    parser.add_argument("--max-texture-dimension", type=int, default=1024)
    args = parser.parse_args()

    model_path = args.model.resolve()
    report_path = args.report.resolve()
    report = audit(model_path, args.max_bytes, args.max_texture_dimension)
    report["auditBudget"] = {
        "maxBytes": args.max_bytes,
        "maxTextureDimension": args.max_texture_dimension,
    }
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
