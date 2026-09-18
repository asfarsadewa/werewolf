// Kip, the woodcutter's apprentice. Nineteen, freckles. Hot-headed and
// defensive; every accusation is personal and comes straight back. Nervous is
// jittery bravado; pleading is a kid who knows he sounds guilty.

import type { LineSpec } from "./types";
import { speaker } from "./define";

const L = speaker("kip");

export const LINES: readonly LineSpec[] = [
  // accuse_evidence
  L("accuse_evidence", "calm", 1, "{target}, your vote was wrong. I'm not letting that slide.", ["fact:vote"]),
  L("accuse_evidence", "calm", 2, "{target}, you said one thing, then another. I heard both.", ["fact:contradiction"]),
  L("accuse_evidence", "calm", 3, "{target}, you've been quiet all day. I notice quiet. Quiet is how a wolf plays it, and I'm calling you.", ["fact:quiet"]),
  L("accuse_evidence", "nervous", 1, "{target}, okay, look. What you said and did today doesn't add up, and it makes you my wolf. Somebody else saw it too.", ["fact:any"]),
  L("accuse_evidence", "nervous", 2, "{target}, you didn't answer. I'm not stupid. You didn't answer!", ["fact:deflect"]),
  L("accuse_evidence", "aggressive", 1, "{target}, say that again. Because that's not what you said before!", ["fact:contradiction"]),
  L("accuse_evidence", "aggressive", 2, "{target}, that vote! You want to explain that vote?", ["fact:vote"]),
  L("accuse_evidence", "aggressive", 3, "{target}, you dodged it! Answer or admit you can't.", ["fact:deflect"]),
  L("accuse_evidence", "sarcastic", 1, "{target}, oh, nice. Real smooth. Dodged the whole question. That's a wolf move and you know it.", ["fact:deflect"]),
  L("accuse_evidence", "sarcastic", 2, "{target}, seer, huh? Funny timing. Real funny. That's a wolf's claim if I ever heard one.", ["fact:claim"]),
  L("accuse_evidence", "sarcastic", 3, "{target}, wow, you just parroted the loud ones. Brave. Wolves hide in the crowd like that. I'm watching you.", ["fact:bandwagon"]),
  L("accuse_evidence", "pleading", 1, "{target}, just explain it, okay? What you said and did today doesn't add up, and it makes you look like a wolf.", ["fact:any"]),
  L("accuse_evidence", "pleading", 2, "{target}, please. You told two stories. Which one is true? Because two stories is what a wolf tells.", ["fact:contradiction"]),

  // accuse_bare
  L("accuse_bare", "calm", 1, "{target}, I don't have a reason. I've got a feeling, and it's you."),
  L("accuse_bare", "calm", 2, "{target}, you keep looking at me like that. Wolves look like that. I think it's you."),
  L("accuse_bare", "nervous", 1, "{target}, you're the wolf. I think. Yeah. You're the wolf. Probably."),
  L("accuse_bare", "nervous", 2, "{target}, don't look at me like that. You're the one acting weird, and weird is wolf to me."),
  L("accuse_bare", "aggressive", 1, "{target}, you're a wolf! Go on, say you aren't."),
  L("accuse_bare", "aggressive", 2, "{target}, you're the wolf. Fight me on it."),
  L("accuse_bare", "sarcastic", 1, "{target}, sure, you're innocent. Real innocent. Sitting there all innocent."),
  L("accuse_bare", "sarcastic", 2, "{target}, oh, that face. Real convincing. I'm calling it anyway: you're the wolf."),
  L("accuse_bare", "pleading", 1, "{target}, please just be honest. I think you're a wolf and I can't keep guessing."),
  L("accuse_bare", "pleading", 2, "{target}, tell me it's not you. I'll believe you, I swear."),

  // defend_self
  L("defend_self", "calm", 1, "It's not me. I chop wood. I don't sneak.", ["accused"]),
  L("defend_self", "calm", 2, "Say what you want. I'm not a wolf, and I've said the same thing all day.", ["accused"]),
  L("defend_self", "nervous", 1, "Me? I'm not a wolf. Funny how it's always me, though. Always.", ["accused"]),
  L("defend_self", "nervous", 2, "I'm not! I'm not, okay? Why would anyone even think that?", ["accused"]),
  L("defend_self", "aggressive", 1, "I'm not a wolf! Say that again to my face.", ["accused"]),
  L("defend_self", "aggressive", 2, "I'm not a wolf! Funny how it's always me, though.", ["accused"]),
  L("defend_self", "sarcastic", 1, "Oh, sure. The apprentice. Big scary wolf. Great. I'm not, by the way. Not a wolf.", ["accused"]),
  L("defend_self", "sarcastic", 2, "Yeah, sure, I'm the mastermind. Obviously. Except I'm not a wolf, so no.", ["accused"]),
  L("defend_self", "pleading", 1, "I know how it sounds. I know! But it's not me.", ["accused"]),
  L("defend_self", "pleading", 2, "Please. I get loud, I know I do. That doesn't make me a wolf.", ["accused"]),

  // defend_other
  L("defend_other", "calm", 1, "{target}, I've got your back. They've got nothing on you."),
  L("defend_other", "calm", 2, "{target}, you haven't done anything wrong. I'd have said."),
  L("defend_other", "nervous", 1, "{target}, you're not a wolf. Right? You're not. I don't think you're a wolf."),
  L("defend_other", "nervous", 2, "{target}, don't let them get to you. I don't think you're a wolf. That's just what they want you to look like."),
  L("defend_other", "aggressive", 1, "{target}, ignore them! You're not a wolf, it's garbage and they know it."),
  L("defend_other", "aggressive", 2, "{target}, you're not the wolf! Whoever's pushing you is the one I'm watching now."),
  L("defend_other", "sarcastic", 1, "{target}, oh, now you're the wolf. Sure. You're not a wolf, you've done nothing, and they know it."),
  L("defend_other", "sarcastic", 2, "{target}, welcome to the club. The nothing-on-you club. You're not a wolf, and they've got nothing."),
  L("defend_other", "pleading", 1, "{target}, hang on. I don't think you're a wolf. Don't give up. Say something."),
  L("defend_other", "pleading", 2, "{target}, come on, tell them you're not a wolf! I believe you. Don't just take it."),

  // question
  L("question", "calm", 1, "{target}, who do you think it is? Just say it."),
  L("question", "calm", 2, "{target}, who's on your list? Straight answer."),
  L("question", "nervous", 1, "{target}, you're not voting me, are you? Are you?"),
  L("question", "nervous", 2, "{target}, who do you suspect? And it better not be me."),
  L("question", "aggressive", 1, "{target}, spit it out! Who are you voting for?"),
  L("question", "aggressive", 2, "{target}, why do you keep dodging? What are you hiding?"),
  L("question", "sarcastic", 1, "{target}, go on then, genius. Who is it?"),
  L("question", "sarcastic", 2, "{target}, got anything to say? Or just looks?"),
  L("question", "pleading", 1, "{target}, please, who do you trust? I need somebody to say something real."),
  L("question", "pleading", 2, "{target}, just tell me. Am I on your list?"),

  // answer
  L("answer", "calm", 1, "You asked. Fine. I suspect whoever keeps pointing at me.", ["asked"]),
  L("answer", "calm", 2, "Yeah, I'll answer. No. I'm not. That's it.", ["asked"]),
  L("answer", "nervous", 1, "Uh, okay. My answer is I don't know. Don't make a thing of it.", ["asked"]),
  L("answer", "nervous", 2, "I'm answering! I said I'm answering. It's no.", ["asked"]),
  L("answer", "aggressive", 1, "There's your answer! Happy now?", ["asked"]),
  L("answer", "aggressive", 2, "I already answered! Ask someone else for once.", ["asked"]),
  L("answer", "sarcastic", 1, "Wow, a question for me. What a shock. The answer's no.", ["asked"]),
  L("answer", "sarcastic", 2, "Sure, here's an answer. Take notes. No.", ["asked"]),
  L("answer", "pleading", 1, "That's the truth, okay? I know I sound guilty. I'm not.", ["asked"]),
  L("answer", "pleading", 2, "I answered. Please don't twist it. I'm bad at this.", ["asked"]),

  // deflect
  L("deflect", "calm", 1, "Forget me. Who else hasn't been asked anything?"),
  L("deflect", "calm", 2, "Look somewhere else for a bit. Some people here haven't said a word."),
  L("deflect", "nervous", 1, "Why's it always me? Ask them! Ask literally anyone else."),
  L("deflect", "nervous", 2, "Can we, uh, talk about someone else? Anyone?"),
  L("deflect", "aggressive", 1, "Stop looking at me! Look at the ones sitting there quiet."),
  L("deflect", "aggressive", 2, "Funny how it's always me and never the quiet ones!"),
  L("deflect", "sarcastic", 1, "Yeah, yeah. Blame the kid. Way easier than thinking."),
  L("deflect", "sarcastic", 2, "Oh sure, ask me. Not the ones who've barely opened their mouths."),
  L("deflect", "pleading", 1, "Please, not me again. Ask someone else. Please."),
  L("deflect", "pleading", 2, "Give me a break for one turn. Look at the others."),

  // chatter
  L("chatter", "calm", 1, "Everyone's getting tense. I can feel it from here."),
  L("chatter", "calm", 2, "This is taking forever. Someone's going to snap."),
  L("chatter", "nervous", 1, "Anyone else feel like they're being watched? Just me? Cool."),
  L("chatter", "nervous", 2, "I hate the quiet bits. Somebody say something."),
  L("chatter", "aggressive", 1, "Come on! Somebody accuse somebody. We're wasting daylight."),
  L("chatter", "aggressive", 2, "All this talk and nobody's said anything. Pathetic."),
  L("chatter", "sarcastic", 1, "Great day. Everyone staring. Nobody talking. Love it."),
  L("chatter", "sarcastic", 2, "Real brave, everyone. Waiting for someone else to go first."),
  L("chatter", "pleading", 1, "Can we just figure this out? I'm tired of being scared."),
  L("chatter", "pleading", 2, "Someone please say something that helps. Anything."),

  // claim_seer
  L("claim_seer", "calm", 1, "Okay. I'm the seer. Laugh if you want. I'm the seer."),
  L("claim_seer", "nervous", 1, "I'm the seer! I know, I know. But I am."),
  L("claim_seer", "aggressive", 1, "I'm the seer! Shut up and listen for once."),

  // counter_claim
  L("counter_claim", "calm", 1, "{target}, that's a lie. I'm the seer. I can back it up.", ["claim_exists"]),
  L("counter_claim", "nervous", 1, "{target}, no! No, I'm the seer. Why would you do that?", ["claim_exists"]),
  L("counter_claim", "aggressive", 1, "{target}, liar! I'm the seer. Say that again and see.", ["claim_exists"]),

  // reveal_wolf
  L("reveal_wolf", "calm", 1, "{target}, I checked you. Wolf. That's it."),
  L("reveal_wolf", "nervous", 1, "{target}, I checked you last night and you came back wolf. I saw it. I did!"),
  L("reveal_wolf", "aggressive", 1, "{target}, I checked you last night. Wolf! Got you. Everyone, it's them."),

  // reveal_clear
  L("reveal_clear", "calm", 1, "{target}, you're clear. I checked. Leave them alone."),
  L("reveal_clear", "nervous", 1, "{target}, I checked you last night. You're not a wolf. Phew. One down."),
  L("reveal_clear", "aggressive", 1, "{target}, I checked you last night. Not a wolf! So back off them, all of you."),

  // vote
  L("vote", "calm", 1, "{target}, I'm voting you. Nothing personal. Well, a bit."),
  L("vote", "nervous", 1, "{target}, I'm voting you. Don't make that face. I'm voting you."),
  L("vote", "aggressive", 1, "{target}, you! My vote's on you."),
  L("vote", "sarcastic", 1, "{target}, my vote. Surprise."),

  // greet
  L("greet", "calm", 1, "Morning. Let's get this done."),
  L("greet", "nervous", 1, "Morning. Everyone's already looking at me, aren't they."),
  L("greet", "aggressive", 1, "Right. Whoever it is, I'll find you!"),

  // mourn
  L("mourn", "calm", 1, "Someone's gone. We're still here. Let's use it.", ["death_today"]),
  L("mourn", "nervous", 1, "Another one. Could've been me. Could still be me.", ["death_today"]),
  L("mourn", "aggressive", 1, "Someone here did that! And they're sitting right here.", ["death_today"]),

  // rebuke
  L("rebuke", "calm", 1, "{target}, hey. We're over here. Talk to us."),
  L("rebuke", "nervous", 1, "{target}, what? Who are you even talking to?"),
  L("rebuke", "aggressive", 1, "{target}, quit that! Talk to us or shut it."),
];
