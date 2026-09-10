# PanoViewer Knowledge Base

**Path:** `PanoViewer/`
**Purpose:** Panorama viewer frontend

## OVERVIEW

Vue 3 + TypeScript viewer for displaying panoramic scenes. Consumes the shared PanoViewV2 engine via `@panoview` alias for rendering.

## STRUCTURE

```
PanoViewer/
├── src/
│   ├── api/           # Axios HTTP client
│   ├── components/    # Vue components (8 files)
│   ├── composables/   # Reusable composition functions
│   ├── router/        # Vue Router
│   ├── stores/        # Pinia stores
│   ├── styles/        # CSS/styling
│   ├── types/         # TypeScript types
│   ├── utils/         # Utility functions
│   └── views/         # Route-level pages
└── vite.config.ts     # Dev server port 5001, proxies /api and /uploads
```

## CONVENTIONS

- **Cross-app imports:** Uses `@panoview/*` to import PanoViewV2 engine modules
- **Axios:** HTTP client with configured baseURL

## WHERE TO LOOK

| Task | Location |
|------|----------|
| HTTP client | `src/api/` |
| Routes | `src/router/` |
| Viewer components | `src/components/` |

## ANTI-PATTERNS

- **Never import from `../PanoViewV2/src/...` directly:** Always use `@panoview/*`
