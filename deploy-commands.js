require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');

// Función recursiva para buscar slash.js
const walk = (dir) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(fullPath);
        } else if (entry.name === 'slash.js') {
            const command = require(fullPath);
            commands.push(command.data.toJSON());
            console.log(`✅ Loaded command: ${command.data.name}`);
        }
    });
};

walk(commandsPath);

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`\n🚀 Started refreshing ${commands.length} application (/) commands.`);

        // Registrar comandos globalmente (sin GUILD_ID)
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`✅ Successfully reloaded ${data.length} application (/) commands globally.`);
        console.log('\n⚠️ Note: Global commands can take up to 1 hour to appear in all servers.');
        console.log('💡 For instant updates during development, set GUILD_ID in .env for guild-specific commands.\n');
    } catch (error) {
        console.error(error);
    }
})();
