const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../../constants/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription("Check Mira's latency 🏓"),

    async execute(interaction) {
        // Show thinking state with random verb
        await interaction.reply({
            embeds: [embeds.thinking()]
        });

        // Calculate actual latency (before animation delay)
        const latency = Date.now() - interaction.createdTimestamp;

        // Animation delay (doubled to 1600ms)
        await new Promise(resolve => setTimeout(resolve, 1600));

        // Update to success state
        await interaction.editReply({
            embeds: [embeds.success(`🏓 Pong! Latency is **${latency}ms**`)]
        });
    }
};
