// Sol, the elder. Seventies, staff. Slow, few words, proverbs and weather.
// Decides late and then hard. Aggressive is quiet and final; nervous is an
// old man admitting he is unsure.

import type { LineSpec } from "./types";
import { speaker } from "./define";

const L = speaker("sol");

export const LINES: readonly LineSpec[] = [
  // accuse_evidence
  L("accuse_evidence", "calm", 1, "{target}. Your vote. I saw where it went. So did the wind. It went where a wolf's would.", ["fact:vote"]),
  L("accuse_evidence", "calm", 2, "{target}. This morning, one thing. Now another. Your story changed, and that makes you my wolf.", ["fact:contradiction"]),
  L("accuse_evidence", "calm", 3, "{target}. You have said nothing all day. Wolves are quiet too. I suspect you for it.", ["fact:quiet"]),
  L("accuse_evidence", "nervous", 1, "{target}. I may be wrong. Old eyes. But what you said and did today does not add up, and I suspect you.", ["fact:any"]),
  L("accuse_evidence", "nervous", 2, "{target}. They asked. You went around it. I am not sure why. I would like to be.", ["fact:deflect"]),
  L("accuse_evidence", "aggressive", 1, "{target}. You changed your story. That is all I need.", ["fact:contradiction"]),
  L("accuse_evidence", "aggressive", 2, "{target}. That vote of yours. It is a wolf's vote. It is enough.", ["fact:vote"]),
  L("accuse_evidence", "aggressive", 3, "{target}. You were asked. You did not answer. A wolf does that. I say it is you.", ["fact:deflect"]),
  L("accuse_evidence", "sarcastic", 1, "{target}. Fine words. The question you were asked is still out in the rain. You dodged it, and I suspect you for it.", ["fact:deflect"]),
  L("accuse_evidence", "sarcastic", 2, "{target}. A seer, you say. The weather turns, and so do you. That claim is why I suspect you.", ["fact:claim"]),
  L("accuse_evidence", "pleading", 1, "{target}. What you said and did today does not add up. That is why I suspect you. Tell me I am wrong. I am old.", ["fact:any"]),
  L("accuse_evidence", "pleading", 2, "{target}. You only echoed the room. Nothing of your own. That echo is why I suspect you. Speak for yourself.", ["fact:bandwagon"]),

  // accuse_bare
  L("accuse_bare", "calm", 1, "{target}. I have watched you. I do not like the weather around you."),
  L("accuse_bare", "calm", 2, "{target}. Wolves are patient. So am I. I have waited long enough. I say wolf. I say you."),
  L("accuse_bare", "nervous", 1, "{target}. Something. I cannot name it. It is there."),
  L("accuse_bare", "nervous", 2, "{target}. Maybe nothing. An old man's chill. But the chill says wolf, and it points at you."),
  L("accuse_bare", "aggressive", 1, "{target}. You are the wolf."),
  L("accuse_bare", "aggressive", 2, "{target}. Wait. No. I am done waiting. You."),
  L("accuse_bare", "sarcastic", 1, "{target}. Very still. Stones are still. So are wolves in long grass. I think you are the wolf."),
  L("accuse_bare", "sarcastic", 2, "{target}. Such a good villager. Never a wrong word. Wolves are good at that. I suspect you."),
  L("accuse_bare", "pleading", 1, "{target}. I think you are a wolf. Give me a reason to wait. One."),
  L("accuse_bare", "pleading", 2, "{target}. I think you are a wolf. Tell me I am a foolish old man. I would take it gladly."),

  // defend_self
  L("defend_self", "calm", 1, "I have sat here longer than any of you. I have no reason to lie now.", ["accused"]),
  L("defend_self", "calm", 2, "Look at me. Then look at what I have done today. Nothing hidden.", ["accused"]),
  L("defend_self", "nervous", 1, "Me. Well. I am old, not a wolf. I do not know how else to say it.", ["accused"]),
  L("defend_self", "nervous", 2, "I am not a wolf. I have not lied. I am too tired to lie.", ["accused"]),
  L("defend_self", "aggressive", 1, "No. I am not a wolf. Look elsewhere.", ["accused"]),
  L("defend_self", "aggressive", 2, "I am not a wolf. You waste the day on me, and the wolves thank you.", ["accused"]),
  L("defend_self", "sarcastic", 1, "The old man with the stick. Yes. Very fast in the night. I am not a wolf.", ["accused"]),
  L("defend_self", "sarcastic", 2, "I am not a wolf. I am the slowest man at the table. Wolves are not slow.", ["accused"]),
  L("defend_self", "pleading", 1, "Wait. I am not a wolf. Hear an old man once more before you vote.", ["accused"]),
  L("defend_self", "pleading", 2, "I am no wolf. I ask for patience. Just that. Then decide.", ["accused"]),

  // defend_other
  L("defend_other", "calm", 1, "{target}, I have watched you. Your weather has not changed. You are not a wolf."),
  L("defend_other", "calm", 2, "{target}, you have said the same thing all day. Liars do not manage that. You are no wolf."),
  L("defend_other", "nervous", 1, "{target}, I do not think you are a wolf. I am not sure of much. I am sure of that."),
  L("defend_other", "nervous", 2, "{target}, they push you hard. I see no reason for it. I do not think you are a wolf."),
  L("defend_other", "aggressive", 1, "{target}, stand. You are no wolf. The rest of you, wait."),
  L("defend_other", "aggressive", 2, "{target}, no one has shown me anything against you. Enough."),
  L("defend_other", "sarcastic", 1, "{target}, they have decided you are a wolf. Quick as frost, and as thin. You are not."),
  L("defend_other", "sarcastic", 2, "{target}, a wolf, they say. On a feeling. Hm. I have watched you all day. You are not a wolf."),
  L("defend_other", "pleading", 1, "{target}, do not stop talking. I do not believe you are a wolf. Let them hear why."),
  L("defend_other", "pleading", 2, "{target}, you are not a wolf. Wait for them to settle. Then say so once more. Please."),

  // question
  L("question", "calm", 1, "{target}, who do you suspect? Take your time. I have."),
  L("question", "calm", 2, "{target}, your vote. Why that one?", ["past_vote"]),
  L("question", "nervous", 1, "{target}, who do you trust? I would like to know before I decide."),
  L("question", "nervous", 2, "{target}, are you sure of what you said this morning?"),
  L("question", "aggressive", 1, "{target}, wolf or not?"),
  L("question", "aggressive", 2, "{target}, who are you protecting?"),
  L("question", "sarcastic", 1, "{target}, when the weather suits you. Who is the wolf?"),
  L("question", "sarcastic", 2, "{target}, you have said much. What do you actually think?"),
  L("question", "pleading", 1, "{target}, one answer. Who would you save?"),
  L("question", "pleading", 2, "{target}, I am asking you plainly. Who is it?"),

  // answer
  L("answer", "calm", 1, "You ask. I answer. I suspect the one who changed with the wind.", ["asked"]),
  L("answer", "calm", 2, "No. That is my answer. It will not change.", ["asked"]),
  L("answer", "nervous", 1, "I do not know yet. I am slow. I would rather be slow than wrong.", ["asked"]),
  L("answer", "nervous", 2, "Ask me later. I am still watching.", ["asked"]),
  L("answer", "aggressive", 1, "No. That is all you get.", ["asked"]),
  L("answer", "aggressive", 2, "I answered. Do not ask twice.", ["asked"]),
  L("answer", "sarcastic", 1, "A question for the old man. Here. No. Was that fast enough?", ["asked"]),
  L("answer", "sarcastic", 2, "My answer is the same as before. The weather has not changed.", ["asked"]),
  L("answer", "pleading", 1, "That is the truth. Believe an old man once.", ["asked"]),
  L("answer", "pleading", 2, "I have answered. I ask you to hear it.", ["asked"]),

  // deflect
  L("deflect", "calm", 1, "Wait. There are others who have not spoken."),
  L("deflect", "calm", 2, "Ask the quiet ones. The loud ones have already told you what they are."),
  L("deflect", "nervous", 1, "Me? I am slow, not hidden. Look at the ones who move fast."),
  L("deflect", "nervous", 2, "Wait. Not me. Not yet. Others first."),
  L("deflect", "aggressive", 1, "Enough. Look elsewhere."),
  L("deflect", "aggressive", 2, "You waste daylight on me. Turn around."),
  L("deflect", "sarcastic", 1, "Yes. Ask the man with the stick. The wolves will wait politely."),
  L("deflect", "sarcastic", 2, "Fine. Question me. The wind blows where it likes."),
  L("deflect", "pleading", 1, "Not me. Please. Look at the rest first."),
  L("deflect", "pleading", 2, "Wait a little. Look around the table. Then ask me."),

  // chatter
  L("chatter", "calm", 1, "Wolves are patient. So am I."),
  L("chatter", "calm", 2, "The wind has turned. Someone at this table felt it."),
  L("chatter", "nervous", 1, "I am old. I am not sure of anything today."),
  L("chatter", "nervous", 2, "It is too quiet. Quiet before weather."),
  L("chatter", "aggressive", 1, "Stop talking. Start deciding."),
  L("chatter", "aggressive", 2, "The day is short. Choose."),
  L("chatter", "sarcastic", 1, "Much talk. Little said. As usual."),
  L("chatter", "sarcastic", 2, "Everyone agrees. How pleasant. How useless."),
  L("chatter", "pleading", 1, "Wait. Let us think before we vote."),
  L("chatter", "pleading", 2, "Give an old man one more turn before you decide."),

  // claim_seer
  L("claim_seer", "calm", 1, "I am the seer. I waited. Now I speak."),
  L("claim_seer", "nervous", 1, "I am the seer. I should have said so. I did not know when."),
  L("claim_seer", "aggressive", 1, "I am the seer. Be quiet and hear me."),

  // counter_claim
  L("counter_claim", "calm", 1, "{target}, no. I am the seer. I have waited to say it. I say it now.", ["claim_exists"]),
  L("counter_claim", "nervous", 1, "{target}, that is not so. I am the seer. I had hoped not to say it today.", ["claim_exists"]),
  L("counter_claim", "aggressive", 1, "{target}, you lie. I am the seer. Wait. Everyone. Listen.", ["claim_exists"]),

  // reveal_wolf
  L("reveal_wolf", "calm", 1, "{target}, I looked at you. Wolf."),
  L("reveal_wolf", "nervous", 1, "{target}, it came back wolf. I checked. I am old, not blind."),
  L("reveal_wolf", "aggressive", 1, "{target}, I looked at you last night. Wolf. It is finished."),

  // reveal_clear
  L("reveal_clear", "calm", 1, "{target}, I looked at you last night. You are not a wolf."),
  L("reveal_clear", "nervous", 1, "{target}, I looked at you last night. Not a wolf. Good. One less shadow."),
  L("reveal_clear", "aggressive", 1, "{target}, I looked at you last night. Not a wolf. Leave them. Look elsewhere."),

  // vote
  L("vote", "calm", 1, "{target}, I have waited. It is you."),
  L("vote", "nervous", 1, "{target}, my vote. I hope the wind is wrong."),
  L("vote", "aggressive", 1, "{target}, you. Done."),

  // greet
  L("greet", "calm", 1, "Morning. Wolves are patient. So am I."),
  L("greet", "nervous", 1, "Morning. Cold night. I did not sleep well."),
  L("greet", "aggressive", 1, "Morning. No speeches. Watch each other."),

  // mourn
  L("mourn", "calm", 1, "Gone. The rest of us remain. Sit. Think.", ["death_today"]),
  L("mourn", "nervous", 1, "Another one. I am too old for this many funerals.", ["death_today"]),
  L("mourn", "aggressive", 1, "Dead. Someone here did it. I will not forget.", ["death_today"]),

  // rebuke
  L("rebuke", "calm", 1, "{target}, talk to us. We are here."),
  L("rebuke", "nervous", 1, "{target}, who do you speak to? There is only the table."),
  L("rebuke", "aggressive", 1, "{target}, enough. Talk to the table."),
];
