const {
    SlashCommandBuilder,
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const path = require('path');
const { setVoicemasterConfig } = require('../../../../utils/storage');
const embeds = require('../../../../constants/embeds');

const vmLogoPath = 'attachment://vm-logo.png';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('voicemaster')
        .setDescription('Setup your VoiceMaster system')
        .addSubcommand(sub =>
            sub.setName('setup')
                .setDescription('Create VoiceMaster category and panel')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const { guild } = interaction;

        // Show thinking state with random verb
        await interaction.reply({
            embeds: [embeds.thinking()],
            ephemeral: true
        });

        // Crear categoría
        const category = await guild.channels.create({
            name: '📞 voice channels',
            type: ChannelType.GuildCategory,
        });

        // Canal generador
        const generatorChannel = await guild.channels.create({
            name: 'create',
            type: ChannelType.GuildVoice,
            parent: category.id,
        });

        // Canal de panel
        const panelChannel = await guild.channels.create({
            name: 'panel',
            type: ChannelType.GuildText,
            parent: category.id,
        });

        // Embed del panel
        const panelEmbed = new EmbedBuilder()
            .setAuthor({ name: 'VoiceMaster Interface', iconURL: guild.iconURL() })
            .setDescription(`Use the buttons below to control your voice channel.\n\n**Button Usage**\n` +
                `<:lock:1489059248292761754> — **\`Lock\`** the voice channel\n` +
                `<:unlock:1489059333328080916> — **\`Unlock\`** the voice channel\n` +
                `<:ghost:1489059154650726491> — **\`Ghost\`** the voice channel\n` +
                `<:reveal:1489059277468340233> — **\`Reveal\`** the voice channel\n` +
                `<:claim:1489058994344431810> — **\`Claim\`** the voice channel\n` +
                `<:disconnect:1489059111927808091> — **\`Disconnect\`** a member\n` +
                `<:start:1489059305696268402> — **\`Start\`** an activity\n` +
                `<:info:1489059218953732307> — **\`View\`** channel information\n` +
                `<:increase:1489059183008420031> — **\`Increase\`** the user limit\n` +
                `<:decrease:1489059046106599549> — **\`Decrease\`** the user limit`
            )
            .setColor(embeds.NEUTRAL_COLOR)
            .setThumbnail(vmLogoPath)
            .setFooter({ text: 'VoiceMaster by Mira' });

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('vm_lock').setEmoji('1489059248292761754').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('vm_unlock').setEmoji('1489059333328080916').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('vm_ghost').setEmoji('1489059154650726491').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('vm_reveal').setEmoji('1489059277468340233').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('vm_claim').setEmoji('1489058994344431810').setStyle(ButtonStyle.Secondary),
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('vm_disconnect').setEmoji('1489059111927808091').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('vm_activity').setEmoji('1489059305696268402').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('vm_info').setEmoji('1489059218953732307').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('vm_increase').setEmoji('1489059183008420031').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('vm_decrease').setEmoji('1489059046106599549').setStyle(ButtonStyle.Secondary),
        );

        await panelChannel.send({
            embeds: [panelEmbed],
            components: [row1, row2],
            files: [path.join(__dirname, '..', 'assets', 'vm-logo.png')]
        });

        // Save config to JSON
        setVoicemasterConfig(generatorChannel.id, category.id, panelChannel.id);

        // Update to success state
        await interaction.editReply({
            embeds: [embeds.success('VoiceMaster setup completed!')]
        });
    }
};
