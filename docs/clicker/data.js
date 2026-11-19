// Choochie Heart Clicker: the tables. Mirrors the shared spec (CLICKER_SPEC v1.0) used by the desktop app, so both play
// the same: same ids (they are saved), same numbers.
export const SPEC_VERSION = "1.2";     // 1.1: nothing is capped; 1.2: wheel modes + Ko-fi tributes, 20 pop-ups, helpers on screen

// helpers (auto-clickers). price of next = base * 1.15^owned * (1 - 0.05*rank(h_bulk))
export const HELPERS = [
  { id: "paw",     icon: "🐾", name: "Paw Cursor",        cost: 15,     cps: 0.1,  desc: "a little paw that taps for you" },
  { id: "kitty",   icon: "🐱", name: "Kitty Helper",      cost: 100,    cps: 1,    desc: "kitties knead hearts out of thin air" },
  { id: "maid",    icon: "🧹", name: "Maid Bot",          cost: 1100,   cps: 8,    desc: "she cleans AND clicks" },
  { id: "letter",  icon: "💌", name: "Love Letter Press", cost: 12e3,   cps: 47,   desc: "mass-produced devotion" },
  { id: "fanclub", icon: "📣", name: "Fan Club",          cost: 130e3,  cps: 260,  desc: "they chant your name. well, hers." },
  { id: "shrine",  icon: "🕯️", name: "Heart Shrine",      cost: 1.4e6,  cps: 1400, desc: "a candle for every click" },
  { id: "factory", icon: "🏭", name: "Kiss Factory",      cost: 20e6,   cps: 7800, desc: "industrial-scale smooches" },
  { id: "simps",   icon: "🖥️", name: "Simp Server Farm",  cost: 330e6,  cps: 44e3, desc: "a datacenter of simps" },
  { id: "cupid",   icon: "🛰️", name: "Cupid Satellite",   cost: 5.1e9,  cps: 260e3, desc: "orbital love strikes" },
  { id: "portal",  icon: "🌀", name: "Love Portal",       cost: 75e9,   cps: 1.6e6, desc: "hearts from another dimension" },
  { id: "clone",   icon: "👯", name: "Choochie Clone",    cost: 1e12,   cps: 10e6, desc: "there can never be too many of her" },
  { id: "engine",  icon: "💗", name: "Obsession Engine",  cost: 14e12,  cps: 65e6, desc: "the final form of being obsessed" },
];
export const COST_GROWTH = 1.15;
// helper training: level u doubles that helper; cost = base * 10 * 8^u, needs owned >= TRAIN_NEED[u]
// no top level: past the table each level needs 100 more owned (u=8 -> 350, u=9 -> 450, ...)
export const TRAIN_NEED = [1, 5, 25, 50, 100, 150, 200, 250];
export const trainNeed = u => (u < TRAIN_NEED.length ? TRAIN_NEED[u] : 250 + 100 * (u - 7));
export const TRAIN_NAMES = ["Trained", "Skilled", "Expert", "Elite", "Master", "Legendary", "Mythic", "Divine"];
export const trainName = u => (u < TRAIN_NAMES.length ? TRAIN_NAMES[u] : "Divine " + (u - TRAIN_NAMES.length + 2));
// Softer Lips (repeatable): cost(tap) = 20 * 1.6^tap
export const TAP_COST = tap => 20 * Math.pow(1.6, tap);

// skill tree: four branches, each a chain (a node needs one rank in the one above it). cost per rank.
// ranks Infinity = endless (the four roots): the next rank costs cost + floor(rank / 3)
export const SKILLS = [
  { id: "k_pucker",   br: "kiss",   ranks: Infinity, cost: 1, icon: "💋", name: "Pucker Up",      desc: "+50% click power per rank" },
  { id: "k_lipstick", br: "kiss",   ranks: 3, cost: 2, req: "k_pucker",   icon: "💄", name: "Lipstick",      desc: "each click also adds 1% of ♥/s per rank" },
  { id: "k_crit",     br: "kiss",   ranks: 3, cost: 2, req: "k_lipstick", icon: "💥", name: "Crit Kiss",     desc: "4 / 8 / 12% chance a click crits x10" },
  { id: "k_muscle",   br: "kiss",   ranks: 1, cost: 3, req: "k_crit",     icon: "💪", name: "Muscle Memory", desc: "click power x2" },
  { id: "k_smooch",   br: "kiss",   ranks: 1, cost: 3, req: "k_muscle",   icon: "😘", name: "Smooch Storm",  desc: "crits hit x25" },
  { id: "k_favorite", br: "kiss",   ranks: 1, cost: 4, req: "k_smooch",   icon: "👑", name: "Her Favorite",  desc: "every 100th click is a MEGA kiss" },
  { id: "h_paw",      br: "help",   ranks: Infinity, cost: 1, icon: "🐾", name: "Paw Training",  desc: "+25% helper output per rank" },
  { id: "h_bulk",     br: "help",   ranks: 3, cost: 2, req: "h_paw",      icon: "🏷️", name: "Bulk Discount", desc: "helpers 5% cheaper per rank" },
  { id: "h_night",    br: "help",   ranks: 2, cost: 2, req: "h_bulk",     icon: "🌙", name: "Night Shift",   desc: "away earnings 50% / 75%, up to 8 h / 24 h" },
  { id: "h_team",     br: "help",   ranks: 1, cost: 3, req: "h_night",    icon: "🤝", name: "Teamwork",      desc: "+3% helper output per helper type owned" },
  { id: "h_overtime", br: "help",   ranks: 1, cost: 3, req: "h_team",     icon: "⏰", name: "Overtime",      desc: "no click for 60 s: helpers x2" },
  { id: "h_clones",   br: "help",   ranks: 1, cost: 4, req: "h_overtime", icon: "👯", name: "Clone Army",    desc: "helper output x3" },
  { id: "l_charm",    br: "luck",   ranks: Infinity, cost: 1, icon: "🍀", name: "Lucky Charm",   desc: "golden hearts +30% as often per rank (up to a 50% chance)" },
  { id: "l_pop",      br: "luck",   ranks: 2, cost: 2, req: "l_charm",    icon: "🫧", name: "Pop Bonus",     desc: "clicking a pop-up pays x2 / x3" },
  { id: "l_gold",     br: "luck",   ranks: 2, cost: 2, req: "l_pop",      icon: "💛", name: "Golden Touch",  desc: "golden rewards +50% per rank" },
  { id: "l_collector",br: "luck",   ranks: 1, cost: 2, req: "l_gold",     icon: "🖼️", name: "Collector",     desc: "pop-ups stay 50% longer" },
  { id: "l_jackpot",  br: "luck",   ranks: 1, cost: 3, req: "l_collector",icon: "🎰", name: "Jackpot",       desc: "10% of golden hearts are JACKPOTS (x7)" },
  { id: "l_wheelcharm",br: "luck",  ranks: 1, cost: 3, req: "l_jackpot",  icon: "🎡", name: "Wheel Charm",   desc: "wheel penalties half as bad, tokens 2x faster" },
  { id: "f_warm",     br: "frenzy", ranks: Infinity, cost: 1, icon: "🔥", name: "Warm Up",       desc: "heat builds +20% faster per rank" },
  { id: "f_hot",      br: "frenzy", ranks: 2, cost: 2, req: "f_warm",     icon: "🌶️", name: "Hot Streak",    desc: "heat cools 30% / 50% slower" },
  { id: "f_king",     br: "frenzy", ranks: 2, cost: 2, req: "f_hot",      icon: "🤴", name: "Combo King",    desc: "max combo x3 / x4" },
  { id: "f_overdrive",br: "frenzy", ranks: 2, cost: 2, req: "f_king",     icon: "⚡", name: "Overdrive",     desc: "frenzy lasts +4 s per rank" },
  { id: "f_fever",    br: "frenzy", ranks: 1, cost: 3, req: "f_overdrive",icon: "🤒", name: "Fever Pitch",   desc: "frenzy: pop-ups 2x faster, golden hearts 3x more often" },
  { id: "f_endless",  br: "frenzy", ranks: 1, cost: 4, req: "f_fever",    icon: "♾️", name: "Endless Love",  desc: "frenzy x5 (not x3), ends at 70% heat" },
];
export const BRANCHES = { kiss: ["Kisses", "#ff5c8a"], help: ["Helpers", "#ffb36b"], luck: ["Luck", "#ffd54a"], frenzy: ["Frenzy", "#ff4a5c"] };

// media tiers: unlocked by ALL-TIME hearts (kept through rebirth)
export const TIER_AT = [0, 1e3, 25e3, 500e3, 10e6, 250e6, 5e9, 100e9, 2.5e12, 75e12];
export const TIER_NAMES = ["Sweet", "Rosy", "Crimson", "Glowing", "Sparkling", "Golden", "Chained", "Prismatic", "Ember", "Devil"];
export const TIERS = TIER_AT.length;            // authored levels (= media folders level1..level10)
// levels never end: past the table each one needs x30 more all-time hearts; their media comes from the highest folders
export const tierAt = i => (i < TIER_AT.length ? TIER_AT[i] : TIER_AT[TIER_AT.length - 1] * Math.pow(30, i - TIER_AT.length + 1));
export const tierName = i => (i < TIER_NAMES.length ? TIER_NAMES[i] : "Devilish +" + (i - TIER_NAMES.length + 1));

// the Wheel (spec 1.2 section 8): 12 slices, equal odds, two modes. kind: good | mild (normal only) | bad (risky only) | tribute.
// A tribute is her asking for a real Ko-fi tip. It is always optional: "maybe later" only makes her sulk for a bit (in game).
const W = (id, kind, icon, name, desc, amt) => ({ id, kind, good: kind === "good", tribute: kind === "tribute" ? amt : 0, icon, name, desc });
const T = amt => W("trib" + amt, "tribute", "💸", "Tribute $" + amt, "a $" + amt + " Ko-fi tip to her (optional, real money)", amt);
export const WHEELS = {
  normal: [
    W("n_lucky", "good", "💋", "Lucky Kiss", "+10% of your hearts (or 5 min of ♥/s)"),
    W("n_tease", "mild", "😏", "Teased~", "clicks x0.75 for 20 s"),
    W("n_storm", "good", "⛈️", "Heart Storm", "♥/s x3 for 45 s"),
    W("n_helper", "good", "🎁", "Free Helper", "+1 of your best helper"),
    W("n_yawn", "mild", "🥱", "Yawn", "♥/s x0.75 for 30 s"),
    W("n_frenzy", "good", "🔥", "FRENZY", "instant frenzy"),
    T(5),
    W("n_rush", "good", "💨", "Kiss Rush", "clicks x3 for 30 s"),
    W("n_token", "good", "🎡", "Free Spin", "+1 spin token"),
    W("n_gold", "good", "💛", "Golden Heart", "a golden heart, right now"),
    W("n_peek", "good", "👀", "Sneak Peek", "3 pop-ups from the next locked level"),
    W("n_pocket", "good", "🪙", "Pocket Change", "+5% of your hearts (or 2 min of ♥/s)"),
  ],
  risky: [
    W("lucky", "good", "💋", "Lucky Kiss", "+30% of your hearts (or 15 min of ♥/s)"),
    W("tax", "bad", "🧾", "Taxed~", "lose 15% of your hearts"),
    W("frenzy", "good", "🔥", "FRENZY", "instant frenzy + clicks x7 for 30 s"),
    T(5),
    W("helper", "good", "🎁", "Free Helpers", "+3 of your best helper"),
    W("butter", "bad", "🧈", "Butterfingers", "clicks x0.5 for 60 s"),
    W("sp", "good", "🌟", "Skill Points", "+2 SP, forever"),
    T(10),
    W("storm", "good", "⛈️", "Heart Storm", "♥/s x7 for 60 s"),
    W("combo", "bad", "💔", "Combo Break", "heat to 0, builds half as fast for 30 s"),
    W("peek", "good", "👀", "Sneak Peek", "5 pop-ups from the next locked level"),
    T(15),
  ],
};
export const wheelOf = mode => WHEELS[mode] || WHEELS.normal;
// "maybe later" on a tribute (or Esc / a click outside / the 60 s timeout): she sulks. ♥/s only, in game only
export const SULK = { normal: { mult: 0.8, sec: 30 }, risky: { mult: 0.5, sec: 60 } };
export const TRIBUTE_CARD_SECONDS = 60, TRIBUTE_WINDOW = 86400;     // the card times out; a pending tribute waits 24 h
// a tribute that really arrived ("Spoiled~"), k = amount / 5: hearts, clicks + ♥/s x3 for 10k min, +k tokens, +k SP
export const SPOILED_MIN = 10, SPOILED_MULT = 3;
export const TOKEN_MAX = 5, TOKEN_CLICKS = 250, TOKEN_SECONDS = 20 * 60;

// achievements: each +1% production, every 4 = +1 SP. test(v) on a view of the state (see game.js achView)
const A = (id, name, desc, test) => ({ id, name, desc, test });
export const ACH = [
  A("c100", "First Kisses", "100 clicks", v => v.clicks >= 100),
  A("c1k", "Smitten", "1,000 clicks", v => v.clicks >= 1e3),
  A("c10k", "Kiss Addict", "10,000 clicks", v => v.clicks >= 1e4),
  A("c100k", "Finger of Steel", "100,000 clicks", v => v.clicks >= 1e5),
  A("c1m", "Clicked Into Oblivion", "1,000,000 clicks", v => v.clicks >= 1e6),
  A("e1k", "Pocket Change", "1K all-time hearts", v => v.all >= 1e3),
  A("e100k", "Sweetheart", "100K all-time hearts", v => v.all >= 1e5),
  A("e10m", "Heartthrob", "10M all-time hearts", v => v.all >= 1e7),
  A("e1b", "Heart Tycoon", "1B all-time hearts", v => v.all >= 1e9),
  A("e100b", "Love Baron", "100B all-time hearts", v => v.all >= 1e11),
  A("e10t", "Heart Empire", "10T all-time hearts", v => v.all >= 1e13),
  A("e1qa", "Infinite Devotion", "1Qa all-time hearts", v => v.all >= 1e15),
  A("s10", "It Clicks Itself", "10 ♥/s", v => v.cps >= 10),
  A("s1k", "Passive Income", "1K ♥/s", v => v.cps >= 1e3),
  A("s100k", "Heart Machine", "100K ♥/s", v => v.cps >= 1e5),
  A("s10m", "Love Industry", "10M ♥/s", v => v.cps >= 1e7),
  A("s1b", "Cosmic Crush", "1B ♥/s", v => v.cps >= 1e9),
  A("h10", "Little Helpers", "10 helpers", v => v.helpers >= 10),
  A("h50", "Helping Paws", "50 helpers", v => v.helpers >= 50),
  A("h100", "Her Army", "100 helpers", v => v.helpers >= 100),
  A("h250", "Swarm", "250 helpers", v => v.helpers >= 250),
  A("h500", "Legion", "500 helpers", v => v.helpers >= 500),
  A("hall", "Full House", "own every helper type", v => v.types >= 12),
  A("fr1", "Heating Up", "1 frenzy", v => v.frenzies >= 1),
  A("fr25", "Fever Dream", "25 frenzies", v => v.frenzies >= 25),
  A("fr250", "Can't Stop", "250 frenzies", v => v.frenzies >= 250),
  A("g1", "Shiny!", "1 golden heart", v => v.goldens >= 1),
  A("g13", "Lucky Number", "13 golden hearts", v => v.goldens >= 13),
  A("g77", "Gold Digger", "77 golden hearts", v => v.goldens >= 77),
  A("w1", "Feeling Lucky", "1 wheel spin", v => v.spins >= 1),
  A("w50", "High Roller", "50 wheel spins", v => v.spins >= 50),
  A("wp10", "Masochist~", "take 10 wheel penalties", v => v.penalties >= 10),
  A("wr10", "Blessed", "win 10 wheel rewards", v => v.rewards >= 10),
  A("rb1", "Born Again", "1 rebirth", v => v.rebirths >= 1),
  A("rb5", "Devoted", "5 rebirths", v => v.rebirths >= 5),
  A("rb25", "Eternal", "25 rebirths", v => v.rebirths >= 25),
  A("t5", "Getting Spicy", "unlock pop-up level 5", v => v.maxTier >= 4),
  A("t10", "Everything Unlocked", "unlock level 10", v => v.maxTier >= 9),
  A("sp10", "Speed Demon", "10 clicks a second", v => v.bestRate >= 10),
  A("sp15", "Inhuman", "15 clicks a second", v => v.bestRate >= 15),
  A("pp50", "Pop Goes the Heart", "click 50 pop-ups", v => v.popClicks >= 50),
  A("pp500", "Pop Star", "click 500 pop-ups", v => v.popClicks >= 500),
  A("afk", "Welcome Back", "earn hearts while away", v => v.afk),
  A("br1", "Specialist", "max every node in one branch", v => v.branchMaxed),
  A("brall", "Completionist", "max the whole tree", v => v.treeMaxed),
  A("crit100", "Critical Crush", "100 crits", v => v.crits >= 100),
];

// her lines (bratty-dominant, playful)
export const LINES = {
  click: ["Faster~", "Don't you dare stop.", "Good. More.", "Mm, that's it~", "Again.", "Is that all?", "Keep going, pet~", "Cute effort."],
  frenzy: ["FRENZY~ don't stop now!", "Yes yes yes, faster!", "That's my good pet~", "Look at you go~"],
  milestone: ["Another hundred~ good.", "You really can't stop, huh?", "Hehe~ addicted already?", "I'm counting, you know."],
  gold: ["Ooh, shiny~ grab it!", "Lucky you~", "Gold for my favourite~"],
  tier: ["New level~ want to see more of me?", "You earned this one~", "Mm, getting spicy~", "Look what you unlocked~"],
  good: ["Lucky... hmph.", "Fine, you win this one.", "Don't get used to it~", "Tch. Lucky."],
  bad: ["Hehe~ taxed.", "Aww, unlucky~", "That's what you get~", "Pfft. Spin again, I dare you."],
  back: ["Missed me? Your helpers kept going~", "There you are. They worked, you didn't~", "Welcome back, pet~"],
  rebirth: ["Again from the start~ but stronger.", "Devoted. I like that."],
  idle: ["Hello? Did your finger fall off?", "Bored already?", "I'm waiting~"],
  tribute: ["Tribute time~ ${amt}. Pay up, pet.", "The wheel says ${amt}. Who am I to argue~?", "${amt} for me. You know you want to~", "On your knees and open Ko-fi. ${amt}, pet~"],
  sulk: ["Hmph. Cheapskate.", "Fine. I'm not talking to you for a bit.", "Maybe later? Tch. Noted.", "Wow. Okay. Sulking now."],
  tributeOpen: ["Good pet~ I'll be waiting.", "Mm, that's what I like to see~"],
  tributeThanks: ["You actually did it~ good pet. GOOD.", "Mmh, spoiled me. Here, take my blessing~"],
};
