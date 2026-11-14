---
name: Rifki Fajar Ramadhani Portfolio
description: A precise, terminal-inspired portfolio for evaluating shipped full-stack engineering work.
colors:
  paper: '#fdfcfc'
  carbon: '#171514'
  carbon-panel: '#201d1d'
  carbon-titlebar: '#2a2626'
  ink-muted-light: '#424245'
  steel: '#646262'
  ash: '#9a9898'
  ink-muted-dark: '#c8c4c4'
  paper-panel: '#f8f7f7'
  paper-titlebar: '#f1eeee'
  hairline-light: 'rgba(15, 0, 0, 0.12)'
  hairline-dark: 'rgba(253, 252, 252, 0.14)'
  operational-green: '#1f8f3c'
  operational-green-hover: '#187a32'
  operational-green-bright: '#3fb950'
  operational-green-bright-hover: '#56d364'
  operational-green-ink: '#0d1f12'
  warning-amber: '#ff9f0a'
  warning-amber-dark: '#ffd60a'
  danger-red: '#ff3b30'
  danger-red-dark: '#ff453a'
typography:
  display:
    fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace'
    fontSize: '1.5rem'
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: '-0.02em'
  headline:
    fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace'
    fontSize: '1.875rem'
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: '-0.03em'
  title:
    fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace'
    fontSize: '1.25rem'
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 'normal'
  body:
    fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 'normal'
  label:
    fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace'
    fontSize: '0.75rem'
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: '0.14em'
rounded:
  none: '0px'
  status: '9999px'
spacing:
  control-xs: '0.375rem'
  control-sm: '0.5rem'
  control-md: '0.75rem'
  control-lg: '1rem'
  panel: '1.25rem'
  panel-comfortable: '1.5rem'
  section-inline: '1.5rem'
  section-block: '6rem'
  section-block-emphasis: '8rem'
components:
  outlined-action:
    backgroundColor: 'transparent'
    textColor: '{colors.steel}'
    typography: '{typography.body}'
    rounded: '{rounded.none}'
    padding: '{spacing.control-sm} {spacing.control-lg}'
  outlined-action-hover:
    backgroundColor: 'transparent'
    textColor: '{colors.operational-green}'
    typography: '{typography.body}'
    rounded: '{rounded.none}'
    padding: '{spacing.control-sm} {spacing.control-lg}'
  bracket-link:
    backgroundColor: 'transparent'
    textColor: '{colors.steel}'
    typography: '{typography.body}'
    rounded: '{rounded.none}'
  bracket-link-hover:
    backgroundColor: 'transparent'
    textColor: '{colors.operational-green}'
    typography: '{typography.body}'
    rounded: '{rounded.none}'
  panel:
    backgroundColor: '{colors.paper-panel}'
    textColor: '{colors.ink-muted-light}'
    rounded: '{rounded.none}'
    padding: '{spacing.panel}'
  panel-dark:
    backgroundColor: '{colors.carbon-panel}'
    textColor: '{colors.ink-muted-dark}'
    rounded: '{rounded.none}'
    padding: '{spacing.panel}'
  terminal-window:
    backgroundColor: '{colors.paper-panel}'
    textColor: '{colors.steel}'
    typography: '{typography.body}'
    rounded: '{rounded.none}'
    padding: '{spacing.panel-comfortable}'
  terminal-window-dark:
    backgroundColor: '{colors.carbon-panel}'
    textColor: '{colors.ash}'
    typography: '{typography.body}'
    rounded: '{rounded.none}'
    padding: '{spacing.panel-comfortable}'
  skill-tab:
    backgroundColor: 'transparent'
    textColor: '{colors.steel}'
    typography: '{typography.body}'
    rounded: '{rounded.none}'
    padding: '{spacing.control-xs} {spacing.control-sm}'
  skill-tab-active:
    backgroundColor: 'transparent'
    textColor: '{colors.operational-green}'
    typography: '{typography.body}'
    rounded: '{rounded.none}'
    padding: '{spacing.control-xs} {spacing.control-sm}'
---

# Design System: Rifki Fajar Ramadhani Portfolio

## Overview

**Creative North Star: "The Operational Console"**

The Operational Console treats the portfolio as a calm, production-minded workspace: direct commands establish structure, system states carry meaning, and shipped work remains the evidence. Its terminal language is precise and restrained rather than nostalgic or theatrical, giving technical hiring teams an interface they can scan quickly and trust.

The system stays spacious even though its controls are compact. Carbon and Paper surfaces support equal light and dark expressions, Operational Green marks the few moments that deserve attention, and square geometry keeps every interaction utilitarian and exact. Motion confirms state and sequence without becoming spectacle.

**Key Characteristics:**

- Monospaced, command-led hierarchy with plainspoken labels.
- Warm near-black and off-white surfaces separated by hairlines and tonal steps.
- Sparse green signals for commands, active states, focus, and healthy status.
- Square panels and controls, with circles reserved for status indicators.
- Quiet, reduced-motion-safe transitions that preserve reading flow.

## Colors

The palette pairs Carbon and Paper neutrals across light and dark modes, using Operational Green as a scarce functional signal rather than a decorative wash.

### Primary

- **Operational Green:** Used for command output, active tabs, interactive hover and focus states, the blinking caret, and healthy system status. The brighter pair serves dark surfaces; the deeper pair maintains contrast on Paper.
- **Operational Green Ink:** Used only where text sits on a solid bright-green status surface.

### Neutral

- **Paper:** The light canvas and the highest-contrast text on Carbon.
- **Carbon:** The dark canvas and the strongest light-mode text anchor.
- **Paper Panels:** Slightly warmer stepped surfaces for panels and terminal title bars in light mode.
- **Carbon Panels:** Subtle lifted tonal surfaces for panels and terminal title bars in dark mode.
- **Steel, Ash, and Muted Ink:** A restrained hierarchy for prompts, supporting copy, metadata, and inactive controls.
- **Hairlines:** Low-contrast translucent separators for panels, navigation, and internal structure; stronger borders reuse the current secondary-ink level.

### Status

- **Warning Amber:** The terminal-window warning light, adjusted for each theme.
- **Danger Red:** The terminal-window danger light, adjusted for each theme.
- **Healthy Status:** Reuses Operational Green so system health and actionable emphasis share one visual signal.

### Named Rules

**The One Signal Rule.** Operational Green appears only on commands, interaction states, and healthy status; its rarity is what gives it authority.

**The Paired Surface Rule.** Every neutral role must have an equivalent light and dark expression before it is introduced into the system.

## Typography

**Display Font:** JetBrains Mono (with ui-monospace, SFMono-Regular, Menlo, and monospace fallbacks)  
**Body Font:** JetBrains Mono (with the same system fallbacks)  
**Label/Mono Font:** JetBrains Mono

**Character:** The single-family system reads like a dependable engineering tool: compact, exact, and consistent across commands, prose, navigation, and metadata. Weight, size, spacing, and color create hierarchy without switching typographic voices.

### Hierarchy

- **Display:** Semibold identity text for the hero command response; responsive implementations may step down on narrow screens.
- **Headline:** Bold section commands and top-level page errors, paired with a prompt and command caret.
- **Title:** Semibold project and role names that anchor local content groups.
- **Body:** Regular long-form copy with generous leading; keep readable descriptions near 65–75 characters per line where layout permits.
- **Label:** Bold uppercase kickers and compact metadata, using tracked letters sparingly.

### Named Rules

**The One Typeface Rule.** Use JetBrains Mono for every visible text role; hierarchy comes from weight, scale, tracking, and color rather than a second family.

**The Command Leads Rule.** Section headings begin with a prompt or command phrase so the interface always explains what the following content represents.

## Layout

The primary reading column is centered and capped at 56rem, with a narrower 42rem measure for the contact close. Sections use a 1.5rem inline gutter and a 6rem vertical rhythm; the contact section expands to 8rem to create a deliberate closing pause. The hero fills the viewport and centers its terminal window vertically beneath the fixed navigation.

Desktop content uses simple grids only when comparison benefits: three columns for the About composition, twelve columns for featured project media and copy, four columns for skills, and two columns for secondary projects. Below the medium breakpoint, every major composition becomes a single reading flow; navigation collapses into a menu, skills use two columns, and the footer trades its status-bar layout for a compact centered line.

Spacing should feel calm rather than dense. Controls remain compact inside generous page whitespace, and related command fragments wrap naturally instead of shrinking below comfortable reading sizes.

## Elevation & Depth

The system is flat by default. Panels gain structure through one-pixel hairlines and small tonal shifts, not ambient shadows or gradients. The only persistent lift is the fixed header after scrolling or opening the mobile menu, where a soft shadow and 16px backdrop blur separate navigation from moving content.

### Shadow Vocabulary

- **Header Ambient** (`0 10px 15px -3px rgb(0 0 0 / 5%)`): Used only on the scrolled or open fixed navigation layer.

### Named Rules

**The Flat-by-Default Rule.** Use borders and tonal layering for depth; reserve shadow for an overlay that must remain legible above scrolling content.

## Shapes

The dominant form is rectangular and square-cornered. Panels, terminal windows, buttons, tabs, image frames, scrollbars, and navigation actions use zero radius. Borders are one-pixel hairlines, with the stronger neutral reserved for primary frames and outlined actions.

Circles are semantic exceptions, not a competing shape language: they represent terminal controls and operational status. Content imagery is clipped to square frames even when its internal aspect ratio is cinematic.

**The Square Workbench Rule.** Use square corners for every container and control; use a full circle only for a status light or terminal indicator.

## Components

Components are utilitarian and exact: each one exposes its role through a border, prompt, bracket, or state change without ornamental chrome.

### Buttons

- **Shape:** Square corners with a one-pixel strong hairline.
- **Primary Action:** Transparent rather than filled, with compact horizontal padding and bracketed lowercase copy.
- **Hover / Focus:** Border and text shift to the theme-appropriate Operational Green; focus remains visibly equivalent for keyboard users.
- **Text / Ghost Action:** Bracket links omit the border and change only their text signal.

### Tabs

- **Style:** Compact text controls with a two-pixel bottom rule and no container fill.
- **State:** The selected tab turns Operational Green and gains `[_` / `_]` command markers; inactive tabs remain secondary ink.
- **Behavior:** Arrow keys, Home, and End move focus and selection; panel transitions collapse to an immediate change under reduced motion.

### Cards / Containers

- **Corner Style:** Square.
- **Background:** The first tonal surface for the active theme.
- **Shadow Strategy:** Flat at rest; use no card shadow.
- **Border:** One-pixel hairline, shifting to Operational Green only for interactive hover emphasis.
- **Internal Padding:** Standard panels use 1.25rem; the terminal hero expands to 1.5rem and 2rem at larger widths.

### Navigation

- **Style:** A fixed, centered command path using quiet secondary text, a bold bracketed identity, and a bordered resume action.
- **State:** Links turn Operational Green on hover or active use. After scrolling, the header gains a hairline, translucent tonal surface, ambient shadow, and blur.
- **Mobile:** Keep the theme and menu controls visible, then reveal a full-width tonal menu with comfortably tappable command links.

### Terminal Window

The signature container uses a strong outer hairline, a stepped title bar, three circular status lights, sequential command rows, a green caret, and a compact action row. It carries identity and role information without imitating a fully interactive shell.

### Terminal Backdrop

Behind the hero window, a faint full-bleed shell session types build, test, deploy, and access-log lines, then clears and repeats. It sits at roughly half opacity in tertiary ink with a vertical fade mask, keeps green to its prompts and `✓` marks, and uses a neutral caret so the hero's green caret remains the single active signal. It is decorative and `aria-hidden`, pauses off-screen and in background tabs, and renders as a still transcript under reduced motion or without JavaScript. Keep it to the hero; it is atmosphere, never content.

### Status Footer

On desktop, the footer reads as a compact editor status bar: a solid green mode segment, project path, year, and healthy-state indicator. Mobile reduces this to the project path and year so it does not compete with the content.

## Do's and Don'ts

### Do:

- **Do** use Operational Green only for commands, active interaction states, focus, and healthy status.
- **Do** preserve a centered 56rem reading column with 1.5rem inline gutters and generous section spacing.
- **Do** use hairlines and tonal surface steps before introducing elevation.
- **Do** keep every interaction keyboard-usable and collapse decorative motion for reduced-motion users.
- **Do** write labels as concise commands, paths, filenames, or bracketed actions when the context supports them.

### Don't:

- **Don't** round cards, buttons, inputs, image frames, or navigation controls.
- **Don't** spread green across large backgrounds or use it as general decoration.
- **Don't** add gradients, glass panels, or broad card shadows to create hierarchy.
- **Don't** mix in a second display or body typeface.
- **Don't** turn the terminal metaphor into fake shell complexity that obscures portfolio evidence.
