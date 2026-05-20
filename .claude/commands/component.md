---
description: Install a component from 21st.dev, Magic UI, Aceternity, or any shadcn-compatible registry. Usage: /component magic animated-beam | /component 21st {author}/{name}
---

You are installing a UI component for Voxa. Read `.claude/skills/21st-dev-components/SKILL.md` for the component catalog.

Parse $ARGUMENTS:

- If the first word is `magic` or `magicui`, treat as Magic UI:
  ```
  npx shadcn@latest add "https://magicui.design/r/{name}.json"
  ```
- If the first word is `21st`, treat as 21st.dev:
  ```
  npx shadcn@latest add "https://21st.dev/r/{author/name}"
  ```
- If the first word is `tremor`, install from npm:
  ```
  pnpm add @tremor/react
  ```
  Then import from `@tremor/react`. Don't use shadcn CLI for Tremor.
- If the first word is `shadcn`, treat as base shadcn:
  ```
  npx shadcn@latest add {name}
  ```
- If a full URL is provided, use it directly:
  ```
  npx shadcn@latest add "{url}"
  ```

After install:
1. Read the generated file (it's in `components/magicui/` or `components/ui/`).
2. Note any required peer dependencies — install them.
3. Show the user the import path and a minimal usage example.
4. If the user said where to use it ("on the landing hero"), drop in the import and a usage stub at the target file.
5. Tweak default colors to the Voxa palette: indigo #6366F1 / pink #EC4899 / emerald #10B981.

If $ARGUMENTS is empty or unparseable, output the most useful components for Voxa:

```
Most-used Magic UI components for Voxa:

  /component magic animated-beam       — landing hero connector animation
  /component magic bento-grid          — features section
  /component magic border-beam         — pricing card emphasis
  /component magic shimmer-button      — primary CTAs
  /component magic number-ticker       — KPI counters
  /component magic dot-pattern         — page backgrounds
  /component magic blur-fade           — scroll-triggered reveals
  /component magic sparkles-text       — hero accent
  /component magic word-rotate         — multilingual demo word swap
  /component magic marquee             — logo strip / testimonials
  /component magic magic-card          — dashboard KPI cards
  /component magic animated-gradient-text — promo pill
  /component magic interactive-hover-button — secondary CTAs

Other:
  /component tremor                    — install @tremor/react for KPI charts
  /component shadcn dialog             — base shadcn dialog
```

Always verify install completes successfully before declaring done. If it fails, output the error verbatim and ask the user to check internet / shadcn version.
