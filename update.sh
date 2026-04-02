#!/bin/bash

# Mira Discord Bot - Update Script
# This script pulls the latest changes from GitHub and restarts the bot

set -e

echo "======================================"
echo "  Mira Bot - Update Script"
echo "======================================"
echo ""

cd ~/mira

# Stop the bot
echo "🛑 Stopping bot..."
pm2 stop mira || echo "Bot was not running"

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Install/update dependencies
echo "📦 Updating dependencies..."
npm install

# Restart the bot
echo "🚀 Starting bot..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

echo ""
echo "======================================"
echo "  ✅ Update Complete!"
echo "======================================"
echo ""
echo "Bot status:"
pm2 status mira
echo ""
echo "View logs with: pm2 logs mira"
echo ""
