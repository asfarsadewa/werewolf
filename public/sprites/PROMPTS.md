# Sprite prompts

Generated 2026-09-18 with OpenAI `gpt-image-2.5-sunburst`, quality `high`, via the sprite-pipeline CLI (`image_gen.py`). Portraits and badges were requested at 1024x1024 with `background=transparent`, `output_format=png`; the village at 1536x640 opaque PNG. Prompts were passed verbatim (`--no-augment`).

Mara was generated first and every other portrait and badge was made with the `edit` endpoint, passing Mara's PNG as image 1 for style only. The style sentence of the art direction appears verbatim in every prompt; the badges and the village replace only its bust-portrait framing sentence with their own framing.

## Post-processing

Portraits and badges: raw alpha below 7 zeroed (faint haze) and the model's modal body alpha (254, never a true 255) stretched to 255; square crop around the alpha bounding box padded by 6 percent of the larger side, centred horizontally, anchored above the head; LANCZOS to 512 and 128; WebP quality 92, method 6. Village: pixels within 12 levels of the sampled sky colour set to #f3f4f1 (a further band up to 24 levels shifted proportionally); WebP quality 88 at 1536x640 and 768x320.

| Asset | Files | Call | Size | Quality | Model | Date |
|---|---|---|---|---|---|---|
| mara | `mara.webp` 512, `mara-128.webp` 128 | generate | 1024x1024 transparent | high | gpt-image-2.5-sunburst | 2026-09-18 |
| tomas | `tomas.webp` 512, `tomas-128.webp` 128 | edit, image 1 = mara (style reference) | 1024x1024 transparent | high | gpt-image-2.5-sunburst | 2026-09-18 |
| bel | `bel.webp` 512, `bel-128.webp` 128 | edit, image 1 = mara (style reference) | 1024x1024 transparent | high | gpt-image-2.5-sunburst | 2026-09-18 |
| ines | `ines.webp` 512, `ines-128.webp` 128 | edit, image 1 = mara (style reference) | 1024x1024 transparent | high | gpt-image-2.5-sunburst | 2026-09-18 |
| kip | `kip.webp` 512, `kip-128.webp` 128 | edit, image 1 = mara (style reference) | 1024x1024 transparent | high | gpt-image-2.5-sunburst | 2026-09-18 |
| rook | `rook.webp` 512, `rook-128.webp` 128 | edit, image 1 = mara (style reference) | 1024x1024 transparent | high | gpt-image-2.5-sunburst | 2026-09-18 |
| sol | `sol.webp` 512, `sol-128.webp` 128 | edit, image 1 = mara (style reference) | 1024x1024 transparent | high | gpt-image-2.5-sunburst | 2026-09-18 |
| stranger | `stranger.webp` 512, `stranger-128.webp` 128 | edit, image 1 = mara (style reference) | 1024x1024 transparent | high | gpt-image-2.5-sunburst | 2026-09-18 |
| wolf | `wolf.webp` 512, `wolf-128.webp` 128 | edit, image 1 = mara (style reference) | 1024x1024 transparent | high | gpt-image-2.5-sunburst | 2026-09-18 |
| seer | `seer.webp` 512, `seer-128.webp` 128 | edit, image 1 = mara (style reference) | 1024x1024 transparent | high | gpt-image-2.5-sunburst | 2026-09-18 |
| villager | `villager.webp` 512, `villager-128.webp` 128 | edit, image 1 = mara (style reference) | 1024x1024 transparent | high | gpt-image-2.5-sunburst | 2026-09-18 |
| village | `village.webp` 1536x640, `village-768.webp` 768x320 | generate | 1536x640 | high | gpt-image-2.5-sunburst | 2026-09-18 |

## mara

```text
Character portrait sprite for a storybook village game. Mara, a village baker in her forties: stern expression with a small frown, dark hair pulled into a tight bun, a flour-dusted apron over a plain dress, arms crossed over her chest. Accent colour: ochre yellow apron strap; everything else in muted earthy tones.

Picture-book simplicity: large simple shapes, few details, every area a single flat matte colour with at most one flat darker tone for shadow, no painted texture, no brush grain, no rendered skin shading, no highlights. Softly stylised proportions with a slightly larger head, a small nose, simple eyes and a friendly hand-drawn charm. The line work is a consistent soft ink line of even weight.

Framing: the whole bust floats fully inside the canvas, taking up roughly 70 percent of the height, with clear empty transparent margin on every side, including above the hair and below the shoulders. The lower edge of the bust is a clean, gently curved cut-off just below the crossed arms, never the image border.

Style: hand-inked storybook illustration, soft dark-ink outlines (#1b1d1a), flat matte gouache fills, limited muted earthy palette with one accent colour per character, gentle rounded shapes, warm and cute but not anime and not chibi, no gradients, no gloss, no outline glow, no drop shadow, no text, no watermark, no background. Bust portrait from the shoulders up, three-quarter view facing slightly to the viewer's left, centred, generous padding on all sides, clean antialiased edges on a fully transparent background.
```

## tomas

```text
Image 1 is a style reference only; do not reproduce this character. Generate a new character in exactly the same illustration style, line weight, palette and framing:

Character portrait sprite for a storybook village game. Tomas, a young shepherd in his early twenties: eager wide smile, a straw hat, tousled hair sticking out beneath it, freckled cheeks, a rough wool vest over a plain shirt. Accent colour: leaf green scarf; everything else in muted earthy tones.

Picture-book simplicity: large simple shapes, few details, every area a single flat matte colour with at most one flat darker tone for shadow, no painted texture, no brush grain, no rendered skin shading, no highlights. Softly stylised proportions with a slightly larger head, a small nose, simple eyes and a friendly hand-drawn charm. The line work is a consistent soft ink line of even weight.

Framing: the whole bust floats fully inside the canvas, taking up roughly 70 percent of the height, with clear empty transparent margin on every side, including above the head and below the shoulders. The lower edge of the bust is a clean, gently curved cut-off just below the chest, never the image border.

Style: hand-inked storybook illustration, soft dark-ink outlines (#1b1d1a), flat matte gouache fills, limited muted earthy palette with one accent colour per character, gentle rounded shapes, warm and cute but not anime and not chibi, no gradients, no gloss, no outline glow, no drop shadow, no text, no watermark, no background. Bust portrait from the shoulders up, three-quarter view facing slightly to the viewer's left, centred, generous padding on all sides, clean antialiased edges on a fully transparent background.
```

## bel

```text
Image 1 is a style reference only; do not reproduce this character. Generate a new character in exactly the same illustration style, line weight, palette and framing:

Character portrait sprite for a storybook village game. Bel, a village herbalist in her thirties: narrow rectangular glasses, a long dark braid draped over one shoulder, small bundles of dried herbs pinned to her collar, one eyebrow raised, a dry unimpressed look. Accent colour: violet kerchief tied at the neck; everything else in muted earthy tones.

Picture-book simplicity: large simple shapes, few details, every area a single flat matte colour with at most one flat darker tone for shadow, no painted texture, no brush grain, no rendered skin shading, no highlights. Softly stylised proportions with a slightly larger head, a small nose, simple eyes and a friendly hand-drawn charm. The line work is a consistent soft ink line of even weight.

Framing: the whole bust floats fully inside the canvas, taking up roughly 70 percent of the height, with clear empty transparent margin on every side, including above the head and below the shoulders. The lower edge of the bust is a clean, gently curved cut-off just below the chest, never the image border.

Style: hand-inked storybook illustration, soft dark-ink outlines (#1b1d1a), flat matte gouache fills, limited muted earthy palette with one accent colour per character, gentle rounded shapes, warm and cute but not anime and not chibi, no gradients, no gloss, no outline glow, no drop shadow, no text, no watermark, no background. Bust portrait from the shoulders up, three-quarter view facing slightly to the viewer's left, centred, generous padding on all sides, clean antialiased edges on a fully transparent background.
```

## ines

```text
Image 1 is a style reference only; do not reproduce this character. Generate a new character in exactly the same illustration style, line weight, palette and framing:

Character portrait sprite for a storybook village game. Ines, a village innkeeper in her sixties: round kind face, grey hair pinned up, a knitted shawl around her shoulders, a soft smile with laugh lines around the eyes. Accent colour: dusty rose shawl; everything else in muted earthy tones.

Picture-book simplicity: large simple shapes, few details, every area a single flat matte colour with at most one flat darker tone for shadow, no painted texture, no brush grain, no rendered skin shading, no highlights. Softly stylised proportions with a slightly larger head, a small nose, simple eyes and a friendly hand-drawn charm. The line work is a consistent soft ink line of even weight.

Framing: the whole bust floats fully inside the canvas, taking up roughly 70 percent of the height, with clear empty transparent margin on every side, including above the head and below the shoulders. The lower edge of the bust is a clean, gently curved cut-off just below the chest, never the image border.

Style: hand-inked storybook illustration, soft dark-ink outlines (#1b1d1a), flat matte gouache fills, limited muted earthy palette with one accent colour per character, gentle rounded shapes, warm and cute but not anime and not chibi, no gradients, no gloss, no outline glow, no drop shadow, no text, no watermark, no background. Bust portrait from the shoulders up, three-quarter view facing slightly to the viewer's left, centred, generous padding on all sides, clean antialiased edges on a fully transparent background.
```

## kip

```text
Image 1 is a style reference only; do not reproduce this character. Generate a new character in exactly the same illustration style, line weight, palette and framing:

Character portrait sprite for a storybook village game. Kip, a woodcutter's apprentice aged nineteen: wiry build, freckles, red-brown hair under a bandana, chin up, a defensive scowl, the wooden handle of a small axe resting over one shoulder. Accent colour: rust red bandana; everything else in muted earthy tones.

Picture-book simplicity: large simple shapes, few details, every area a single flat matte colour with at most one flat darker tone for shadow, no painted texture, no brush grain, no rendered skin shading, no highlights. Softly stylised proportions with a slightly larger head, a small nose, simple eyes and a friendly hand-drawn charm. The line work is a consistent soft ink line of even weight.

Framing: the whole bust floats fully inside the canvas, taking up roughly 70 percent of the height, with clear empty transparent margin on every side, including above the head and below the shoulders. The lower edge of the bust is a clean, gently curved cut-off just below the chest, never the image border.

Style: hand-inked storybook illustration, soft dark-ink outlines (#1b1d1a), flat matte gouache fills, limited muted earthy palette with one accent colour per character, gentle rounded shapes, warm and cute but not anime and not chibi, no gradients, no gloss, no outline glow, no drop shadow, no text, no watermark, no background. Bust portrait from the shoulders up, three-quarter view facing slightly to the viewer's left, centred, generous padding on all sides, clean antialiased edges on a fully transparent background.
```

## rook

```text
Image 1 is a style reference only; do not reproduce this character. Generate a new character in exactly the same illustration style, line weight, palette and framing:

Character portrait sprite for a storybook village game. Rook, a village clerk in his fifties: thin face, small round spectacles, receding grey hair, a high stiff collar, a leather-bound ledger held against his chest with both hands, pursed lips. Accent colour: slate blue, as ink stains on his fingers and a slate blue collar ribbon; everything else in muted earthy tones.

Picture-book simplicity: large simple shapes, few details, every area a single flat matte colour with at most one flat darker tone for shadow, no painted texture, no brush grain, no rendered skin shading, no highlights. Softly stylised proportions with a slightly larger head, a small nose, simple eyes and a friendly hand-drawn charm. The line work is a consistent soft ink line of even weight.

Framing: the whole bust floats fully inside the canvas, taking up roughly 70 percent of the height, with clear empty transparent margin on every side, including above the head and below the shoulders. The lower edge of the bust is a clean, gently curved cut-off just below the chest, never the image border.

Style: hand-inked storybook illustration, soft dark-ink outlines (#1b1d1a), flat matte gouache fills, limited muted earthy palette with one accent colour per character, gentle rounded shapes, warm and cute but not anime and not chibi, no gradients, no gloss, no outline glow, no drop shadow, no text, no watermark, no background. Bust portrait from the shoulders up, three-quarter view facing slightly to the viewer's left, centred, generous padding on all sides, clean antialiased edges on a fully transparent background.
```

## sol

```text
Image 1 is a style reference only; do not reproduce this character. Generate a new character in exactly the same illustration style, line weight, palette and framing:

Character portrait sprite for a storybook village game. Sol, the village elder in his seventies: long white beard, deep-set calm eyes, a heavy hooded cloak with the hood down, both hands folded on top of a wooden walking staff, a patient half-smile. Accent colour: old gold clasp fastening the cloak; everything else in muted earthy tones.

Picture-book simplicity: large simple shapes, few details, every area a single flat matte colour with at most one flat darker tone for shadow, no painted texture, no brush grain, no rendered skin shading, no highlights. Softly stylised proportions with a slightly larger head, a small nose, simple eyes and a friendly hand-drawn charm. The line work is a consistent soft ink line of even weight.

Framing: the whole bust floats fully inside the canvas, taking up roughly 70 percent of the height, with clear empty transparent margin on every side, including above the head and below the shoulders. The lower edge of the bust is a clean, gently curved cut-off just below the chest, never the image border.

Style: hand-inked storybook illustration, soft dark-ink outlines (#1b1d1a), flat matte gouache fills, limited muted earthy palette with one accent colour per character, gentle rounded shapes, warm and cute but not anime and not chibi, no gradients, no gloss, no outline glow, no drop shadow, no text, no watermark, no background. Bust portrait from the shoulders up, three-quarter view facing slightly to the viewer's left, centred, generous padding on all sides, clean antialiased edges on a fully transparent background.
```

## stranger

```text
Image 1 is a style reference only; do not reproduce this character. Generate a new character in exactly the same illustration style, line weight, palette and framing:

Character portrait sprite for a storybook village game. The Stranger, a hooded traveller of indeterminate age and gender: hood up, face in soft flat shadow showing only a calm mouth and the faint suggestion of eyes, a worn travelling cloak, a small pack strap crossing the chest. Palette: strictly cool neutral greys only, from near-black ink to pale paper grey; absolutely no brown, no tan, no ochre and no warm tones anywhere, the cloak is a flat mid grey, the strap a darker grey, the shadowed face a soft grey; the single light note is a small round pale moon-white clasp at the throat. No accent colour.

Picture-book simplicity: large simple shapes, few details, every area a single flat matte colour with at most one flat darker tone for shadow, no painted texture, no brush grain, no rendered skin shading, no highlights. Softly stylised proportions with a slightly larger head, a small nose, simple eyes and a friendly hand-drawn charm. The line work is a consistent soft ink line of even weight.

Framing: the whole bust floats fully inside the canvas, taking up roughly 70 percent of the height, with clear empty transparent margin on every side, including above the head and below the shoulders. The lower edge of the bust is a clean, gently curved cut-off just below the chest, never the image border.

Style: hand-inked storybook illustration, soft dark-ink outlines (#1b1d1a), flat matte gouache fills, limited muted earthy palette with one accent colour per character, gentle rounded shapes, warm and cute but not anime and not chibi, no gradients, no gloss, no outline glow, no drop shadow, no text, no watermark, no background. Bust portrait from the shoulders up, three-quarter view facing slightly to the viewer's left, centred, generous padding on all sides, clean antialiased edges on a fully transparent background.
```

## wolf

```text
Image 1 is a style reference only; do not reproduce this character or any person. Generate an emblem in exactly the same illustration style, line weight and palette:

Role badge emblem for a storybook village game: a wolf head in profile, muzzle raised, howling, drawn in dark ink with flat muted grey fills; the only accent is a small rust red tongue.

Style: hand-inked storybook illustration, soft dark-ink outlines (#1b1d1a), flat matte gouache fills, limited muted earthy palette with one accent colour per character, gentle rounded shapes, warm and cute but not anime and not chibi, no gradients, no gloss, no outline glow, no drop shadow, no text, no watermark, no background. Single centred emblem drawn large, filling roughly 70 percent of the canvas, with generous empty transparent margin on all sides, no circle, shield or plate behind it, clean antialiased edges on a fully transparent background. Simple shapes that stay readable at 24 pixels.
```

## seer

```text
Image 1 is a style reference only; do not reproduce this character or any person. Generate an emblem in exactly the same illustration style, line weight and palette:

Role badge emblem for a storybook village game: a single open eye, with a crescent moon in place of the iris, drawn in dark ink with flat muted fills; the only accent is a small pale gold glint on the moon.

Style: hand-inked storybook illustration, soft dark-ink outlines (#1b1d1a), flat matte gouache fills, limited muted earthy palette with one accent colour per character, gentle rounded shapes, warm and cute but not anime and not chibi, no gradients, no gloss, no outline glow, no drop shadow, no text, no watermark, no background. Single centred emblem drawn large, filling roughly 70 percent of the canvas, with generous empty transparent margin on all sides, no circle, shield or plate behind it, clean antialiased edges on a fully transparent background. Simple shapes that stay readable at 24 pixels.
```

## villager

```text
Image 1 is a style reference only; do not reproduce this character or any person. Generate an emblem in exactly the same illustration style, line weight and palette:

Role badge emblem for a storybook village game: a small wheat sprig, one stalk with a head of grain and two leaves, drawn in dark ink with flat muted fills; the only accent is ochre yellow grain.

Style: hand-inked storybook illustration, soft dark-ink outlines (#1b1d1a), flat matte gouache fills, limited muted earthy palette with one accent colour per character, gentle rounded shapes, warm and cute but not anime and not chibi, no gradients, no gloss, no outline glow, no drop shadow, no text, no watermark, no background. Single centred emblem drawn large, filling roughly 70 percent of the canvas, with generous empty transparent margin on all sides, no circle, shield or plate behind it, clean antialiased edges on a fully transparent background. Simple shapes that stay readable at 24 pixels.
```

## village

```text
Wide title illustration for a storybook village game. A small hillside village in the evening: a handful of simple cottages with warm lit windows, a church tower with a pointed roof, a dark silhouetted pine treeline behind the houses and a large pale round moon in the sky. Evening is conveyed only by the warm windows and the dark pines. The sky is one single flat uniform paper colour, exactly #f3f4f1 (RGB 243, 244, 241), with no gradient, no clouds, no stars, no texture and no vignette; the same flat colour fills every part of the sky right to the edges, so the drawing sits on a paper page. The moon is a slightly different pale tone with an ink outline so it reads against the sky. Flat matte colours, muted earthy palette, warm window glow drawn as flat ochre shapes, no text. Style: hand-inked storybook illustration, soft dark-ink outlines (#1b1d1a), flat matte gouache fills, limited muted earthy palette with one accent colour per character, gentle rounded shapes, warm and cute but not anime and not chibi, no gradients, no gloss, no outline glow, no drop shadow, no text, no watermark, no background. Wide landscape composition with the village in the lower two thirds and open flat sky above.
```
