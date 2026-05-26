# Counting Boosters, Items & Stats — Design

## Goal

Layered upgrade of the counting game in `src/events/messageCreate.js` plus new slash commands:

1. Plain-text snarky wrong-number replies (shipped).
2. Booster mechanic with claim button + modal (shipped).
3. Item drops (new spawn type) that go to a user's inventory.
4. Per-user stats (`total_count`, `numbers_counted`, `items`, `protecting_through`, `primed`).
5. Slash commands: `/loot [user]`, `/top`, `/use <item> [user]`.

## Wrong-Number Replies (shipped)

- Plain text reply, 20 random lines in `src/constants/countingLines.js`.

## Booster Mechanic (shipped)

- 8% chance per correct count, max 1 active.
- Operation generator in `src/utils/boosterOps.js`.
- Booster applies to **global** count (`current_number`). It does NOT credit `total_count` to any user. Only the literal number you typed adds to your `total_count`.
- Win/fail lines in `src/constants/countingLines.js`.

## Item Drops (new)

- After a correct count: roll booster (8%) first. If it didn't roll, then roll item drop (4%).
- Only one drop OR one booster active at a time.
- Drop spawn message:
  ```
  🎁 a 🛡 streak shield appeared — solve `(7+5)×4` to claim it
  [🎯 claim it]
  ```
- Button `drop_claim:<drop_id>` → modal `drop_answer:<drop_id>` with one input.
- First user to submit correct answer wins the item; it goes to their inventory.
- Wrong answer: drop is consumed, user gets a short mocking ephemeral and a mock reply on the original message.
- Race: same handling as boosters — re-read storage on modal submit, ephemeral "someone got there first" if id no longer matches.

### Item types (4)

| Item | Activation | Effect |
|---|---|---|
| 🛡 `streak_shield` | passive | Auto-arms on each correct count if user has ≥1 in inventory. Protects through `current + 25`. On fumble, if any user has an active protection window AND ≥1 shield in inventory, consume 1 of their shields → count is NOT reset, post a save message. |
| 🎯 `perfect_aim` | `/use perfect_aim` | Primes user. Next time they click `claim it` on a booster, the modal is skipped and the booster auto-wins. Consumes 1 item. |
| 🔮 `oracle_eye` | `/use oracle_eye` | Primes user. Next booster claim: ephemeral message reveals the answer, then normal modal appears. Consumes 1 item. |
| 💣 `sabotage` | `/use sabotage user:@target` | Target's next count attempt must be a math expression evaluating to the expected number. Plain number = wrong (count resets). Sabotage clears after target's next attempt (right or wrong). |

## Per-User Stats

Storage in `data/config.json` under `user_stats`:

```json
"user_stats": {
  "<user_id>": {
    "total_count": 0,
    "numbers_counted": 0,
    "items": {
      "streak_shield": 0,
      "perfect_aim": 0,
      "sabotage": 0,
      "oracle_eye": 0
    },
    "protecting_through": null,
    "primed": {
      "perfect_aim": false,
      "oracle_eye": false
    },
    "sabotaged": false
  }
}
```

- `total_count` increases by the literal number typed on each correct count.
- `numbers_counted` increments by 1 on each correct count.
- `protecting_through` (number | null): if `current_number <= protecting_through`, the user is currently protecting the count. Set on correct count if they have ≥1 shield in inventory. Cleared on consumption.
- `primed.perfect_aim` / `primed.oracle_eye`: armed by `/use`; consumed on next booster claim.
- `sabotaged` (bool): set by another user's `/use sabotage`. Cleared on next count attempt.

### Helpers in `src/utils/storage.js`

- `getUserStats(user_id)` — returns existing or defaulted stats (without writing).
- `ensureUserStats(user_id)` — returns + persists default.
- `addToTotalCount(user_id, n)` — increments total and numbers_counted, also re-arms shield if applicable.
- `addItem(user_id, item_type, qty=1)`
- `removeItem(user_id, item_type, qty=1)`
- `primeItem(user_id, item_type)` / `unprimeItem(...)`
- `setSabotaged(target_id)` / `clearSabotaged(target_id)`
- `findShieldSaver(current_number)` — returns a `user_id` who can save (has shield + protecting_through >= current_number), or null.
- `consumeShield(user_id)` — decrement shield and reset `protecting_through`.
- `armShield(user_id, current_number)` — set protecting_through if they have any shield.
- `getActiveDrop()` / `setActiveDrop(drop)` / `clearActiveDrop()`
- `getAllUserStats()` — for `/top`.

## Slash Commands

### `/loot [user]`

Embed showing the target user's mini-profile.

- Avatar thumbnail.
- Title: user's display name.
- Fields:
  - **total counted**: `total_count`
  - **times counted**: `numbers_counted`
  - **inventory**: bullet list of items with cantidad >0, or "no items" if empty.
  - **status**: "🛡 protecting through #{n}" if currently protecting; "🎯 primed for perfect aim" / "🔮 primed for oracle eye" if primed; "💣 sabotaged" if sabotaged.

Path: `src/commands/fun/loot/slash.js`.

### `/top`

Top 10 users by `total_count`. Embed.

- Numbered list with username + total_count.
- If invoker not in top 10: appended below with their rank.

Path: `src/commands/fun/top/slash.js`.

### `/use <item> [user]`

- `item` option: choices = `perfect_aim`, `oracle_eye`, `sabotage`.
- `user` option: only used (and required) for `sabotage`.
- Checks user has ≥1 in inventory; else error.
- For `perfect_aim` / `oracle_eye`: primes the invoker (does NOT consume yet — consumed on next booster claim).
- For `sabotage`: removes 1 sabotage from invoker's inventory, sets `sabotaged=true` on target's stats. Posts a public message announcing it.
- Streak shield is NOT a valid choice (auto-only).

Path: `src/commands/fun/use/slash.js`.

## Counting Flow Updates (`messageCreate.js`)

On message in counting channel that is a valid integer:

1. **Sabotage gate**: if `user_stats[sender].sabotaged` is true:
   - The message content must NOT be a plain integer matching the expected.
   - If it's a math expression evaluating to expected → count it as correct. Clear `sabotaged`.
   - If it's a plain integer (matched or not) → wrong. Clear `sabotaged`. Snarky reply mentioning sabotage.
   - If it's a malformed string → ignore (not a count attempt).
2. **Same-user check** (existing): silently ignored if same user counts twice (sabotage check first).
3. **Correct number**:
   - `updateCount`, react ✅.
   - `addToTotalCount(user, number)`.
   - `armShield(user, current_number)` if they have shield.
   - Roll booster (8%) → spawn.
   - Else roll drop (4%) → spawn.
4. **Wrong number**:
   - Look for shield saver via `findShieldSaver(current_number)`.
   - If found: `consumeShield(saver)`. Post protection message. DO NOT reset count. React ⚡ or 🛡.
   - Else: reset count, react ❌, snarky reply (existing flow).

### Math expression evaluator (for sabotage)

- Allowed chars: `[0-9+\-*/×÷() \t]`.
- Replace `×` → `*`, `÷` → `/`.
- Reject if any other char present.
- Reject if empty after trim.
- Evaluate via `Function` constructor in a try/catch. If result is finite integer, OK.
- File: `src/utils/safeMath.js`.

## Interaction Flow Updates (`interactionCreate.js`)

- Button `booster_claim:<id>`:
  - If user `primed.perfect_aim` → consume item, unprime, immediately resolve as correct (no modal). Edit message + reply with win line.
  - Else: show modal as today. If `primed.oracle_eye` → unprime + consume + add ephemeral reveal alongside the modal.
- Button `drop_claim:<id>`: show modal with the operation.
- Modal `drop_answer:<id>`:
  - On correct: add item to user inventory, edit drop message to resolved, post win-style reply (item-specific lines).
  - On wrong: clear drop, edit message to busted, post fail-style reply.

## New Snarky Lines

`src/constants/countingLines.js` additions:

- `SHIELD_SAVE_LINES` (~10) — celebratory of shield protecting count.
- `SABOTAGE_FUMBLE_LINES` (~10) — mocking when sabotaged user types plain integer.
- `DROP_WIN_LINES` (~10) — congrats for winning an item.
- `DROP_FAIL_LINES` (~10) — mocking for botching the drop math.

Tokens reused: `{user}`, `{n}`, `{item}`, `{expression}`, `{answer}`, `{guess}`.

## Files

New:
- `src/commands/fun/loot/slash.js`
- `src/commands/fun/top/slash.js`
- `src/commands/fun/use/slash.js`
- `src/utils/safeMath.js`
- `src/utils/itemDrops.js` (drop spawn helper)

Modified:
- `src/utils/storage.js`
- `src/events/messageCreate.js`
- `src/events/interactionCreate.js`
- `src/constants/countingLines.js`

## Out of Scope

- Sabotage cooldown / sabotage stacking (last write wins).
- Trade / give items between users.
- Achievement / rank tiers based on total_count.
- Cross-channel counting.
