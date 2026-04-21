#!/bin/bash

# Mira Discord Bot - Update Script
# This script pulls the latest changes from GitHub and restarts the bot
# Runs every operation as the `av6cts` user (owner of the bot and pm2 daemon),
# so it works whether you invoke it as `diane` via gcloud SSH or directly as `av6cts`.

set -e

echo "======================================"
echo "  Mira Bot - Update Script"
echo "======================================"
echo ""

# If already av6cts, no wrapping needed; otherwise run each command via sudo -u av6cts -H.
if [ "$(whoami)" = "av6cts" ]; then
    RUN=""
else
    RUN="sudo -u av6cts -H"
fi

PM2="$RUN /home/av6cts/.npm-global/bin/pm2"
MIRA_DIR="/home/av6cts/mira"

cd "$MIRA_DIR"

# Stop the bot
echo "🛑 Stopping bot..."
$PM2 stop mira || echo "Bot was not running"

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
$RUN git -C "$MIRA_DIR" pull origin main

# Install/update dependencies
echo "📦 Updating dependencies..."
$RUN bash -c "cd $MIRA_DIR && npm install"

# Restart the bot
echo "🚀 Starting bot..."
$PM2 start ecosystem.config.js

# Save PM2 configuration
$PM2 save

echo ""
echo "======================================"
echo "  ✅ Update Complete!"
echo "======================================"
echo ""
echo "Bot status:"
$PM2 status mira
echo ""
echo "View logs with: pm2 logs mira"
echo ""
