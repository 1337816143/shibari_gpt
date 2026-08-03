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
BLENDER_ARCHIVE="$WORK_ROOT/$BLENDER_ARCHIVE_NAME"
BLENDER_CHECKSUM="$WORK_ROOT/$BLENDER_ARCHIVE_NAME.sha256"
ASSET_ARCHIVE="$WORK_ROOT/makehuman-system-assets.zip"

export HOME="$BLENDER_HOME"
export BLENDER_VERSION BLENDER_HOME OUTPUT_DIR
mkdir -p "$WORK_ROOT" "$BLENDER_HOME" "$OUTPUT_DIR"

curl --fail --location --retry 5 --retry-all-errors \
  --connect-timeout 20 --max-time 1200 \
  "$BLENDER_ARCHIVE_URL" \
  --output "$BLENDER_ARCHIVE" \
  2>&1 | tee "$OUTPUT_DIR/download-blender.log"

curl --fail --location --retry 5 --retry-all-errors \
  --connect-timeout 20 --max-time 120 \
  "$BLENDER_CHECKSUM_URL" \
  --output "$BLENDER_CHECKSUM" \
  2>&1 | tee "$OUTPUT_DIR/download-blender-checksum.log"

blender_bytes="$(stat -c%s "$BLENDER_ARCHIVE")"
test "$blender_bytes" -gt 100000000
expected_blender_sha="$(awk 'NR == 1 { print $1 }' "$BLENDER_CHECKSUM")"
actual_blender_sha="$(sha256sum "$BLENDER_ARCHIVE" | awk '{ print $1 }')"
test -n "$expected_blender_sha"
test "$actual_blender_sha" = "$expected_blender_sha"
xz --test "$BLENDER_ARCHIVE"
printf 'archive=%s\nbytes=%s\nsha256=%s\n' \
  "$BLENDER_ARCHIVE_NAME" "$blender_bytes" "$actual_blender_sha" \
  | tee "$OUTPUT_DIR/blender-provenance.txt"

tar -xJf "$BLENDER_ARCHIVE" -C "$WORK_ROOT"
BLENDER_BIN="$WORK_ROOT/$BLENDER_BUILD_NAME/blender"
test -x "$BLENDER_BIN"
"$BLENDER_BIN" --version | tee "$OUTPUT_DIR/blender-version.txt"

"$BLENDER_BIN" --online-mode --command extension install -s -e mpfb \
  2>&1 | tee "$OUTPUT_DIR/install-extension.log"
"$BLENDER_BIN" --command extension list \
  2>&1 | tee "$OUTPUT_DIR/extensions.txt"

curl --fail --location --retry 5 --retry-all-errors \
  --connect-timeout 20 --max-time 1200 \
  'https://files2.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip' \
  --output "$ASSET_ARCHIVE" \
  2>&1 | tee "$OUTPUT_DIR/download-assets.log"
test "$(stat -c%s "$ASSET_ARCHIVE")" -gt 100000000

"$BLENDER_BIN" -b --python-exit-code 1 \
  --python tools/blender/install_mpfb_assets.py \
  -- "$ASSET_ARCHIVE" \
  2>&1 | tee "$OUTPUT_DIR/install-assets.log"

"$BLENDER_BIN" -b --python-exit-code 1 \
  --python tools/blender/generate_mpfb_candidate.py \
  -- "$OUTPUT_DIR" \
  2>&1 | tee "$OUTPUT_DIR/generation.log"

test -s "$OUTPUT_DIR/shibari-adult-female-candidate.glb"
for view in front back left right; do
  test -s "$OUTPUT_DIR/preview-${view}.png"
done
(cd "$OUTPUT_DIR" && sha256sum shibari-adult-female-candidate.glb > SHA256.txt)

python tools/blender/audit_glb_candidate.py \
  "$OUTPUT_DIR/shibari-adult-female-candidate.glb" \
  "$OUTPUT_DIR/glb-audit.json" \
  | tee "$OUTPUT_DIR/glb-audit.log"

size=$(stat -c%s "$OUTPUT_DIR/shibari-adult-female-candidate.glb")
echo "candidate bytes: $size" | tee "$OUTPUT_DIR/budget-check.log"
test "$size" -lt 12582912

python - <<'PY' | tee -a "$OUTPUT_DIR/budget-check.log"
import json
import os
import pathlib

output = pathlib.Path(os.environ["OUTPUT_DIR"])
report = json.loads((output / "candidate-report.json").read_text(encoding="utf-8"))
audit = json.loads((output / "glb-audit.json").read_text(encoding="utf-8"))
assert report["armatureCount"] >= 1, report
assert report["boneCount"] >= 40, report
assert report["meshCount"] >= 6, report
assert report["adultPresentation"] is True, report
assert report["presentation"] == "neutral-fully-clothed", report
assert any(asset["file"] == "female_casualsuit01.mhclo" for asset in report["assets"]), report
assert audit["skinCount"] >= 1, audit
assert audit["jointCount"] >= 40, audit
assert audit["maxTextureDimension"] <= 1024, audit
assert audit["glbBytes"] < 12 * 1024 * 1024, audit
print(json.dumps({"candidate": report, "glbAudit": audit}, indent=2, ensure_ascii=False))
PY
