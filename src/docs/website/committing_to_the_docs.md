---
title: Committing to the Docs
description: How to make, check and submit a documentation change.
order: 3
---

The docs are part of the [website repository](https://github.com/VanillaSquared/Website). A docs change goes through the same build and pull request process as every other website change.

## Setting up the Repository

Fork the repository on GitHub if you don't have write access, then clone your fork:

```shell
git clone https://github.com/<your-name>/Website.git
cd Website
npm install
```

Create a branch for your change. Do not make unrelated changes on the same branch.

```shell
git switch -c docs/short-description
```

If you already have the repository, update your default branch before creating the new branch:

```shell
git switch main
git pull
git switch -c docs/short-description
```

## Changing the Docs

Documentation files are under `src/docs/`. The folder and filename decide the URL. For example:

```text
src/docs/datapacks/recipe_tags.md -> /docs/datapacks/recipe_tags
```

A file with the same name as its folder becomes the category page:

```text
src/docs/website/website.md -> /docs/website
```

Start every docs file with its header:

```yaml
---
title: Page Title
description: A short explanation shown in search results.
order: 1
---
```

Use an existing page in the same category as a formatting reference. Keep names used by the mod exact, include full examples when documenting a format and link to another docs page instead of explaining the same thing twice. The [Markdown guide](./markdown) lists the supported syntax and components.

Images belong under `src/assets/`. Add SVG files when making new website graphics; don't put generated SVG markup inside a component. Reference docs images like this:

```md
![Useful description](@/assets/docs/example.svg)
```

## Checking the Change

Build the full website before committing:

```shell
npm run build
```

The build checks that every Markdown file can be rendered. It also catches invalid dates, news tags, bug fields, image paths and duplicate routes.

After the build passes, review only your changes:

```shell
git status --short
git diff
```

Make sure no private files, `.env` files or unrelated changes are included.

## Committing

Add the files you changed instead of adding the entire repository without checking it:

```shell
git add src/docs/website/markdown.md
git commit -m "docs: update markdown guide"
```

Use a short commit message which says what changed. `docs: add bug report guide` is useful, `updated stuff` isn't.

Push your branch:

```shell
git push -u origin docs/short-description
```

Open a pull request into the website repository's default branch. In the description, say what was changed and mention that `npm run build` passes. If the pull request fixes a bug report, link it there as well.

If review asks for changes, update the same branch, run the build again, commit and push. The pull request updates automatically; you don't need to open another one.
