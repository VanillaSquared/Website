---
title: 📘Introduction
description: Guides and reference material for configuring and using Vanilla².
order: 1
---

## Welcome

Documentation pages are discovered automatically from Markdown files in `src/docs`. Use the navigation to browse a guide, or search the documentation from the site header.

## Authoring a page

Add a `.md` file and optionally begin it with frontmatter:

```md
---
title: Items
description: Configure custom item behavior.
order: 20
---

## First section

Standard Markdown and **GitHub-flavored Markdown** are supported.

<Card title="A registered component" description="Only components in the docs registry are available.">
  Native <strong>HTML</strong> can be used inside registered components.
</Card>
```

Nested folders create navigation groups. A folder is a clickable category when it contains a Markdown file with the same name. For example, `configuration/configuration.md` becomes `/docs/configuration`, while `configuration/items.md` becomes `/docs/configuration/items`.

<Card title="Safe, reusable components" description="Button, Card, and CodeBlock are registered for documentation authors.">
  <Button href="/components" variant="tertiary">Browse components</Button>
</Card>

## Component registry

Approved components are maintained centrally in `src/docs/components.js`. Documentation files cannot import arbitrary modules.

### Headings and links

Headings receive stable anchor IDs and are added to the “On this page” navigation. Tables, task lists, links, and fenced code blocks are supported through GitHub-flavored Markdown.

Create an inline link by putting the visible text in square brackets followed by the URL in parentheses: `[this is a hidden link](https://google.com)`. For example: [this is a hidden link](https://google.com).

Use `---` on its own line to render the shared `Separator` component.

---

Use `-#` at the beginning of a standalone line for small, muted subheader text.

-# Subheaders provide secondary context without adding an item to the page navigation.
