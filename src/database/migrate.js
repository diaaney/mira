const fs = require('fs');
const path = require('path');
const GuildConfig = require('./guildConfig');
const ActiveRooms = require('./activeRooms');
const LlamaContext = require('./llamaContext');

// Migration script to transfer data from JSON to SQLite
function migrateFromJSON() {
    console.log('[Migration] Starting JSON to SQLite migration...');

    // Migrate VoiceMaster config
    const configPath = path.join(__dirname, '..', 'commands', 'server-configuration', 'voicemaster', 'data', 'config.json');
    if (fs.existsSync(configPath)) {
        try {
            const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            for (const [guildId, config] of Object.entries(configData)) {
                GuildConfig.setVoiceMasterConfig(guildId, config);
                console.log(`[Migration] Migrated VoiceMaster config for guild ${guildId}`);
            }
        } catch (err) {
            console.error('[Migration] Error migrating config.json:', err);
        }
    }

    // Migrate active rooms
    const activeRoomsPath = path.join(__dirname, '..', 'commands', 'server-configuration', 'voicemaster', 'data', 'activeRooms.json');
    if (fs.existsSync(activeRoomsPath)) {
        try {
            const activeRoomsData = JSON.parse(fs.readFileSync(activeRoomsPath, 'utf8'));
            console.log(`[Migration] Found ${Object.keys(activeRoomsData).length} active rooms`);
            console.log('[Migration] Note: Active rooms will be recreated when users rejoin');
        } catch (err) {
            console.error('[Migration] Error migrating activeRooms.json:', err);
        }
    }

    // Migrate LLM context
    const llamaContextPath = path.join(__dirname, '..', 'commands', 'miscellaneous', 'ai', 'llamaContext.json');
    if (fs.existsSync(llamaContextPath)) {
        try {
            const contextData = JSON.parse(fs.readFileSync(llamaContextPath, 'utf8'));
            for (const [channelId, messages] of Object.entries(contextData)) {
                if (Array.isArray(messages)) {
                    for (const message of messages) {
                        LlamaContext.add(channelId, message);
                    }
                    console.log(`[Migration] Migrated ${messages.length} messages for channel ${channelId}`);
                }
            }
        } catch (err) {
            console.error('[Migration] Error migrating llamaContext.json:', err);
        }
    }

    console.log('[Migration] Migration completed!');
}

// Run if executed directly
if (require.main === module) {
    migrateFromJSON();
}

module.exports = { migrateFromJSON };
