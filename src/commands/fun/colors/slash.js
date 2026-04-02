const {
    SlashCommandBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} = require('discord.js');
const embeds = require('../../../constants/embeds');

// Color role IDs in order: red, yellow, green, blue, purple, orange
const COLOR_ROLES = [
    { id: '1488317627062288535', name: 'Red', emoji: '🔴' },
    { id: '1488317627913994261', name: 'Yellow', emoji: '🟡' },
    { id: '1488317628568305825', name: 'Green', emoji: '🟢' },
    { id: '1488317629801431211', name: 'Blue', emoji: '🔵' },
    { id: '1488317630703079617', name: 'Purple', emoji: '🟣' },
    { id: '1488317631458050088', name: 'Orange', emoji: '🟠' },
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('colors')
        .setDescription('Aight, pick your color role!'),

    async execute(interaction) {
        // Show thinking state
        await interaction.reply({
            embeds: [embeds.thinking()],
            ephemeral: true
        });

        // Animation delay (1200ms like count command)
        await new Promise(resolve => setTimeout(resolve, 1200));

        // Create select menu with color options
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('color_select')
            .setPlaceholder('Choose your vibe...')
            .addOptions(
                COLOR_ROLES.map(color =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel(color.name)
                        .setValue(color.id)
                        .setEmoji(color.emoji)
                )
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        // Update with select menu
        await interaction.editReply({
            embeds: [embeds.success('**Aight, what color you feelin\'?**\n\nPick one from the dropdown below.')],
            components: [row]
        });
    }
};
