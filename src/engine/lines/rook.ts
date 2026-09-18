// Rook, the clerk. Fifties, keeps a ledger. Pedantic and formal; cites the
// record in complete sentences. Sarcasm is bone-dry procedure. His pleading
// is a plea to the record, never to feelings.

import type { LineSpec } from "./types";
import { speaker } from "./define";

const L = speaker("rook");

export const LINES: readonly LineSpec[] = [
  // accuse_evidence
  L("accuse_evidence", "calm", 1, "{target}, the record shows your vote. I have noted it, and it does not favour you.", ["fact:vote"]),
  L("accuse_evidence", "calm", 2, "{target}, as noted, your account this morning differs from your account now.", ["fact:contradiction"]),
  L("accuse_evidence", "calm", 3, "{target}, for the ledger, you have said nothing today. I record silence as a wolf's choice. I suspect you.", ["fact:quiet"]),
  L("accuse_evidence", "nervous", 1, "{target}, I have checked your entries twice. What you said today does not hold. I suspect you.", ["fact:any"]),
  L("accuse_evidence", "nervous", 2, "{target}, a question was put to you. The record shows no answer. That is a wolf's entry, and I suspect you.", ["fact:deflect"]),
  L("accuse_evidence", "aggressive", 1, "{target}, the ledger does not lie. You did. Which entry do you retract?", ["fact:contradiction"]),
  L("accuse_evidence", "aggressive", 2, "{target}, your vote is on the record, and it reads as a wolf's vote. Explain it or be judged by it.", ["fact:vote"]),
  L("accuse_evidence", "aggressive", 3, "{target}, you were asked. You did not answer. That is now written down.", ["fact:deflect"]),
  L("accuse_evidence", "sarcastic", 1, "{target}, I shall record your reply as an answer. Loosely. Strictly, it was a dodge, and dodges mark a wolf.", ["fact:deflect"]),
  L("accuse_evidence", "sarcastic", 2, "{target}, a seer, you say, and just when you needed one. I record that claim as evidence against you.", ["fact:claim"]),
  L("accuse_evidence", "sarcastic", 3, "{target}, a faithful echo of the room, nothing of your own. The ledger calls that a wolf hiding. So do I.", ["fact:bandwagon"]),
  L("accuse_evidence", "pleading", 1, "{target}, your own words today stand against you, and I suspect you. Correct the record if you can. Gladly.", ["fact:any"]),
  L("accuse_evidence", "pleading", 2, "{target}, you gave two accounts. That is a wolf's ledger. Tell me which is true, and I will strike the other.", ["fact:contradiction"]),

  // accuse_bare
  L("accuse_bare", "calm", 1, "{target}, I have no entry against you. I have an impression. I am recording it."),
  L("accuse_bare", "calm", 2, "{target}, the ledger cannot explain it, and neither can I. I suspect you all the same."),
  L("accuse_bare", "nervous", 1, "{target}, this is irregular. I have no fact against you, only unease. I suspect you nonetheless, and I note it."),
  L("accuse_bare", "nervous", 2, "{target}, I cannot cite a line against you, yet I suspect you. That is precisely what concerns me."),
  L("accuse_bare", "aggressive", 1, "{target}, I do not need the record for this one. It is you."),
  L("accuse_bare", "aggressive", 2, "{target}, no citation. No matter. I say you are a wolf, and I say it for the record."),
  L("accuse_bare", "sarcastic", 1, "{target}, an impeccable record. Not a mark on it. How very careful. Wolves are careful. I suspect you."),
  L("accuse_bare", "sarcastic", 2, "{target}, you have been exemplary. I find exemplary suspicious, professionally."),
  L("accuse_bare", "pleading", 1, "{target}, I suspect you. Give the record something in your favour. It has nothing."),
  L("accuse_bare", "pleading", 2, "{target}, I have you down as a wolf. I would like to write one line that clears you. Provide it."),

  // defend_self
  L("defend_self", "calm", 1, "I am not a wolf. The record shows every word I have said today. Consult it. It is consistent.", ["accused"]),
  L("defend_self", "calm", 2, "I have kept the ledger honestly. I ask to be judged by it.", ["accused"]),
  L("defend_self", "nervous", 1, "I am accused. Very well. I am not a wolf, and I refer the table to my entries, all of them.", ["accused"]),
  L("defend_self", "nervous", 2, "This is not in order. I am not a wolf. I have contradicted nothing. Check.", ["accused"]),
  L("defend_self", "aggressive", 1, "I am not a wolf. Cite one line I have said that does not hold. You cannot.", ["accused"]),
  L("defend_self", "aggressive", 2, "I am not a wolf. An accusation without a citation is not a case. It is noise.", ["accused"]),
  L("defend_self", "sarcastic", 1, "I am not a wolf. Were I one, the ledger is the first thing I would have stopped keeping. I have not.", ["accused"]),
  L("defend_self", "sarcastic", 2, "A charge without a reference. I shall enter it under miscellaneous, beside the fact that I am not a wolf.", ["accused"]),
  L("defend_self", "pleading", 1, "I am not a wolf. Let the record speak for me. It is all I have, and it is enough.", ["accused"]),
  L("defend_self", "pleading", 2, "I am not a wolf. I ask only that you read what I said before you vote on what you feel.", ["accused"]),

  // defend_other
  L("defend_other", "calm", 1, "{target}, the record shows you consistent all day. I state it for the table."),
  L("defend_other", "calm", 2, "{target}, as noted, your account has not moved all day. I do not believe you are a wolf."),
  L("defend_other", "nervous", 1, "{target}, I have nothing against you in the ledger. I do not think you are a wolf. I would say if I did."),
  L("defend_other", "nervous", 2, "{target}, I have reviewed your entries twice. They hold."),
  L("defend_other", "aggressive", 1, "{target}, stand firm. You are not a wolf. Nobody accusing you has cited a single line."),
  L("defend_other", "aggressive", 2, "{target}, the case against you has no reference. I reject it. For the record, you are not a wolf."),
  L("defend_other", "sarcastic", 1, "{target}, you are charged with consistency. The ledger notes the irony and enters you as not a wolf."),
  L("defend_other", "sarcastic", 2, "{target}, accused on no evidence. I shall file it under feelings. You are not a wolf, for the record."),
  L("defend_other", "pleading", 1, "{target}, the record says you are not a wolf. Let it defend you. Say again what you said this morning."),
  L("defend_other", "pleading", 2, "{target}, keep to your account. It is clean. I ask the table to read it."),

  // question
  L("question", "calm", 1, "{target}, for the ledger, who do you suspect, and on what entry?"),
  L("question", "calm", 2, "{target}, state your reasoning for your vote. Completely.", ["past_vote"]),
  L("question", "nervous", 1, "{target}, I must ask directly. Have you changed your account today?"),
  L("question", "nervous", 2, "{target}, whom do you trust? I need it on the record."),
  L("question", "aggressive", 1, "{target}, answer for the record. Are you a wolf?"),
  L("question", "aggressive", 2, "{target}, a plain question. Whom are you voting for, and why?"),
  L("question", "sarcastic", 1, "{target}, when convenient, who do you suspect? The ledger has waited all day."),
  L("question", "sarcastic", 2, "{target}, a brief entry, if you would. What have you actually contributed?"),
  L("question", "pleading", 1, "{target}, give the record one clear answer. Whom do you trust?"),
  L("question", "pleading", 2, "{target}, I ask once, plainly. Why did you vote as you did?", ["past_vote"]),

  // answer
  L("answer", "calm", 1, "Asked, and so entered. I suspect whoever's account has changed. The ledger knows.", ["asked"]),
  L("answer", "calm", 2, "For the record, my answer is no, and my entries support it.", ["asked"]),
  L("answer", "nervous", 1, "I will answer. I do not yet have a conclusion. That is the honest entry.", ["asked"]),
  L("answer", "nervous", 2, "My answer is incomplete. I would rather say so than invent one.", ["asked"]),
  L("answer", "aggressive", 1, "There is your answer. It is on the record. Do not ask me to repeat it.", ["asked"]),
  L("answer", "aggressive", 2, "No. Entered. Next question, to someone else.", ["asked"]),
  L("answer", "sarcastic", 1, "A question for the clerk. Observe: a complete answer, on time. No.", ["asked"]),
  L("answer", "sarcastic", 2, "I refer you to my earlier answer. It has not aged.", ["asked"]),
  L("answer", "pleading", 1, "That is my answer. I ask that it be recorded as given, not as feared.", ["asked"]),
  L("answer", "pleading", 2, "I have answered plainly. Please read it plainly.", ["asked"]),

  // deflect
  L("deflect", "calm", 1, "I would rather review the entries of those who have made none."),
  L("deflect", "calm", 2, "The question is better put to the quieter side of the table."),
  L("deflect", "nervous", 1, "This is irregular. Several here have said nothing and nobody asks them."),
  L("deflect", "nervous", 2, "May we proceed in order? Others have not yet been examined."),
  L("deflect", "aggressive", 1, "Wrong page. Look at the ones with blank entries."),
  L("deflect", "aggressive", 2, "Direct that elsewhere. There are people here with nothing on the record at all."),
  L("deflect", "sarcastic", 1, "Question the clerk. Certainly. The silent ones can be examined never."),
  L("deflect", "sarcastic", 2, "A fine use of the day. Interrogating the one who keeps notes."),
  L("deflect", "pleading", 1, "Not me. Please. Examine the blank pages first."),
  L("deflect", "pleading", 2, "I ask the table to look elsewhere for now. The gaps are not mine."),

  // chatter
  L("chatter", "calm", 1, "For the ledger, the table has been cautious today. I record no clear line."),
  L("chatter", "calm", 2, "The record grows. Clarity does not."),
  L("chatter", "nervous", 1, "There is a gap in the record I cannot account for. It worries me."),
  L("chatter", "nervous", 2, "Something said this morning does not reconcile. I am still checking."),
  L("chatter", "aggressive", 1, "Speak in full sentences and mean them. The record is tired of shrugs."),
  L("chatter", "aggressive", 2, "Enough hedging. Enter an accusation or enter nothing."),
  L("chatter", "sarcastic", 1, "A productive morning. Many words, no entries."),
  L("chatter", "sarcastic", 2, "The minutes will read: everyone agreed, nothing was decided."),
  L("chatter", "pleading", 1, "Someone give the record a fact. Anything I can write down."),
  L("chatter", "pleading", 2, "I need one clear statement from this table. One."),

  // claim_seer
  L("claim_seer", "calm", 1, "For the record, I am the seer. I have entries to share."),
  L("claim_seer", "nervous", 1, "I am the seer. I had hoped to keep that entry private a while longer."),
  L("claim_seer", "aggressive", 1, "I am the seer. Quiet. The record will now be corrected."),

  // counter_claim
  L("counter_claim", "calm", 1, "{target}, that claim is false. I am the seer, and I say so for the record.", ["claim_exists"]),
  L("counter_claim", "nervous", 1, "{target}, no. I am the seer. I did not want to make this entry today.", ["claim_exists"]),
  L("counter_claim", "aggressive", 1, "{target}, you are lying, and the ledger will show it. I am the seer.", ["claim_exists"]),

  // reveal_wolf
  L("reveal_wolf", "calm", 1, "{target}, I examined you. The result was wolf. It is entered."),
  L("reveal_wolf", "nervous", 1, "{target}, you came back wolf. I have checked the entry. I am certain."),
  L("reveal_wolf", "aggressive", 1, "{target}, wolf. Examined, recorded, finished."),

  // reveal_clear
  L("reveal_clear", "calm", 1, "{target}, I examined you. Clear. I enter it gladly."),
  L("reveal_clear", "nervous", 1, "{target}, I examined you last night. You are not a wolf. The record now has one certainty."),
  L("reveal_clear", "aggressive", 1, "{target}, I examined you last night. Not a wolf. The table will stop wasting questions on them."),

  // vote
  L("vote", "calm", 1, "{target}, my vote is for you. The record left me no other entry."),
  L("vote", "nervous", 1, "{target}, I vote for you. I have checked. I hope the record is wrong."),
  L("vote", "aggressive", 1, "{target}, you. Entered."),
  L("vote", "sarcastic", 1, "{target}, my vote, duly recorded. Do object; I will note that too."),

  // greet
  L("greet", "calm", 1, "Good morning. For the ledger, we begin. Speak clearly."),
  L("greet", "nervous", 1, "Good morning. I have opened a fresh page. I do not like how blank it is."),
  L("greet", "aggressive", 1, "Morning. Everything said today goes in the ledger. Choose your words."),

  // mourn
  L("mourn", "calm", 1, "One entry closed. I record it, and we continue.", ["death_today"]),
  L("mourn", "nervous", 1, "Another line struck through. I did not expect that one.", ["death_today"]),
  L("mourn", "aggressive", 1, "They are dead. Someone at this table made that entry. I will find the hand.", ["death_today"]),

  // rebuke
  L("rebuke", "calm", 1, "{target}, that was not addressed to the table. The ledger cannot record it."),
  L("rebuke", "nervous", 1, "{target}, I do not follow. To whom are you speaking?"),
  L("rebuke", "aggressive", 1, "{target}, that is out of order. Address the table."),
  L("rebuke", "sarcastic", 1, "{target}, noted, under irrelevant. Now address a person."),
];
