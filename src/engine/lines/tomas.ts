// Tomas, the shepherd. Early twenties, eager. Agreeable, echoes the room, wants
// to be on the winning side and hates being alone in an opinion. His
// aggression is a puppy barking; his pleading is real fear.

import type { LineSpec } from "./types";
import { speaker } from "./define";

const L = speaker("tomas");

export const LINES: readonly LineSpec[] = [
  // accuse_evidence
  L("accuse_evidence", "calm", 1, "{target}, your vote looked bad to me. I think others noticed too.", ["fact:vote"]),
  L("accuse_evidence", "calm", 2, "{target}, that's not what you said earlier, is it? People remember.", ["fact:contradiction"]),
  L("accuse_evidence", "calm", 3, "{target}, you just said what everyone else said. I do that too, but from you it looks like a wolf hiding.", ["fact:bandwagon"]),
  L("accuse_evidence", "nervous", 1, "{target}, what you said and did today doesn't add up. Someone else saw that too, right? I suspect you.", ["fact:any"]),
  L("accuse_evidence", "nervous", 2, "{target}, you didn't really answer. I noticed. I think we all noticed.", ["fact:deflect"]),
  L("accuse_evidence", "aggressive", 1, "{target}, you changed your story! Everyone heard it.", ["fact:contradiction"]),
  L("accuse_evidence", "aggressive", 2, "{target}, that vote was wrong and everyone can see it! That's a wolf's vote.", ["fact:vote"]),
  L("accuse_evidence", "aggressive", 3, "{target}, say something! Everyone else has. Staying quiet all day is what a wolf does.", ["fact:quiet"]),
  L("accuse_evidence", "sarcastic", 1, "{target}, great answer. Really cleared that up. Except you dodged the question, which is what a wolf does.", ["fact:deflect"]),
  L("accuse_evidence", "sarcastic", 2, "{target}, sure, you're the seer. And I'm the mayor. A claim like that is a wolf's claim, and I think you're one.", ["fact:claim"]),
  L("accuse_evidence", "pleading", 1, "{target}, please explain it. What you said and did today doesn't add up, and I suspect you. I want to believe you.", ["fact:any"]),
  L("accuse_evidence", "pleading", 2, "{target}, why won't you talk? You've said nothing all day, and quiet like that scares me. It looks like a wolf.", ["fact:quiet"]),

  // accuse_bare
  L("accuse_bare", "calm", 1, "{target}, a few people have been looking at you. I'm starting to see why."),
  L("accuse_bare", "calm", 2, "{target}, I don't know. Something about you today. Others feel it too."),
  L("accuse_bare", "nervous", 1, "{target}, I think you're a wolf. Is it just me? It's probably not just me."),
  L("accuse_bare", "nervous", 2, "{target}, I'm not accusing, exactly. I'm only saying what the rest are thinking."),
  L("accuse_bare", "aggressive", 1, "{target}, you're the wolf! I'd bet the whole flock on it."),
  L("accuse_bare", "aggressive", 2, "{target}, everyone can see it. Wolf!"),
  L("accuse_bare", "sarcastic", 1, "{target}, oh, you're definitely a villager. Sure. Except I think you're a wolf, and I bet I'm not alone."),
  L("accuse_bare", "sarcastic", 2, "{target}, you look so innocent. Suspiciously innocent."),
  L("accuse_bare", "pleading", 1, "{target}, please tell me it isn't you. Please."),
  L("accuse_bare", "pleading", 2, "{target}, I think you're a wolf and I don't want it to be you. Say something that helps."),

  // defend_self
  L("defend_self", "calm", 1, "It's not me. Ask anyone. I've agreed with all of you all day.", ["accused"]),
  L("defend_self", "calm", 2, "I'm a shepherd. I follow. Wolves lead.", ["accused"]),
  L("defend_self", "nervous", 1, "Wait, me? No. No, I've been with the room the whole time!", ["accused"]),
  L("defend_self", "nervous", 2, "I only ever said what you all were saying. How is that a wolf?", ["accused"]),
  L("defend_self", "aggressive", 1, "Not me! Look somewhere else.", ["accused"]),
  L("defend_self", "aggressive", 2, "I'm not a wolf and I'm sick of hearing it!", ["accused"]),
  L("defend_self", "sarcastic", 1, "Me, the one who agrees with everybody. Very dangerous. I'm not a wolf. I couldn't lead a pack if I tried.", ["accused"]),
  L("defend_self", "sarcastic", 2, "Sure. I'm the mastermind. Look at me. I'm not a wolf, and you all know it.", ["accused"]),
  L("defend_self", "pleading", 1, "Please. Please don't vote me. I'm not a wolf. I've never gone against this room, not once.", ["accused"]),
  L("defend_self", "pleading", 2, "I'm scared, all right? I'm not a wolf. I just don't want to be alone in this.", ["accused"]),

  // defend_other
  L("defend_other", "calm", 1, "{target}, I don't think you're a wolf. I'm with you, and I think most of the room is too."),
  L("defend_other", "calm", 2, "{target}, nothing about you has felt wrong to me. I'd say so if it had."),
  L("defend_other", "nervous", 1, "{target}, I don't think you're a wolf. Is that just me? Someone say it isn't just me."),
  L("defend_other", "nervous", 2, "{target}, I don't think you're a wolf. I'll say so out loud, if a couple of others do too."),
  L("defend_other", "aggressive", 1, "{target}, don't listen to them! You've been fine all day."),
  L("defend_other", "aggressive", 2, "{target}, they're wrong about you and I'll say it loud!"),
  L("defend_other", "sarcastic", 1, "{target}, apparently you're a wolf now. News to me. You're not one, and I'd bet the room agrees."),
  L("defend_other", "sarcastic", 2, "{target}, they've decided you're a wolf. Terrible reasons. You're not one, and I'm saying so."),
  L("defend_other", "pleading", 1, "{target}, hang on, don't give up. Some of us believe you."),
  L("defend_other", "pleading", 2, "{target}, please keep talking. You're not a wolf. Make them see it."),

  // question
  L("question", "calm", 1, "{target}, who are you leaning toward? I want to hear it before I decide."),
  L("question", "calm", 2, "{target}, what do you make of the vote so far?", ["past_vote"]),
  L("question", "nervous", 1, "{target}, you're not going to vote for me, are you?"),
  L("question", "nervous", 2, "{target}, who do you think it is? Say it and I'll tell you if I agree."),
  L("question", "aggressive", 1, "{target}, answer me! Who are you voting for?"),
  L("question", "aggressive", 2, "{target}, who do you actually suspect? Say it!"),
  L("question", "aggressive", 3, "{target}, why are you so quiet when everyone else is talking?", ["fact:quiet"]),
  L("question", "sarcastic", 1, "{target}, go on, tell us who it is. I'll nod along like always."),
  L("question", "sarcastic", 2, "{target}, any thoughts? Or are you waiting to see which way we go?"),
  L("question", "pleading", 1, "{target}, please, just tell me who you trust. I need to know I'm not alone."),
  L("question", "pleading", 2, "{target}, who do you think it is? I'm lost."),

  // answer
  L("answer", "calm", 1, "Fair question. I'm going with the room, and the room seems to have picked.", ["asked"]),
  L("answer", "calm", 2, "Honestly? I think what most people here think.", ["asked"]),
  L("answer", "nervous", 1, "Um. I'm not sure yet. Who do you think? I'll probably agree.", ["asked"]),
  L("answer", "nervous", 2, "I'd rather hear a few more people before I say.", ["asked"]),
  L("answer", "aggressive", 1, "You want my answer? Same as everyone's. Look around!", ["asked"]),
  L("answer", "aggressive", 2, "I already said what I think! Same as the rest.", ["asked"]),
  L("answer", "sarcastic", 1, "My answer? Whatever the answer is. I'm flexible.", ["asked"]),
  L("answer", "sarcastic", 2, "Great, put me on the spot. I agree with the last person who spoke.", ["asked"]),
  L("answer", "pleading", 1, "I'm trying to answer. Please don't twist it. I'm just saying what I see.", ["asked"]),
  L("answer", "pleading", 2, "I don't know! That's my answer. I don't know and it's frightening.", ["asked"]),

  // deflect
  L("deflect", "calm", 1, "Let's not get stuck on me. What do the rest of you think?"),
  L("deflect", "calm", 2, "I'll go where the room goes. So where is the room going?"),
  L("deflect", "nervous", 1, "Why me? Nobody else was asked this. Ask them first."),
  L("deflect", "nervous", 2, "Can we, um, go round the table before we settle on anyone?"),
  L("deflect", "aggressive", 1, "Stop pointing at me! There are quieter people right here."),
  L("deflect", "aggressive", 2, "Ask them! Ask the ones who haven't said a word."),
  L("deflect", "sarcastic", 1, "Oh sure, the shepherd is the danger. Not the ones sitting in silence."),
  L("deflect", "sarcastic", 2, "Yes, pick on me. Much easier than picking on someone clever."),
  L("deflect", "pleading", 1, "Please, not me. Look at the others first. Please."),
  L("deflect", "pleading", 2, "Can we talk about someone else? Anyone? I'm not hiding anything."),

  // chatter
  L("chatter", "calm", 1, "It feels like the room is settling on someone. I can feel it."),
  L("chatter", "calm", 2, "Everyone's being careful today. That's good, I think."),
  L("chatter", "nervous", 1, "It's quiet. Too quiet. Is anyone else nervous?"),
  L("chatter", "nervous", 2, "I keep counting who's left. I shouldn't, but I do."),
  L("chatter", "aggressive", 1, "Come on, somebody say something! We're wasting the day."),
  L("chatter", "aggressive", 2, "We need to agree on someone! Sitting here won't save anyone."),
  L("chatter", "sarcastic", 1, "Great table. Very brave. Everyone waiting for someone else to go first."),
  L("chatter", "sarcastic", 2, "Nobody wants to go first. Fine. I'll agree with whoever does."),
  L("chatter", "pleading", 1, "Can we please all agree on something? Anything? It's the not knowing."),
  L("chatter", "pleading", 2, "I just want us to get this right. Together. Please."),

  // claim_seer
  L("claim_seer", "calm", 1, "Okay. I'm the seer. I know how that sounds from me. But I am."),
  L("claim_seer", "nervous", 1, "I'm the seer! I didn't want to say it. Please believe me."),
  L("claim_seer", "aggressive", 1, "I'm the seer! Listen to me for once instead of each other."),

  // counter_claim
  L("counter_claim", "calm", 1, "{target}, that's not true. I'm the seer. I wouldn't lie about that.", ["claim_exists"]),
  L("counter_claim", "nervous", 1, "{target}, no. No, I'm the seer. Why would you say that? Why?", ["claim_exists"]),
  L("counter_claim", "aggressive", 1, "{target}, liar! I'm the seer and I can prove it.", ["claim_exists"]),

  // reveal_wolf
  L("reveal_wolf", "calm", 1, "{target}, I checked you. You're a wolf. Everyone hear that."),
  L("reveal_wolf", "nervous", 1, "{target}, I checked you last night and you came back wolf. I'm sorry, I'm shaking, but you did."),
  L("reveal_wolf", "aggressive", 1, "{target}, I checked you last night. Wolf! Everyone, it's them."),

  // reveal_clear
  L("reveal_clear", "calm", 1, "{target}, you're clear. I checked. We can trust you."),
  L("reveal_clear", "nervous", 1, "{target}, I looked at you last night. You're not a wolf. Thank goodness."),
  L("reveal_clear", "aggressive", 1, "{target}, I checked you last night. You're not a wolf! Leave them alone, all of you."),

  // vote
  L("vote", "calm", 1, "{target}, I'm voting you. That's where the room is."),
  L("vote", "nervous", 1, "{target}, I'm sorry. I'm going with the others."),
  L("vote", "aggressive", 1, "{target}, my vote's on you! Everyone can see it."),
  L("vote", "sarcastic", 1, "{target}, I vote you. Bold of me, I know."),
  L("vote", "pleading", 1, "{target}, I'm voting you. Please don't hate me for it."),

  // greet
  L("greet", "calm", 1, "Morning, everyone. Let's stick together on this."),
  L("greet", "nervous", 1, "Morning. So, um, who's going first? Not me."),
  L("greet", "aggressive", 1, "Right, let's find them! Nobody sits this out."),

  // mourn
  L("mourn", "calm", 1, "We lost someone. Let's not lose anyone else today.", ["death_today"]),
  L("mourn", "nervous", 1, "Another one gone. It could've been any of us. It could still be.", ["death_today"]),
  L("mourn", "aggressive", 1, "They're dead and somebody here is smiling inside! Find them.", ["death_today"]),

  // rebuke
  L("rebuke", "calm", 1, "{target}, talk to us, not to whatever that was."),
  L("rebuke", "nervous", 1, "{target}, um, what? Who are you talking to?"),
  L("rebuke", "aggressive", 1, "{target}, stop messing about! People are dying."),
];
