#!/bin/bash
#
# First-run setup check for the 剪口播 skill.
#
# Usage:
#   bash scripts/check_setup.sh
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
REPO_DIR="$(dirname "$SKILL_DIR")"
ENV_FILE="$REPO_DIR/.env"

echo "🔎 检查剪口播 Skill 配置..."

MISSING=0

if command -v node >/dev/null 2>&1; then
  echo "✅ Node.js: $(node --version)"
else
  echo "❌ 缺少 Node.js"
  echo "   macOS 可用: brew install node"
  MISSING=1
fi

if command -v ffmpeg >/dev/null 2>&1 && command -v ffprobe >/dev/null 2>&1; then
  echo "✅ FFmpeg/ffprobe 已安装"
else
  echo "❌ 缺少 FFmpeg 或 ffprobe"
  echo "   macOS 可用: brew install ffmpeg"
  MISSING=1
fi

if command -v python3 >/dev/null 2>&1; then
  echo "✅ Python: $(python3 --version)"
else
  echo "❌ 缺少 Python 3"
  MISSING=1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo ""
  echo "❌ 还没有创建 .env 配置文件"
  echo ""
  echo "下一步："
  echo "  cd \"$REPO_DIR\""
  echo "  cp .env.example .env"
  echo "  open -e .env"
  echo ""
  echo "然后把火山引擎/豆包语音识别 API Key 填进去："
  echo "  VOLCENGINE_API_KEY=你的_key"
  echo ""
  echo "不会申请 Key？看这里："
  echo "  $REPO_DIR/docs/API_KEY_SETUP.md"
  echo "  https://console.volcengine.com/"
  exit 1
fi

API_KEY="$(grep '^VOLCENGINE_API_KEY=' "$ENV_FILE" | head -1 | cut -d'=' -f2- | tr -d '[:space:]')"

if [ -z "$API_KEY" ]; then
  echo ""
  echo "❌ .env 已存在，但 VOLCENGINE_API_KEY 还是空的"
  echo ""
  echo "下一步："
  echo "  1. 打开火山引擎控制台: https://console.volcengine.com/"
  echo "  2. 搜索：语音识别 / 智能语音 / 豆包语音 / Speech"
  echo "  3. 开通语音识别服务，创建或复制 API Key"
  echo "  4. 打开 .env，把 Key 填到 VOLCENGINE_API_KEY= 后面"
  echo ""
  echo "详细小白教程："
  echo "  $REPO_DIR/docs/API_KEY_SETUP.md"
  exit 1
fi

echo "✅ VOLCENGINE_API_KEY 已配置"

if [ "$MISSING" -ne 0 ]; then
  echo ""
  echo "⚠️ 依赖还没装齐，先按上面的提示补齐。"
  exit 1
fi

echo ""
echo "✅ 配置检查通过，可以开始剪口播。"
