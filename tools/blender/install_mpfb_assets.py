"""Install a MakeHuman asset-pack ZIP into MPFB's isolated user-data directory."""

from __future__ import annotations

import importlib
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path


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


def locate_asset_root(extracted: Path) -> Path:
    markers = list(extracted.rglob("female_casualsuit01.mhclo"))
    if not markers:
        markers = list(extracted.rglob("female_sportsuit01.mhclo"))
    if not markers:
        raise FileNotFoundError("Could not locate a known fully clothed female asset in the pack")

    clothes_dir = markers[0].parent
    if clothes_dir.name != "clothes":
        raise RuntimeError(f"Unexpected clothes directory: {clothes_dir}")
    return clothes_dir.parent


def main() -> None:
    args = script_args()
    if len(args) != 1:
        raise SystemExit("Usage: blender -b --python install_mpfb_assets.py -- ASSET_PACK.zip")

    archive = Path(args[0]).resolve()
    if not archive.is_file():
        raise FileNotFoundError(archive)

    location_service = dynamic_import("mpfb.services.locationservice", "LocationService")
    destination = Path(location_service.get_user_data()).resolve()
    destination.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="mpfb-assets-") as temporary:
        extracted = Path(temporary)
        with zipfile.ZipFile(archive) as package:
            package.extractall(extracted)
        source_root = locate_asset_root(extracted)

        copied = []
        for child in sorted(source_root.iterdir()):
            target = destination / child.name
            if child.is_dir():
                shutil.copytree(child, target, dirs_exist_ok=True)
                copied.append(child.name)
            elif child.is_file():
                shutil.copy2(child, target)
                copied.append(child.name)

    required = [
        destination / "clothes" / "female_casualsuit01.mhclo",
        destination / "eyes" / "low-poly.mhclo",
    ]
    missing = [str(path) for path in required if not path.exists()]
    if missing:
        raise FileNotFoundError(f"Installed asset pack is incomplete: {missing}")

    print(f"MPFB assets installed to {destination}")
    print(f"Copied top-level entries: {', '.join(copied)}")


if __name__ == "__main__":
    main()
