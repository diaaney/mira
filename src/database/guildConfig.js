const db = require('./db');

class GuildConfig {
    // Get guild config by ID
    static get(guildId) {
        const stmt = db.prepare('SELECT * FROM guild_configs WHERE guild_id = ?');
        return stmt.get(guildId);
    }

    // Get or create guild config with default values
    static getOrCreate(guildId) {
        let config = this.get(guildId);
        if (!config) {
            const now = Date.now();
            const stmt = db.prepare(`
                INSERT INTO guild_configs (guild_id, prefix, created_at, updated_at)
                VALUES (?, '!', ?, ?)
            `);
            stmt.run(guildId, now, now);
            config = this.get(guildId);
        }
        return config;
    }

    // Get guild prefix
    static getPrefix(guildId) {
        const config = this.getOrCreate(guildId);
        return config.prefix || '!';
    }

    // Set guild prefix
    static setPrefix(guildId, prefix) {
        const config = this.getOrCreate(guildId);
        const stmt = db.prepare(`
            UPDATE guild_configs
            SET prefix = ?, updated_at = ?
            WHERE guild_id = ?
        `);
        stmt.run(prefix, Date.now(), guildId);
    }

    // Get VoiceMaster config
    static getVoiceMasterConfig(guildId) {
        const config = this.get(guildId);
        if (!config) return null;

        return {
            generator: config.voicemaster_generator_id,
            category: config.voicemaster_category_id,
            panel: config.voicemaster_panel_id
        };
    }

    // Set VoiceMaster config
    static setVoiceMasterConfig(guildId, { generator, category, panel }) {
        const config = this.getOrCreate(guildId);
        const stmt = db.prepare(`
            UPDATE guild_configs
            SET voicemaster_generator_id = ?,
                voicemaster_category_id = ?,
                voicemaster_panel_id = ?,
                updated_at = ?
            WHERE guild_id = ?
        `);
        stmt.run(generator, category, panel, Date.now(), guildId);
    }

    // Check if guild has VoiceMaster configured
    static hasVoiceMaster(guildId) {
        const config = this.get(guildId);
        return config && config.voicemaster_generator_id !== null;
    }

    // Get role on join
    static getRoleOnJoin(guildId) {
        const config = this.get(guildId);
        return config ? config.role_on_join_id : null;
    }

    // Set role on join
    static setRoleOnJoin(guildId, roleId) {
        const config = this.getOrCreate(guildId);
        const stmt = db.prepare(`
            UPDATE guild_configs
            SET role_on_join_id = ?, updated_at = ?
            WHERE guild_id = ?
        `);
        stmt.run(roleId, Date.now(), guildId);
    }

    // Get RGB loop roles
    static getRGBLoopRoles(guildId) {
        const config = this.get(guildId);
        if (!config || !config.rgb_loop_roles) return null;
        try {
            return JSON.parse(config.rgb_loop_roles);
        } catch (error) {
            console.error('[GuildConfig] Error parsing RGB loop roles:', error);
            return null;
        }
    }

    // Set RGB loop roles
    static setRGBLoopRoles(guildId, roleIds) {
        const config = this.getOrCreate(guildId);
        const stmt = db.prepare(`
            UPDATE guild_configs
            SET rgb_loop_roles = ?, rgb_loop_interval = ?, updated_at = ?
            WHERE guild_id = ?
        `);
        stmt.run(
            roleIds.length > 0 ? JSON.stringify(roleIds) : null,
            1500,
            Date.now(),
            guildId
        );
    }

    // Get RGB loop interval
    static getRGBLoopInterval(guildId) {
        const config = this.get(guildId);
        return config?.rgb_loop_interval || 1500;
    }

    // Clear RGB loop
    static clearRGBLoop(guildId) {
        const stmt = db.prepare(`
            UPDATE guild_configs
            SET rgb_loop_roles = NULL, updated_at = ?
            WHERE guild_id = ?
        `);
        stmt.run(Date.now(), guildId);
    }

    // Check if guild has RGB loop active
    static hasRGBLoop(guildId) {
        const config = this.get(guildId);
        return config?.rgb_loop_roles !== null && config?.rgb_loop_roles !== undefined;
    }
}

module.exports = GuildConfig;
