const {
    Collection,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    Routes,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const embeds = require('../constants/embeds');
const { getRoom, getPersonalColor, setPersonalColor } = require('../utils/storage');

const LEGACY_COLOR_ROLE_IDS = [
    '1488317627062288535',
    '1488317627913994261',
    '1488317628568305825',
    '1488317629801431211',
    '1488317630703079617',
    '1488317631458050088',
];

const COLOR_POSITION_UPPER_BOUND = '1488317626315837440';
const COLOR_POSITION_LOWER_BOUND = '1488317632246710432';

function parseHexColor(input) {
    if (!input) return null;
    let hex = input.trim().replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
    return parseInt(hex, 16);
}

function isValidIconUrl(url) {
    try {
        const u = new URL(url);
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
        return false;
    }
}

async function applyPersonalColor(interaction, { primaryColor, secondaryColor = null, customName = null, iconUrl = null }) {
    const member = interaction.member;
    const guild = interaction.guild;

    await member.roles.remove(LEGACY_COLOR_ROLE_IDS).catch(() => {});

    let roleId = getPersonalColor(member.id);
    let role = roleId ? await guild.roles.fetch(roleId).catch(() => null) : null;

    const displayName = member.displayName || member.user.username;
    const baseName = customName || (role ? role.name : `🎨 ${displayName}`);

    const editOpts = { color: primaryColor, name: baseName };
    if (iconUrl) editOpts.icon = iconUrl;

    let iconApplied = Boolean(iconUrl);

    async function tryWrite() {
        if (role) {
            await role.edit(editOpts, 'personal color update');
        } else {
            role = await guild.roles.create({
                ...editOpts,
                hoist: false,
                mentionable: false,
                reason: `personal color role for ${member.user.tag}`
            });
            setPersonalColor(member.id, role.id);
        }
    }

    try {
        await tryWrite();
    } catch (err) {
        if (iconUrl) {
            iconApplied = false;
            delete editOpts.icon;
            await tryWrite();
        } else {
            throw err;
        }
    }

    let gradientApplied = false;
    try {
        await interaction.client.rest.patch(
            Routes.guildRole(guild.id, role.id),
            {
                body: {
                    colors: {
                        primary_color: primaryColor,
                        secondary_color: secondaryColor,
                        tertiary_color: null
                    }
                },
                reason: secondaryColor !== null ? 'personal gradient' : 'personal solid color'
            }
        );
        gradientApplied = secondaryColor !== null;
    } catch (err) {
        if (secondaryColor !== null) {
            const e = new Error('gradient_unsupported');
            e.cause = err;
            throw e;
        }
    }

    const upperBound = await guild.roles.fetch(COLOR_POSITION_UPPER_BOUND).catch(() => null);
    const lowerBound = await guild.roles.fetch(COLOR_POSITION_LOWER_BOUND).catch(() => null);
    if (upperBound) {
        let target = upperBound.position - 1;
        if (lowerBound && target <= lowerBound.position) target = lowerBound.position + 1;
        await role.setPosition(target).catch(() => {});
    }

    if (!member.roles.cache.has(role.id)) {
        await member.roles.add(role).catch(() => {});
    }

    return { role, gradientApplied, iconApplied };
}

// Cargar todos los botones desde components/buttons/
const buttons = new Collection();
const buttonsPath = path.join(__dirname, '../components/buttons');
fs.readdirSync(buttonsPath).forEach(file => {
    const button = require(path.join(buttonsPath, file));
    if (button?.id && typeof button.execute === 'function') {
        buttons.set(button.id, button);
    }
});

module.exports = (client) => {
    client.on('interactionCreate', async interaction => {
        // Slash command
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (err) {
                console.error(err);
                await interaction.reply({
                    embeds: [embeds.error('Error executing command.')],
                    ephemeral: true
                });
            }
            return;
        }

        // Botón
        if (interaction.isButton()) {
            // Solid color picker
            if (interaction.customId === 'colors_pick_solid') {
                const modal = new ModalBuilder()
                    .setCustomId('colors_modal_solid')
                    .setTitle('pick your color');

                const hexInput = new TextInputBuilder()
                    .setCustomId('colors_hex')
                    .setLabel('hex code')
                    .setPlaceholder('#ff66cc')
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(3)
                    .setMaxLength(7)
                    .setRequired(true);

                const nameInput = new TextInputBuilder()
                    .setCustomId('colors_name')
                    .setLabel('role name (optional)')
                    .setPlaceholder('leave empty to keep current')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(100)
                    .setRequired(false);

                const iconInput = new TextInputBuilder()
                    .setCustomId('colors_icon')
                    .setLabel('icon PNG url (optional)')
                    .setPlaceholder('https://... — needs server boost lvl 2')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(500)
                    .setRequired(false);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(hexInput),
                    new ActionRowBuilder().addComponents(nameInput),
                    new ActionRowBuilder().addComponents(iconInput)
                );
                return interaction.showModal(modal);
            }

            // Gradient picker
            if (interaction.customId === 'colors_pick_gradient') {
                const modal = new ModalBuilder()
                    .setCustomId('colors_modal_gradient')
                    .setTitle('pick your gradient');

                const primaryInput = new TextInputBuilder()
                    .setCustomId('colors_hex_primary')
                    .setLabel('first color (hex)')
                    .setPlaceholder('#ff66cc')
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(3)
                    .setMaxLength(7)
                    .setRequired(true);

                const secondaryInput = new TextInputBuilder()
                    .setCustomId('colors_hex_secondary')
                    .setLabel('second color (hex)')
                    .setPlaceholder('#6666ff')
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(3)
                    .setMaxLength(7)
                    .setRequired(true);

                const nameInput = new TextInputBuilder()
                    .setCustomId('colors_name')
                    .setLabel('role name (optional)')
                    .setPlaceholder('leave empty to keep current')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(100)
                    .setRequired(false);

                const iconInput = new TextInputBuilder()
                    .setCustomId('colors_icon')
                    .setLabel('icon PNG url (optional)')
                    .setPlaceholder('https://... — needs server boost lvl 2')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(500)
                    .setRequired(false);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(primaryInput),
                    new ActionRowBuilder().addComponents(secondaryInput),
                    new ActionRowBuilder().addComponents(nameInput),
                    new ActionRowBuilder().addComponents(iconInput)
                );
                return interaction.showModal(modal);
            }

            const handler = buttons.get(interaction.customId);
            if (!handler) return;

            const userChannel = interaction.member.voice?.channel;
            if (!userChannel) {
                return interaction.reply({
                    embeds: [embeds.error('You are not in a voice channel.')],
                    ephemeral: true
                });
            }

            const room = getRoom(userChannel.id);

            // Los botones como 'claim', 'info' y 'activity' pueden ser usados por cualquiera
            const bypassOwnerCheck = ['vm_claim', 'vm_info', 'vm_activity'];

            if (!room && !bypassOwnerCheck.includes(interaction.customId)) {
                return interaction.reply({
                    embeds: [embeds.error('This is not a VoiceMaster channel.')],
                    ephemeral: true
                });
            }

            if (room && room.owner_id !== interaction.member.id && !bypassOwnerCheck.includes(interaction.customId)) {
                return interaction.reply({
                    embeds: [embeds.error('You are not the owner of this channel.')],
                    ephemeral: true
                });
            }

            try {
                await handler.execute(interaction, userChannel, room);
            } catch (err) {
                console.error(err);
                return interaction.reply({
                    embeds: [embeds.error('Error handling button interaction.')],
                    ephemeral: true
                });
            }
        }

        // Modal submit
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'colors_modal_solid' || interaction.customId === 'colors_modal_gradient') {
                const isGradient = interaction.customId === 'colors_modal_gradient';

                const primary = parseHexColor(
                    interaction.fields.getTextInputValue(isGradient ? 'colors_hex_primary' : 'colors_hex')
                );
                const secondary = isGradient
                    ? parseHexColor(interaction.fields.getTextInputValue('colors_hex_secondary'))
                    : null;

                if (primary === null || (isGradient && secondary === null)) {
                    return interaction.reply({
                        embeds: [embeds.error('one of those hex codes is invalid. use a format like `#ff66cc` or `f6c`.')],
                        ephemeral: true
                    });
                }

                const customName = (interaction.fields.getTextInputValue('colors_name') || '').trim() || null;
                const iconRaw = (interaction.fields.getTextInputValue('colors_icon') || '').trim();
                const iconUrl = iconRaw || null;

                if (iconUrl && !isValidIconUrl(iconUrl)) {
                    return interaction.reply({
                        embeds: [embeds.error('that icon URL doesn\'t look right. needs to be a direct http(s) link to a png/jpg.')],
                        ephemeral: true
                    });
                }

                await interaction.deferReply({ ephemeral: true });

                try {
                    const { gradientApplied, iconApplied } = await applyPersonalColor(interaction, {
                        primaryColor: primary,
                        secondaryColor: secondary,
                        customName,
                        iconUrl
                    });

                    const hexA = primary.toString(16).padStart(6, '0');
                    const hexB = secondary !== null ? secondary.toString(16).padStart(6, '0') : null;

                    const notes = [];
                    if (isGradient && !gradientApplied) {
                        notes.push('gradient needs **Server Boost lvl 2** — fell back to solid for now');
                    }
                    if (iconUrl && !iconApplied) {
                        notes.push('couldn\'t set the icon — likely needs **Server Boost lvl 2** or the URL didn\'t load');
                    }

                    const headline = isGradient
                        ? `gradient set: **#${hexA}** → **#${hexB}**`
                        : `your color is now **#${hexA}**`;

                    const body = notes.length
                        ? `${headline}.\n\n${notes.map(n => `• ${n}`).join('\n')}`
                        : `${headline}. looking fresh ${interaction.member}`;

                    return interaction.editReply({
                        embeds: [(notes.length ? embeds.error : embeds.success)(body)]
                    });
                } catch (err) {
                    if (err?.message === 'gradient_unsupported') {
                        console.error('[Colors] gradient unsupported:', err.cause?.message || err.cause);
                        return interaction.editReply({
                            embeds: [embeds.error('this server can\'t use gradient roles yet — needs **Server Boost lvl 2**.')]
                        });
                    }
                    console.error('[Colors] failed to apply personal color:', err);
                    return interaction.editReply({
                        embeds: [embeds.error('couldn\'t set that. make sure i have **Manage Roles** and my role is high enough in the list.')]
                    });
                }
            }
        }

        // Select menu (ej: disconnect y activity)
        if (interaction.isStringSelectMenu()) {
            const userChannel = interaction.member.voice?.channel;
            if (!userChannel) {
                return interaction.reply({
                    embeds: [embeds.error('You are not in a voice channel.')],
                    ephemeral: true
                });
            }

            const room = getRoom(userChannel.id);
            const selected = interaction.values;

            if (interaction.customId === 'vm_disconnect_select') {
                const toKick = selected.filter(id => userChannel.members.has(id));
                for (const id of toKick) {
                    const member = userChannel.members.get(id);
                    if (member) await member.voice.disconnect().catch(() => {});
                }

                return interaction.reply({
                    embeds: [embeds.success(`🪝 Disconnected ${toKick.length} member(s) from your channel.`)],
                    ephemeral: true
                });
            }

            if (interaction.customId === 'vm_activity_select') {
                return interaction.reply({
                    embeds: [
                        embeds.warn(
                            `⚠️ <@${interaction.user.id}>: You can now start 🚀 **activities** in your app!\nThis **functionality** via interface buttons has been removed.`
                        )
                    ],
                    ephemeral: true
                });
            }
        }
    });
};
