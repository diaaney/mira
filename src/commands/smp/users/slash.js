const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const embeds = require('../../../constants/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('users')
        .setDescription('Ver usuarios conectados al servidor de Minecraft'),

    async execute(interaction) {
        try {
            // PLACEHOLDER: Aquí irá la lógica para obtener usuarios conectados del servidor de Minecraft
            // Por ahora usamos datos mockados/placeholder

            const connectedUsers = [
                { name: 'Player1', uuid: 'placeholder-uuid-1' },
                { name: 'Player2', uuid: 'placeholder-uuid-2' },
                { name: 'Player3', uuid: 'placeholder-uuid-3' }
            ];

            const maxPlayers = 20; // Placeholder

            if (connectedUsers.length === 0) {
                return interaction.reply({
                    embeds: [embeds.info('No hay jugadores conectados en este momento')],
                    ephemeral: true
                });
            }

            const userList = connectedUsers.map((user, idx) =>
                `${idx + 1}. **${user.name}**`
            ).join('\n');

            const usersEmbed = new EmbedBuilder()
                .setColor('#7ab158')
                .setTitle('👥 Jugadores Conectados')
                .setDescription(userList)
                .setFooter({
                    text: `${connectedUsers.length}/${maxPlayers} jugadores en línea`
                })
                .setTimestamp();

            return interaction.reply({
                embeds: [usersEmbed],
                ephemeral: true
            });
        } catch (error) {
            console.error('[SMP Users] Error:', error);
            return interaction.reply({
                embeds: [embeds.error('Error al obtener los jugadores conectados')],
                ephemeral: true
            });
        }
    }
};
