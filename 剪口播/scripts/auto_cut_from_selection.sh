#!/bin/bash
#
# No-review automatic cut:
#   subtitles_words.json + auto_selected.json -> delete_segments.json -> cut MP4 -> final SRT
#
# Usage:
#   bash auto_cut_from_selection.sh <source_video.mp4> <subtitles_words.json> <auto_selected.json> [output.mp4]

set -euo pipefail

VIDEO_PATH="${1:-}"
WORDS_JSON="${2:-}"
SELECTED_JSON="${3:-}"
OUTPUT_MP4="${4:-}"

if [ -z "$VIDEO_PATH" ] || [ -z "$WORDS_JSON" ] || [ -z "$SELECTED_JSON" ]; then
  echo "Usage: bash auto_cut_from_selection.sh <source_video.mp4> <subtitles_words.json> <auto_selected.json> [output.mp4]" >&2
  exit 1
fi

if [ ! -f "$VIDEO_PATH" ]; then
  echo "Missing source video: $VIDEO_PATH" >&2
  exit 1
fi

if [ ! -f "$WORDS_JSON" ]; then
  echo "Missing subtitles words json: $WORDS_JSON" >&2
  exit 1
fi

if [ ! -f "$SELECTED_JSON" ]; then
  echo "Missing selected json: $SELECTED_JSON" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VIDEO_ABS="$(cd "$(dirname "$VIDEO_PATH")" && pwd)/$(basename "$VIDEO_PATH")"
WORDS_ABS="$(cd "$(dirname "$WORDS_JSON")" && pwd)/$(basename "$WORDS_JSON")"
SELECTED_ABS="$(cd "$(dirname "$SELECTED_JSON")" && pwd)/$(basename "$SELECTED_JSON")"

if [ -z "$OUTPUT_MP4" ]; then
  OUTPUT_DIR="$(pwd)"
  BASE_NAME="$(basename "$VIDEO_ABS" .mp4)"
  OUTPUT_MP4="$OUTPUT_DIR/${BASE_NAME}_auto_cut.mp4"
fi

OUTPUT_DIR="$(cd "$(dirname "$OUTPUT_MP4")" && pwd)"
OUTPUT_ABS="$OUTPUT_DIR/$(basename "$OUTPUT_MP4")"
DELETE_JSON="$OUTPUT_DIR/delete_segments.json"

echo "🧾 生成删除时间段..."
node "$SCRIPT_DIR/selected_to_delete_segments.js" "$WORDS_ABS" "$SELECTED_ABS" "$DELETE_JSON"

echo "✂️ 自动剪辑，不打开审核网页..."
bash "$SCRIPT_DIR/cut_video.sh" "$VIDEO_ABS" "$DELETE_JSON" "$OUTPUT_ABS"

echo "📝 基于剪后 MP4 重新生成最终字幕..."
bash "$SCRIPT_DIR/generate_final_subtitles.sh" "$OUTPUT_ABS"

FINAL_SRT="${OUTPUT_ABS%.mp4}_final.srt"

echo "✅ 全自动处理完成"
echo "视频: $OUTPUT_ABS"
echo "字幕: $FINAL_SRT"
