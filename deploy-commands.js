require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');

console.log('\n╔══════════════════════════════════════════════╗');
console.log('║     Mira Bot - Command Deployment Tool       ║');
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

        // Always deploy globally so the commands show up in every server mira is in.
        const globalData = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        console.log(`🌍 Global: deployed ${globalData.length} command(s) (propagation up to 1 hour)`);

        // If GUILD_ID is set, also deploy to that guild so changes show up instantly there.
        if (process.env.GUILD_ID) {
            const guildData = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands },
            );
            console.log(`⚡ Guild ${process.env.GUILD_ID}: deployed ${guildData.length} command(s) (instant)`);
        }

        console.log('\n╔══════════════════════════════════════════════╗');
        console.log('║           Deployment Complete! 🎉            ║');
        console.log('╚══════════════════════════════════════════════╝\n');
    } catch (error) {
        console.error('\n❌ Deployment failed:\n', error);
        process.exit(1);
    }
})();
