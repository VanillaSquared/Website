<h1 align="center">Vanilla² Website</h1>

<h4 align="center">Official Next.js website for the Vanilla² Minecraft Fabric mod.</h4>

## Overview

The site contains the Vanilla² landing page, news, documentation, a markdown-backed bug tracker, and reusable UI templates. News articles, documentation, and bug reports are stored in the repository and rendered from Markdown without accounts or a database.

## Tech stack

- [Next.js](https://nextjs.org/) App Router
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/) v4 via PostCSS
- [gray-matter](https://github.com/jonschlinkert/gray-matter) and MDX for repository content

## Content

### Documentation

Add Markdown files under `src/docs/`. Their paths determine their `/docs` routes.

### News

Add Markdown files under `src/news/`. Supported frontmatter fields are:

```yaml
---
title: Article title
tag: patchnotes
image: "@/assets/news/article-image.svg"
imageAlt: Description of the article image
showImageOnPage: false
author: Author name
authorImage: "@/assets/news/author-image.svg"
published_date: 30/07/2026
private: false
---
```

`published_date` is required and must use `dd/mm/yyyy`. It controls the article's displayed publication date and newest-first ordering. `private: true` excludes the article from every news listing and route. Images must be stored under `src/assets/news/`.

### Bug reports

Add Markdown files under `src/bugs/`. The filename is used as the bug ID unless an `id` is supplied. All former bug reporter fields live in frontmatter:

```yaml
---
id: vsq-1
title: Short issue summary
author: Reporter name
created_date: 30/07/2026
category: vanilla-squared
priority: Medium
status: Confirmed
fixed: false
affectedVersions:
  - 2.12.0-snapshot.1
fixedVersion: null
---

Describe the issue and reproduction steps here.
```

`created_date` is required and must use `dd/mm/yyyy`. Supported categories are `vanilla-squared` and `website`. Supported priorities are `Low`, `Medium`, `High`, `Code Red`, and `unset`. Supported statuses are `Fixed`, `Unfixable`, `Unconfirmed`, `Confirmed`, `Works as intended`, and `Vanilla bug`.

## Development

```sh
npm install
npm run dev
```

Verify a production build with:

```sh
npm run build
```
