# Counting Boosters + Snarky Wrong-Number Replies — Design

## Goal

Two related changes to the counting game in `src/events/messageCreate.js`:

1. Replace the embed "Wrong number!" reply with a plain-text snarky reply that varies between aggressive/burlesque tones, matching the existing pattern in `src/events/messageDelete.js`.
2. Add a booster mechanic where, after a correct count, there is a small random chance the bot spawns a math operation. Anyone can claim it via button; the claimer answers in a modal. Correct answers boost the global count (`x2`, `+100`, etc.). Both correct and incorrect outcomes get a random snarky reply.

## Wrong-Number Replies

- Drop `embeds: [embeds.error(...)]` in `messageCreate.js`.
- Send a single plain message with `message.reply({ content: line })`.
- Source ~20 random lines from a `WRONG_NUMBER_LINES` array (new file: `src/constants/countingLines.js`).
- Template tokens supported: `{user}` (mention), `{expected}`, `{got}`, `{reached}` (the count the user had reached before failing, i.e. `current_number`).
- Style: aggressive, burlesque, same vibe as the existing `SNARKY_LINES` in `messageDelete.js`. Each line conveys that the count reset to 0.

## Booster Mechanic

### Trigger

- After a successful `updateCount` in `messageCreate.js`:
  - If no booster is active → 8% chance to spawn one.
  - If a booster is already active → no roll.
- Operations are generated to ensure result ≠ `current+1` (next valid count), avoiding ambiguity.

### Operation Generator

- Mixed expressions with parentheses, single pair max: `(a±b)×c`, `a±(b×c)`, `(a×b)±c`, `(a+b)÷c` where divisible.
- Constrained so result is a positive integer between 10 and 500.
- Display uses unicode `×` and `÷`. Internally evaluated against safe sums.

### Booster Types

Random choice per booster, weighted by impact:
- `+25`, `+50`, `+100`, `+200` (additive)
- `x2`, `x3` (multiplicative)

Applied to the global count when claimed correctly.

### Spawn Message

Plain text with a single button:

```
⚡ booster spawned — solve  (7+5)×4  to launch the count  +100
```

Button: `🎯 claim it` (custom_id includes booster id).

### Claim & Resolve Flow

1. User clicks `claim it` → bot calls `interaction.showModal(...)`.
2. Modal has one short-input text field labeled `your answer` (custom_id `booster_answer`).
3. On modal submit:
   - Parse answer as integer.
   - Compare to expected result.
   - On correct → apply boost to count (config write), edit original message to show resolved + post a reply on the original message tagging the claimer with a random snarky-congrats line.
   - On wrong → edit original message to show busted + post a reply tagging the claimer with a random mocking line. Count is unchanged. Booster is consumed.
4. If user dismisses modal → original message stays clickable; another user can claim.
5. Race condition: two users could click claim and submit modals near-simultaneously. On modal submit, re-read `active_booster`; if the booster id no longer matches storage, send an ephemeral reply "someone got there first" and exit without changes.

### Storage Shape

Add to `counting` block in `data/config.json`:

```json
"active_booster": {
  "id": "<uuid>",
  "expression": "(7+5)×4",
  "answer": 48,
  "type": "+100" | "x2" | ...,
  "value": 100 | 2 | ...,
  "channel_id": "...",
  "message_id": "..."
}
```

When no booster active: `active_booster: null`.

New storage helpers in `src/utils/storage.js`:
- `getActiveBooster()`
- `setActiveBooster(booster)`
- `clearActiveBooster()`

### Concurrency Notes

- Normal counting still works while a booster is active. The button + modal flow is independent of message-based counting.
- `last_user_id` is not changed by booster resolution. The user who claimed can still count normally next.
- Bot restarts: `active_booster` persists in `data/config.json`. Button handler restores the booster state from storage when interactions arrive.

### Interaction Routing

- Button `custom_id`: `booster_claim:<booster_id>`.
- Modal `custom_id`: `booster_answer:<booster_id>`.
- Interaction handler in `src/events/interactionCreate.js` (or wherever buttons are currently routed).

### Random Reply Lines

In `src/constants/countingLines.js`:
- `WRONG_NUMBER_LINES` (~20)
- `BOOSTER_WIN_LINES` (~15) — snarky/celebratory: "{user} actually did math, count goes from **{from}** to **{to}**"
- `BOOSTER_FAIL_LINES` (~15) — mocking: "{user} thought {answer} was right. it was {correct}. count untouched"

Each array supports its own token set.

## Files Touched

- `src/events/messageCreate.js` — replace wrong-number embed; add booster roll after correct count; route booster answer (if shape-matched).
- `src/events/interactionCreate.js` — handle button + modal (new or existing event file).
- `src/constants/countingLines.js` — new file with all three line arrays.
- `src/utils/boosterOps.js` — new file: operation generator + evaluator.
- `src/utils/storage.js` — add booster CRUD helpers.

## Out of Scope

- Per-user stats / leaderboard tracking.
- Streak bonuses.
- Booster cooldown across multiple channels (counting is single-channel today).
- Sound/emoji animations.
