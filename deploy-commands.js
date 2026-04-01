require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');

console.log('\n╔══════════════════════════════════════════════╗');
console.log('║     Mira Bot - Command Deployment Tool      ║');
console.log('╚══════════════════════════════════════════════╝\n');

// Recursive function to find all slash.js files
const walk = (dir) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(fullPath);
        } else if (entry.name === 'slash.js') {
            const command = require(fullPath);
            commands.push(command.data.toJSON());
            console.log(`  ✓ Loaded: /${command.data.name}`);
        }
    });
};

console.log('📦 Loading commands...\n');
walk(commandsPath);

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`\n🚀 Deploying ${commands.length} slash command(s) to Discord...\n`);

        const useGuild = process.env.GUILD_ID;

        if (useGuild) {
            // Guild-specific deployment (instant)
            const data = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands },
            );
            console.log(`✅ Successfully deployed ${data.length} command(s) to guild ${process.env.GUILD_ID}`);
            console.log('💡 Commands are available instantly in your server!\n');
        } else {
            // Global deployment
            const data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands },
            );
            console.log(`✅ Successfully deployed ${data.length} command(s) globally`);
            console.log('⏳ Global commands may take up to 1 hour to propagate\n');
            console.log('💡 Tip: Add GUILD_ID to .env for instant testing\n');
        }

        console.log('╔══════════════════════════════════════════════╗');
        console.log('║           Deployment Complete! 🎉            ║');
        console.log('╚══════════════════════════════════════════════╝\n');
    } catch (error) {
        console.error('\n❌ Deployment failed:\n', error);
        process.exit(1);
    }
})();
