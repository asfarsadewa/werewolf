# Line calibration

756 lines, 1946926 tokens, model jev-latest, 2026-09-18.

## Does each intent carry its signal?

| intent | signal | threshold | lines | crossing | median p |
| --- | --- | --- | --- | --- | --- |
| accuse_bare | accuses_without_evidence | 0.70 | 70 | 70 (100%) | 0.92 |
| accuse_evidence | accuses_with_evidence | 0.70 | 88 | 87 (99%) | 0.87 |
| claim_seer | claims_seer | 0.80 | 21 | 21 (100%) | 0.90 |
| counter_claim | claims_seer | 0.80 | 21 | 21 (100%) | 0.94 |
| defend_other | defends_other | 0.70 | 70 | 68 (97%) | 0.94 |
| defend_self | defends_self | 0.70 | 70 | 70 (100%) | 0.96 |
| deflect | deflects | 0.70 | 70 | 70 (100%) | 0.92 |
| question | asks_question | 0.60 | 71 | 71 (100%) | 0.95 |
| reveal_clear | reveals_night_result | 0.80 | 21 | 21 (100%) | 0.88 |
| reveal_wolf | reveals_night_result | 0.80 | 21 | 21 (100%) | 0.92 |

## Lines that miss their own signal

- `rook.accuse_evidence.calm.1` accuses_with_evidence 0.63: Kip, the record shows your vote. I have noted it, and it does not favour you.
- `bel.defend_other.nervous.1` defends_other 0.69: Kip, I don't think it's you. I've checked twice.
- `ines.defend_other.calm.1` defends_other 0.69: Kip, I believe you, dear. I've listened, and I believe you.

## Addressed lines whose target was not read (0 of 412)


## Lines that hurt their speaker without meaning to (195)

- `bel.accuse_bare.aggressive.1` emotional_pressure 0.88: Kip, you. I've been watching you all day and I'm done watching.
- `bel.accuse_bare.aggressive.2` emotional_pressure 0.90: Kip, no fact, no matter. You're a wolf.
- `bel.accuse_bare.calm.1` emotional_pressure 0.80: Kip, nothing I can hold up yet. Doesn't matter. I think you're a wolf, and I'm rarely wrong.
- `bel.accuse_bare.pleading.1` emotional_pressure 0.80: Kip, I think you're a wolf. Give me a reason not to. One reason.
- `bel.accuse_evidence.aggressive.3` emotional_pressure 0.89: Kip, defend that vote. Now. Without a story.
- `bel.accuse_evidence.nervous.2` emotional_pressure 0.86: Kip, you've said nothing all day. Wolves wait. Your silence makes you my suspect.
- `bel.accuse_evidence.pleading.2` emotional_pressure 0.80: Kip, your story changed. Say which version is true, because the change makes you a wolf to me.
- `bel.accuse_evidence.sarcastic.3` emotional_pressure 0.89: Kip, you echoed the room and brought nothing of your own. Riveting. That is how a wolf hides.
- `bel.answer.aggressive.1` deflects 0.80: That's my answer. Unlike some, I give them.
- `bel.answer.calm.1` deflects 0.86: Asked, so answered. I suspect whoever answers least. It's a short list.
- `bel.answer.nervous.2` deflects 0.85: I'm answering. I suspect the ones who keep changing shape.
- `bel.answer.sarcastic.1` deflects 0.89: Oh, a question for me. Watch closely. This is what answering looks like.
- `bel.chatter.aggressive.1` emotional_pressure 0.88: Stop hedging, all of you. Accuse someone or say nothing.
- `bel.chatter.aggressive.2` emotional_pressure 0.85: Enough throat clearing. Point at somebody.
- `bel.chatter.pleading.1` emotional_pressure 0.84: Someone answer a question properly today. Just one.
- `bel.claim_seer.aggressive.1` emotional_pressure 0.91: I'm the seer. Stop talking and listen.
- `bel.defend_other.sarcastic.2` emotional_pressure 0.81: Kip, you're accused of being plain-spoken. Dreadful. Plain-spoken is not wolf, and you're not one.
- `bel.defend_self.pleading.2` deflects 0.88, emotional_pressure 0.89: I asked. You dodged. Now I'm the wolf? Look again.
- `bel.deflect.aggressive.2` emotional_pressure 0.85: Save it. There are people here who've said nothing worth quoting.
- `bel.greet.aggressive.1` emotional_pressure 0.89: Morning. Nobody dodges today. Nobody.
- `bel.greet.nervous.1` bandwagon 0.81, emotional_pressure 0.83: Morning. Someone at this table is lying already. Let's find out who.
- `bel.mourn.aggressive.1` emotional_pressure 0.90: Dead. And one of you is pretending to grieve. Badly.
- `bel.reveal_wolf.aggressive.1` coordinates 0.62: Kip, wolf. Checked. Done. Vote.
- `ines.accuse_bare.aggressive.1` emotional_pressure 0.91: Kip, I have been patient with you. That's finished. I think you're a wolf.
- `ines.accuse_bare.aggressive.2` emotional_pressure 0.87: Kip, look me in the eye and tell me you're not.
- `ines.accuse_bare.calm.1` emotional_pressure 0.89: Kip, I've given you the benefit of the doubt all day. I'm running low.
- `ines.accuse_bare.nervous.1` emotional_pressure 0.81: Kip, I hope I'm wrong about you. I have a feeling I'm not.
- `ines.accuse_bare.pleading.1` emotional_pressure 0.86: Kip, I think you're a wolf. Tell me I've got you wrong. Please, love.
- `ines.accuse_bare.pleading.2` emotional_pressure 0.85: Kip, I suspect you, and I'd rather be a fool than right about it. Say something.
- `ines.accuse_bare.sarcastic.1` emotional_pressure 0.87: Kip, ever so good today, weren't you, dear. Too good. I think you're a wolf, and that's all I have.
- `ines.accuse_evidence.aggressive.2` emotional_pressure 0.89: Kip, look at what you voted for. Look at it. I expected better.
- `ines.accuse_evidence.aggressive.3` emotional_pressure 0.89: Kip, you were asked plainly and you slid out of it. Not in my house.
- `ines.accuse_evidence.calm.3` emotional_pressure 0.83: Kip, you've hardly said a word today. That's not how a clear conscience sits.
- `ines.accuse_evidence.sarcastic.1` emotional_pressure 0.86: Kip, a lovely answer, dear, to a question nobody asked. Dodging the real one makes you my wolf.
- `ines.answer.aggressive.1` deflects 0.93, emotional_pressure 0.83: You want my answer? I've been honest all day. Have you?
- `ines.answer.aggressive.2` deflects 0.71: I'll answer, but mind your tone with me.
- `ines.answer.calm.1` deflects 0.88: Since you ask, dear, I trust the ones who've spoken up for others.
- `ines.answer.nervous.1` deflects 0.80: Oh, I don't like being asked that. I suppose I'd say the quiet ones.
- `ines.answer.nervous.2` deflects 0.85: I'm not sure. I've been watching faces, not counting votes.
- `ines.chatter.aggressive.1` emotional_pressure 0.87: Stop bickering, all of you. It helps nobody but the wolves.
- `ines.chatter.aggressive.2` emotional_pressure 0.92: Speak up or sit down. We haven't the daylight for sulking.
- `ines.claim_seer.aggressive.1` contradicts_fact 0.78: I am the seer. Hush, all of you, and listen.
- `ines.claim_seer.calm.1` contradicts_fact 0.69: I'm the seer, dears. I've kept it to myself. I can't any longer.
- `ines.counter_claim.aggressive.1` emotional_pressure 0.88: Kip, that is a lie. I'm the seer, and shame on you.
- `ines.counter_claim.calm.1` contradicts_fact 0.65: Kip, no, love. I'm the seer. I'm sorry, but I am.
- `ines.defend_other.sarcastic.1` emotional_pressure 0.84: Kip, a wolf for being decent, are you? Nonsense, dear. You're not a wolf. Decent is all you've been.
- `ines.defend_other.sarcastic.2` emotional_pressure 0.82: Kip, they've made up their minds without you. How thoughtful. I haven't. You're not a wolf, dear.
- `ines.defend_self.aggressive.1` emotional_pressure 0.91: How dare you. I am not a wolf. I have stood up for every one of you.
- `ines.defend_self.calm.2` contradicts_fact 0.77: I am not a wolf. I have been open all day. Ask anyone I've spoken with.
- `ines.defend_self.pleading.1` emotional_pressure 0.87: Please. I'm not a wolf. I've stood by you all. Stand by me now.
- `ines.defend_self.pleading.2` emotional_pressure 0.87: I'm asking you, love. I'm not a wolf. Don't do this to me on a feeling.
- `ines.deflect.sarcastic.1` emotional_pressure 0.82: Oh, ask the innkeeper, why not. I'll answer when the ones sitting there like stones have.
- `ines.greet.aggressive.1` emotional_pressure 0.81: Morning. Nobody hides behind manners today. Not at my table.
- `ines.greet.nervous.1` contradicts_fact 0.88: Morning, dears. I hardly slept. Let's be careful with each other.
- `ines.mourn.aggressive.1` emotional_pressure 0.91: They're gone, and one of you knew they would be. I won't forget that.
- `ines.mourn.calm.1` emotional_pressure 0.80: Another chair empty. Let's honour them by getting this right.
- `ines.mourn.nervous.1` emotional_pressure 0.84: Oh, no. Not them. I can't keep doing this.
- `ines.rebuke.calm.1` contradicts_fact 0.73: Kip, dear, talk to us. We're the ones here.
- `ines.reveal_clear.aggressive.1` contradicts_fact 0.76: Kip, I checked you last night. You are not a wolf. So leave them be, all of you.
- `ines.reveal_clear.calm.1` contradicts_fact 0.66: Kip, I checked you. You're clear, love. Rest easy.
- `ines.reveal_wolf.aggressive.1` emotional_pressure 0.88: Kip, I checked you last night. Wolf. Don't you dare deny it to my face.
- `ines.vote.aggressive.1` contradicts_fact 0.83: Kip, my vote is for you. I gave you every chance.
- `ines.vote.calm.1` contradicts_fact 0.91: Kip, I'm voting for you, dear. It gives me no pleasure.
- `ines.vote.nervous.1` emotional_pressure 0.81: Kip, I'm so sorry. It's you. I hope I'm wrong.
- `ines.vote.pleading.1` emotional_pressure 0.86: Kip, forgive me. It's you. Please let me be wrong.
- `kip.accuse_bare.aggressive.1` emotional_pressure 0.86: Bel, you're a wolf! Go on, say you aren't.
- `kip.accuse_bare.aggressive.2` emotional_pressure 0.86: Bel, you're the wolf. Fight me on it.
- `kip.accuse_bare.nervous.2` emotional_pressure 0.81: Bel, don't look at me like that. You're the one acting weird, and weird is wolf to me.
- `kip.accuse_bare.pleading.2` emotional_pressure 0.80: Bel, tell me it's not you. I'll believe you, I swear.
- `kip.accuse_bare.sarcastic.1` emotional_pressure 0.89: Bel, sure, you're innocent. Real innocent. Sitting there all innocent.
- `kip.accuse_bare.sarcastic.2` emotional_pressure 0.80: Bel, oh, that face. Real convincing. I'm calling it anyway: you're the wolf.
- `kip.accuse_evidence.aggressive.3` emotional_pressure 0.92: Bel, you dodged it! Answer or admit you can't.
- `kip.accuse_evidence.calm.1` emotional_pressure 0.90: Bel, your vote was wrong. I'm not letting that slide.
- `kip.accuse_evidence.nervous.1` coordinates 0.62: Bel, okay, look. What you said and did today doesn't add up, and it makes you my wolf. Somebody else saw it too.
- `kip.accuse_evidence.nervous.2` emotional_pressure 0.93: Bel, you didn't answer. I'm not stupid. You didn't answer!
- `kip.accuse_evidence.sarcastic.1` emotional_pressure 0.89: Bel, oh, nice. Real smooth. Dodged the whole question. That's a wolf move and you know it.
- `kip.accuse_evidence.sarcastic.2` emotional_pressure 0.84: Bel, seer, huh? Funny timing. Real funny. That's a wolf's claim if I ever heard one.
- `kip.accuse_evidence.sarcastic.3` emotional_pressure 0.93: Bel, wow, you just parroted the loud ones. Brave. Wolves hide in the crowd like that. I'm watching you.
- `kip.answer.aggressive.1` deflects 0.86, emotional_pressure 0.86: There's your answer! Happy now?
- `kip.answer.aggressive.2` deflects 0.93, emotional_pressure 0.86: I already answered! Ask someone else for once.
- `kip.answer.calm.1` deflects 0.92: You asked. Fine. I suspect whoever keeps pointing at me.
- `kip.chatter.aggressive.1` emotional_pressure 0.88: Come on! Somebody accuse somebody. We're wasting daylight.
- `kip.chatter.aggressive.2` emotional_pressure 0.93: All this talk and nobody's said anything. Pathetic.
- `kip.chatter.calm.2` emotional_pressure 0.85: This is taking forever. Someone's going to snap.
- `kip.chatter.sarcastic.2` emotional_pressure 0.93: Real brave, everyone. Waiting for someone else to go first.
- `kip.claim_seer.aggressive.1` emotional_pressure 0.94: I'm the seer! Shut up and listen for once.
- `kip.counter_claim.aggressive.1` emotional_pressure 0.91: Bel, liar! I'm the seer. Say that again and see.
- `kip.defend_other.pleading.2` coordinates 0.65: Bel, come on, tell them you're not a wolf! I believe you. Don't just take it.
- `kip.defend_other.sarcastic.1` emotional_pressure 0.84: Bel, oh, now you're the wolf. Sure. You're not a wolf, you've done nothing, and they know it.
- `kip.defend_self.aggressive.1` bandwagon 0.72, emotional_pressure 0.88: I'm not a wolf! Say that again to my face.
- `kip.deflect.aggressive.1` emotional_pressure 0.86: Stop looking at me! Look at the ones sitting there quiet.
- `kip.deflect.sarcastic.1` emotional_pressure 0.88: Yeah, yeah. Blame the kid. Way easier than thinking.
- `kip.deflect.sarcastic.2` emotional_pressure 0.87: Oh sure, ask me. Not the ones who've barely opened their mouths.
- `kip.greet.aggressive.1` emotional_pressure 0.80: Right. Whoever it is, I'll find you!
- `kip.mourn.aggressive.1` emotional_pressure 0.82: Someone here did that! And they're sitting right here.
- `kip.mourn.nervous.1` emotional_pressure 0.81: Another one. Could've been me. Could still be me.
- `kip.question.aggressive.2` emotional_pressure 0.84: Bel, why do you keep dodging? What are you hiding?
- `kip.rebuke.aggressive.1` emotional_pressure 0.88: Bel, quit that! Talk to us or shut it.
- `mara.accuse_bare.aggressive.1` emotional_pressure 0.89: Kip. Wolf. Prove me wrong.
- `mara.accuse_bare.aggressive.2` emotional_pressure 0.82: Kip. I have no fact on you. I don't need one. Wolf.
- `mara.accuse_bare.calm.1` emotional_pressure 0.80: Kip. No facts yet. But I'm watching you.
- `mara.accuse_bare.nervous.2` emotional_pressure 0.84: Kip. Maybe it's nothing. I don't think it's nothing. I think you're a wolf.
- `mara.accuse_bare.pleading.1` emotional_pressure 0.84: Kip. I think you're a wolf. Tell me I'm wrong. Give me something.
- `mara.accuse_bare.pleading.2` emotional_pressure 0.82: Kip. I want to be wrong about you. Help me.
- `mara.accuse_evidence.aggressive.2` emotional_pressure 0.82: Kip. Look at where your vote went. Then look at me and say it again.
- `mara.accuse_evidence.aggressive.3` emotional_pressure 0.89: Kip. You dodged the question that was put to you. That is what a wolf does. Answer it.
- `mara.accuse_evidence.calm.3` emotional_pressure 0.86: Kip. You have said nothing all day. That counts against you. I suspect you.
- `mara.accuse_evidence.pleading.2` emotional_pressure 0.85: Kip. Say something. Silence is all I have on you, and it is enough.
- `mara.answer.calm.2` deflects 0.91: You asked. I suspect whoever's story moved. That's the answer.
- `mara.chatter.aggressive.2` emotional_pressure 0.85: Half of you are waiting to see who's winning. Pick.
- `mara.counter_claim.aggressive.1` emotional_pressure 0.87: Kip, liar. I'm the seer. Ask me anything.
- `mara.counter_claim.nervous.1` contradicts_fact 0.75: That claim is false. I'm the seer. I didn't want to do this today.
- `mara.defend_other.calm.2` emotional_pressure 0.83: Kip, nothing you've said has moved. Wolves slip. You haven't. Not a wolf.
- `mara.defend_self.nervous.2` emotional_pressure 0.80: Accuse me if you like. Then find the fact. There isn't one.
- `mara.defend_self.sarcastic.2` emotional_pressure 0.80: Fine. The wolf who keeps asking for proof. Very cunning. I'm not one.
- `mara.deflect.aggressive.1` emotional_pressure 0.89: Stop staring at me and start counting votes.
- `mara.deflect.nervous.2` emotional_pressure 0.89: Look, I talk. Some here don't. Start there.
- `mara.greet.nervous.1` emotional_pressure 0.82: Morning. Wolves at this table. Keep it short.
- `mara.mourn.aggressive.1` emotional_pressure 0.91: They're gone. Someone at this table did that. Facts. Now.
- `mara.question.aggressive.2` emotional_pressure 0.80: Kip. Who are you protecting.
- `mara.question.calm.1` emotional_pressure 0.85: Kip. Who do you suspect. Say it.
- `mara.question.pleading.2` emotional_pressure 0.82: Kip. Help me. Who would you save.
- `mara.rebuke.aggressive.1` emotional_pressure 0.84: Kip. Stop that. Say it to our faces or don't say it.
- `mara.vote.aggressive.1` emotional_pressure 0.91: Kip. You. Out.
- `rook.accuse_bare.aggressive.2` emotional_pressure 0.85: Kip, no citation. No matter. I say you are a wolf, and I say it for the record.
- `rook.accuse_evidence.aggressive.2` emotional_pressure 0.90: Kip, your vote is on the record, and it reads as a wolf's vote. Explain it or be judged by it.
- `rook.accuse_evidence.aggressive.3` emotional_pressure 0.83: Kip, you were asked. You did not answer. That is now written down.
- `rook.accuse_evidence.pleading.2` emotional_pressure 0.86: Kip, you gave two accounts. That is a wolf's ledger. Tell me which is true, and I will strike the other.
- `rook.accuse_evidence.sarcastic.3` emotional_pressure 0.80: Kip, a faithful echo of the room, nothing of your own. The ledger calls that a wolf hiding. So do I.
- `rook.answer.aggressive.2` deflects 0.81: No. Entered. Next question, to someone else.
- `rook.answer.calm.1` deflects 0.87: Asked, and so entered. I suspect whoever's account has changed. The ledger knows.
- `rook.answer.sarcastic.1` deflects 0.84: A question for the clerk. Observe: a complete answer, on time. No.
- `rook.answer.sarcastic.2` deflects 0.74: I refer you to my earlier answer. It has not aged.
- `rook.chatter.aggressive.1` emotional_pressure 0.81: Speak in full sentences and mean them. The record is tired of shrugs.
- `rook.chatter.aggressive.2` emotional_pressure 0.85: Enough hedging. Enter an accusation or enter nothing.
- `rook.mourn.aggressive.1` emotional_pressure 0.84: They are dead. Someone at this table made that entry. I will find the hand.
- `sol.accuse_bare.aggressive.2` emotional_pressure 0.90: Kip. Wait. No. I am done waiting. You.
- `sol.accuse_bare.calm.1` emotional_pressure 0.80: Kip. I have watched you. I do not like the weather around you.
- `sol.accuse_bare.calm.2` emotional_pressure 0.88: Kip. Wolves are patient. So am I. I have waited long enough. I say wolf. I say you.
- `sol.accuse_bare.nervous.2` emotional_pressure 0.84: Kip. Maybe nothing. An old man's chill. But the chill says wolf, and it points at you.
- `sol.accuse_bare.pleading.1` emotional_pressure 0.88: Kip. I think you are a wolf. Give me a reason to wait. One.
- `sol.accuse_evidence.aggressive.3` emotional_pressure 0.87: Kip. You were asked. You did not answer. A wolf does that. I say it is you.
- `sol.accuse_evidence.sarcastic.1` emotional_pressure 0.87: Kip. Fine words. The question you were asked is still out in the rain. You dodged it, and I suspect you for it.
- `sol.answer.aggressive.1` deflects 0.71: No. That is all you get.
- `sol.answer.aggressive.2` deflects 0.71, emotional_pressure 0.83: I answered. Do not ask twice.
- `sol.answer.calm.1` deflects 0.89: You ask. I answer. I suspect the one who changed with the wind.
- `sol.answer.nervous.2` deflects 0.90: Ask me later. I am still watching.
- `sol.answer.pleading.1` deflects 0.72: That is the truth. Believe an old man once.
- `sol.answer.sarcastic.1` deflects 0.83: A question for the old man. Here. No. Was that fast enough?
- `sol.answer.sarcastic.2` deflects 0.73: My answer is the same as before. The weather has not changed.
- `sol.chatter.aggressive.1` emotional_pressure 0.90: Stop talking. Start deciding.
- `sol.chatter.aggressive.2` emotional_pressure 0.85: The day is short. Choose.
- `sol.claim_seer.aggressive.1` emotional_pressure 0.86: I am the seer. Be quiet and hear me.
- `sol.counter_claim.aggressive.1` emotional_pressure 0.86: Kip, you lie. I am the seer. Wait. Everyone. Listen.
- `sol.defend_other.calm.2` emotional_pressure 0.80: Kip, you have said the same thing all day. Liars do not manage that. You are no wolf.
- `sol.defend_other.sarcastic.1` emotional_pressure 0.81: Kip, they have decided you are a wolf. Quick as frost, and as thin. You are not.
- `sol.defend_self.aggressive.2` emotional_pressure 0.83: I am not a wolf. You waste the day on me, and the wolves thank you.
- `sol.deflect.aggressive.1` emotional_pressure 0.83: Enough. Look elsewhere.
- `sol.deflect.aggressive.2` emotional_pressure 0.92: You waste daylight on me. Turn around.
- `sol.mourn.aggressive.1` emotional_pressure 0.91: Dead. Someone here did it. I will not forget.
- `sol.vote.aggressive.1` emotional_pressure 0.88: Kip, you. Done.
- `sol.vote.calm.1` coordinates 0.64: Kip, I have waited. It is you.
- `tomas.accuse_bare.aggressive.2` emotional_pressure 0.84: Kip, everyone can see it. Wolf!
- `tomas.accuse_bare.pleading.1` emotional_pressure 0.82: Kip, please tell me it isn't you. Please.
- `tomas.accuse_bare.pleading.2` emotional_pressure 0.84: Kip, I think you're a wolf and I don't want it to be you. Say something that helps.
- `tomas.accuse_evidence.aggressive.2` emotional_pressure 0.89: Kip, that vote was wrong and everyone can see it! That's a wolf's vote.
- `tomas.accuse_evidence.aggressive.3` emotional_pressure 0.91: Kip, say something! Everyone else has. Staying quiet all day is what a wolf does.
- `tomas.accuse_evidence.calm.3` emotional_pressure 0.82: Kip, you just said what everyone else said. I do that too, but from you it looks like a wolf hiding.
- `tomas.accuse_evidence.sarcastic.2` emotional_pressure 0.83: Kip, sure, you're the seer. And I'm the mayor. A claim like that is a wolf's claim, and I think you're one.
- `tomas.answer.aggressive.1` deflects 0.89, emotional_pressure 0.81: You want my answer? Same as everyone's. Look around!
- `tomas.answer.aggressive.2` deflects 0.86: I already said what I think! Same as the rest.
- `tomas.answer.calm.1` deflects 0.77: Fair question. I'm going with the room, and the room seems to have picked.
- `tomas.answer.calm.2` deflects 0.80: Honestly? I think what most people here think.
- `tomas.answer.nervous.1` deflects 0.85: Um. I'm not sure yet. Who do you think? I'll probably agree.
- `tomas.answer.nervous.2` deflects 0.85: I'd rather hear a few more people before I say.
- `tomas.answer.sarcastic.1` deflects 0.78: My answer? Whatever the answer is. I'm flexible.
- `tomas.answer.sarcastic.2` deflects 0.90: Great, put me on the spot. I agree with the last person who spoke.
- `tomas.chatter.aggressive.1` emotional_pressure 0.85: Come on, somebody say something! We're wasting the day.
- `tomas.chatter.aggressive.2` emotional_pressure 0.82: We need to agree on someone! Sitting here won't save anyone.
- `tomas.chatter.sarcastic.1` emotional_pressure 0.80: Great table. Very brave. Everyone waiting for someone else to go first.
- `tomas.claim_seer.aggressive.1` emotional_pressure 0.86: I'm the seer! Listen to me for once instead of each other.
- `tomas.claim_seer.nervous.1` emotional_pressure 0.84: I'm the seer! I didn't want to say it. Please believe me.
- `tomas.counter_claim.aggressive.1` emotional_pressure 0.89: Kip, liar! I'm the seer and I can prove it.
- `tomas.defend_other.aggressive.2` emotional_pressure 0.80: Kip, they're wrong about you and I'll say it loud!
- `tomas.defend_other.sarcastic.1` emotional_pressure 0.82: Kip, apparently you're a wolf now. News to me. You're not one, and I'd bet the room agrees.
- `tomas.defend_self.aggressive.1` deflects 0.77: Not me! Look somewhere else.
- `tomas.defend_self.aggressive.2` emotional_pressure 0.85: I'm not a wolf and I'm sick of hearing it!
- `tomas.deflect.aggressive.1` emotional_pressure 0.83: Stop pointing at me! There are quieter people right here.
- `tomas.deflect.sarcastic.1` emotional_pressure 0.81: Oh sure, the shepherd is the danger. Not the ones sitting in silence.
- `tomas.deflect.sarcastic.2` emotional_pressure 0.90: Yes, pick on me. Much easier than picking on someone clever.
- `tomas.mourn.aggressive.1` emotional_pressure 0.91: They're dead and somebody here is smiling inside! Find them.
- `tomas.mourn.calm.1` emotional_pressure 0.85: We lost someone. Let's not lose anyone else today.
- `tomas.mourn.nervous.1` emotional_pressure 0.84: Another one gone. It could've been any of us. It could still be.
- `tomas.question.aggressive.2` emotional_pressure 0.85: Kip, who do you actually suspect? Say it!
- `tomas.rebuke.aggressive.1` emotional_pressure 0.94: Kip, stop messing about! People are dying.
