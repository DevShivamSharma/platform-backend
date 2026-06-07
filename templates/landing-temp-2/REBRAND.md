# Rebrand guide — landing-modern (editorial portfolio template)

This site is now **config-driven**. To launch a new client, you edit **one file**:
`src/content.json`. Nothing else needs touching.

- `src/content.json` — **the only file you swap per site.** All real copy + data.
- `src/config.js` — fixed template identity (theme palette, fonts, section chrome,
  magazine micro-copy). Never edited per-site.
- `.platform-meta.json` (repo root) — optional platform override; deep-merges over
  `content.json` for known top-level keys. Leave as `{}` if unused.

Merge order: `defaults (config.js)  ←  content.json  ←  .platform-meta.json`.
`config.js` guards every field, so a partial/empty `content.json` won't crash.

## content.json keys to edit for a new client

| Key | Drives |
|-----|--------|
| `publication` | Issue/volume numbers, season, place, total pages, tagline (mastheads, folios, copyright) |
| `document` | Browser tab `title`, meta `description`, `lang` |
| `profile` | Name, role, current title, company, location, email, phone (Hero, Nav, About, Footer, Contact) |
| `education` | Degree, short label, school, CGPA, period (About sidebar) |
| `navLinks` | Nav + footer menu labels and anchor targets |
| `stats` | "By the numbers" counters (Hero + About) |
| `skillGroups` | Skills "Table of contents" groups → tags |
| `supportingSkills` | "Adjacent strengths" appendix list |
| `projects` | Project spreads (title, description, metrics, tech, features, note, type, featured) |
| `experience` | Trajectory entries (period, title, company, location, description, bullets, skills) |
| `services` | "Departments" list (title, description) |
| `contactLinks` | Contact channels (label, value, href) |
| `hero` | Coverline kicker, name lines, lede, CTAs, side quote, marquee phrases |
| `about` | Section title, lede, essay paragraphs, pull-quote, columns, sign-off initials |
| `skillsSection` | Skills section title, lede, supporting caption |
| `projectsSection` | Projects title, lede, end-plate (title/lede/CTA) |
| `experienceSection` | Experience title, lede |
| `servicesSection` | Services title, lede, inquiry link text |
| `contact` | Big CTA words, channels title, editor's note, availability rows, plate caption |

## Rich (inline-emphasis) copy format

Headings/ledes that mix upright + emphasized words are stored as **segment arrays**
so the look survives the move to JSON:

```json
"title": ["A working ", { "t": "stack", "em": "display-italic" }, "."]
```

Segment forms:
- `"plain text"` → raw text
- `{ "t": "word", "em": "display-italic" }` → heading italic
- `{ "t": "word", "em": "signature" }` → inline accent italic
- `{ "t": "word", "em": "signature-plain" }` → upright accent
- `{ "t": "word", "em": "muted" }` → de-emphasized (`--fg-3`)
- `{ "br": true }` → line break

## Re-skin colors / fonts (template-level, rare)

Edit `theme.modes.light` / `theme.modes.dark` / `theme.fonts` in `src/config.js`,
**then mirror the same values** in `src/index.css` (`@theme` + the
`[data-theme="…"]` blocks). The two must stay in sync; every component reads color
only through CSS vars (`var(--bg)`, `var(--accent)`, …), so the theme toggle needs
no per-component changes.
