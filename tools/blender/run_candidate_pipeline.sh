#!/usr/bin/env bash
set -euo pipefail

BLENDER_VERSION="${BLENDER_VERSION:-4.5.12}"
BLENDER_BUILD_ID="${BLENDER_BUILD_ID:-84afd5f785f7}"
BLENDER_BUILD_NAME="blender-${BLENDER_VERSION}-stable+v45.${BLENDER_BUILD_ID}-linux.x86_64-release"
BLENDER_ARCHIVE_NAME="${BLENDER_BUILD_NAME}.tar.xz"
BLENDER_DOWNLOAD_BASE="https://cdn.builder.blender.org/download/daily"
BLENDER_ARCHIVE_URL="${BLENDER_DOWNLOAD_BASE}/${BLENDER_ARCHIVE_NAME/+/%2B}"
BLENDER_CHECKSUM_URL="${BLENDER_ARCHIVE_URL}.sha256"

WORK_ROOT="${RUNNER_TEMP:-${TMPDIR:-/tmp}}/shibari-mpfb"
BLENDER_HOME="${BLENDER_HOME:-$WORK_ROOT/blender-home}"
OUTPUT_DIR="${OUTPUT_DIR:-$WORK_ROOT/output}"
DIAGNOSTICS_DIR="$OUTPUT_DIR/diagnostics"
CATALOG_DIR="$OUTPUT_DIR/catalog"
BLENDER_ARCHIVE="$WORK_ROOT/$BLENDER_ARCHIVE_NAME"
BLENDER_CHECKSUM="$WORK_ROOT/$BLENDER_ARCHIVE_NAME.sha256"
ASSET_ARCHIVE="$WORK_ROOT/makehuman-system-assets.zip"
OPTIMIZED_TEXTURES="$WORK_ROOT/optimized-textures"

export HOME="$BLENDER_HOME"
export BLENDER_VERSION BLENDER_HOME OUTPUT_DIR
rm -rf "$WORK_ROOT"
mkdir -p "$WORK_ROOT" "$BLENDER_HOME" "$DIAGNOSTICS_DIR" "$CATALOG_DIR"

curl --fail --location --retry 5 --retry-all-errors \
  --connect-timeout 20 --max-time 1200 \
  "$BLENDER_ARCHIVE_URL" \
  --output "$BLENDER_ARCHIVE" \
  2>&1 | tee "$DIAGNOSTICS_DIR/download-blender.log"

curl --fail --location --retry 5 --retry-all-errors \
  --connect-timeout 20 --max-time 120 \
  "$BLENDER_CHECKSUM_URL" \
  --output "$BLENDER_CHECKSUM" \
  2>&1 | tee "$DIAGNOSTICS_DIR/download-blender-checksum.log"

blender_bytes="$(stat -c%s "$BLENDER_ARCHIVE")"
test "$blender_bytes" -gt 100000000
expected_blender_sha="$(awk 'NR == 1 { print $1 }' "$BLENDER_CHECKSUM")"
actual_blender_sha="$(sha256sum "$BLENDER_ARCHIVE" | awk '{ print $1 }')"
test -n "$expected_blender_sha"
test "$actual_blender_sha" = "$expected_blender_sha"
xz --test "$BLENDER_ARCHIVE"
printf 'archive=%s\nbytes=%s\nsha256=%s\n' \
  "$BLENDER_ARCHIVE_NAME" "$blender_bytes" "$actual_blender_sha" \
  | tee "$DIAGNOSTICS_DIR/blender-provenance.txt"

tar -xJf "$BLENDER_ARCHIVE" -C "$WORK_ROOT"
BLENDER_BIN="$WORK_ROOT/$BLENDER_BUILD_NAME/blender"
test -x "$BLENDER_BIN"
"$BLENDER_BIN" --version | tee "$DIAGNOSTICS_DIR/blender-version.txt"

"$BLENDER_BIN" --online-mode --command extension install -s -e mpfb \
  2>&1 | tee "$DIAGNOSTICS_DIR/install-extension.log"
"$BLENDER_BIN" --command extension list \
  2>&1 | tee "$DIAGNOSTICS_DIR/extensions.txt"

curl --fail --location --retry 5 --retry-all-errors \
  --connect-timeout 20 --max-time 1200 \
  'https://files2.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip' \
  --output "$ASSET_ARCHIVE" \
  2>&1 | tee "$DIAGNOSTICS_DIR/download-assets.log"
test "$(stat -c%s "$ASSET_ARCHIVE")" -gt 100000000

"$BLENDER_BIN" -b --python-exit-code 1 \
  --python tools/blender/install_mpfb_assets.py \
  -- "$ASSET_ARCHIVE" \
  2>&1 | tee "$DIAGNOSTICS_DIR/install-assets.log"

generate_original() {
  local variant="$1"
  local slug="$2"
  local destination="$CATALOG_DIR/$slug"
  mkdir -p "$destination"
  "$BLENDER_BIN" -b --python-exit-code 1 \
    --python tools/blender/generate_mpfb_candidate.py \
    -- "$destination" "$variant" \
    2>&1 | tee "$DIAGNOSTICS_DIR/generate-${slug}.log"
  mv "$destination/shibari-adult-female-candidate.glb" "$destination/model.glb"
}

generate_original "sports-original" "mpfb-sports-original"
generate_original "casual-original" "mpfb-casual-original"

CASUAL_ORIGINAL="$CATALOG_DIR/mpfb-casual-original"
CASUAL_MOBILE="$CATALOG_DIR/mpfb-casual-mobile"
mkdir -p "$CASUAL_MOBILE"
cp "$CASUAL_ORIGINAL"/preview-*.png "$CASUAL_MOBILE/"
cp "$CASUAL_ORIGINAL/SOURCE.md" "$CASUAL_MOBILE/SOURCE.md"
cp "$CASUAL_ORIGINAL/LICENSE.txt" "$CASUAL_MOBILE/LICENSE.txt"
cp "$CASUAL_ORIGINAL/candidate-report.json" "$CASUAL_MOBILE/candidate-report.json"

"$BLENDER_BIN" -b --python-exit-code 1 \
  --python tools/blender/optimize_glb_candidate.py \
  -- "$CASUAL_ORIGINAL/model.glb" "$CASUAL_MOBILE/model.glb" "$OPTIMIZED_TEXTURES" "$CASUAL_MOBILE/candidate-report.json" \
  2>&1 | tee "$DIAGNOSTICS_DIR/optimize-casual-mobile.log"
cat >> "$CASUAL_MOBILE/SOURCE.md" <<'SOURCE'

Mobile variant: embedded textures were re-imported, replaced, and capped at 1024 pixels before the final GLB export.
SOURCE

validate_variant() {
  local slug="$1"
  local max_bytes="$2"
  local expected_presentation="$3"
  local expected_clothing="$4"
  local max_texture_dimension="$5"
  local destination="$CATALOG_DIR/$slug"

  test -s "$destination/model.glb"
  test -s "$destination/candidate-report.json"
  test -s "$destination/SOURCE.md"
  test -s "$destination/LICENSE.txt"
  for view in front back left right; do
    test -s "$destination/preview-${view}.png"
  done

  (cd "$destination" && sha256sum model.glb > SHA256.txt)
  python tools/blender/audit_glb_candidate.py \
    "$destination/model.glb" \
    "$destination/glb-audit.json" \
    --max-bytes "$max_bytes" \
    --max-texture-dimension "$max_texture_dimension" \
    | tee "$DIAGNOSTICS_DIR/audit-${slug}.log"

  VARIANT_DIR="$destination" \
  MAX_BYTES="$max_bytes" \
  EXPECTED_PRESENTATION="$expected_presentation" \
  EXPECTED_CLOTHING="$expected_clothing" \
  python - <<'PY' | tee "$DIAGNOSTICS_DIR/validate-${slug}.log"
import json
import os
from pathlib import Path

variant_dir = Path(os.environ["VARIANT_DIR"])
max_bytes = int(os.environ["MAX_BYTES"])
report = json.loads((variant_dir / "candidate-report.json").read_text(encoding="utf-8"))
audit = json.loads((variant_dir / "glb-audit.json").read_text(encoding="utf-8"))
sha = (variant_dir / "SHA256.txt").read_text(encoding="utf-8").split()[0]

assert report["adultPresentation"] is True, report
assert report["presentation"] == os.environ["EXPECTED_PRESENTATION"], report
assert any(asset["file"] == os.environ["EXPECTED_CLOTHING"] for asset in report["assets"]), report
assert report["armatureCount"] >= 1, report
assert report["boneCount"] >= 40, report
assert report["meshCount"] >= 6, report
assert audit["skinCount"] >= 1, audit
assert audit["jointCount"] >= 40, audit
assert audit["glbBytes"] <= max_bytes, (audit, max_bytes)

summary = {
    "slug": variant_dir.name,
    "glbBytes": audit["glbBytes"],
    "sha256": sha,
    "presentation": report["presentation"],
    "meshCount": audit["meshCount"],
    "jointCount": audit["jointCount"],
    "maxTextureDimension": audit["maxTextureDimension"],
}
(variant_dir / "catalog-entry.json").write_text(
    json.dumps(summary, indent=2, ensure_ascii=False) + "\n",
    encoding="utf-8",
)
print(json.dumps(summary, indent=2, ensure_ascii=False))
PY
}

validate_variant "mpfb-sports-original" $((24 * 1024 * 1024)) "neutral-sportswear-midriff" "female_sportsuit01.mhclo" 4096
validate_variant "mpfb-casual-original" $((32 * 1024 * 1024)) "neutral-fully-clothed" "female_casualsuit01.mhclo" 4096
validate_variant "mpfb-casual-mobile" $((12 * 1024 * 1024)) "neutral-fully-clothed" "female_casualsuit01.mhclo" 1024

python - <<'PY'
import json
import os
from pathlib import Path

catalog = Path(os.environ["OUTPUT_DIR"]) / "catalog"
entries = [
    json.loads((directory / "catalog-entry.json").read_text(encoding="utf-8"))
    for directory in sorted(catalog.iterdir())
    if directory.is_dir()
]
(catalog / "catalog-summary.json").write_text(
    json.dumps(entries, indent=2, ensure_ascii=False) + "\n",
    encoding="utf-8",
)
print(json.dumps(entries, indent=2, ensure_ascii=False))
PY

du -ah "$CATALOG_DIR" | sort -h | tail -40
