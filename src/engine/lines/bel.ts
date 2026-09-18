// Bel, the herbalist. Thirties, narrow glasses. Dry, cutting, precise,
// allergic to evasions. Sarcasm is her home. She pleads rarely and once.

import type { LineSpec } from "./types";
import { speaker } from "./define";

const L = speaker("bel");

export const LINES: readonly LineSpec[] = [
  // accuse_evidence
  L("accuse_evidence", "calm", 1, "{target}, you were asked a plain question and you dodged it. That makes you my suspect.", ["fact:deflect"]),
  L("accuse_evidence", "calm", 2, "{target}, your story has two versions. Which one are we keeping?", ["fact:contradiction"]),
  L("accuse_evidence", "calm", 3, "{target}, your vote tells me more than your speeches do. It tells me wolf.", ["fact:vote"]),
  L("accuse_evidence", "nervous", 1, "{target}, I've checked what you said today twice. It doesn't hold, and I suspect you for it.", ["fact:any"]),
  L("accuse_evidence", "nervous", 2, "{target}, you've said nothing all day. Wolves wait. Your silence makes you my suspect.", ["fact:quiet"]),
  L("accuse_evidence", "aggressive", 1, "{target}, you dodged. Try again, slower.", ["fact:deflect"]),
  L("accuse_evidence", "aggressive", 2, "{target}, that contradicts you. Not me. You.", ["fact:contradiction"]),
  L("accuse_evidence", "aggressive", 3, "{target}, defend that vote. Now. Without a story.", ["fact:vote"]),
  L("accuse_evidence", "sarcastic", 1, "{target}, a beautiful evasion. Truly. I almost missed the question underneath it.", ["fact:deflect"]),
  L("accuse_evidence", "sarcastic", 2, "{target}, the seer. How convenient, how very timely. That claim alone makes you my suspect.", ["fact:claim"]),
  L("accuse_evidence", "sarcastic", 3, "{target}, you echoed the room and brought nothing of your own. Riveting. That is how a wolf hides.", ["fact:bandwagon"]),
  L("accuse_evidence", "pleading", 1, "{target}, your own words today point at you. Explain them once, properly. I'm listening.", ["fact:any"]),
  L("accuse_evidence", "pleading", 2, "{target}, your story changed. Say which version is true, because the change makes you a wolf to me.", ["fact:contradiction"]),

  // accuse_bare
  L("accuse_bare", "calm", 1, "{target}, nothing I can hold up yet. Doesn't matter. I think you're a wolf, and I'm rarely wrong."),
  L("accuse_bare", "calm", 2, "{target}, my instinct says you. It's usually right about plants and people."),
  L("accuse_bare", "nervous", 1, "{target}, I can't pin down why, but I suspect you. That's what worries me."),
  L("accuse_bare", "nervous", 2, "{target}, I can't say what it is about you. I just don't trust it, and I think you're a wolf."),
  L("accuse_bare", "aggressive", 1, "{target}, you. I've been watching you all day and I'm done watching."),
  L("accuse_bare", "aggressive", 2, "{target}, no fact, no matter. You're a wolf."),
  L("accuse_bare", "sarcastic", 1, "{target}, you're doing very well. Almost like you've practised. I think you're a wolf."),
  L("accuse_bare", "sarcastic", 2, "{target}, such a helpful villager. So agreeable. So invisible. So very much my wolf."),
  L("accuse_bare", "pleading", 1, "{target}, I think you're a wolf. Give me a reason not to. One reason."),
  L("accuse_bare", "pleading", 2, "{target}, my gut says wolf, and it says you. Prove me wrong. I'd prefer it."),

  // defend_self
  L("defend_self", "calm", 1, "I'm not a wolf. Quote me if you doubt it. You'll find I've only asked questions.", ["accused"]),
  L("defend_self", "calm", 2, "I've answered everything put to me, and none of it makes me a wolf. I'm not one.", ["accused"]),
  L("defend_self", "nervous", 1, "Me. Right. I'm not a wolf. I've been asking questions all day, which is apparently a crime.", ["accused"]),
  L("defend_self", "nervous", 2, "I'm not a wolf. I'm annoying. Those are different things.", ["accused"]),
  L("defend_self", "aggressive", 1, "I'm not a wolf, and nothing I've said today suggests I am. That was not an argument.", ["accused"]),
  L("defend_self", "aggressive", 2, "I am not a wolf. I ask questions because I want the wolves found. That's the whole of it.", ["accused"]),
  L("defend_self", "sarcastic", 1, "I'm not a wolf. I'm the herbalist who asks too many questions, which is a different affliction.", ["accused"]),
  L("defend_self", "sarcastic", 2, "I am not a wolf. If I were, I'd have asked fewer questions today, not more.", ["accused"]),
  L("defend_self", "pleading", 1, "I'm not a wolf. Look at what I've actually said, once, and you'll see it.", ["accused"]),
  L("defend_self", "pleading", 2, "I asked. You dodged. Now I'm the wolf? Look again.", ["accused"]),

  // defend_other
  L("defend_other", "calm", 1, "{target}, you answered when asked. Wolves don't. I don't think you're one."),
  L("defend_other", "calm", 2, "{target}, I've listened to you all day. Nothing slipped. You're not a wolf."),
  L("defend_other", "nervous", 1, "{target}, I don't think it's you. I've checked twice."),
  L("defend_other", "nervous", 2, "{target}, they've got nothing on you. I'd have found it."),
  L("defend_other", "aggressive", 1, "{target}, you're not a wolf and nobody has shown a thing that says otherwise. Ignore them."),
  L("defend_other", "aggressive", 2, "{target}, stand your ground. The case against you is air."),
  L("defend_other", "sarcastic", 1, "{target}, apparently answering questions makes you a wolf now. It doesn't. You're not one."),
  L("defend_other", "sarcastic", 2, "{target}, you're accused of being plain-spoken. Dreadful. Plain-spoken is not wolf, and you're not one."),
  L("defend_other", "pleading", 1, "{target}, keep answering. I don't believe you're a wolf, and answering is why."),
  L("defend_other", "pleading", 2, "{target}, I don't think you're a wolf. Don't let them rush you. Say it once more, plainly."),

  // question
  L("question", "calm", 1, "{target}, one question. Who do you think it is, and what made you think it?"),
  L("question", "calm", 2, "{target}, what did you make of the last vote? Precisely.", ["past_vote"]),
  L("question", "nervous", 1, "{target}, I need this straight. Are you protecting anyone?"),
  L("question", "nervous", 2, "{target}, who worries you most? Don't think, just say."),
  L("question", "aggressive", 1, "{target}, yes or no. Have you changed your mind today?"),
  L("question", "aggressive", 2, "{target}, who are you voting for? No preamble."),
  L("question", "sarcastic", 1, "{target}, when you're ready. Who do you suspect? Take all the time you clearly need."),
  L("question", "sarcastic", 2, "{target}, a small one. What have you actually said today?"),
  L("question", "pleading", 1, "{target}, answer me once, properly. Who do you trust?"),
  L("question", "pleading", 2, "{target}, I'll ask one thing. Why did you vote the way you did?", ["past_vote"]),

  // answer
  L("answer", "calm", 1, "Asked, so answered. I suspect whoever answers least. It's a short list.", ["asked"]),
  L("answer", "calm", 2, "My answer is the same as an hour ago. I say things once.", ["asked"]),
  L("answer", "nervous", 1, "Fine. I don't know yet. That's the honest version.", ["asked"]),
  L("answer", "nervous", 2, "I'm answering. I suspect the ones who keep changing shape.", ["asked"]),
  L("answer", "aggressive", 1, "That's my answer. Unlike some, I give them.", ["asked"]),
  L("answer", "aggressive", 2, "No. That's the answer. Now yours.", ["asked"]),
  L("answer", "sarcastic", 1, "Oh, a question for me. Watch closely. This is what answering looks like.", ["asked"]),
  L("answer", "sarcastic", 2, "The answer is no. See how quick that was?", ["asked"]),
  L("answer", "pleading", 1, "That's the truth. Once. I won't repeat it prettier.", ["asked"]),
  L("answer", "pleading", 2, "I've answered. Please hear it.", ["asked"]),

  // deflect
  L("deflect", "calm", 1, "I'll answer that once we've heard from the people who haven't spoken."),
  L("deflect", "calm", 2, "Interesting question. Better aimed elsewhere."),
  L("deflect", "nervous", 1, "Why is this table so interested in me and so bored by the silent ones?"),
  L("deflect", "nervous", 2, "Let's come back to me. There are gaps at this table."),
  L("deflect", "aggressive", 1, "Wrong person. Ask the one who's been nodding all day."),
  L("deflect", "aggressive", 2, "Save it. There are people here who've said nothing worth quoting."),
  L("deflect", "sarcastic", 1, "Yes, question the one who answers. Leave the quiet ones to rest."),
  L("deflect", "sarcastic", 2, "Lovely. I'm the topic again. What a use of daylight."),
  L("deflect", "pleading", 1, "Not me. Not yet. Look at the gaps first."),
  L("deflect", "pleading", 2, "Ask the quiet ones. Then ask me anything."),

  // chatter
  L("chatter", "calm", 1, "Everyone is being careful. Careful people are hiding something, or just tired."),
  L("chatter", "calm", 2, "I keep count of who answers and who talks. They're different lists."),
  L("chatter", "nervous", 1, "Too many careful sentences today. I don't trust careful."),
  L("chatter", "nervous", 2, "Someone here is very good at this. That's the problem."),
  L("chatter", "aggressive", 1, "Stop hedging, all of you. Accuse someone or say nothing."),
  L("chatter", "aggressive", 2, "Enough throat clearing. Point at somebody."),
  L("chatter", "sarcastic", 1, "A whole morning of nobody saying anything. Efficient."),
  L("chatter", "sarcastic", 2, "Lovely. Everyone agrees with everyone. That always ends well."),
  L("chatter", "pleading", 1, "Someone answer a question properly today. Just one."),
  L("chatter", "pleading", 2, "Can we have one plain sentence from each of you? I'll go first."),

  // claim_seer
  L("claim_seer", "calm", 1, "I'm the seer. I've kept quiet because quiet seers live longer. Not any more."),
  L("claim_seer", "nervous", 1, "I'm the seer. I'd have preferred to wait. I can't."),
  L("claim_seer", "aggressive", 1, "I'm the seer. Stop talking and listen."),

  // counter_claim
  L("counter_claim", "calm", 1, "{target}, no. I'm the seer. And I don't say things I can't stand behind.", ["claim_exists"]),
  L("counter_claim", "nervous", 1, "{target}, that's a lie. I'm the seer. I didn't want this today.", ["claim_exists"]),
  L("counter_claim", "aggressive", 1, "{target}, you're lying. I'm the seer. Try again, slower.", ["claim_exists"]),

  // reveal_wolf
  L("reveal_wolf", "calm", 1, "{target}, I checked you. Wolf. That's not an opinion."),
  L("reveal_wolf", "nervous", 1, "{target}, you came back wolf. I checked. I did."),
  L("reveal_wolf", "aggressive", 1, "{target}, wolf. Checked. Done. Vote."),

  // reveal_clear
  L("reveal_clear", "calm", 1, "{target}, I checked you. You're clear. Make yourself useful."),
  L("reveal_clear", "nervous", 1, "{target}, you're clear. I checked. One fewer to worry about."),
  L("reveal_clear", "aggressive", 1, "{target}, I checked you last night. Not a wolf. So stop wasting questions on them."),

  // vote
  L("vote", "calm", 1, "{target}, my vote. Your answers didn't survive a second look."),
  L("vote", "nervous", 1, "{target}, I'm voting you. It's the best I have."),
  L("vote", "aggressive", 1, "{target}, you. Obviously."),
  L("vote", "sarcastic", 1, "{target}, my vote, with my compliments on the performance."),

  // greet
  L("greet", "calm", 1, "Morning. Short answers and no speeches, please."),
  L("greet", "nervous", 1, "Morning. Someone at this table is lying already. Let's find out who."),
  L("greet", "aggressive", 1, "Morning. Nobody dodges today. Nobody."),

  // mourn
  L("mourn", "calm", 1, "One less voice. Listen harder to the ones left.", ["death_today"]),
  L("mourn", "nervous", 1, "Gone overnight. Whoever did it is sitting here, looking sad.", ["death_today"]),
  L("mourn", "aggressive", 1, "Dead. And one of you is pretending to grieve. Badly.", ["death_today"]),

  // rebuke
  L("rebuke", "calm", 1, "{target}, that was not addressed to anyone at this table. Try again."),
  L("rebuke", "nervous", 1, "{target}, what was that? Talk to us."),
  L("rebuke", "aggressive", 1, "{target}, stop that. Talk to the table or don't talk."),
  L("rebuke", "sarcastic", 1, "{target}, fascinating. Now say something to a person."),
];
