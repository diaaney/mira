# Multi-Server Support + `/emoji` Command — Design

**Date:** 2026-06-06
**Status:** Approved (pending spec review)

## Goal

1. Make the bot work correctly across **multiple guilds** (currently hardcoded to a single server).
2. Add an `/emoji add` command that clones a pasted custom emoji into the current server.

## Decisions (from brainstorming)

- **Emoji input:** paste an existing custom emoji; the bot clones it via the Discord CDN.
- **Data migration:** existing flat config is migrated under the current `GUILD_ID`.
- **Member count:** configurable per server via a new `/membercount setup`.
- **Custom emojis:** migrate hardcoded guild emojis to **application emojis** (bot-owned, work everywhere).
- **`/colors`:** remove hardcoded role IDs; create/position the color role dynamically per guild.
- **`user_stats` / leaderboard:** **GLOBAL** (cross-guild). Counting *game state* is per-guild.

## 1. Storage refactor (`src/utils/storage.js`)

### New `config.json` shape

```jsonc
{
  "guilds": {
    "<guildId>": {
      "voicemaster":     { "generator_id": null, "category_id": null, "panel_id": null },
      "counting":        { "channel_id": null, "current_number": 0, "last_user_id": null,
                           "active_booster": null, "active_drop": null },
      "welcome":         { "channel_id": null, "featured_channels": [], "image_url": null },
      "autorole":        { "role_id": null },
      "membercount":     { "category_id": null },
      "personal_colors": { "<userId>": "roleId" }
    }
  },
  "global": {
    "user_stats":     { "<userId>": { /* total_count, numbers_counted, items, primed, ... */ } },
    "afk_users":      { "<userId>": { "reason": "", "since": 0 } },
    "react_messages": { "<userId>": { "emoji": "", "remaining": 0 } }
  }
}
```

### Scoping summary

| Data | Scope | Notes |
|---|---|---|
| voicemaster, counting (incl. game state), welcome, autorole, membercount, personal_colors | per-guild | under `guilds[guildId]` |
| user_stats (inventory + leaderboard), afk_users, react_messages | global | under `global`, keyed by `userId` |
| `rooms.json` | unchanged | already keyed by globally-unique `channel_id` |

### Function signature changes

- Guild-scoped getters/setters gain `guildId` as the **first parameter**:
  `getVoicemasterConfig(guildId)`, `setVoicemasterConfig(guildId, ...)`,
  `getCountingConfig(guildId)`, `setCountingChannel(guildId, channelId)`, counting game state setters,
  `getWelcomeConfig(guildId)` / setters, `getAutorole(guildId)` / setter,
  `getMembercountConfig(guildId)` / `setMembercountCategory(guildId, categoryId)`,
  `getPersonalColor(guildId, userId)` / `setPersonalColor(guildId, userId, roleId)`.
- Global functions keep their current signatures (no `guildId`):
  `getUserStats(userId)`, `getAllUserStats()`, item/stat mutators, AFK, react-message functions.
- Internal helper `getGuildConfig(guildId)` lazily initializes a guild's sub-object with defaults.

### Migration (one-time, automatic on load)

On read, if the loaded object has **no `guilds` key** (legacy flat shape):
1. Write `config.backup.json` (existing backup mechanism).
2. Create `{ guilds: { [GUILD_ID]: {...} }, global: {...} }`.
3. Move `voicemaster, counting, welcome, autorole, personal_colors` (+ a fresh `membercount`) under `guilds[GUILD_ID]`.
4. Move `user_stats, afk_users, react_messages` under `global`.
5. Persist the migrated structure.

`GUILD_ID` is read from `.env`. If absent, log a warning and initialize an empty `guilds` map (fresh start).

### Call-site updates

Pass `interaction.guild.id` / `message.guild.id` / `member.guild.id` into the storage calls across:
`src/events/*` (interactionCreate, messageCreate, voiceStateUpdate, guildMemberAdd, memberCount) and all command `slash.js`/`prefix.js` files that read or write guild config.

## 2. `/emoji add` command (`src/commands/server-configuration/emoji/slash.js`)

- Options: `emoji` (string, required — pasted custom emoji), `name` (string, optional — overrides the source name).
- Behavior:
  1. Validate the actor has `ManageGuildExpressions`; otherwise reject.
  2. Parse `<:name:id>` / `<a:name:id>` with a regex. If it's a unicode emoji (no id), reject with a clear message.
  3. Build CDN URL: `https://cdn.discordapp.com/emojis/{id}.{gif|png}` (gif when animated).
  4. `await interaction.guild.emojis.create({ attachment: url, name })`.
  5. Reply with a success embed showing the new emoji; on failure (emoji limit reached, missing bot permission, bad name) reply with the error reason.
- Registered globally (existing deploy flow), category `server-configuration`.

## 3. Hardcoded emojis → application emojis

- `migrate-emojis.js` (root, run manually once, like `deploy-commands.js`):
  - For each hardcoded custom emoji (animated loading + 11 voicemaster button emojis), download from
    `https://cdn.discordapp.com/emojis/{oldId}.{gif|png}` and upload via `client.application.emojis.create({ attachment, name })`.
  - Write `src/constants/appEmojis.js` mapping logical names → new application-emoji markup/IDs.
- `src/constants/appEmojis.js` ships with the **old IDs as fallback** so nothing breaks before the script runs.
- Replace hardcoded `<a:loading:...>` / `<:lock:...>` etc. references in `src/constants/embeds.js` and
  `src/commands/server-configuration/voicemaster/setup/slash.js` (and any button handlers) with `appEmojis.*`.

## 4. `/colors` per-guild

- Remove hardcoded role boundary IDs and legacy-role removal logic in
  `src/commands/.../colors` and `src/events/interactionCreate.js`.
- Create the color role dynamically and position it just **below the bot's highest role** in the current guild.
- Persist the user→role mapping in per-guild `personal_colors`.
- Boost-gated features (gradient) keep their existing checks via `guild.premiumTier`.

## 5. Member count per-guild

- `/membercount setup` (`src/commands/server-configuration/membercount/slash.js`): accepts/creates a category, stores `membercount.category_id` for the guild.
- `src/events/memberCount.js`: look up the guild's configured category and update its name; **no-op if unconfigured**. Remove the hardcoded category ID.

## Non-goals (YAGNI)

- No move to Supabase/SQL (JSON file storage kept).
- No per-guild config files (single `config.json` retained).
- `/emoji` clones one emoji at a time (no bulk steal).

## Testing

- **Migration:** given a legacy flat `config.json`, after load the structure has `guilds[GUILD_ID]` with the
  original voicemaster/counting/welcome/autorole/personal_colors data and `global` with user_stats/afk/react.
- **Storage isolation:** writes to guild A's counting/welcome/etc. do not affect guild B.
- **Global stats:** `user_stats` mutations are visible regardless of guild; `/top` aggregates across guilds.
- **`/emoji add`:** valid custom emoji → created in guild; unicode emoji → rejected; missing permission → rejected.
- **Idempotent migration:** loading an already-migrated config does not re-wrap or duplicate data.
