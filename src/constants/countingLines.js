const WRONG_NUMBER_LINES = [
    'lmao {user} typed **{got}** when we needed **{expected}**. count died at **{reached}**, back to 1',
    '{user} cooked the whole count. expected **{expected}**, got **{got}**. we\'re at 0 thanks to you',
    'imagine reaching **{reached}** just to fumble at **{expected}**. embarrassing {user}',
    '{user} can\'t count past **{reached}** apparently. it was **{expected}** not **{got}**. reset.',
    'the count was **{reached}** strong and {user} said "nah". next number: **1**',
    '{user} really typed **{got}** with their full chest. it was **{expected}**. start over',
    'rip the **{reached}** streak, {user} just clicked it off. back to 1',
    'bro {user} thinks **{got}** comes after **{reached}**. school was free',
    '{user} just deleted **{reached}** counts of teamwork. expected **{expected}**, got **{got}**',
    'nobody asked {user} to math but here we are. count: **0**. next: **1**',
    '{user} the count was literally **{reached}**. how do you type **{got}**',
    'expected **{expected}**. {user} typed **{got}**. count: gone. confidence: also gone',
    '{user} fumbled at **{expected}** harder than i\'ve ever seen. back to 1',
    'how do you mess up **{expected}** {user}. it\'s right there. count reset',
    '{user} just performed a count-icide on **{reached}** numbers. start again',
    'fun fact: **{expected}** ≠ **{got}**. blame {user} for the reset',
    '{user} typed **{got}** like they were sure. they were not. back to 1',
    '**{reached}** numbers of progress gone because {user} can\'t count. expected **{expected}**',
    '{user} the next number was **{expected}**. you wrote **{got}**. read the room',
    'count restart sponsored by {user} typing **{got}** instead of **{expected}**'
];

const BOOSTER_WIN_LINES = [
    'ok {user} actually did `{expression}` = **{answer}**. count goes **{from}** → **{to}** ({type})',
    'shocking. {user} can math. count yeeted from **{from}** to **{to}**',
    '{user} solved it in like 2 seconds and {type}\'d the whole count to **{to}**',
    'proud of {user} ngl. **{answer}** was right. count: **{from}** → **{to}**',
    '{user} just speedran `{expression}` and the count jumped to **{to}**. cracked',
    'bet nobody expected {user} to know **{answer}**. count: **{to}** ({type})',
    'somehow {user} pulled **{answer}** out of nowhere. count slapped with {type} → **{to}**',
    '{user} the human calculator. **{from}** is now **{to}**. carry on',
    'ok genius {user}. `{expression}` = **{answer}** confirmed. count: **{to}**',
    '{user} earned the count a {type}. **{from}** → **{to}**. peasants keep counting',
    'wasn\'t expecting {user} to actually solve `{expression}` but here we are. **{to}**',
    '{user} clocked **{answer}** like it owed them money. count jumped to **{to}**',
    '{user} did the math while you were sleeping. count is now **{to}**',
    '{type} secured by {user}. count walks tall at **{to}**',
    '{user} actually read the question. count: **{from}** → **{to}**. respect.'
];

const BOOSTER_FAIL_LINES = [
    '{user} typed **{guess}** for `{expression}`. it was **{answer}**. embarrassing. count untouched',
    'imagine claiming and then writing **{guess}**. it was **{answer}** {user}. shameful',
    '{user} clicked claim with the confidence of someone who knows math. they don\'t. answer was **{answer}**',
    'not **{guess}** {user}. **{answer}**. did you even look at `{expression}`',
    '{user} just lost the booster for the whole channel. answer was **{answer}**, not **{guess}**',
    'catastrophic. {user} thought **{guess}**. it was **{answer}**. count gets nothing',
    '{user} the calculator is free. **{guess}** is not **{answer}**. booster wasted',
    'bro {user} claimed it just to type **{guess}**. it was **{answer}**. why',
    '{user} fumbled a free boost. **{answer}**, not **{guess}**. count stays',
    '{user} solved `{expression}` like a goldfish. answer: **{answer}**. yours: **{guess}**',
    'devastating loss for {user}. the answer was **{answer}**. you typed **{guess}**. count: cope',
    '{user} claimed the booster and threw the game. **{answer}**, not **{guess}**',
    'somewhere a math teacher is crying because {user} typed **{guess}** instead of **{answer}**',
    '{user} could\'ve boosted the count. instead they wrote **{guess}**. it was **{answer}**',
    'clown moment from {user}. **{guess}** ≠ **{answer}**. count gets nothing'
];

function pickLine(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function fillTokens(line, tokens) {
    let result = line;
    for (const [key, value] of Object.entries(tokens)) {
        result = result.replaceAll(`{${key}}`, value);
    }
    return result;
}

module.exports = {
    WRONG_NUMBER_LINES,
    BOOSTER_WIN_LINES,
    BOOSTER_FAIL_LINES,
    pickLine,
    fillTokens,
};
