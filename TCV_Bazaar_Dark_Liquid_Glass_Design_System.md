# TCV Bazaar Dark Liquid Glass Design System

## Direction

TCV Bazaar will use a dark-only premium experience inspired by Apple’s restraint: large editorial typography, generous spacing, cinematic media, near-black surfaces, translucent glass, and motion that feels quiet and intentional. Apple is a visual reference for hierarchy and polish only; TCV Bazaar keeps its own gold identity, event content, booking flow, and imagery.

## Core tokens

| Token | Value | Purpose |
|---|---|---|
| Background | `#070706` | Dark-only page canvas |
| Elevated surface | `rgba(255,255,255,.055)` | Glass cards and navigation |
| Elevated surface hover | `rgba(255,255,255,.10)` | Interactive glass hover |
| Ink | `#F5F0E7` | Primary text |
| Muted ink | `#AFA79A` | Supporting copy |
| Gold | `#D9B45F` | Brand accent and CTA |
| Gold soft | `rgba(217,180,95,.16)` | Accent glow |
| Border | `rgba(255,255,255,.14)` | Glass edge |

## Glass recipe

Liquid-glass components use a translucent surface, `backdrop-filter: blur(22px) saturate(135%)`, a fine white border, layered inner highlight, and a soft shadow. The effect should remain subtle and readable, never look like a heavy grey box, and always preserve focus contrast.

## Motion recipe

Hero content uses a short staggered reveal. Sections use the existing Reveal system with a 20–28px offset and spring-like easing. Glass cards lift 4–6px on hover and brighten their border. Decorative glows drift slowly. All motion respects `prefers-reduced-motion`; reduced motion removes drift and transforms while preserving visible content.

## Dark-only rule

The public site and shared theme applicator always set the document to dark mode. The public theme toggle is removed rather than leaving a control that cannot change the experience. Admin theme data remains structurally compatible for existing cloud content, but public rendering is intentionally dark-only.
