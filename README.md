<h1 align="center">Vanilla² Website</h1>

<h4 align="center">Official Next.js website for the Vanilla² Minecraft Fabric mod.</h4>

## Overview

The site contains the Vanilla² landing page, news, documentation, a bug tracker, and reusable UI templates. News articles and documentation are stored in the repository and rendered from Markdown. Bug reports use the website's private issue backend.

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
image: "@cdn/news/article-image.svg"
imageAlt: Description of the article image
showImageOnPage: false
author: Author name
authorImage: "@cdn/news/author-image.svg"
published_date: 30/07/2026
private: false
---
```

`published_date` is required and must use `dd/mm/yyyy`. It controls the article's displayed publication date and newest-first ordering. `private: true` excludes the article from every news listing and route. Images must be stored under `cdn/news/`.

### Bug reports

Bug reports are created from the form on `/bugs` and loaded through `/api/bugs`. Server-side access to the private issue backend requires a fine-grained token in the `github` environment variable.

## Development

```sh
npm install
npm run dev
```

Verify a production build with:

```sh
npm run build
```
