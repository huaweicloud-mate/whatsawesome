#!/usr/bin/env bash
# QA 截图脚本(Windows / Git-Bash 兼容)
# 用本机 Edge headless 对关键页面截图,作为迭代验收依据。
# Usage:
#   ./qa-playwright-capture.sh [base_url] [output_dir]
# Example:
#   ./qa-playwright-capture.sh http://localhost:5173 public/qa-screenshots

set -e
BASE_URL="${1:-http://localhost:5173}"
OUT_DIR="${2:-public/qa-screenshots}"

# Edge 路径(优先新版,后回退旧版)
EDGE_NEW="/c/Program Files/Microsoft/Edge/Application/msedge.exe"
EDGE_OLD="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
EDGE=""
if [ -x "$EDGE_NEW" ]; then EDGE="$EDGE_NEW";
elif [ -x "$EDGE_OLD" ]; then EDGE="$EDGE_OLD";
else
  echo "[ERROR] 未找到 Edge: $EDGE_NEW / $EDGE_OLD" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
echo "[INFO] Edge: $EDGE"
echo "[INFO] Base: $BASE_URL"
echo "[INFO] Out : $OUT_DIR"

# 等待服务就绪
for i in 1 2 3 4 5; do
  if curl -s --max-time 3 "$BASE_URL" > /dev/null 2>&1; then break; fi
  echo "[WAIT] $BASE_URL 未就绪,3 秒后重试..."
  sleep 3
done

# 关键页面截图列表(可按需扩展)
PAGES=(
  "skill-hall|/"
  "skill-detail-mcp|/skills/mcp"
  "skill-detail-huawei-fg|/skills/huawei-functiongraph"
)

for entry in "${PAGES[@]}"; do
  name="${entry%%|*}"
  path="${entry##*|}"
  out="$OUT_DIR/${name}.png"
  echo "[SHOT] $BASE_URL$path -> $out"
  "$EDGE" --headless=new --disable-gpu --window-size=1440,1000 \
    --virtual-time-budget=10000 --screenshot="$out" \
    "$BASE_URL$path" > /dev/null 2>&1
done

echo "[DONE] 截图完成,共 ${#PAGES[@]} 张,目录: $OUT_DIR"
