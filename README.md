# Mira - Discord VoiceMaster Bot

A simple Discord bot focused on dynamic voice channel management.

## Features

- **VoiceMaster System**: Create temporary voice channels on-demand
  - Users join a "create" channel to get their own voice room
  - Full control panel with 11 interactive buttons
  - Channels auto-delete when empty
  - Lock/unlock, hide/reveal, claim, disconnect, and more

- **Commands**:
  - `/ping` - Check bot latency
  - `/voicemaster setup` - Initialize VoiceMaster system

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   DISCORD_TOKEN=your_bot_token
   CLIENT_ID=your_application_id
   ```

4. Deploy slash commands:
   ```bash
   npm run deploy
   ```

5. Start the bot:
   ```bash
   npm start
   ```

## VoiceMaster Controls

Once setup is complete, users can control their voice channels with these buttons:

- **Lock** - Prevent new users from joining
- **Unlock** - Allow anyone to join
- **Ghost** - Hide the channel from the channel list
- **Reveal** - Make the channel visible again
- **Claim** - Take ownership of an unclaimed channel
- **Disconnect** - Kick a member from your channel
- **Activity** - Start a Discord activity
- **Info** - View channel information
- **Increase** - Raise user limit
- **Decrease** - Lower user limit

## Data Storage

All configuration is stored in JSON files in the `data/` directory:
- `config.json` - VoiceMaster setup configuration
- `rooms.json` - Active voice channel tracking

## Requirements

- Node.js 16 or higher
- Discord.js v14

## Deployment (Google Cloud VM - Free Tier)

This bot can be hosted 24/7 for free on Google Cloud's Always Free e2-micro VM.

### Prerequisites

1. Create a Google Cloud account
2. Create an e2-micro VM instance:
   - **Region**: `us-west1`, `us-central1`, or `us-east1` (Always Free regions)
   - **Machine type**: e2-micro (2 vCPU, 1 GB memory)
   - **Boot disk**: Ubuntu 22.04 LTS, 30 GB Standard persistent disk
   - **Firewall**: Allow HTTP and HTTPS traffic

### Quick Setup (Automated)

1. SSH into your VM from the Google Cloud Console

2. Run the automated setup script:
   ```bash
   curl -o- https://raw.githubusercontent.com/diaaney/mira/main/setup.sh | bash
   ```

3. Edit the `.env` file with your Discord credentials:
   ```bash
   nano ~/mira/.env
   ```

   Add your bot token and client ID:
   ```
   DISCORD_TOKEN=your_actual_token_here
   CLIENT_ID=your_actual_client_id_here
   ```

   Save with `Ctrl+O`, `Enter`, then exit with `Ctrl+X`

4. Deploy slash commands:
   ```bash
   cd ~/mira
   npm run deploy
   ```

5. Start the bot with PM2:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   ```

### Useful Commands

```bash
# View bot status
pm2 status

# View real-time logs
pm2 logs mira

# Restart the bot
pm2 restart mira

# Stop the bot
pm2 stop mira

# Update the bot (pulls latest changes from GitHub)
bash ~/mira/update.sh
```

### Manual Setup (Alternative)

If you prefer to set up manually or the automated script doesn't work:

1. SSH into your VM

2. Install Node.js 20.x:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs git
   ```

3. Install PM2:
   ```bash
   sudo npm install -g pm2
   ```

4. Clone the repository:
   ```bash
   git clone https://github.com/diaaney/mira.git
   cd mira
   ```

5. Install dependencies:
   ```bash
   npm install
   ```

6. Create and configure `.env`:
   ```bash
   nano .env
   ```

   Add:
   ```
   DISCORD_TOKEN=your_token_here
   CLIENT_ID=your_client_id_here
   ```

7. Create data directory:
   ```bash
   mkdir -p data
   ```

8. Deploy commands and start:
   ```bash
   npm run deploy
   pm2 start ecosystem.config.js
   pm2 startup systemd -u $USER --hp $HOME
   pm2 save
   ```

## License

MIT License - see LICENSE file for details
