# Kaspi MVP Tracker

Local-first MVP for parsing Kaspi transaction text and saving structured records in browser storage.

## Architecture

- `src/domain` - business entities and pure logic (parser, stats, types, contracts)
- `src/application` - use-cases that orchestrate flows
- `src/infrastructure` - adapters (localStorage repository)
- `src/components` - reusable UI pieces
- `src/app` - routes and page composition
- `src/shared` - formatting helpers and shared utilities

This layering keeps parser/storage isolated from UI so future changes (IndexedDB, backend API, new parsers) can be added without rewriting pages.

## MVP Features

- Smart paste input (single and bulk)
- Deterministic split and parse logic for Kaspi patterns
- Preview before save with edit/delete actions
- Local storage persistence
- History page with filter and basic analytics

## Run locally

1. Install Node.js 20+
2. Install dependencies:
   - `npm install`
3. Start dev server:
   - `npm run dev`
4. Open `http://localhost:3000`

## Notes

- MVP supports only Kaspi text format keywords: `Покупка`, `Перевод`, `Пополнение`
- No backend, no accounts, no AI
