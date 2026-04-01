const { EmbedBuilder } = require('discord.js');

// Neutral color matching Discord's embed background (lighter gray on the right)
const NEUTRAL_COLOR = '#2b2d31'; // Discord dark mode embed background

module.exports = {
    // State embeds
    thinking: (message = 'Processing...') =>
        new EmbedBuilder()
            .setColor(NEUTRAL_COLOR)
            .setDescription(message),

    loading: (message = 'Loading...') =>
        new EmbedBuilder()
            .setColor(NEUTRAL_COLOR)
            .setDescription(message),

    // Result embeds
    success: (message) =>
        new EmbedBuilder()
            .setColor(NEUTRAL_COLOR)
            .setDescription(message),

    error: (message) =>
        new EmbedBuilder()
            .setColor(NEUTRAL_COLOR)
            .setDescription(message),

    info: (message) =>
        new EmbedBuilder()
            .setColor(NEUTRAL_COLOR)
            .setDescription(message),

    warn: (message) =>
        new EmbedBuilder()
            .setColor(NEUTRAL_COLOR)
            .setDescription(message),

    // Export color constant
    NEUTRAL_COLOR
};
