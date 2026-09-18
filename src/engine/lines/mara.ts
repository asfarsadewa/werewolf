// Mara, the baker. Forties, arms crossed. Facts or nothing. Short declaratives,
// rarely a question mark, never a compliment. Her sarcasm is flat; her
// pleading is admitting she needs one thing: proof.

import type { LineSpec } from "./types";
import { speaker } from "./define";

const L = speaker("mara");

export const LINES: readonly LineSpec[] = [
  // accuse_evidence
  L("accuse_evidence", "calm", 1, "{target}. Your vote went the wrong way. I noticed.", ["fact:vote"]),
  L("accuse_evidence", "calm", 2, "{target}. That is not what you said this morning.", ["fact:contradiction"]),
  L("accuse_evidence", "calm", 3, "{target}. You have said nothing all day. That counts against you. I suspect you.", ["fact:quiet"]),
  L("accuse_evidence", "nervous", 1, "{target}. I checked what you said today against what you did. It doesn't hold. I say wolf.", ["fact:any"]),
  L("accuse_evidence", "nervous", 2, "{target}. They asked you something plain. You didn't answer. I keep noticing that.", ["fact:deflect"]),
  L("accuse_evidence", "aggressive", 1, "{target}. Two stories. Pick one. Two stories is a wolf's habit.", ["fact:contradiction"]),
  L("accuse_evidence", "aggressive", 2, "{target}. Look at where your vote went. Then look at me and say it again.", ["fact:vote"]),
  L("accuse_evidence", "aggressive", 3, "{target}. You dodged the question that was put to you. That is what a wolf does. Answer it.", ["fact:deflect"]),
  L("accuse_evidence", "sarcastic", 1, "{target}. Lovely speech. Not an answer.", ["fact:deflect"]),
  L("accuse_evidence", "sarcastic", 2, "{target}. Seer, you say. No proof. That claim alone makes you my suspect.", ["fact:claim"]),
  L("accuse_evidence", "sarcastic", 3, "{target}. You repeated what the room said and called it a thought. Wolves hide like that. I suspect you.", ["fact:bandwagon"]),
  L("accuse_evidence", "pleading", 1, "{target}. What you said and did today doesn't add up. Give me one thing that explains it. One. I'll take it.", ["fact:any"]),
  L("accuse_evidence", "pleading", 2, "{target}. Say something. Silence is all I have on you, and it is enough.", ["fact:quiet"]),

  // accuse_bare
  L("accuse_bare", "calm", 1, "{target}. No facts yet. But I'm watching you."),
  L("accuse_bare", "calm", 2, "{target}. Something about you is off. I think wolf. I'll find the fact."),
  L("accuse_bare", "nervous", 1, "{target}. I suspect you. I can't point to anything. That bothers me more."),
  L("accuse_bare", "nervous", 2, "{target}. Maybe it's nothing. I don't think it's nothing. I think you're a wolf."),
  L("accuse_bare", "aggressive", 1, "{target}. Wolf. Prove me wrong."),
  L("accuse_bare", "aggressive", 2, "{target}. I have no fact on you. I don't need one. Wolf."),
  L("accuse_bare", "sarcastic", 1, "{target}. Very calm. Wolves are calm. I say you're one."),
  L("accuse_bare", "sarcastic", 2, "{target}. Not a hair out of place. Very tidy. I think you're a wolf, on nothing but that."),
  L("accuse_bare", "pleading", 1, "{target}. I think you're a wolf. Tell me I'm wrong. Give me something."),
  L("accuse_bare", "pleading", 2, "{target}. I want to be wrong about you. Help me."),

  // defend_self
  L("defend_self", "calm", 1, "I'm not a wolf. Check what I've said. All of it. It holds.", ["accused"]),
  L("defend_self", "calm", 2, "I am not a wolf. I have not changed my story once. That is my defence.", ["accused"]),
  L("defend_self", "nervous", 1, "I don't have a speech. I'm not a wolf. I have what I said. Read it back.", ["accused"]),
  L("defend_self", "nervous", 2, "Accuse me if you like. Then find the fact. There isn't one.", ["accused"]),
  L("defend_self", "aggressive", 1, "I'm not a wolf. Show me one thing that says I am. You can't.", ["accused"]),
  L("defend_self", "aggressive", 2, "I'm not a wolf. There's no fact against me. There won't be one.", ["accused"]),
  L("defend_self", "sarcastic", 1, "A feeling. You brought a feeling to a vote. I'm not a wolf. That's a fact.", ["accused"]),
  L("defend_self", "sarcastic", 2, "Fine. The wolf who keeps asking for proof. Very cunning. I'm not one.", ["accused"]),
  L("defend_self", "pleading", 1, "I'm not a wolf. I need you to look at what I've said. Not how I say it.", ["accused"]),
  L("defend_self", "pleading", 2, "I am not a wolf. I have given you facts all day. Give me one. Please.", ["accused"]),

  // defend_other
  L("defend_other", "calm", 1, "{target}, you've been straight with the room. You're not a wolf. I'll say so."),
  L("defend_other", "calm", 2, "{target}, nothing you've said has moved. Wolves slip. You haven't. Not a wolf."),
  L("defend_other", "nervous", 1, "{target}, I don't think it's you. I can't fully say why. Not yet."),
  L("defend_other", "nervous", 2, "{target}, they haven't shown me anything on you. I don't think you're a wolf. I won't pretend otherwise."),
  L("defend_other", "aggressive", 1, "{target}, stand still. Nobody here has a fact against you."),
  L("defend_other", "aggressive", 2, "{target}, ignore them. You're not a wolf. Feelings are not facts."),
  L("defend_other", "sarcastic", 1, "{target}, apparently you're a wolf because you answered plainly. No. You're not one."),
  L("defend_other", "sarcastic", 2, "{target}, the case against you is a shrug. I don't vote on shrugs. You're not a wolf."),
  L("defend_other", "pleading", 1, "{target}, hold on. I don't think you're a wolf. Don't let them vote you out on nothing."),
  L("defend_other", "pleading", 2, "{target}, keep talking. You're not a wolf. Give them nothing to twist."),

  // question
  L("question", "calm", 1, "{target}. Who do you suspect. Say it."),
  L("question", "calm", 2, "{target}. Your vote. Explain it.", ["past_vote"]),
  L("question", "nervous", 1, "{target}. I need to hear it from you. Who are you voting for."),
  L("question", "nervous", 2, "{target}. What changed your mind. Something did."),
  L("question", "aggressive", 1, "{target}. Answer plainly. Are you a wolf."),
  L("question", "aggressive", 2, "{target}. Who are you protecting."),
  L("question", "sarcastic", 1, "{target}. Humour me. What have you actually done today."),
  L("question", "sarcastic", 2, "{target}. Take your time. Who do you suspect, and why."),
  L("question", "pleading", 1, "{target}. One straight answer. Who do you trust."),
  L("question", "pleading", 2, "{target}. Help me. Who would you save."),

  // answer
  L("answer", "calm", 1, "Asked and answered. My vote follows the facts.", ["asked"]),
  L("answer", "calm", 2, "You asked. I suspect whoever's story moved. That's the answer.", ["asked"]),
  L("answer", "nervous", 1, "You want an answer. I don't have a clean one. I'm working on it.", ["asked"]),
  L("answer", "nervous", 2, "I'm not sure. I won't pretend to be. Ask me again after the vote.", ["asked"]),
  L("answer", "aggressive", 1, "Here's your answer. No. Next.", ["asked"]),
  L("answer", "aggressive", 2, "I heard the question. The answer is I've hidden nothing. Move on.", ["asked"]),
  L("answer", "sarcastic", 1, "Good question. Here's a boring answer. I'm a villager.", ["asked"]),
  L("answer", "sarcastic", 2, "You asked. I answered before you asked. Read it back.", ["asked"]),
  L("answer", "pleading", 1, "That's the honest answer. Take it or leave it, but take it.", ["asked"]),
  L("answer", "pleading", 2, "I'm answering you straight. Please hear it that way.", ["asked"]),

  // deflect
  L("deflect", "calm", 1, "Enough about me. Someone's vote still doesn't add up.", ["past_vote"]),
  L("deflect", "calm", 2, "Ask the quiet ones. I've been talking all day."),
  L("deflect", "nervous", 1, "Why is this about me. There are others who haven't said a word."),
  L("deflect", "nervous", 2, "Look, I talk. Some here don't. Start there."),
  L("deflect", "aggressive", 1, "Stop staring at me and start counting votes."),
  L("deflect", "aggressive", 2, "Wrong target. Look at who hasn't been asked anything."),
  L("deflect", "sarcastic", 1, "Yes, put the baker on trial. The quiet ones can wait."),
  L("deflect", "sarcastic", 2, "Interesting. Every question lands on me and none on the ones who say nothing."),
  L("deflect", "pleading", 1, "Not me. Please. Look at the rest of the table first."),
  L("deflect", "pleading", 2, "Spend the questions where there are gaps. Not on me."),

  // chatter
  L("chatter", "calm", 1, "Facts first. Then votes."),
  L("chatter", "calm", 2, "Long day. Nobody has shown me anything yet."),
  L("chatter", "nervous", 1, "This room is too quiet for my liking."),
  L("chatter", "nervous", 2, "Something moved this morning. I haven't placed it."),
  L("chatter", "aggressive", 1, "Stop talking about feelings. Bring me a fact."),
  L("chatter", "aggressive", 2, "Half of you are waiting to see who's winning. Pick."),
  L("chatter", "sarcastic", 1, "Wonderful. A whole morning of everyone agreeing and no one proving anything."),
  L("chatter", "sarcastic", 2, "We've talked for an hour and I could write it on a crumb."),
  L("chatter", "pleading", 1, "Somebody give me something solid. Anything."),
  L("chatter", "pleading", 2, "I don't want to vote on a guess again. Help me not to.", ["past_vote"]),

  // claim_seer
  L("claim_seer", "calm", 1, "I'm the seer. I've been checking. Now listen."),
  L("claim_seer", "nervous", 1, "I'm the seer. I should have said it sooner. Here's what I have."),
  L("claim_seer", "aggressive", 1, "I'm the seer. Sit down and listen."),

  // counter_claim
  L("counter_claim", "calm", 1, "{target}, you're not the seer. I am. I don't say things I can't back.", ["claim_exists"]),
  L("counter_claim", "nervous", 1, "That claim is false. I'm the seer. I didn't want to do this today.", ["claim_exists"]),
  L("counter_claim", "aggressive", 1, "{target}, liar. I'm the seer. Ask me anything.", ["claim_exists"]),

  // reveal_wolf
  L("reveal_wolf", "calm", 1, "{target}. I checked you. Wolf."),
  L("reveal_wolf", "nervous", 1, "{target}. I looked at you. It came back wolf. I'm sorry, it did."),
  L("reveal_wolf", "aggressive", 1, "{target}. Wolf. I saw it. Done."),

  // reveal_clear
  L("reveal_clear", "calm", 1, "{target}. I checked you. You're clear."),
  L("reveal_clear", "nervous", 1, "{target}. You came back clear. That's one less."),
  L("reveal_clear", "aggressive", 1, "{target}. I checked you last night. Not a wolf. Everyone leave them alone."),

  // vote
  L("vote", "calm", 1, "{target}. My vote. Nothing personal. Everything factual."),
  L("vote", "nervous", 1, "{target}. I'm voting you. I hope I'm wrong."),
  L("vote", "aggressive", 1, "{target}. You. Out."),
  L("vote", "sarcastic", 1, "{target}. My vote. Congratulations."),

  // greet
  L("greet", "calm", 1, "Morning. Facts on the table. Let's start."),
  L("greet", "nervous", 1, "Morning. Wolves at this table. Keep it short."),
  L("greet", "aggressive", 1, "Talk. Everyone. I want every voice before noon."),

  // mourn
  L("mourn", "calm", 1, "One gone. The rest of us talk.", ["death_today"]),
  L("mourn", "nervous", 1, "Another empty chair. I didn't see it coming.", ["death_today"]),
  L("mourn", "aggressive", 1, "They're gone. Someone at this table did that. Facts. Now.", ["death_today"]),

  // rebuke
  L("rebuke", "calm", 1, "{target}. Talk to the table. Not to the air."),
  L("rebuke", "nervous", 1, "{target}. What is that. Talk to us."),
  L("rebuke", "aggressive", 1, "{target}. Stop that. Say it to our faces or don't say it."),
];
