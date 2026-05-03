---
version: alpha
name: Sticker Dream
description: A voice-powered kids coloring page creator. Bubbly, inflated, sticker-book aesthetic for ages 5–12.
colors:
  primary: "#FF69B4"
  primary-deep: "#FF1493"
  primary-dark: "#C13B7E"
  secondary: "#FFE066"
  secondary-deep: "#FFCC00"
  on-primary: "#FFFFFF"
  on-secondary: "#C13B7E"
  surface: "#FFF0F7"
  neutral: "#FFFFFF"
typography:
  display:
    fontFamily: "Fredoka One, Nunito, system-ui, sans-serif"
    fontSize: 96px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: 0.02em
  headline:
    fontFamily: "Fredoka One, Nunito, system-ui, sans-serif"
    fontSize: 48px
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: 0.02em
  body:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.4
  label:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 800
    lineHeight: 1
    letterSpacing: 0.04em
rounded:
  sm: 16px
  md: 24px
  lg: 40px
  full: 9999px
spacing:
  xs: 8px
  sm: 16px
  md: 24px
  lg: 48px
  xl: 80px
components:
  speak-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    padding: 32px
  speak-button-active:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    padding: 32px
  cancel-button:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.full}"
    padding: 24px
  word-display:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary-dark}"
    rounded: "{rounded.lg}"
    padding: 24px
---

## Overview

"Cotton Candy Arcade" — an endlessly playful, bubbly world designed to delight children ages 5–12. Every element should feel like a touchable, inflated sticker-book object. Think bubble letters, chunky outlines, glowing pastels, and cartoon depth — like the bold, rounded 3D bubble typography from kids game UIs and sticker packs.

The UI is intentionally minimal (a single button, a blank canvas) but maximally expressive through size, color, and motion. The interaction should feel magical: speaking brings things to life.

## Colors

The palette is cotton-candy pastels with high-saturation punches for interaction. White is used generously for contrast and the "sticker" effect (white outlines around elements).

- **Primary (#FF69B4) — Bubble Pink:** The dominant interactive color. Used for the SPEAK button, active states, and primary decorative accents. Evokes playfulness and warmth.
- **Primary Deep (#FF1493) — Hot Pink:** Pressed/active state and high-emphasis moments. More intense than Bubble Pink; used sparingly.
- **Primary Dark (#C13B7E) — Candy Rose:** Text on light pink backgrounds and icon fills. Provides contrast while staying in the pink family.
- **Secondary (#FFE066) — Sunshine Yellow:** Animated wallpaper stars, countdown ring, and supportive accent elements. Never competes with Primary.
- **Secondary Deep (#FFCC00) — Golden Yellow:** The chunky drop shadow behind the SPEAK button that creates sticker-book 3D depth. Also hover state for yellow elements.
- **On-Primary (#FFFFFF) — Pure White:** All text on pink. Also the "sticker outline" border on bubble elements.
- **On-Secondary (#C13B7E) — Candy Rose:** Text on yellow backgrounds for readability.
- **Surface (#FFF0F7) — Marshmallow Pink:** The page background. A soft blush that makes every colored element pop without harsh contrast.
- **Neutral (#FFFFFF) — White:** Word display canvas, card backgrounds, clean zones.

## Typography

Typography must be **round, fat, and enormous**. Every headline should feel like bubble letters — inflated and ready to bounce off the screen. Fredoka One is the primary display font for its perfectly circular letterforms; Nunito is the body companion for its rounded terminals.

- **Display (96px):** The animated word lyrics — each word floats fullscreen at maximum scale. Fredoka One with a soft offset `text-shadow` for depth.
- **Headline (48px):** The SPEAK button label and any status text. Bold presence without overwhelming.
- **Body (20px, weight 700):** Supporting copy like status messages. Heavy weight stays legible on colorful backgrounds.
- **Label (16px, weight 800):** Countdown timer digits and small UI indicators. Uppercase with generous tracking.

Always apply a hard-offset text shadow to display-level text — e.g. `text-shadow: 3px 4px 0 #C13B7E` — for sticker depth. Minimum font weight is 700 for any visible text in the UI.

## Layout

The interface is a **centered single-column canvas** — the blankness is intentional, forming the surface the child "draws on" with their voice. No sidebars, no menus, no persistent chrome.

- **Viewport:** Full `100dvh × 100dvw`, `overflow: hidden`. Nothing scrolls.
- **Centering:** Everything is centered horizontally and vertically using `display: grid; place-items: center`.
- **SPEAK button:** Minimum 180px × 180px circle — oversized to be unmissable and easy for small fingers on touch devices.
- **Word display area:** Full-viewport overlay, words appear at dead center with no positional drift.
- **Spacing scale:** 8px base; generous use of `lg` (48px) and `xl` (80px) between major UI zones.

## Elevation & Depth

Depth is achieved through **cartoon sticker shadows** — solid-color offset shadows, not realistic blur-based elevation. Every interactive element has a hard offset that simulates a sticker peeling off a surface.

- **SPEAK button:** `box-shadow: 0 8px 0 #FFCC00, 0 12px 0 #C13B7E` — layered yellow + rose "sticker stack". On press, reduces to `0 2px 0` to simulate being pushed.
- **Display text:** `text-shadow: 4px 6px 0 rgba(193,59,126,0.25)` for a gentle float.
- **Generated image frame:** `box-shadow: 0 12px 0 #C13B7E, 0 16px 0 rgba(0,0,0,0.1)` — a lifted poster effect.
- **No blur-heavy shadows anywhere.** All depth is flat, offset, solid-color to maintain the graphic sticker-book aesthetic.

## Shapes

**Everything is a bubble.** Shape language is maximally rounded — buttons are pills or circles, cards use minimum `24px` border-radius.

- **SPEAK button:** Perfect circle (`border-radius: 9999px`) — a big pink dot.
- **Cancel button:** Pill (`border-radius: 9999px`).
- **Word display card:** Softly rounded rectangle (`border-radius: 40px`), white background, pink border.
- **Generated image container:** `border-radius: 24px` with a `4px` white border and colored sticker shadow.
- **Animated wallpaper:** Star/sparkle shapes use rounded SVG paths — no sharp spikes.
- **No sharp corners.** If in doubt, round it more.

## Components

The UI has three primary interactive components: the speak button, the word display, and the generated image view.

- **Speak Button (idle):** 180px circle, Bubble Pink (`#FF69B4`), white "SPEAK" in Fredoka One 28px, Golden Yellow + Candy Rose sticker shadow, white ring border (`border: 4px solid white`).
- **Speak Button (recording):** Pulsing ring animation — `box-shadow` keyframe from `0 0 0 0 rgba(255,105,180,0.6)` to `0 0 0 28px transparent`. Background shifts to Primary Deep.
- **Cancel Button:** Pill shape, Sunshine Yellow background, Candy Rose "Cancel?" text, 3-second SVG ring countdown arc overlaid on the button border.
- **Word Display:** Each word centered at Display scale, white fill with Primary Dark shadow. Fade in 200ms → hold 600ms → fade out 200ms → next word. Pretext measures natural width; font scales down if word exceeds 80% viewport width.
- **Loading Indicator:** Three bouncing dots in Pink / Yellow / Pink with stagger delay. No thin spinners or minimal loaders.
- **Generated Image:** Full-screen fade in over 400ms, `border-radius: 24px`, white border, Candy Rose drop shadow. "Tap to start over" label in Nunito Body fades in 1 second later.

## Do's and Don'ts

- Do make every interactive element feel touchable — large tap targets (min 80px), obvious depth, satisfying press feedback with scale and shadow reduction.
- Do use white borders and outlines liberally — the sticker effect depends on white isolation between colored elements and the background.
- Do keep Surface (#FFF0F7) as the dominant visual tone; colored elements sit on top of it, they do not fill it.
- Do animate every state transition: button presses, word appearances, image reveals. If state changes, something should move.
- Don't use font weights below 700. Thin text looks out of place in this visual universe.
- Don't use blue, gray, or cool neutral tones for interactive elements — stay in the pink / yellow / white family.
- Don't add navigation, menus, headers, or persistent chrome of any kind. The single button is the entire UI.
- Don't use blur-heavy realistic shadows. All depth is flat, offset, solid-color.
- Don't use Sunshine Yellow (#FFE066) for interactive elements — it is decorative only. Use Golden Yellow (#FFCC00) as the interactive counterpart.
- Don't render generated images or word cards with sharp corners — `border-radius: 24px` minimum everywhere.
