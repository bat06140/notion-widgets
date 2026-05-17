# Notion Widgets Monorepo

This repository now uses a workspace-only `npm` + `turbo` layout.

Packages:

- `apps/widget-client`: Vite/React widget client
- `apps/widget-server`: Node/Express widget server
- `packages/shared`: shared runtime and types

Useful commands from the repository root:

- `npm run build`
- `npm test`
- `npm run dev`
- `npm run dev:calendar`
- `npm run dev:deadline`
- `npm run dev:clock`
- `npm start`

Development workflow:

- `npm run dev` starts the React Router frontend on `http://localhost:3000`
- the backend API runs internally on `http://localhost:3001`
- frontend widget routes are handled by React Router
- `/api/*` is proxied automatically to the backend in development
- production serves the built frontend app from Express on the same widget URLs
