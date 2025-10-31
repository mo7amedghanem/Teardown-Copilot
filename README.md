# Teardown Copilot Front-End

This repository contains the single-page wizard for the Teardown Copilot pilot experience. The app is a React interface bundled with esbuild and can be run locally with either a dev server or a static build.

## Prerequisites

- Node.js 18+
- npm 9+

## Getting started

Install dependencies once:

```bash
npm install
```

### Run the development server

Start an auto-rebuilding dev server that serves the app at [http://localhost:5173](http://localhost:5173):

```bash
npm run dev
```

The command uses esbuild's built-in server. When it starts successfully it will report the host/port in the terminal. Open the printed URL in your browser to interact with the UI.

### Build for static hosting

Generate the production bundle inside `dist/` and open `index.html` with any static file server:

```bash
npm run build
```

After the build finishes, you can serve the folder with a tool such as `npx http-server .` or by configuring your own static hosting. The `index.html` file already points to the generated bundle in `dist/`.

## Available features

The wizard guides you through the four required stages:

1. **Scenario selection & intake** – capture goal-specific inputs across Dreamer, Pragmatist, Operator, and Audit modes.
2. **Source review** – manage the list of URLs and see validation feedback before running analysis.
3. **Run progress** – view live progress states, highlights, and mock backend status chips.
4. **Results dashboard** – inspect generated pricing tables, feature matrices, verified claims, and export actions.

Strict vs. balanced verification behaviors, coverage indicators, and mock highlights are all simulated client-side so you can demo the flow without backend connectivity.

## Troubleshooting

- If `npm install` fails due to network restrictions, retry once connectivity is restored. Dependencies are limited to React, ReactDOM, Day.js, and esbuild.
- If the dev server port is busy, change the `--serve=localhost:5173` flag in `package.json` to another available port.
- For completely offline demos, run `npm run build` once while online and keep the generated `dist/` artifacts alongside `index.html`.

