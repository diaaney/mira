const { PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../../database/guildConfig');

module.exports = {
    name: 'setprefix',
    aliases: ['prefix'],
    permissions: [PermissionFlagsBits.Administrator],
    async execute(message, args) {
        if (!args[0] || args[0].length > 5) {
            return message.reply({
                embeds: [{
                    color: 0xa82d43,
                    description: '❌ Usage: `setprefix <prefix>` (1-5 characters)'
                }]
            });
        }

        const newPrefix = args[0];
        GuildConfig.setPrefix(message.guild.id, newPrefix);

        message.reply({
            embeds: [{
                color: 0x7ab158,
                description: `✅ Prefix changed to \`${newPrefix}\``
            }]
        });
    }
};
