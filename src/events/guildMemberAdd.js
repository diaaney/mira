const { EmbedBuilder, Events } = require('discord.js');
const embeds = require('../constants/embeds');
const { getWelcomeConfig } = require('../utils/storage');

module.exports = (client) => {
    client.on(Events.GuildMemberAdd, async (member) => {
        try {
            // Get welcome configuration
            const welcomeConfig = getWelcomeConfig();

            // If no welcome channel is configured, do nothing
            if (!welcomeConfig.channel_id) {
                return;
            }

            // Get the welcome channel
            const welcomeChannel = await member.guild.channels.fetch(welcomeConfig.channel_id);

            if (!welcomeChannel) {
                console.error('Welcome channel not found');
                return;
            }

            // Get user info
            const user = member.user;
            const avatarURL = user.displayAvatarURL({ dynamic: true, size: 256 });

            // Create welcome embed
            const welcomeEmbed = new EmbedBuilder()
                .setColor(embeds.NEUTRAL_COLOR)
                .setAuthor({
                    name: `wlc ${member.displayName} <3`,
                    iconURL: avatarURL
                })
                .setDescription(`wlc to meow café! ⸜(｡˃ ᵕ ˂ )⸝♡\n\n<#1488317654501691423>      <#1489428117666926612>      <#1488848193591709696>`)
                .setThumbnail(avatarURL)
                .setFooter({ text: `users | ${member.guild.memberCount}` });

            // Send welcome message with user mention
            await welcomeChannel.send({
                content: `${member}`,
                embeds: [welcomeEmbed]
            });

        } catch (error) {
            console.error('Error sending welcome message:', error);
        }
    });

    console.log('✅ Welcome event handler loaded');
};
