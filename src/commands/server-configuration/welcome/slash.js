const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const embeds = require('../../../constants/embeds');
const { getWelcomeConfig, setWelcomeChannel } = require('../../../utils/storage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('configure welcome messages for new members')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('configure the welcome channel (admin only)')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('channel where welcome messages will be sent')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('test the welcome message in the configured channel')
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

            const channel = interaction.options.getChannel('channel');

            // Save the welcome channel
            setWelcomeChannel(channel.id);

            // Defer reply to prevent interaction timeout
            await interaction.deferReply({ ephemeral: true });

            // Animation delay (1200ms)
            await new Promise(resolve => setTimeout(resolve, 1200));

            await interaction.editReply({
                embeds: [embeds.success(`welcome channel set to ${channel}! ✨\n\nuse \`/welcome test\` to preview the message`)]
            });
        }

        if (subcommand === 'test') {
            // Get welcome configuration
            const welcomeConfig = getWelcomeConfig();

            if (!welcomeConfig.channel_id) {
                return interaction.reply({
                    embeds: [embeds.error('nah, you need to configure a welcome channel first using `/welcome setup`')],
                    ephemeral: true
                });
            }

            // Get the configured channel
            const welcomeChannel = await interaction.guild.channels.fetch(welcomeConfig.channel_id);

            if (!welcomeChannel) {
                return interaction.reply({
                    embeds: [embeds.error('the configured welcome channel no longer exists. please run `/welcome setup` again')],
                    ephemeral: true
                });
            }

            // Defer reply to prevent interaction timeout
            await interaction.deferReply({ ephemeral: true });

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

            // Send to welcome channel
            await welcomeChannel.send({
                embeds: [welcomeEmbed]
            });

            // Confirm to user
            await interaction.editReply({
                embeds: [embeds.success(`test message sent to ${welcomeChannel}! ✨`)]
            });
        }
    }
};
