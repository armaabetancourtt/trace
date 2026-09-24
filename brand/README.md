# TRACE / Official visual identity

<p align="center"><img src="trace-banner.svg" alt="Official TRACE wordmark, white on black" width="100%"></p>

The source of truth is the approved TRACE artwork. The wordmark is a **geometric custom mark**: wide tracking, distinctive open A and sculpted R. Do not recreate it with ordinary letter-spacing or substitute a display font.

## Assets

| Asset | Purpose |
| --- | --- |
| [Official wordmark](trace-wordmark.svg) | Transparent white vector wordmark for dark backgrounds |
| [README banner](trace-banner.svg) | Signature black-and-white GitHub hero |
| [T monogram](trace-icon.svg) | Compact mark derived from the original T; suitable for small square contexts |
| [Native launcher](trace-launcher.png) | 1024 × 1024 monochrome PNG for Expo's app icon |

The vectors were traced from the supplied approved logo to make the art reusable in source control. Keep proportions and letterforms intact.

## Palette

| Token | Value | Role |
| --- | --- | --- |
| Black | `#050505` | Signature background, dark overlays |
| White | `#FFFFFF` | Wordmark, primary actions and main text |
| Surface | `#101010` | Panels |
| Divider | `#292929` | Quiet rules |
| Muted | `#A0A0A0` | Supporting metadata |
| Live signal | `#B7FF3C` | **Functional status only**: live presence, recording and route status |

TRACE is a **monochrome identity**. Lime is a status signal, not a third brand color: avoid lime hero banners or lime primary buttons. Allow maps and activity data to carry the visual complexity.

## Usage

Give the full wordmark generous clear space, approximately a capital-letter stroke plus the height of its horizontal terminals. Prefer the complete wordmark in wide placements and the derived T in square placements. Use white artwork over black/dark surfaces; do not put the transparent white wordmark over white. Never stretch, skew, retype, outline, or distort the logo.

For the native app, use the matching SVG path through `TraceWordmark` and theme tokens in `apps/mobile/src/theme/tokens.ts`. Documentation uses these portable SVG assets.

## Product truth

Keep README claims aligned with implementation. TRACE currently has a mobile foundation; real live discovery, Firebase project provisioning and ML performance are not presented as launched capabilities. Precise location is not public by default, as documented in [privacy and safety](../docs/PRIVACY_AND_SAFETY.md).
