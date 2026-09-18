# Audio prompts and provenance

Generated 2026-09-18. Sound effects from ElevenLabs text-to-sound-effects, music from Google Lyria 3.5 via the Gemini interactions API. Every file was post-processed with ffmpeg 8.1.2 and measured with `ffprobe` and the `ebur128` filter. Nothing here is generated at runtime; these are static assets referenced by `manifest.json`.

## Sound effects

Endpoint `POST https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128`, body `{text, duration_seconds, prompt_influence, loop}`. `model_id` was not set, so the API default applied (`eleven_text_to_sound_v2` at the time of writing). `prompt_influence` 0.6 everywhere except `click` (0.8). `loop` false everywhere except `night`. `duration_seconds` is the requested generation length; the target length in brackets is what the brief asked for after trimming, and the measured length is what shipped.

| name | prompt sent (take that shipped) | duration_seconds | target | shipped |
|---|---|---|---|---|
| send | A quill pen making one quick decisive scratch on paper, then a soft tap as it is set down. Close, dry, quiet room. Foley, no music. | 1.0 | 0.4 s | 0.64 s |
| tick-up | A single low dry wooden knock, like a knuckle on an oak table, slightly ominous. One hit only, no reverb, no music. | 1.0 | 0.35 s | 0.43 s |
| tick-down | A small brass bell struck once softly with a fingertip and immediately muted, short warm ding. One hit, no music. | 1.0 | 0.35 s | 0.55 s |
| turn | A small wooden gavel tapped twice gently on a wooden table: tap, a short pause, tap. Two distinct quiet knocks, dry, no reverb, no music. | 1.5 | 0.6 s | 0.52 s |
| vote | A smooth pebble dropped into an empty clay bowl, one clean clack with a small rattle as it settles. Close, dry, foley. | 1.5 | 0.7 s | 0.90 s |
| toll | A single deep church bell toll heard across a cold valley, one strike, long natural decay into silence. No music, no other sounds. | 4.0 | 2.5 s | 3.00 s |
| reveal-wolf | A short low guttural wolf growl very close to the microphone, then silence. Menacing but brief, one growl only, no music. | 2.5 | 1.5 s | 2.08 s |
| reveal-villager | A single low sad cello note, bowed once, plain and dry, no vibrato, fading naturally. One note only, no accompaniment. | 2.5 | 1.5 s | 2.10 s |
| night | Cold night wind moving through pine trees, steady, with one very distant wolf howl. Quiet outdoor ambience, seamless loop, no music. | 5.0, loop | 5 s | 5.00 s |
| dawn | Village at dawn: distant single rooster crow, light sparrow chirps, then a wooden shutter swinging open. Outdoor foley, no music. | 4.0 | 3 s | 3.58 s |
| death | One crow calls caw caw, then a short gust of wind. Bleak morning field, no music. | 3.0 | 1.8 s | 2.40 s |
| win | Village church bells ringing joyfully, a small country church, a brief peal of several bells, dry outdoor recording. No music, no voices. | 4.0 | 3 s | 3.20 s |
| lose | A pack of wolves howling in chorus, close, under a cold steady wind. Final and bleak, no music. | 4.5 | 3.5 s | 3.80 s |
| click | One single very short soft tap of a fingertip on a thick sheet of paper. A tiny dry tick, no rustle, no music. | 0.5 | 0.15 s | 0.18 s |

### Retakes

Each retake used one more literal prompt; the take that shipped is the one in the table above. Rejected first takes and their prompts:

- tick-down: first take measured -45 LUFS integrated with a -30 dBFS peak, effectively silent. Prompt was "A single soft warm chime, like a small brass bell tapped once, quickly damped by a finger. Quiet, close, one note only." Retake is 25 dB hotter with a -77 dBFS noise floor.
- dawn: first take decoded to +1.6 dBTP (over full scale) and had only two events. Prompt was "Early morning in a small village: a rooster crows once far away, a few sparrows chirp, a wooden window shutter creaks open. Quiet, natural, no music." Retake is 3 dB less hot and shows the three events asked for (chirp, crow, shutter). Both takes exceed 0 dBTP in the raw decode; neither is hard-clipped (astats flat factor 0, peak count 2), and the shipped file is normalised well below that.
- death: first take decoded to +1.1 dBTP with a gust as loud as the caws and 2.9 s long. Prompt was "A single crow caws twice, then a gust of cold wind passes. Outdoor, bleak, dry, no music." Retake has the literal caw, caw, gust structure in 2.3 s.
- send: retake ("One short quick quill scratch on paper, then immediately the pen is set down on a wooden desk with one soft tap. Two sounds only, very brief, dry close foley, no music.", 0.8 s) came back as a uniform six-burst scribble with no distinct tap, so the first take shipped, capped at 0.64 s just after its tap.
- click: first take was a 250 ms sustained rustle rather than a tap. Prompt was "A very soft paper tap, a fingertip touching a thick sheet of paper once. Tiny, quiet, dry, ui feedback, no music." Retake is a 90 ms transient.
- turn: neither take produced two taps (first take prompt "Two soft taps of a small wooden gavel on a table, polite, not loud, evenly spaced. Dry room, foley, no music."; both takes are one tap with decay). The shipped file is foley-edited from the retake's single clean tap: the tap trimmed to 0.26 s, duplicated at +300 ms and -2 dB, mixed. No audio was synthesised for this.

### Post-processing (SFX)

1. Decode to mono float.
2. Pre-gain to the target loudness, then `silenceremove` at -45 dB (peak detection) on the head, and on the tail via `areverse`, keeping 10 ms before and 30 ms after the sound. The pre-gain makes the -45 dB threshold relative to the delivered level rather than to whatever level ElevenLabs happened to return (raw takes ranged from -7 to -37 LUFS).
3. Where the trimmed take ran well past its target, a cap with a short fade out (toll 3.0 s / 0.6 s fade, win 3.2 s / 0.7 s, lose 3.8 s / 0.8 s, death 2.4 s / 0.3 s, reveal-villager 2.1 s / 0.4 s, tick-down 0.55 s / 0.2 s, send 0.64 s / 0.05 s, click 0.18 s / 0.03 s). `night` was not trimmed or capped so its loop stays seamless.
4. Two-pass `loudnorm`, I=-18 LUFS, TP=-1.5 dBTP, LRA=7 for one-shots and I=-20 for the ambience, `linear=true` with measured values. Files shorter than 3.5 s were padded with silence for the measurement (silence is gated out of integrated loudness) and cut back afterwards. For six short transients (send, tick-up, turn, vote, click, and tick-down within 0.1 dB) a linear gain to -18 LUFS would have pushed the true peak above -1.5 dBTP and loudnorm would have switched to its dynamic (compressing) mode; those files instead got a plain gain capped so the true peak sits at -1.5 dBTP, which is the loudest they can honestly be without limiting. toll was likewise set by plain gain (its measured LRA exceeded 7).
5. `libmp3lame -b:a 64k -ac 1 -ar 44100`, Xing/LAME header kept so decoders can apply gapless trimming to the loop.

Measured on the shipped files (integrated loudness on a 3.5 s silence-padded copy for files shorter than that, since integrated loudness is undefined under 400 ms):

| name | seconds | integrated LUFS | max momentary LUFS | true peak dBTP | manifest gainDb |
|---|---|---|---|---|---|
| send | 0.64 | -27.2 | -25.4 | -2.2 | 0 |
| tick-up | 0.43 | -26.1 | -26.1 | -1.9 | 0 |
| tick-down | 0.55 | -18.3 | -14.0 | -3.4 | -11 |
| turn | 0.52 | -25.8 | -23.1 | -1.9 | -2 |
| vote | 0.90 | -29.3 | -25.3 | -3.2 | 0 |
| toll | 3.00 | -18.2 | -12.4 | -1.9 | 0 |
| reveal-wolf | 2.08 | -18.3 | -14.8 | -6.5 | 0 |
| reveal-villager | 2.10 | -18.5 | -16.5 | -9.9 | 0 |
| night | 5.00 | -19.2 | -14.8 | -4.8 | 0 |
| dawn | 3.58 | -18.1 | -15.5 | -4.9 | 0 |
| death | 2.40 | -17.9 | -14.4 | -5.7 | 0 |
| win | 3.20 | -18.2 | -16.9 | -6.6 | 0 |
| lose | 3.80 | -18.5 | -16.6 | -7.4 | 0 |
| click | 0.18 | -26.2 | -25.4 | -2.1 | -4 |

`gainDb` in the manifest is a playback offset, not baked into the file. It balances the UI family by max momentary loudness: the tick-down bell sustains long enough to reach -18 LUFS while the tick-up knock is peak-limited 12 LU lower, so tick-down is pulled down to sit level with tick-up (both about -25 LU), the two-tap gavel is trimmed 2 dB so it does not exceed the send scratch, and the click is the quietest thing in the game by design. Event sounds (toll, reveals, dawn, death, win, lose) are left at 0.

## Music

Endpoint `POST https://generativelanguage.googleapis.com/v1beta/interactions` with `{"model":"lyria-3.5","input":<prompt>}`; the response is an `interaction` object whose second `model_output` step carries `audio/mpeg` (44.1 kHz stereo, 192 kbps) as base64. Six calls, two candidates per track, 31 to 48 s each. Every prompt ended with "Instrumental only, no vocals, no lyrics, no spoken words."

- day: "Slow folk piece for a tense village council at dusk, medieval-adjacent: nylon guitar and hammered dulcimer over a soft frame drum, a low cello drone underneath, sparse, unhurried, slightly uneasy, minor key, the kind of music that sits under conversation without demanding attention. Steady dynamics, no big build, no drums fill, gentle enough to loop. Instrumental only, no vocals, no lyrics, no spoken words."
- night: "Dark ambient nocturne: distant wind textures, a very low bowed double bass drone, occasional lonely wooden flute phrase, sparse detuned music box notes, slow and cold, a forest at night where something is watching. Very sparse, no percussion, no melody that repeats often, seamless mood. Instrumental only, no vocals, no lyrics, no spoken words."
- title: "Main theme for a storybook village game about trust and wolves: a slow lilting waltz in a minor key on fiddle and nylon guitar with hurdy-gurdy drone, plaintive and warm at once, a single memorable melody stated twice, modest dynamics, ends quietly. Instrumental only, no vocals, no lyrics, no spoken words."

### Selection

Criteria, applied by script to the raw candidates: duration between 90 and 200 s; no internal silence longer than 1.5 s (`silencedetect` at -35 dB, measured inside the musical content, which ends at the last non-silent stretch of at least 0.5 s; the decay after that is tail, not a dropout); LRA at least 4 LU; when both pass, the candidate whose first 10 s are quieter (integrated LUFS of 0 to 10 s) wins, as the better bed for speech.

| candidate | duration | content ends | tail | longest internal gap | LRA | integrated | true peak | first 10 s | result |
|---|---|---|---|---|---|---|---|---|---|
| day-1 | 179.9 s | 173.6 s | 6.3 s | 0.10 s | 6.8 | -12.6 | -0.1 | -16.5 | pass |
| day-2 | 148.5 s | 145.9 s | 2.6 s | 0.00 s | 6.9 | -12.1 | +0.1 | -19.6 | pass, chosen |
| night-1 | 150.8 s | 147.6 s | 3.2 s | 0.00 s | 5.1 | -12.7 | -0.2 | -16.3 | pass |
| night-2 | 177.9 s | 169.4 s | 8.6 s | 0.45 s | 16.3 | -12.6 | 0.0 | -24.1 | pass, chosen, cut at 167.98 s |
| title-1 | 122.3 s | 119.5 s | 2.8 s | 0.00 s | 4.2 | -11.7 | -0.1 | -13.9 | pass, chosen |
| title-2 | 94.7 s | 92.0 s | 2.7 s | 0.14 s | 5.3 | -11.5 | -0.1 | -13.6 | pass |

- day: both pass; day-2 opens 3 LU quieter and, at 148 s, needs no cut, where day-1 would have been cut at 170 s through its ending.
- night: both pass; night-2 opens 8 LU quieter (a true fade-in from wind) and is far more dynamic (LRA 16.3 against 5.1). It is longer than 170 s, so it was cut at 167.98 s, 0.15 s into the last silence (167.83 to 168.28 s) that starts before 170 s, then faded.
- title: both pass; the tie-break is thin (-13.9 against -13.6) and falls to title-1, which is also the longer statement of the theme (120 s against 92 s).

### Post-processing (music)

1. Cut at the chosen point where required, then trim trailing silence below -45 dB via `areverse`, keeping 0.25 s of tail.
2. Two-pass `loudnorm`, I=-19 LUFS, TP=-1.5 dBTP, LRA=9, `linear=true` with measured values. day and title normalised linearly. night's measured LRA (16.4) exceeds the LRA=9 target, so loudnorm applied its dynamic mode there, which is the only way to reach that target; it brought LRA to 13.6 without pumping artefacts visible in the loudness trace.
3. `afade` 1.5 s in, 3 s out; `aresample` back to 44.1 kHz.
4. `libmp3lame -b:a 96k -joint_stereo 1 -ar 44100`.

| track | source | seconds | bytes | integrated LUFS | LRA | true peak dBTP | first 10 s LUFS |
|---|---|---|---|---|---|---|---|
| day | day-2 | 147.57 | 1,771,729 | -19.4 | 6.9 | -6.5 | -26.6 |
| night | night-2 | 167.98 | 2,016,548 | -19.7 | 13.6 | -4.2 | -32.1 |
| title | title-1 | 119.96 | 1,440,391 | -19.4 | 4.2 | -7.7 | -21.6 |

The only sub -35 dB stretch in each finished track is the last 1.2 to 2.2 s of its own fade-out; each ends between -49 and -68 dBFS peak.
