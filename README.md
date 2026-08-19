<h1 align="center">
  <br>
  Vanilla² Website
  <br>
</h1>

<h4 align="center">Official Astro website for the Vanilla² Minecraft Fabric mod.</h4>

<p align="center">
  <img alt="Astro" src="https://img.shields.io/badge/Astro-7-000000?style=flat-square&logo=astro&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white">
  <img alt="Version" src="https://img.shields.io/badge/version-0.2.2-blue?style=flat-square">
  <img alt="License" src="https://img.shields.io/badge/license-BLOBSFER--1.0-6B4EFF?style=flat-square">
</p>

## Overview

The Vanilla² website contains the mod's landing page, news, documentation, bug tracker, and reusable UI templates. News articles and documentation are stored in the repository and rendered from Markdown. Bug reports use the website's private issue backend.

## License

This project uses the BLOBSFER Licence 1.0. It permits private use and contributions to the official repository, but does not permit independent publication, distribution, or deployment. See [LICENSE](LICENSE).

## Features

- Landing page for the Vanilla² Minecraft Fabric mod.
- Repository-backed Markdown documentation.
- Repository-backed news articles with private-draft support.
- Bug report form backed by a private issue backend.
- Reusable UI component and page templates.

## Tech stack

- [Astro](https://astro.build/) pages and server routes
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/) v4 via Vite
- [gray-matter](https://github.com/jonschlinkert/gray-matter) and MDX for repository content

## Content

### Documentation

Add Markdown files under `src/docs/`. Their paths determine their `/docs` routes.

### News

Add Markdown files under `news/`. Supported frontmatter fields are:

```yaml
---
title: Article title
tag: announcements
image: "@cdn/news/article-image.svg"
imageAlt: Description of the article image
showImageOnPage: false
author: Author name
authorImage: "@cdn/news/author-image.svg"
published_date: 30/07/2026
private: false
---
```

`published_date` is required and must use `dd/mm/yyyy`. It controls the article's displayed publication date and newest-first ordering. `private: true` excludes the article from the statically generated public news listing and pages. Images must be stored under `cdn/news/` and are referenced directly as `/cdn/...` at runtime.

### Bug reports

Bug reports are created from the form on `/bugs` and loaded through the cached `/api/bugs` endpoint. Server-side access to the private issue backend requires a fine-grained token in the `github` environment variable. The serverless rate limiter intentionally uses in-memory state and does not require additional environment variables.

## Development

Use Node.js 22.12 or newer, then install dependencies.

```sh
npm install
```

Start the development server.

```sh
npm run dev
```

Build the production website.

```sh
npm run build
```
