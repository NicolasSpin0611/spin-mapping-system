# Spinbox ↔ Spin Legacy — component parity workspace

A React app for comparing every **Spinbox** component with its **Spin Legacy** counterpart. Each component opens
two iframes side by side: the live Spinbox documentation page on the left, the Spin Legacy Figma frame on the
right. Underneath, a checklist records which variants still have to be mapped, with the name each system uses.

The dataset comes from the `Spin box - Mapping` document ([`docs/spin-box-mapping.pdf`](docs/spin-box-mapping.pdf)) —
37 component pairs, including the rows where one of the two systems has nothing to show.

## What it does

- **Side-by-side embeds.** Figma links are rewritten from `www.figma.com/design/…` to
  `embed.figma.com/design/…&embed-host=share` at render time, so the URLs stay readable in the data file. Spinbox
  docs pages are embedded as-is. Toggle between side-by-side, Spinbox only, and Legacy only.
- **Empty states that say something.** Components that exist in only one system (Debit card, Footer, Tables, Text
  area, OCR, Instructions, Paragraphs, Confirmation behaviours) render an explanation instead of a blank frame,
  quoting the note from the mapping document. The same goes for the one reference that lives in a Google Doc,
  which refuses to be framed.
- **Variant checklist.** Per component, a row per variant with the Spinbox name, the Spin Legacy name, a status
  (pending, in progress, done, blocked, not needed) and free-form notes. Rows seeded from the document are marked
  `suggested` until someone confirms them. Progress is summed per component and across the whole library.
- **Copyable embed code.** Any panel's iframe snippet can be copied in the exact shape used by Figma's share
  dialog: `<iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="800" height="450" src="…" allowfullscreen>`.
- **Admin panel** (`#/admin`) for editing titles, categories, parity status, both URLs, notes and variants, adding
  or deleting components, and exporting/importing the whole dataset as JSON.

## Running it

Requires [Bun](https://bun.sh) 1.2+.

```bash
bun install
bun dev        # http://127.0.0.1:43317
```

Other scripts:

```bash
bun run build    # type-check + production build into dist/
bun run preview  # serve the production build
bun run lint     # oxlint
```

## Where the data lives

`src/data/seed.ts` is the committed source of truth: one entry per mapping row, with the Spinbox URL, the Figma
node, the parity status, migration notes and the seeded variant rows. `src/data/types.ts` holds the types.

Edits made in the admin panel are stored in `localStorage` under `spin-mapping:dataset:v1` — they belong to the
browser that made them, not to the repository. To share them, use **Export JSON** in the admin panel and either
hand the file to someone (they can **Import JSON**) or fold the changes back into `src/data/seed.ts` and commit.
**Reset to seed data** drops the local copy.

## Notes on the source document

Two rows in the mapping document need a decision from the design team, and the app flags both:

- **Alerts / Callouts** had its two links swapped — the Spinbox row pointed at a Google Doc and the Legacy row at a
  Spinbox URL. The app resolves it to Spinbox `Callout` vs. the Alerts spec document, and marks the pair *needs
  review*; no Figma node exists for it yet.
- **Snackbar** is proposed for both Legacy *Toast Notification* and Legacy *Notifications*, so one of the two
  Legacy components is still unmapped.

Figma frames only render for people who have view access to the `Design system Spin` file. Without access, the
frame shows Figma's own "request access" screen — that is Figma's behaviour, not a bug in the app. Some
documentation sites also send `X-Frame-Options`; if a panel stays blank, the footer hints at it and the header has
an "open in a new tab" button.

## Deploying to GitHub Pages

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds with Bun and publishes `dist/` on every push
to `main`. Enable it once, in the repository settings:

**Settings → Pages → Build and deployment → Source: GitHub Actions**

The workflow passes `BASE_PATH=/<repo>/` to Vite so hashed assets resolve under the project-pages subpath. Routing
is hash-based (`#/component/button`), which needs no server rewrite and survives deep links and refreshes on Pages.
For a user or organisation site served from the domain root, drop `BASE_PATH` from the workflow.

## Stack

Bun · Vite · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · lucide-react · sonner
