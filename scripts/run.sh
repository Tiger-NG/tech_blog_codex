#!/usr/bin/env bash
set -euo pipefail
cd /var/www/tech_blog_codex

# 加载 .env 到当前进程环境
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

# 启动 Nuxt 产物
exec node .output/server/index.mjs