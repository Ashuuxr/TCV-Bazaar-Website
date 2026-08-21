# TCV Bazaar Premium Minimal Design System

## Design direction

TCV Bazaar will use an **editorial luxury-market aesthetic**: warm ivory surfaces, ink-black contrast, antique-gold accents, generous whitespace, and confident serif typography. The system should feel premium and calm rather than crowded or overly decorative. The visual language takes cues from an editorial collage hero and modern landing-page composition, while preserving TCV Bazaar’s festive gold identity and current Supabase-driven content.

## Brand palette

| Token | Light mode | Dark mode | Use |
|---|---|---|---|
| Ink | `#17130C` | `#F4ECDD` | Primary text, navigation, high-contrast surfaces |
| Background | `#FAF7F1` | `#0E0B07` | Page canvas |
| Surface | `#FFFFFF` | `#171208` | Cards, panels, forms |
| Surface muted | `#F3EDE2` | `#171208` | Alternating sections and subtle bands |
| Gold | `#B98A2F` | `#D9B45F` | Accent, active state, focus, key CTA |
| Gold highlight | `#E8CC85` | `#F1D993` | Hover and shimmer highlight |
| Text muted | `#5C554A` | `#A99F8D` | Supporting copy, metadata |
| Line | `#E7DDCC` | `#2C2415` | Borders, dividers, rules |

Gold is an accent, not a fill for every control. Primary CTAs use ink on light surfaces and gold on dark surfaces to keep the hierarchy restrained.

## Typography

The display face is **Fraunces** for expressive editorial headlines. The interface and body face is **Inter** for legibility and operational clarity. Headlines use tight tracking and short line lengths; body copy uses a relaxed line-height between 1.65 and 1.8.

| Role | Font | Size guidance | Weight |
|---|---|---:|---:|
| Hero display | Fraunces | `clamp(3rem, 8vw, 7.5rem)` | 500 |
| Section heading | Fraunces | `clamp(2rem, 4vw, 4rem)` | 500 |
| Card heading | Fraunces | `1.25rem–1.75rem` | 500 |
| Body | Inter | `0.9375rem–1.125rem` | 400 |
| Eyebrow | Inter | `0.6875rem` | 600, uppercase, `0.28em` tracking |
| CTA | Inter | `0.8125rem–0.875rem` | 600 |

## Layout principles

The homepage uses a clear editorial rhythm: an immersive hero, a compact proof strip, an asymmetric story section, a benefit grid, a focused package comparison, the interactive stall layout, social proof, and one decisive closing CTA. Sections alternate between the ivory canvas and muted surfaces instead of adding extra cards everywhere.

The content container is capped at `80rem`, with `1.25rem` mobile padding and `2rem` desktop padding. Major sections use `6rem–8rem` vertical spacing on desktop and `4.5rem–6rem` on mobile. Rounded corners remain generous but controlled at approximately `1rem–1.75rem`; no component should look inflated or toy-like.

## Component language

Buttons are pill-shaped with visible focus rings and tactile press feedback. Cards use thin borders, a soft warm shadow, and a restrained `translateY(-6px)` hover lift. Navigation is transparent over the hero, then becomes a translucent surface after scroll. Metadata is represented with small gold line icons and compact labels. Image blocks use `1.5rem–2rem` radii, crop with `object-cover`, and reveal a dark-to-transparent caption overlay on hover.

## Motion system

All non-essential motion is gated by `prefers-reduced-motion`. Hero copy enters in a short stagger, section content reveals with a `24px` upward offset, and cards use `180–280ms` hover transitions. Motion is limited to opacity and transform wherever possible. The existing `Reveal`, `Framer Motion`, marquee, shimmer, and hero drift utilities remain the motion foundation.

## Accessibility and responsive behavior

All controls must remain keyboard reachable with a visible gold focus ring. Text must retain strong contrast on both themes. Mobile layouts collapse to one column, preserve comfortable tap targets of at least `44px`, and keep the primary booking CTA visible without forcing users to search. Decorative image overlays must not be the only source of information; image titles and links remain available in semantic text.

## Implementation scope

The redesign will update the public homepage and shared public navigation styling. Booking, portal, contact, admin routes, Supabase synchronization, Meta Pixel, analytics, and the booking ON/OFF server guard remain functionally unchanged. Existing CMS values remain the source of truth for hero media, event information, packages, gallery, testimonials, and brand assets.
