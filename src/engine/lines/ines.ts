// Ines, the innkeeper. Sixties, shawl. Warm, gives the benefit of the doubt,
// believes people who defend others. "Dear" and "love" sparingly. Her anger is
// a disappointed mother's; her sarcasm is gentle teasing.

import type { LineSpec } from "./types";
import { speaker } from "./define";

const L = speaker("ines");

export const LINES: readonly LineSpec[] = [
  // accuse_evidence
  L("accuse_evidence", "calm", 1, "{target}, that vote of yours sat badly with me. I've tried to let it go. I can't. It makes me suspect you.", ["fact:vote"]),
  L("accuse_evidence", "calm", 2, "{target}, that's not quite what you told us before, is it, dear?", ["fact:contradiction"]),
  L("accuse_evidence", "calm", 3, "{target}, you've hardly said a word today. That's not how a clear conscience sits.", ["fact:quiet"]),
  L("accuse_evidence", "nervous", 1, "{target}, I don't like saying this. What you said and did today doesn't add up, and I suspect you for it.", ["fact:any"]),
  L("accuse_evidence", "nervous", 2, "{target}, you didn't answer the question they put to you. I noticed, and now I suspect you. I wish I didn't.", ["fact:deflect"]),
  L("accuse_evidence", "aggressive", 1, "{target}, you told us one thing and then another. I am disappointed in you.", ["fact:contradiction"]),
  L("accuse_evidence", "aggressive", 2, "{target}, look at what you voted for. Look at it. I expected better.", ["fact:vote"]),
  L("accuse_evidence", "aggressive", 3, "{target}, you were asked plainly and you slid out of it. Not in my house.", ["fact:deflect"]),
  L("accuse_evidence", "sarcastic", 1, "{target}, a lovely answer, dear, to a question nobody asked. Dodging the real one makes you my wolf.", ["fact:deflect"]),
  L("accuse_evidence", "sarcastic", 2, "{target}, the seer, are you? Aren't we blessed. A claim that handy is a wolf's claim, dear.", ["fact:claim"]),
  L("accuse_evidence", "pleading", 1, "{target}, your own words today don't hold together, love, and I suspect you for it. Please explain. I want to be wrong.", ["fact:any"]),
  L("accuse_evidence", "pleading", 2, "{target}, you only echoed what the room said. That is how wolves hide, love. Tell me what you think yourself.", ["fact:bandwagon"]),

  // accuse_bare
  L("accuse_bare", "calm", 1, "{target}, I've given you the benefit of the doubt all day. I'm running low."),
  L("accuse_bare", "calm", 2, "{target}, something in how you've sat there today. I can't put it kinder."),
  L("accuse_bare", "nervous", 1, "{target}, I hope I'm wrong about you. I have a feeling I'm not."),
  L("accuse_bare", "nervous", 2, "{target}, I keep looking at you and thinking wolf, and I can't say why."),
  L("accuse_bare", "aggressive", 1, "{target}, I have been patient with you. That's finished. I think you're a wolf."),
  L("accuse_bare", "aggressive", 2, "{target}, look me in the eye and tell me you're not."),
  L("accuse_bare", "sarcastic", 1, "{target}, ever so good today, weren't you, dear. Too good. I think you're a wolf, and that's all I have."),
  L("accuse_bare", "sarcastic", 2, "{target}, butter wouldn't melt, would it, dear. That's just how a wolf looks to me."),
  L("accuse_bare", "pleading", 1, "{target}, I think you're a wolf. Tell me I've got you wrong. Please, love."),
  L("accuse_bare", "pleading", 2, "{target}, I suspect you, and I'd rather be a fool than right about it. Say something."),

  // defend_self
  L("defend_self", "calm", 1, "I've fed half this table. I've hidden nothing from any of you.", ["accused"]),
  L("defend_self", "calm", 2, "I am not a wolf. I have been open all day. Ask anyone I've spoken with.", ["accused"]),
  L("defend_self", "nervous", 1, "Me? Oh, dear. No. No, I've only tried to keep the peace.", ["accused"]),
  L("defend_self", "nervous", 2, "I don't know what to say to that. I'm not a wolf. I've been kind. Is that suspicious now?", ["accused"]),
  L("defend_self", "aggressive", 1, "How dare you. I am not a wolf. I have stood up for every one of you.", ["accused"]),
  L("defend_self", "aggressive", 2, "I am not a wolf, and I'm hurt that you'd say it so easily.", ["accused"]),
  L("defend_self", "sarcastic", 1, "Yes, dear, the innkeeper who tucks everyone in. A monster. I'm not a wolf, and you know it.", ["accused"]),
  L("defend_self", "sarcastic", 2, "I'm not a wolf, dear. I'm the one who keeps saying be gentle, which is rather the opposite.", ["accused"]),
  L("defend_self", "pleading", 1, "Please. I'm not a wolf. I've stood by you all. Stand by me now.", ["accused"]),
  L("defend_self", "pleading", 2, "I'm asking you, love. I'm not a wolf. Don't do this to me on a feeling.", ["accused"]),

  // defend_other
  L("defend_other", "calm", 1, "{target}, I believe you, dear. I've listened, and I believe you."),
  L("defend_other", "calm", 2, "{target}, you've been kind to this table. Wolves don't bother."),
  L("defend_other", "nervous", 1, "{target}, I don't think you're a wolf. I hope you're not. I really don't think so."),
  L("defend_other", "nervous", 2, "{target}, they're being hard on you. I don't see what they see."),
  L("defend_other", "aggressive", 1, "{target}, you are not a wolf, and don't you dare let them shout you down. I'm with you."),
  L("defend_other", "aggressive", 2, "{target}, stay put. You're no wolf, and the rest of you know it. Leave them be."),
  L("defend_other", "sarcastic", 1, "{target}, a wolf for being decent, are you? Nonsense, dear. You're not a wolf. Decent is all you've been."),
  L("defend_other", "sarcastic", 2, "{target}, they've made up their minds without you. How thoughtful. I haven't. You're not a wolf, dear."),
  L("defend_other", "pleading", 1, "{target}, hold on, love. I don't believe you're a wolf. Keep talking and let them hear why."),
  L("defend_other", "pleading", 2, "{target}, I don't think you're a wolf. Please, everyone, hear this one out before you decide."),

  // question
  L("question", "calm", 1, "{target}, who do you trust at this table? I'd like to know."),
  L("question", "calm", 2, "{target}, tell me plainly. Who worries you?"),
  L("question", "nervous", 1, "{target}, you'd tell me if something was wrong, wouldn't you?"),
  L("question", "nervous", 2, "{target}, what did you make of the vote? Honestly, now.", ["past_vote"]),
  L("question", "aggressive", 1, "{target}, look at me. Are you a wolf? Yes or no."),
  L("question", "aggressive", 2, "{target}, who are you voting for, and why? No shrugging."),
  L("question", "sarcastic", 1, "{target}, go on, dear. Who's the wolf? You've been so sure about everything else."),
  L("question", "sarcastic", 2, "{target}, any thoughts, or are we saving them for later?"),
  L("question", "pleading", 1, "{target}, please, just tell me who you'd protect. That tells me who you are."),
  L("question", "pleading", 2, "{target}, please, dear. Who do you think it is? I can't see it."),

  // answer
  L("answer", "calm", 1, "Since you ask, dear, I trust the ones who've spoken up for others.", ["asked"]),
  L("answer", "calm", 2, "You asked. I'll say it plain. I don't know yet, and I won't pretend.", ["asked"]),
  L("answer", "nervous", 1, "Oh, I don't like being asked that. I suppose I'd say the quiet ones.", ["asked"]),
  L("answer", "nervous", 2, "I'm not sure. I've been watching faces, not counting votes.", ["asked"]),
  L("answer", "aggressive", 1, "You want my answer? I've been honest all day. Have you?", ["asked"]),
  L("answer", "aggressive", 2, "I'll answer, but mind your tone with me.", ["asked"]),
  L("answer", "sarcastic", 1, "Well, since you asked so nicely, dear. No. I'm not.", ["asked"]),
  L("answer", "sarcastic", 2, "My answer is the same as before. I'll say it slower if it helps.", ["asked"]),
  L("answer", "pleading", 1, "That's my honest answer. Please take it as it's meant.", ["asked"]),
  L("answer", "pleading", 2, "I've answered you. Believe me or don't, but I've answered.", ["asked"]),

  // deflect
  L("deflect", "calm", 1, "Let's not fuss over me. There are people here who've said nothing."),
  L("deflect", "calm", 2, "I'd rather hear from the quiet ones before I say more."),
  L("deflect", "nervous", 1, "Oh, must it be me? Ask around the table first."),
  L("deflect", "nervous", 2, "I don't think I'm the one you should be looking at. Really I don't."),
  L("deflect", "aggressive", 1, "Enough about me. Ask the ones who've kept their heads down."),
  L("deflect", "aggressive", 2, "Turn that question round the table. I'm not the only one here."),
  L("deflect", "sarcastic", 1, "Oh, ask the innkeeper, why not. I'll answer when the ones sitting there like stones have."),
  L("deflect", "sarcastic", 2, "Ask me all you like. It's the quiet ones who'll surprise you."),
  L("deflect", "pleading", 1, "Not me, love. Please. Look at the others first."),
  L("deflect", "pleading", 2, "Let me be for now. There are others who need asking."),

  // chatter
  L("chatter", "calm", 1, "Everyone's tired. Tired people say things they don't mean. Be gentle."),
  L("chatter", "calm", 2, "It's a hard thing, looking at neighbours this way."),
  L("chatter", "nervous", 1, "I keep looking round the table. Someone's lying to me, and I've fed them."),
  L("chatter", "nervous", 2, "It's gone very quiet. I don't like it when the inn goes quiet."),
  L("chatter", "aggressive", 1, "Stop bickering, all of you. It helps nobody but the wolves."),
  L("chatter", "aggressive", 2, "Speak up or sit down. We haven't the daylight for sulking."),
  L("chatter", "sarcastic", 1, "Lovely. Everyone talking and nobody saying anything. Just like market day."),
  L("chatter", "sarcastic", 2, "Well, this is cosy. Shall I put the kettle on while we accuse each other?"),
  L("chatter", "pleading", 1, "Please, can we be kind for a minute? Just a minute."),
  L("chatter", "pleading", 2, "I just want us to get this right. Somebody help me get it right."),

  // claim_seer
  L("claim_seer", "calm", 1, "I'm the seer, dears. I've kept it to myself. I can't any longer."),
  L("claim_seer", "nervous", 1, "I'm the seer. Oh, I didn't want to say it. Please listen."),
  L("claim_seer", "aggressive", 1, "I am the seer. Hush, all of you, and listen."),

  // counter_claim
  L("counter_claim", "calm", 1, "{target}, no, love. I'm the seer. I'm sorry, but I am.", ["claim_exists"]),
  L("counter_claim", "nervous", 1, "{target}, that isn't true. I'm the seer. I wish I weren't, today.", ["claim_exists"]),
  L("counter_claim", "aggressive", 1, "{target}, that is a lie. I'm the seer, and shame on you.", ["claim_exists"]),

  // reveal_wolf
  L("reveal_wolf", "calm", 1, "{target}, I checked you, dear. You're a wolf. I'm sorry."),
  L("reveal_wolf", "nervous", 1, "{target}, I looked at you. Wolf. Oh, I hoped not."),
  L("reveal_wolf", "aggressive", 1, "{target}, I checked you last night. Wolf. Don't you dare deny it to my face."),

  // reveal_clear
  L("reveal_clear", "calm", 1, "{target}, I checked you. You're clear, love. Rest easy."),
  L("reveal_clear", "nervous", 1, "{target}, you're clear. I checked. Thank heavens for that."),
  L("reveal_clear", "aggressive", 1, "{target}, I checked you last night. You are not a wolf. So leave them be, all of you."),

  // vote
  L("vote", "calm", 1, "{target}, I'm voting for you, dear. It gives me no pleasure."),
  L("vote", "nervous", 1, "{target}, I'm so sorry. It's you. I hope I'm wrong."),
  L("vote", "aggressive", 1, "{target}, my vote is for you. I gave you every chance."),
  L("vote", "pleading", 1, "{target}, forgive me. It's you. Please let me be wrong."),

  // greet
  L("greet", "calm", 1, "Good morning, all. Be kind and be honest, and we'll manage."),
  L("greet", "nervous", 1, "Morning, dears. I hardly slept. Let's be careful with each other."),
  L("greet", "aggressive", 1, "Morning. Nobody hides behind manners today. Not at my table."),

  // mourn
  L("mourn", "calm", 1, "Another chair empty. Let's honour them by getting this right.", ["death_today"]),
  L("mourn", "nervous", 1, "Oh, no. Not them. I can't keep doing this.", ["death_today"]),
  L("mourn", "aggressive", 1, "They're gone, and one of you knew they would be. I won't forget that.", ["death_today"]),

  // rebuke
  L("rebuke", "calm", 1, "{target}, dear, talk to us. We're the ones here."),
  L("rebuke", "nervous", 1, "{target}, who are you talking to? There's only us here."),
  L("rebuke", "aggressive", 1, "{target}, that's enough of that. Talk to the table."),
];
