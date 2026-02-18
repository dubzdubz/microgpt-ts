> **Note:** `CLAUDE.md` is a symlink to this file. `AGENTS.md` is the source of truth — edit this file, not `CLAUDE.md`.

## Agent Behavior

- Be proactive: when you learn something important (decisions, conventions, pitfalls, user preferences), save it to `AGENTS.md` or the relevant file in `docs/`.
- For non-trivial tasks, create a plan doc in `docs/plans/` using the filename format `YY-MM-DD-short-description.md` (e.g. `26-02-18-add-auth-flow.md`).

## Documentation

Project documentation lives in docs/. Use it extensively.
In particular:
- docs/style-guide.md — code style, Biome rules, naming conventions, TypeScript & React patterns
- docs/ui-guide.md — UI principles, shadcn-first approach, adding components, design guidelines


## Web App (`web/`)

### Stack

| Tool | Purpose |
|------|---------|
| [Next.js 16](https://nextjs.org/) | React framework (App Router) |
| [shadcn/ui](https://ui.shadcn.com/) | UI component library |
| [Tailwind CSS v4](https://tailwindcss.com/) | Styling |
| [Base UI](https://base-ui.com/) | Headless primitives (used by shadcn) |
| [motion](https://motion.dev/) | Animations |
| [Biome](https://biomejs.dev/) | Linting & formatting (replaces ESLint + Prettier) |
| [Storybook](https://storybook.js.org/) | Component development & visual testing |
| [Vitest](https://vitest.dev/) | Unit testing |
| [pnpm](https://pnpm.io/) | Package manager |

### Scripts (run from `web/`)

```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Production build
pnpm lint         # Biome check
pnpm lint:fix     # Biome check + auto-fix
pnpm storybook    # Storybook (localhost:6006)
pnpm vitest       # Run unit tests
```

### Key Rules

- Run `pnpm lint:fix` before committing
- Add `.stories.tsx` alongside new components
- Install shadcn components via CLI, never copy-paste: `pnpm dlx shadcn@latest add [component]`
- Prefer Server Components; add `"use client"` only when necessary


## microgpt lib

Follow Karpathy's style: keep code compact and simple. Prefer plain arrays and indexOf over Maps, simple loops over abstractions, and minimal intermediate variables. The code should read almost like pseudocode.
