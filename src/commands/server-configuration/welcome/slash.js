const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../../constants/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('configure welcome messages for new members')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('preview the welcome message (admin only)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('test the welcome message from any channel')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'setup') {
            // Check for admin permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    embeds: [embeds.error('nah, you need administrator permissions to use this command')],
                    ephemeral: true
                });
            }

            // Defer reply to prevent interaction timeout
            await interaction.deferReply();

            // Animation delay (1200ms)
            await new Promise(resolve => setTimeout(resolve, 1200));

            const user = interaction.user;
            const member = interaction.member;
            const avatarURL = user.displayAvatarURL({ dynamic: true, size: 256 });

            const welcomeEmbed = new EmbedBuilder()
                .setColor(embeds.NEUTRAL_COLOR)
                .setAuthor({
                    name: `wlc ${member.displayName} <3`,
                    iconURL: avatarURL
                })
                .setDescription(`wlc to meow café! ⸜(｡˃ ᵕ ˂ )⸝♡\n\n<#1488317654501691423>      <#1488317657911656600>      <#1488848193591709696>`)
                .setThumbnail(avatarURL)
                .setFooter({ text: `users | ${interaction.guild.memberCount}` });

            await interaction.editReply({
                embeds: [welcomeEmbed]
            });
        }

        if (subcommand === 'test') {
            // Defer reply to prevent interaction timeout
            await interaction.deferReply();

            // Animation delay (1200ms)
            await new Promise(resolve => setTimeout(resolve, 1200));

            const user = interaction.user;
            const member = interaction.member;
            const avatarURL = user.displayAvatarURL({ dynamic: true, size: 256 });

            const welcomeEmbed = new EmbedBuilder()
                .setColor(embeds.NEUTRAL_COLOR)
                .setAuthor({
                    name: `wlc ${member.displayName} <3`,
                    iconURL: avatarURL
                })
                .setDescription(`wlc to missu! ⸜(｡˃ ᵕ ˂ )⸝♡\n\n<#1488317654501691423>      <#1488317657911656600>      <#1488848193591709696>`)
                .setThumbnail(avatarURL)
                .setFooter({ text: `users | ${interaction.guild.memberCount}` });

            await interaction.editReply({
                embeds: [welcomeEmbed]
            });
        }
    }
};
