const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../../constants/embeds');
const smpWhitelist = require('../../../database/smpWhitelist');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('smp')
        .setDescription('Comandos del SMP')
        .addSubcommand(subcommand =>
            subcommand
                .setName('whitelist')
                .setDescription('Gestiona el whitelist del SMP')
                .addStringOption(option =>
                    option
                        .setName('action')
                        .setDescription('Acción a realizar')
                        .setRequired(true)
                        .addChoices(
                            { name: 'add', value: 'add' },
                            { name: 'remove', value: 'remove' },
                            { name: 'list', value: 'list' },
                            { name: 'check', value: 'check' }
                        )
                )
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('Usuario de Discord (requerido para add/remove/check)')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName('minecraft_name')
                        .setDescription('Nombre de Minecraft (requerido para add)')
                        .setRequired(false)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand !== 'whitelist') return;

        const action = interaction.options.getString('action');
        const user = interaction.options.getUser('user');
        const minecraftName = interaction.options.getString('minecraft_name');

        // ADD action
        if (action === 'add') {
            if (!user || !minecraftName) {
                return interaction.reply({
                    embeds: [embeds.error('Se requiere un usuario y nombre de Minecraft')],
                    ephemeral: true
                });
            }

            try {
                // Validar si ya existe
                if (smpWhitelist.exists(user.id)) {
                    return interaction.reply({
                        embeds: [embeds.error(`El usuario <@${user.id}> ya está en el whitelist`)],
                        ephemeral: true
                    });
                }

                // Validar si el nombre de Minecraft ya existe
                if (smpWhitelist.getByMinecraftName(minecraftName)) {
                    return interaction.reply({
                        embeds: [embeds.error(`El nombre de Minecraft **${minecraftName}** ya está registrado`)],
                        ephemeral: true
                    });
                }

                smpWhitelist.add(user.id, minecraftName, user.username, interaction.user.id);

                return interaction.reply({
                    embeds: [embeds.success(
                        `✅ **${user.username}** ha sido agregado al whitelist\n` +
                        `🎮 Minecraft: **${minecraftName}**`
                    )],
                    ephemeral: true
                });
            } catch (error) {
                console.error('[SMP Whitelist] Error al agregar:', error);
                return interaction.reply({
                    embeds: [embeds.error('Error al agregar el usuario al whitelist')],
                    ephemeral: true
                });
            }
        }

        // REMOVE action
        if (action === 'remove') {
            if (!user) {
                return interaction.reply({
                    embeds: [embeds.error('Se requiere un usuario')],
                    ephemeral: true
                });
            }

            try {
                const whitelistUser = smpWhitelist.getByDiscordId(user.id);

                if (!whitelistUser) {
                    return interaction.reply({
                        embeds: [embeds.error(`El usuario <@${user.id}> no está en el whitelist`)],
                        ephemeral: true
                    });
                }

                smpWhitelist.remove(user.id);

                return interaction.reply({
                    embeds: [embeds.success(
                        `✅ **${whitelistUser.discord_username}** ha sido removido del whitelist`
                    )],
                    ephemeral: true
                });
            } catch (error) {
                console.error('[SMP Whitelist] Error al remover:', error);
                return interaction.reply({
                    embeds: [embeds.error('Error al remover el usuario del whitelist')],
                    ephemeral: true
                });
            }
        }

        // LIST action
        if (action === 'list') {
            try {
                const whitelist = smpWhitelist.getAll();

                if (whitelist.length === 0) {
                    return interaction.reply({
                        embeds: [embeds.info('El whitelist está vacío')],
                        ephemeral: true
                    });
                }

                const listText = whitelist.map((user, idx) =>
                    `${idx + 1}. **${user.discord_username}** → \`${user.minecraft_name}\``
                ).join('\n');

                const embed = require('discord.js').EmbedBuilder;
                const listEmbed = new embed()
                    .setColor('#7ab158')
                    .setTitle('📋 Whitelist del SMP')
                    .setDescription(listText)
                    .setFooter({ text: `Total: ${whitelist.length} usuarios` })
                    .setTimestamp();

                return interaction.reply({
                    embeds: [listEmbed],
                    ephemeral: true
                });
            } catch (error) {
                console.error('[SMP Whitelist] Error al listar:', error);
                return interaction.reply({
                    embeds: [embeds.error('Error al listar el whitelist')],
                    ephemeral: true
                });
            }
        }

        // CHECK action
        if (action === 'check') {
            if (!user) {
                return interaction.reply({
                    embeds: [embeds.error('Se requiere un usuario')],
                    ephemeral: true
                });
            }

            try {
                const whitelistUser = smpWhitelist.getByDiscordId(user.id);

                if (!whitelistUser) {
                    return interaction.reply({
                        embeds: [embeds.error(`El usuario <@${user.id}> no está en el whitelist`)],
                        ephemeral: true
                    });
                }

                const embed = require('discord.js').EmbedBuilder;
                const checkEmbed = new embed()
                    .setColor('#7ab158')
                    .setTitle('✅ Usuario en Whitelist')
                    .addFields(
                        { name: 'Discord', value: `<@${whitelistUser.discord_id}>`, inline: true },
                        { name: 'Minecraft', value: `\`${whitelistUser.minecraft_name}\``, inline: true },
                        { name: 'Agregado por', value: whitelistUser.added_by ? `<@${whitelistUser.added_by}>` : 'Sistema', inline: true }
                    )
                    .setTimestamp();

                return interaction.reply({
                    embeds: [checkEmbed],
                    ephemeral: true
                });
            } catch (error) {
                console.error('[SMP Whitelist] Error al verificar:', error);
                return interaction.reply({
                    embeds: [embeds.error('Error al verificar el usuario')],
                    ephemeral: true
                });
            }
        }
    }
};
