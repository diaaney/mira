const { Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const embeds = require('../constants/embeds');
const { getRoom } = require('../utils/storage');

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

        // Select menu (ej: disconnect y activity)
        if (interaction.isStringSelectMenu()) {
            // Color selection menu (doesn't require voice channel)
            if (interaction.customId === 'color_select') {
                const selectedRoleId = interaction.values[0];
                const member = interaction.member;

                // Define all color roles to remove
                const allColorRoles = [
                    '1488317627062288535',
                    '1488317627913994261',
                    '1488317628568305825',
                    '1488317629801431211',
                    '1488317630703079617',
                    '1488317631458050088',
                ];

                try {
                    // Remove all color roles first
                    await member.roles.remove(allColorRoles).catch(() => {});

                    // Add the selected color role
                    await member.roles.add(selectedRoleId);

                    const selectedRole = interaction.guild.roles.cache.get(selectedRoleId);
                    const roleName = selectedRole ? selectedRole.name : 'your color';

                    return interaction.reply({
                        embeds: [embeds.success(`you got the **${roleName}** role now. looking fresh!`)]
                    });
                } catch (err) {
                    console.error('Error assigning color role:', err);
                    return interaction.reply({
                        embeds: [embeds.error('Couldn\'t assign that color role. Maybe I don\'t have permission?')],
                        ephemeral: true
                    });
                }
            }

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
