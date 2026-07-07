<h1 align="center">
  <br>
  Vanilla² Website
  <br>
</h1>

<h4 align="center">Official Next.js website for Vanilla²: landing pages, account login, bug reporting, and reusable UI templates for the Minecraft Fabric mod project.</h4>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16.2.10-black?style=flat-square">
  <img alt="React" src="https://img.shields.io/badge/React-19.2.4-blue?style=flat-square">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8?style=flat-square">
  <img alt="OpenAuth" src="https://img.shields.io/badge/OpenAuth-0.4.3-purple?style=flat-square">
</p>

## Overview

Vanilla² Website is the public web application for the Vanilla² Minecraft Fabric mod. The main page introduces the mod's combat and progression overhaul, links to downloads, Discord, documentation, GitHub, and bug reporting, and showcases feature cards for weapons, armor, enchantments, fishing rod combat, HUD improvements, and the Sulfur Cube.

The app also includes a local account system, OpenAuth token routes, development utilities, a MySQL-backed bug reporter, and a small reusable component/template library used by the site's pages.

## Features

- Landing page for Vanilla² with feature, enchanting, download, documentation, Discord, and GitHub links.
- Email-code style login and signup flow powered by OpenAuth and first-party server actions.
- HTTP-only access and refresh token cookies with token verification helpers.
- MySQL-backed users, roles, bug reports, bug report counters, and uploaded bug report files.
- Bug list, detail, filtering, search previews, and authenticated multipart bug submission.
- Server-side validation for bug categories, versions, status, priority, file limits, and server-controlled fields.
- Reusable UI components including buttons, cards, header/footer, tags, modals, search, inputs, toggles, multiselects, file uploads, previews, and scroll helpers.
- Reusable page templates for default pages, element views, error pages, and searchable list pages.
- Development pages for component/template inspection.

## Tech stack

- [Next.js](https://nextjs.org/) App Router
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/) v4 via PostCSS
- [OpenAuth](https://openauth.js.org/)
- [Hono](https://hono.dev/) for OpenAuth route handling
- [mysql2](https://github.com/sidorares/node-mysql2)
- [Valibot](https://valibot.dev/) for auth subject schemas

## Project structure

```text
src/app/                  Next.js routes, pages, layouts, server actions, and API routes
src/app/api/bugs/         JSON API for listing and submitting bug reports
src/app/bugs/             Bug browsing, filtering, detail pages, and report form UI
src/auth/                 OpenAuth issuer, providers, subjects, permissions, and MySQL user helpers
src/bugs/                 Bug report validation, persistence, file storage, and demo seed helpers
src/components/           Shared UI components
src/security/             Request and server-field guards
src/template-pages/       Reusable page templates
src/assets/               Project assets and SVG icons
cdn/                      Static CDN-style assets aliased as @cdn
scripts/                  Local MySQL helper scripts
```

Important entry points:

- `src/app/page.js` — home page content.
- `src/app/layout.js` — global metadata, fonts, header, and layout shell.
- `src/app/login/page.js`, `src/app/signup/page.js`, `src/app/login/code/page.js` — auth UI.
- `src/app/authorize/route.js`, `src/app/token/route.js`, `src/app/api/callback/route.js` — OpenAuth flow routes.
- `src/app/api/auth/status/route.js`, `src/app/api/auth/logout/route.js` — session status and logout APIs.
- `src/app/api/bugs/route.js` — bug report list/create API.
- `src/bugs/reporter.js` — bug schema creation, validation, filtering, persistence, and uploads.

## Requirements

- Node.js compatible with Next.js 16.
- npm.
- MySQL 8 or a compatible MySQL server.

Install dependencies before running any Next.js script:

```sh
npm install
```

## Environment variables

The application can connect through either `DATABASE_URL` or individual MySQL variables.

| Variable | Description | Default |
| --- | --- | --- |
| `DATABASE_URL` | Full MySQL connection URI. Takes precedence over individual MySQL settings. | unset |
| `MYSQL_HOST` | MySQL host. | `localhost` |
| `MYSQL_PORT` | MySQL port. | `3306` |
| `MYSQL_USER` | MySQL username. | unset |
| `MYSQL_PASSWORD` | MySQL password. | unset |
| `MYSQL_DATABASE` | MySQL database name. | unset |
| `MYSQL_CONNECTION_LIMIT` | MySQL pool connection limit. | `3` |
| `MYSQL_AUTO_START` | Set to `false` to disable the predev/prestart auto-start helper. | enabled |
| `MYSQLD_PATH` | Windows path to `mysqld.exe` used by the auto-start helper. | MySQL Server 8.4 default path |
| `MYSQL_DEFAULTS_FILE` | Windows MySQL defaults file used by the auto-start helper. | MySQL Server 8.4 default path |
| `OPENAUTH_ISSUER` | External OpenAuth issuer URL when it differs from the current request origin. | current origin |
| `OPENAUTH_APP_CLIENT_SECRET` | Fallback secret for email-code claim signing. | unset |
| `EMAIL_CODE_CLAIM_SECRET` | Secret for email-code claim signatures. Required in production unless covered by app secret fallback. | development fallback outside production |
| `INTERNAL_AUTH_SECRET` | Secret for internal auth token exchange. Required in production. | generated under `.data/` outside production |

Example `.env`:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=vanillasquared
INTERNAL_AUTH_SECRET=replace-with-a-long-random-secret
EMAIL_CODE_CLAIM_SECRET=replace-with-a-long-random-secret
```

## Development

Start the development server:

```sh
npm run dev
```

`npm run dev` first runs `scripts/start-mysql.js`. The helper checks local MySQL availability and can auto-start a local Windows MySQL Server install. On non-Windows platforms it only reports that auto-start is not configured.

Build the project before checking in changes:

```sh
npm run build
```

Run the production server after building:

```sh
npm run start
```

## Authentication notes

- Login and signup use email-code verification.
- Codes are currently logged to the server console; wire `sendCode`/email delivery to a transactional email provider before production use.
- In development, typing `admin` in the code field can bypass email verification when the admin-code bypass is enabled by the app code.
- Session tokens are stored in HTTP-only cookies named `access_token` and `refresh_token`.
- Production requires `INTERNAL_AUTH_SECRET`, and should use strong secrets for email-code signing.

## Bug reporter notes

- Submitting a bug report requires an authenticated user.
- Accepted upload extensions are `.log`, `.png`, `.txt`, `.json`, and `.html`.
- Uploads are limited to 3 files, 10 MiB per file.
- Uploaded files are stored under `.data/bug-reports`.
- Bug categories are currently `vanilla-squared`, `website`, and `test`.
- Priority and status are server-controlled fields and are guarded against client-supplied writes during report creation.

## Development utilities

The app exposes helpers intended for development/testing contexts:

- `loginInfo()` — inspect the current browser session.
- `logout()` — clear the current browser session.
- `openModal('VARIANT')` — open modal variants on development pages.

## Build artifact and local data

- Next.js build output is written to `.next/`.
- OpenAuth persistence, generated development secrets, and bug uploads are stored in `.data/`.
- Do not commit `.next/`, `.data/`, local environment files, or secrets.
