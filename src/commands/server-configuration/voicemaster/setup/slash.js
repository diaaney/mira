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
                `<:lock:1442162503621542121> — **\`Lock\`** the voice channel\n` +
                `<:unlock:1442162751395856529> — **\`Unlock\`** the voice channel\n` +
                `<:ghost:1442162253557268481> — **\`Ghost\`** the voice channel\n` +
                `<:reveal:1442162575721627688> — **\`Reveal\`** the voice channel\n` +
                `<:claim:1442162092361777325> — **\`Claim\`** the voice channel\n` +
                `<:disconnect:1442162201002774619> — **\`Disconnect\`** a member\n` +
                `<:start:1442162695150243863> — **\`Start\`** an activity\n` +
                `<:info:1442162380036378744> — **\`View\`** channel information\n` +
                `<:increase:1442162325514621100> — **\`Increase\`** the user limit\n` +
                `<:decrease:1442162157465636997> — **\`Decrease\`** the user limit`
            )
            .setColor(embeds.NEUTRAL_COLOR)
            .setThumbnail(vmLogoPath)
            .setFooter({ text: 'VoiceMaster by Mira' });

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('vm_lock').setEmoji('1442162503621542121').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('vm_unlock').setEmoji('1442162751395856529').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('vm_ghost').setEmoji('1442162253557268481').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('vm_reveal').setEmoji('1442162575721627688').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('vm_claim').setEmoji('1442162092361777325').setStyle(ButtonStyle.Secondary),
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('vm_disconnect').setEmoji('1442162201002774619').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('vm_activity').setEmoji('1442162695150243863').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('vm_info').setEmoji('1442162380036378744').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('vm_increase').setEmoji('1442162325514621100').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('vm_decrease').setEmoji('1442162157465636997').setStyle(ButtonStyle.Secondary),
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
