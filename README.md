<h1 align="center">
  <br>
  Vanilla² Website
  <br>
</h1>

<h4 align="center">The official website for Vanilla², built with Next.js to present the mod, its features, documentation links, downloads, authentication, and project resources.</h4>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16.2.10-black?style=flat-square">
  <img alt="React" src="https://img.shields.io/badge/React-19.2.4-blue?style=flat-square">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8?style=flat-square">
  <img alt="OpenAuth" src="https://img.shields.io/badge/OpenAuth-0.4.3-purple?style=flat-square">
</p>

## Overview

Vanilla² Website is the public web presence for the Vanilla² Minecraft Fabric mod. It introduces the mod's combat and progression overhaul, highlights weapons, armor, enchantments, and combat utility features, and provides direct paths to downloads, documentation, issue reporting, authentication, and project repositories.

## Features

- Presents Vanilla² with a landing page, feature sections, navigation, and project links.
- Highlights rebalanced combat, expanded armor scaling, new attributes, fishing rod combat, the extended armor HUD, and the Sulfur Cube.
- Summarizes the recipe-based enchanting overhaul and showcases new special enchantments.
- Provides quick access to Modrinth downloads, GitHub resources, documentation, and bug reporting.
- Includes reusable UI components for buttons, cards, tags, headers, footers, modals, search, and text inputs.
- Includes OpenAuth-based login, callback, token, authorization, status, and logout routes.
- Uses Next.js App Router, React, Tailwind CSS, Hono, OpenAuth, and MySQL for a modern full-stack website.

## Authentication and development tools

Vanilla² Website includes authentication routes and development helpers for testing local sessions.

- `loginInfo()` gets information about the current browser session.
- `logout()` logs out of the current browser session.
- `openModal('VARIANT')` opens a modal variant in development pages.
- Typing `admin` in the login code field bypasses email verification for local development.

## Pages and components

Vanilla² Website keeps the application structure modular and reusable.

- `src/app/page.js` defines the main landing page.
- `src/app/layout.js` defines global metadata, fonts, and document layout.
- `src/app/login/page.js` and `src/app/signup/page.js` define authentication entry pages.
- `src/app/api/auth/status/route.js` and `src/app/api/auth/logout/route.js` expose session status and logout behavior.
- `src/auth/` contains OpenAuth, issuer, provider, permissions, and SQL helpers.
- `src/components/` contains shared UI components such as buttons, cards, headers, footers, modals, search, and form inputs.
- `src/template-pages/` contains reusable default and error page templates.
- `scripts/start-mysql.js` starts the local MySQL service used by development and production scripts.

## Requirements

- Node.js compatible with Next.js 16.
- npm or a compatible package manager.
- MySQL available through the included development startup script or a compatible local setup.

## Installation

1. Clone the repository.
2. Install dependencies.

```sh
npm install
```

3. Start the development server.

```sh
npm run dev
```

4. Open the local URL printed by Next.js in your browser.

## Development

Build the project before checking changes into the website.

```sh
npm run build
```

Run the production server after building.

```sh
npm run start
```

The build output is written to `.next/`.
