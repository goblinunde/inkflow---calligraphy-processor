# Repository Guidelines

## Project Structure & Module Organization
This repository is a Vite + React + TypeScript app with optional Electron packaging. The main entry points are `index.tsx` and `App.tsx`. UI code lives in `components/`, reusable logic in `hooks/`, image-processing and AI integrations in `services/`, static assets in `public/`, Electron bootstrap code in `electron/`, and longer notes in `doc/`. Production web output is generated into `dist/`.

## Build, Test, and Development Commands
- `npm install`: install project dependencies.
- `npm run dev`: start the Vite dev server on `http://localhost:9999`.
- `npm run build`: create a production bundle in `dist/`.
- `npm run preview`: serve the built app locally for verification.
- `npm run electron:dev`: launch the Electron shell against the current app in development mode.
- `npm run electron:build`: build the web app, then package desktop binaries with `electron-builder`.
- `docker-compose up -d`: run the web build behind Nginx on port `8080`.

## Coding Style & Naming Conventions
Use TypeScript with React function components and ES module imports. Follow the surrounding file’s indentation style: most top-level app files use 2 spaces, while some older UI components use 4 spaces; keep each file internally consistent. Use `PascalCase` for components and `camelCase` for hooks and services. No formatter or linter config is committed, so run a careful manual pass before opening a PR.

## Testing Guidelines
There is no automated test suite checked in yet. For every change, at minimum run `npm run build` and manually verify the affected workflow in `npm run dev` or `npm run preview`. For Electron changes, also run `npm run electron:dev`. When adding tests later, place them near the feature or in a `tests/` directory and name them after the module under test.

## Commit & Pull Request Guidelines
Recent history uses short, focused commits, often with Conventional Commit prefixes such as `chore:` and occasional Chinese summaries. Prefer concise messages in the form `type: action`, for example `feat: add batch export preset`. Pull requests should describe the user-visible change, list verification steps, link related issues, and include screenshots or short recordings for UI changes.

## Security & Configuration Tips
Keep secrets in `.env.local`; Vite reads `GEMINI_API_KEY` from the environment and exposes it at build time. Do not commit real API keys, generated credentials, or ad hoc local config files.
