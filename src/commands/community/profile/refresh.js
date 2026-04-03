const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../../constants/embeds');
const axios = require('axios');

// Web app URL
const WEB_APP_URL = process.env.WEB_APP_URL || 'http://localhost:3000';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile-refresh')
        .setDescription('refresh your profile data (skin, elo, location)'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            // Call the update API endpoint
            const response = await axios.post(`${WEB_APP_URL}/api/profile/update`, {
                discord_id: interaction.user.id
            }, {
                timeout: 30000 // 30 second timeout for scraping
            });

            if (response.data.success) {
                return interaction.editReply({
                    embeds: [embeds.success('profile refreshed successfully! use `/profile` to see your updated data')]
                });
            } else {
                throw new Error(response.data.error || 'Unknown error');
            }

        } catch (error) {
            console.error('Error refreshing profile:', error);

            if (error.response?.status === 404) {
                return interaction.editReply({
                    embeds: [embeds.error('you don\'t have a profile yet! use `/profile` to set one up')]
                });
            }

            return interaction.editReply({
                embeds: [embeds.error(`failed to refresh profile: ${error.message}`)]
            });
        }
    }
};
