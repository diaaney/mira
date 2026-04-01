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

## License

MIT License - see LICENSE file for details
