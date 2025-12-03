const GuildConfig = require('../database/guildConfig');

module.exports = (client) => {
    client.on('guildMemberAdd', async (member) => {
        // Guard clauses
        if (!member.guild) return;

        const roleId = GuildConfig.getRoleOnJoin(member.guild.id);
        if (!roleId) return;

        // Intentar obtener y asignar rol
        try {
            const role = await member.guild.roles.fetch(roleId);
            if (!role) {
                console.error(`[RoleOnJoin] Role ${roleId} not found in guild ${member.guild.id}`);
                return;
            }

            await member.roles.add(roleId);
            console.log(`[RoleOnJoin] Assigned role ${role.name} to ${member.user.tag}`);
        } catch (error) {
            console.error(`[RoleOnJoin] Error assigning role to ${member.user.tag}:`, error.message);
        }
    });
};
