"""Install a MakeHuman asset-pack ZIP into MPFB's isolated user-data directory."""

from __future__ import annotations

import importlib
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path


SYSTEM_ASSET_DIRECTORIES = {
    "clothes",
    "eyes",
    "eyebrows",
    "eyelashes",
    "hair",
    "poses",
    "proxymeshes",
    "rigs",
    "skins",
    "teeth",
    "tongue",
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


def asset_directory_names(path: Path) -> set[str]:
    return {child.name for child in path.iterdir() if child.is_dir()}


def locate_asset_root(extracted: Path) -> Path:
    markers = list(extracted.rglob("female_casualsuit01.mhclo"))
    if not markers:
        markers = list(extracted.rglob("female_sportsuit01.mhclo"))
    if not markers:
        raise FileNotFoundError("Could not locate a known fully clothed female asset in the pack")

    marker = markers[0]
    candidates = [marker.parent, *marker.parents]
    for candidate in candidates:
        if candidate == extracted.parent:
            break
        names = asset_directory_names(candidate)
        if "clothes" in names and len(names & SYSTEM_ASSET_DIRECTORIES) >= 3:
            return candidate

    raise RuntimeError(
        "Could not identify the MakeHuman asset root above "
        f"{marker}; inspected {[str(candidate) for candidate in candidates[:6]]}"
    )


def find_installed_asset(destination: Path, category: str, filename: str) -> Path:
    matches = list((destination / category).rglob(filename))
    if not matches:
        raise FileNotFoundError(destination / category / "**" / filename)
    return matches[0]


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
        find_installed_asset(destination, "clothes", "female_casualsuit01.mhclo"),
        find_installed_asset(destination, "eyes", "low-poly.mhclo"),
    ]

    print(f"MPFB assets installed to {destination}")
    print(f"Copied top-level entries: {', '.join(copied)}")
    print("Verified assets:")
    for path in required:
        print(f"- {path.relative_to(destination)}")


if __name__ == "__main__":
    main()
