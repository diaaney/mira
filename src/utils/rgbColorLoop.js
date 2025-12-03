const GuildConfig = require('../database/guildConfig');

class RGBColorLoopManager {
    constructor() {
        // Map<guildId, intervalId>
        this.activeLoops = new Map();
        // Map<guildId, { roles, startedAt, currentIndex }>
        this.loopStates = new Map();
    }

    /**
     * Inicia un loop RGB para un servidor
     * @param {Guild} guild - Objeto del servidor Discord
     * @param {string[]} roleIds - Array de IDs de roles a rotar
     * @param {number} interval - Intervalo en ms (default: 1500)
     */
    async startRGBLoop(guild, roleIds, interval = 1500) {
        const guildId = guild.id;

        // Validar roles
        this.validateRoles(guild, roleIds);

        // Detener loop anterior si existe
        if (this.activeLoops.has(guildId)) {
            this.stopRGBLoop(guildId);
        }

        // Inicializar estado
        this.loopStates.set(guildId, {
            roles: roleIds,
            startedAt: Date.now(),
            currentIndex: 0
        });

        // Crear y guardar intervalo
        const intervalId = setInterval(async () => {
            try {
                await this.rotateRoles(guild, roleIds);
            } catch (error) {
                console.error(`[RGB] Error rotating roles for ${guildId}:`, error);
            }
        }, interval);

        this.activeLoops.set(guildId, intervalId);
        console.log(`[RGB] Started loop for guild ${guildId} with ${roleIds.length} roles`);
    }

    /**
     * Detiene el loop RGB de un servidor
     * @param {string} guildId - ID del servidor
     */
    stopRGBLoop(guildId) {
        if (this.activeLoops.has(guildId)) {
            clearInterval(this.activeLoops.get(guildId));
            this.activeLoops.delete(guildId);
            this.loopStates.delete(guildId);
            console.log(`[RGB] Stopped loop for guild ${guildId}`);
        }
    }

    /**
     * Rota los roles de todos los miembros del servidor
     * @param {Guild} guild - Objeto del servidor Discord
     * @param {string[]} roleIds - Array de IDs de roles
     */
    async rotateRoles(guild, roleIds) {
        try {
            const members = await guild.members.fetch().catch(err => {
                console.error(`[RGB] Error fetching members for ${guild.id}:`, err);
                return new Map();
            });

            let successCount = 0;
            let failCount = 0;

            for (const member of members.values()) {
                try {
                    // Obtener rol actual del miembro
                    let currentRoleId = null;
                    for (const roleId of roleIds) {
                        if (member.roles.cache.has(roleId)) {
                            currentRoleId = roleId;
                            break;
                        }
                    }

                    if (currentRoleId === null) {
                        // Primer cambio: agregar primer rol
                        await member.roles.add(roleIds[0]).catch(() => {
                            failCount++;
                        });
                    } else {
                        // Rotar al siguiente rol
                        const currentIndex = roleIds.indexOf(currentRoleId);
                        const nextIndex = (currentIndex + 1) % roleIds.length;

                        await member.roles.remove(currentRoleId).catch(() => {});
                        await member.roles.add(roleIds[nextIndex]).catch(() => {
                            failCount++;
                        });
                    }

                    successCount++;

                    // Delay para evitar rate-limiting
                    await new Promise(resolve => setTimeout(resolve, 50));
                } catch (error) {
                    if (error.code === 429) {
                        // Rate-limited
                        console.warn(`[RGB] Rate limited for guild ${guild.id}. Waiting...`);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                    failCount++;
                }
            }

            if (successCount + failCount > 0) {
                console.log(`[RGB] Guild ${guild.id}: ${successCount} success, ${failCount} failed`);
            }
        } catch (error) {
            console.error(`[RGB] Critical error rotating roles:`, error);
        }
    }

    /**
     * Obtiene el estado actual del loop
     * @param {string} guildId - ID del servidor
     * @returns {object} Estado del loop
     */
    getLoopStatus(guildId) {
        const isActive = this.activeLoops.has(guildId);
        const state = this.loopStates.get(guildId);
        const interval = GuildConfig.getRGBLoopInterval(guildId);

        return {
            active: isActive,
            roles: isActive && state ? state.roles : [],
            interval: interval,
            startedAt: state ? state.startedAt : null,
            membersCount: 0 // Se obtendrá en el comando
        };
    }

    /**
     * Valida que los roles sean válidos para el loop
     * @param {Guild} guild - Objeto del servidor Discord
     * @param {string[]} roleIds - Array de IDs de roles
     */
    validateRoles(guild, roleIds) {
        const botHighestRole = guild.members.me.roles.highest;

        for (const roleId of roleIds) {
            const role = guild.roles.cache.get(roleId);

            // Rol no existe
            if (!role) {
                throw new Error(`Role ${roleId} not found`);
            }

            // Rol más alto que el bot
            if (role.position >= botHighestRole.position) {
                throw new Error(`Role ${role.name} is higher than my highest role`);
            }

            // Rol del sistema (@everyone, @here, etc)
            if (role.managed) {
                throw new Error(`Cannot use managed role ${role.name}`);
            }
        }
    }

    /**
     * Maneja la eliminación de un rol
     * @param {string} guildId - ID del servidor
     * @param {string} roleId - ID del rol eliminado
     */
    async handleRoleDelete(guildId, roleId) {
        const roleIds = GuildConfig.getRGBLoopRoles(guildId);

        if (roleIds && roleIds.includes(roleId)) {
            console.log(`[RGB] Role ${roleId} deleted. Stopping loop in guild ${guildId}`);

            // Detener loop
            this.stopRGBLoop(guildId);
            GuildConfig.clearRGBLoop(guildId);

            return true;
        }

        return false;
    }

    /**
     * Limpia los loops de un servidor (cuando el bot se va)
     * @param {string} guildId - ID del servidor
     */
    cleanupGuild(guildId) {
        this.stopRGBLoop(guildId);
    }
}

module.exports = new RGBColorLoopManager();
