#!/bin/bash
#
# Generate final subtitles from the audio of the already-cut MP4.
#
# Usage:
#   bash generate_final_subtitles.sh <cut_video.mp4> [output.srt]
#
# This is the final-delivery subtitle path. Do not use original subtitle
# remapping as the final SRT because cumulative drift can appear after cutting.

set -euo pipefail

CUT_VIDEO="${1:-}"
OUTPUT_SRT="${2:-}"

if [ -z "$CUT_VIDEO" ]; then
  echo "Usage: bash generate_final_subtitles.sh <cut_video.mp4> [output.srt]" >&2
  exit 1
fi

if [ ! -f "$CUT_VIDEO" ]; then
  echo "Missing cut video: $CUT_VIDEO" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CUT_VIDEO_ABS="$(cd "$(dirname "$CUT_VIDEO")" && pwd)/$(basename "$CUT_VIDEO")"
CUT_DIR="$(dirname "$CUT_VIDEO_ABS")"
BASE_NAME="$(basename "$CUT_VIDEO_ABS" .mp4)"

WORK_DIR="$CUT_DIR/../4_成片字幕/${BASE_NAME}_mp3_reasr"
mkdir -p "$WORK_DIR"

if [ -z "$OUTPUT_SRT" ]; then
  OUTPUT_SRT="$CUT_DIR/${BASE_NAME}_final.srt"
fi
OUTPUT_SRT_ABS="$(cd "$(dirname "$OUTPUT_SRT")" && pwd)/$(basename "$OUTPUT_SRT")"
if [[ "$OUTPUT_SRT_ABS" == *_final.srt ]]; then
  RAW_SRT_ABS="${OUTPUT_SRT_ABS%_final.srt}_raw_final.srt"
else
  RAW_SRT_ABS="${OUTPUT_SRT_ABS%.srt}_raw.srt"
fi

AUDIO_FILE="$WORK_DIR/${BASE_NAME}_final_192k.mp3"
UPLOAD_JSON="$WORK_DIR/upload_response.json"

echo "🎧 从剪后成片抽取音频..."
ffmpeg -hide_banner -y \
  -i "$CUT_VIDEO_ABS" \
  -map 0:a:0 -vn -ar 48000 -ac 2 \
  -c:a libmp3lame -b:a 192k -write_xing 1 \
  "$AUDIO_FILE"

echo "☁️ 上传剪后音频..."
curl -s -F "files[]=@$AUDIO_FILE" https://uguu.se/upload > "$UPLOAD_JSON"

AUDIO_URL="$(node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
const url = data.files && data.files[0] && data.files[0].url;
if (!url) process.exit(1);
console.log(url);
" "$UPLOAD_JSON")"

if [ -z "$AUDIO_URL" ]; then
  echo "Failed to parse uploaded audio URL from $UPLOAD_JSON" >&2
  exit 1
fi

echo "🎤 重新识别剪后音频..."
(
  cd "$WORK_DIR"
  bash "$SCRIPT_DIR/volcengine_transcribe.sh" "$AUDIO_URL"
  node "$SCRIPT_DIR/generate_final_srt.js" volcengine_result.json "$CUT_VIDEO_ABS" "$OUTPUT_SRT_ABS"
)

cp "$OUTPUT_SRT_ABS" "$RAW_SRT_ABS"
node "$SCRIPT_DIR/prepare_final_srt_polish.js" "$RAW_SRT_ABS" "$OUTPUT_SRT_ABS"

# If this follows the standard output layout, also place a copy in 字幕/3_输出.
if [ "$(basename "$CUT_DIR")" = "3_审核" ]; then
  SUBTITLE_DIR="$CUT_DIR/../../字幕/3_输出"
  mkdir -p "$SUBTITLE_DIR"
  cp "$OUTPUT_SRT_ABS" "$SUBTITLE_DIR/$(basename "$OUTPUT_SRT_ABS")"
  cp "$RAW_SRT_ABS" "$SUBTITLE_DIR/$(basename "$RAW_SRT_ABS")"
  echo "📝 已同步字幕输出目录: $SUBTITLE_DIR/$(basename "$OUTPUT_SRT_ABS")"
fi

echo "✅ ASR 原始最终字幕已生成: $RAW_SRT_ABS"
echo "⚠️ 还必须执行 AI 字幕文字校对，再把校正版写回: $OUTPUT_SRT_ABS"
echo "   校对提示: ${OUTPUT_SRT_ABS%.srt}_ai_polish_prompt.md"
