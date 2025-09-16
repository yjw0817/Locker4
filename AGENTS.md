# Repository Guidelines

## Project Structure & Module Organization
The Locker4 app is split into a Vue 3 front end ("frontend/") and an Express/MySQL API ("backend/"). Key front-end folders: "src/components" for widgets, "src/pages" for routed views, "src/stores" for Pinia state, "src/services" for API clients, and "public/" for static assets. Backend routes live in "backend/routes/", shared helpers in "backend/utils/", and database pooling in "backend/config/database.js". Product notes stay in "docs/", while repository scripts sit in "scripts/" (for example "scripts/restore_context.sh").

## Build, Test & Development Commands
Run npm install in both workspace roots. Start the UI with npm run dev inside "frontend/" (Vite on :5173) and the API with npm run dev inside "backend/" (Nodemon on :3333). npm run build compiles the Vue bundle, npm run preview smoke-tests the build, npm start runs the API without watchers, and npm run init-db seeds the schema once database credentials exist. Before pushing, execute npm run lint and npm run type-check in "frontend/".

## Coding Style & Naming Conventions
Stick to two-space indentation across TypeScript and Node files. Vue single-file components use <script setup lang="ts"> and PascalCase filenames such as "LockerCanvas.vue"; composables, stores, and services stay camelCase. Name REST handlers after the paths in "backend/routes". Rely on ESLint and Vue TSC, and fix every warning rather than ignoring it.

## Testing Guidelines
Automated tests are pending. For now, follow the scenarios in "docs/testing/" and "docs/TEST_GUIDE.md". Keep the browser console helpers under "frontend/test-scripts/" aligned with canvas changes, and document the expected URLs (typically http://localhost:5173 or :5174). When you add features, attach at least one reproducible manual checklist and, when feasible, scriptable regression coverage.

## Commit & Pull Request Guidelines
Commits use conventional prefixes (feat:, fix:, docs:). Mirror the focused tone in recent history, for example "fix: 빈 락커 클릭 시 이전 데이터가 남아있는 문제 수정", and split unrelated work. Pull requests need a clear summary, linked issues or docs, manual test evidence, and screenshots or GIFs for UI changes. Gate every PR on lint, type-check, and a healthy API ping.

## Environment & Configuration
Create "backend/.env" with DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME, then run npm run init-db after applying schema updates from "docs/DATABASE_INTEGRATION.md". The Vue build reads integration hints from the PHP bridge, so keep mount points such as "locker4-app" aligned when embedding in CodeIgniter.
