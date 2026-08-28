# sidharthkris.github.io

Personal site of **Sidharth Vijayan Krishnan**, software engineer. Built with
Astro, static output, no client framework.

## Art direction — "Press"

The page is set like a printed technical journal that alternates stock: warm
paper for reading, full-bleed ink panels for the work. Rhythm comes from that
switch rather than from decoration — you always know which register you are in.

- **Colour** — warm paper and a soft black, with a single **claret** used
  structurally: rules, project numerals, the current section. No second accent,
  because a second accent would need a reason and there isn't one.
- **Type** — Bricolage Grotesque for display (idiosyncratic, slightly condensed),
  Instrument Sans for body, Azeret Mono for all data. Self-hosted and subset to
  156 KB total; no third-party request on first paint.
- **Imagery** — none. The oversized project numerals are the artwork.

The dark register is implemented by a single `.dark` class that reassigns the
colour tokens, so every component inside works on both grounds without a second
set of rules.

## Content

Everything traces to the CV, LinkedIn, or a public repository. It lives in
`src/data/content.ts`; adding a project is one entry in `projects`.

**Deliberately absent:** location and spoken languages. Only verified, publicly
reachable destinations are linked — email, LinkedIn, GitHub, CV. The JSON-LD
carries no postal address and no language list.

## Develop

Requires **Node 24.20.0** (see `.nvmrc`).

```bash
npm install
npm run dev      # localhost:4321
npm run build    # → dist/
```

## Deploy

Push to `main`, then set **Settings → Pages → Source → GitHub Actions**. The
included workflow builds and publishes `dist/`.

## Verified

- Zero axe-core violations, WCAG 2.1 A + AA, on both the paper and ink registers
- Renders fully with JavaScript disabled
- No horizontal overflow, 320–1920px
- `prefers-reduced-motion` resolves everything instantly
