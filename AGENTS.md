# Project Guidelines

## Formatting

- Format JSON files with VS Code's default pretty-print formatting.
- Always make css variables for colors in order to make them reusable (in `src/app/globals.css`).

## Development Workflow

- Always start the website with `npm run build` to check for errors.

## Code Quality

- Keep the codebase clean, structured, and maintainable.
- Prefer proper, reusable APIs over one-off helper methods or scattered utility functions.
- Avoid monkey patching. Improve the underlying API when a reusable solution is needed.
- Write code that can be reused in future work and remains easy to understand.

## Security

- Do not leak secrets, credentials, or sensitive information.
- Keep server-side code secure and avoid introducing unsafe behavior.
