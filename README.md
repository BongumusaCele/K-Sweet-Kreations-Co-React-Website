# K Sweet Kreations Co.

React JavaScript website using Vite. Product requirements and features will be added as development begins.

## Getting started

Use Node.js 24 LTS and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite.

## Checks and production build

```sh
npm run lint
npm run build
npm run preview
```

The production build is generated in `dist/`. The starter uses Oxlint for linting.

## Development workflow

- `main`: stable, tested releases.
- `develop`: integration of completed work.
- `feature/<name>`: individual features, branched from `develop`.
- `test/<name>`: dedicated testing, branched from `develop`.

Merge verified feature/test work into `develop`, then tested releases into `main`.
Commit messages use `feat`, `fix`, `test`, `docs`, `refactor`, or `style` followed by a meaningful description. See [AGENTS.md](AGENTS.md) for project conventions.
