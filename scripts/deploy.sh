#!/usr/bin/env bash
set -euo pipefail

# --- bootstrap Node/NVM/PNPM for non-login shells ---
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
fi
# 锁到你的版本
nvm use 24.4.1 >/dev/null

# 启用 corepack 并确保 pnpm 在 PATH 中
corepack enable >/dev/null 2>&1 || true
export PATH="$HOME/.local/share/pnpm:$PATH"

#（可选）打印版本，便于排错
node -v
pnpm -v

APP_DIR="/var/www/tech_blog_codex"
cd "$APP_DIR"

# 如果 .env 由 CI 写入到服务器，此处无需覆盖
# 若你希望在服务器手工管理 .env，请在这里 echo >> .env

# 安装依赖 & 迁移 & 构建
pnpm install --frozen-lockfile
# 如使用 Prisma（你有 DATABASE_URL）
pnpm prisma migrate deploy || true
pnpm build   # Nuxt 4 / Nitro Node 产物 .output/server/index.mjs

# 用 PM2 启动 / 重启
if pm2 list | grep -q tech_blog_codex; then
  pm2 restart tech_blog_codex --update-env
else
  pm2 start .output/server/index.mjs --name tech_blog_codex
fi

pm2 save