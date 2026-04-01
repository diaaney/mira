const { EmbedBuilder } = require('discord.js');

// Neutral color for all embeds
const NEUTRAL_COLOR = '#5865F2'; // Discord blurple

module.exports = {
    // State embeds
    thinking: (message = 'Processing...') =>
        new EmbedBuilder()
            .setColor(NEUTRAL_COLOR)
            .setDescription(`💭 ${message}`),

    loading: (message = 'Loading...') =>
        new EmbedBuilder()
            .setColor(NEUTRAL_COLOR)
            .setDescription(`⏳ ${message}`),

    // Result embeds
    success: (message) =>
        new EmbedBuilder()
            .setColor(NEUTRAL_COLOR)
            .setDescription(`✅ ${message}`),

    error: (message) =>
        new EmbedBuilder()
            .setColor(NEUTRAL_COLOR)
            .setDescription(`❌ ${message}`),

    info: (message) =>
        new EmbedBuilder()
            .setColor(NEUTRAL_COLOR)
            .setDescription(`ℹ️ ${message}`),

    warn: (message) =>
        new EmbedBuilder()
            .setColor(NEUTRAL_COLOR)
            .setDescription(`⚠️ ${message}`),

    // Export color constant
    NEUTRAL_COLOR
};
