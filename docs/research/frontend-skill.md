# Which Claude Code skill to use for the frontend

Checked 2026-10-17. Star counts and dates come straight from the GitHub API (`gh api repos/...`), not from blog posts. "Last updated" is the last commit that touched that skill's own folder or file, not the whole repo.

**Scope:** a React dashboard for fleet owners (app UI) and a public "try it now" page for judges (landing page). The UI should be extremely simple, clean and elegant, and the skill must be quick to set up because this is a solo buildathon.

## Ranked table

| # | Skill | Repo | Stars | Skill last updated | What it does | Install (Claude Code) |
|---|---|---|---|---|---|---|
| 1 | **frontend-design** (Anthropic, official) | https://github.com/anthropics/skills (also shipped as a plugin in https://github.com/anthropics/claude-plugins-official) | 181,675 (skills repo); 41,105 (plugins repo) | 2026-09-03 | One SKILL.md file, about 70 lines, with no scripts. Claude first writes a short token plan (4–6 hex colors, typefaces, layout as an ASCII wireframe, principles). It then checks that plan against a list of common "AI-looking" defaults, builds the UI, and critiques screenshots. The core rule is restraint: "spend your boldness in one place". | `/plugin install frontend-design@claude-plugins-official` |
| 2 | **impeccable** (Paul Bakaus) | https://github.com/pbakaus/impeccable | 82,165 | 2026-10-16 | A full design toolkit with about 23 sub-commands (`shape`, `critique`, `polish`, `distill`, `quieter`, `audit`, …). Its "Operate" mode targets dashboards and app UI, where it favors precision and restraint. It ships a launcher binary and a hook that checks for design problems after edits, and it writes PRODUCT.md and DESIGN.md files. | `/plugin marketplace add pbakaus/impeccable`, then install from `/plugin` (or `npx impeccable install`) |
| 3 | **ui-ux-pro-max** | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | 136,707 | 2026-08-13 | A searchable design database: 79 styles, 192 palettes, 74 font pairings, 119 UX rules and 22 stack guides. Claude queries it through a Python script (`search.py --design-system`) and gets back a generated design system. It is strong on accessibility and UX checklists. | `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` then `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill` |
| 4 | **taste-skill** (design-taste-frontend v2) | https://github.com/Leonxlnx/taste-skill | 98,214 | 2026-10-12 | Art direction for landing pages, based on a study of 247 award-winning sites. A script picks a direction, a browser inspector enforces strict rules (no gradients, no eyebrow labels, no monospace, no card grids), and Claude reviews screenshots in a loop. It needs Node 22+ and Chrome. **Its own description says "Not for dashboards or app screens."** | `/plugin marketplace add Leonxlnx/taste-skill` then `/plugin install taste-skill@taste-skill` |
| 5 | **frontend-ui-engineering** (in addyosmani/agent-skills) | https://github.com/addyosmani/agent-skills | 107,591 (whole pack) | 2026-10-03 | Engineering-focused rules: component structure, state, WCAG and responsive layout. It aims for UI that does not look AI-generated, but it gives little aesthetic direction. It is one skill in a general software-engineering pack. | `npx skills add https://github.com/addyosmani/agent-skills --skill frontend-ui-engineering` |
| 6 | **web-design-guidelines** (Vercel) | https://github.com/vercel-labs/agent-skills | 32,546 | 2026-01-16 | Review only. It fetches Vercel's Web Interface Guidelines and lists violations as `file:line`. It does not design or build anything. | `npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines` |

Also seen and dropped: `obra/superpowers` (300k stars, but it is a general development workflow, not frontend), awesome-lists (ComposioHQ, travisvn and others, which are directories, not skills), and many 0–10 star repos.

## Top 3: pros and cons

### 1. frontend-design (Anthropic)
- **Pros:**
  - Official and lives in the most-starred skills repo.
  - It is in the `claude-plugins-official` marketplace, which Claude Code already knows about, so install is one command.
  - One file with no runtime, binary, Python or hooks.
  - Its guidance matches "simple and elegant": one or two typefaces, line length under 80 characters, sparing motion, and "remove one accessory" before finishing.
  - It sets a quality floor (responsive layouts, visible focus, reduced motion respected) and gives good UX-writing rules (active voice, clear empty and error states).
  - It applies to any UI, including dashboards.
- **Cons:**
  - Its default push is "distinctive, take aesthetic risk". For a fleet dashboard, the brief needs to ask for calm and restraint.
  - It has no dashboard-specific mode and no automated checker.

### 2. impeccable
- **Pros:**
  - It is the only top skill with a dedicated dashboard/app mode ("Operate": scanability and consistency come before expression).
  - Commands like `distill`, `quieter` and `polish` fit "extremely simple" exactly.
  - It is very actively maintained (updated yesterday) and includes a design-problem checker.
- **Cons:**
  - Much heavier: a launcher that downloads a binary on first run, project hooks, an `init` step that writes PRODUCT.md, and about 23 commands to learn.
  - That is overkill for a 2-page buildathon frontend.

### 3. ui-ux-pro-max
- **Pros:**
  - It has the most stars of any standalone design skill.
  - It covers a huge range of styles, palettes and fonts, and has good accessibility and UX checklists.
- **Cons:**
  - Designs come from a style database, so output tends toward catalog styles ("glassmorphism", "bento", …) rather than a restrained look made for this product.
  - It needs Python, and the SKILL.md is long and procedural.
  - It has not been updated since August.

**Why not taste-skill despite its 98k stars:** its own SKILL.md excludes dashboards, which is half of what we are building. It also requires Node 22, Chrome, image hunting and an animation pass with at least 8 moving elements, which works against "extremely simple".

## Recommendation: Anthropic's `frontend-design`

It is official, the simplest to set up, needs zero dependencies, and covers both pages. Its restraint rules fit the brief.

**Install (inside Claude Code, in the jaagte-raho project):**

```
/plugin install frontend-design@claude-plugins-official
```

If Claude Code says the marketplace is unknown, add it first, then install:

```
/plugin marketplace add anthropics/claude-plugins-official
/plugin install frontend-design@claude-plugins-official
```

Restart or reload Claude Code. Check that `/plugin` lists `frontend-design` as installed. Claude then loads it automatically when asked to build UI, or you can ask for it by name.

**Use it well:**
- Pin the direction in the brief, because the skill says "the brief's own words always win". For example: "Calm, minimal, high-legibility dashboard for fleet owners who check it at night. One accent color reserved for the GREEN/AMBER/RED/MISSED alertness states. Dark mode first. No decoration."
- Feed it the UX spec from the parallel design session as that brief.

**Optional later:** if the finished UI needs a polish pass, impeccable's `/impeccable polish` or `/impeccable distill` is the best add-on. It is not needed to start.
