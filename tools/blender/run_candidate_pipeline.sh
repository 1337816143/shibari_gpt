#!/usr/bin/env bash
set -euo pipefail

BLENDER_VERSION="${BLENDER_VERSION:-4.5.12}"
WORK_ROOT="${RUNNER_TEMP:-${TMPDIR:-/tmp}}/shibari-mpfb"
BLENDER_HOME="${BLENDER_HOME:-$WORK_ROOT/blender-home}"
OUTPUT_DIR="${OUTPUT_DIR:-$WORK_ROOT/output}"
BLENDER_DIR="$WORK_ROOT/blender-${BLENDER_VERSION}-linux-x64"
BLENDER_BIN="$BLENDER_DIR/blender"
ASSET_ARCHIVE="$WORK_ROOT/makehuman-system-assets.zip"

export HOME="$BLENDER_HOME"
export BLENDER_VERSION BLENDER_HOME OUTPUT_DIR
mkdir -p "$WORK_ROOT" "$BLENDER_HOME" "$OUTPUT_DIR"

curl --fail --location --retry 3 \
  "https://download.blender.org/release/Blender4.5/blender-${BLENDER_VERSION}-linux-x64.tar.xz" \
  --output "$WORK_ROOT/blender.tar.xz" \
  2>&1 | tee "$OUTPUT_DIR/download-blender.log"
tar -xf "$WORK_ROOT/blender.tar.xz" -C "$WORK_ROOT"
test -x "$BLENDER_BIN"

"$BLENDER_BIN" --online-mode --command extension install -s -e mpfb \
  2>&1 | tee "$OUTPUT_DIR/install-extension.log"
"$BLENDER_BIN" --command extension list \
  2>&1 | tee "$OUTPUT_DIR/extensions.txt"

curl --fail --location --retry 3 \
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

size=$(stat -c%s "$OUTPUT_DIR/shibari-adult-female-candidate.glb")
echo "candidate bytes: $size" | tee "$OUTPUT_DIR/budget-check.log"
test "$size" -lt 52428800

python - <<'PY' | tee -a "$OUTPUT_DIR/budget-check.log"
import json
import os
import pathlib

output = pathlib.Path(os.environ["OUTPUT_DIR"])
report = json.loads((output / "candidate-report.json").read_text(encoding="utf-8"))
assert report["armatureCount"] >= 1, report
assert report["boneCount"] >= 10, report
assert report["meshCount"] >= 2, report
assert report["adultPresentation"] is True, report
assert report["presentation"] == "neutral-fully-clothed", report
print(json.dumps(report, indent=2, ensure_ascii=False))
PY
