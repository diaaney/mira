const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../../constants/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check Mira's latency 🏓'),

    async execute(interaction) {
        const startTime = Date.now();

        // Show thinking state with random verb
        await interaction.reply({
            embeds: [embeds.thinking()]
        });

        // Small delay for effect
        await new Promise(resolve => setTimeout(resolve, 800));

        const latency = Date.now() - startTime;

        // Update to success state
        await interaction.editReply({
            embeds: [embeds.success(`🏓 Pong! Latency is **${latency}ms**`)]
        });
    }
};
