---
title: Markdown
description: The supported Markdown syntax, website components and header fields.
order: 1
---

The website uses `.md` files for docs, news articles and bug reports. Docs are stored in `src/docs/`, news articles in `src/news/` and bug reports in `src/bugs/`.

The path and filename decide the page URL. For example, `src/docs/website/markdown.md` becomes `/docs/website/markdown`. Use lowercase snake case for filenames. A category page has the same name as its folder, meaning `src/docs/website/website.md` is the page for the `website` category.

## Normal Markdown

You can use headings, text formatting, links, images, quotes, lists, tables and code blocks. The website also supports GitHub flavored Markdown, including task lists and strikethrough.

~~~markdown
# Main Heading
## Heading
### Smaller Heading
-# Small and quiet text.

**Bold**, *italic*, ~~strikethrough~~ and `inline code`.

- List item
- Another item

1. First item
2. Second item

> Quote

[Docs link](./committing_to_the_docs)
[External link](https://github.com/VanillaSquared/Website)

![Image description](@/assets/docs/example.svg)

| Field | Required |
| --- | --- |
| title | No |

```json
{
  "example": true
}
```
~~~

`-#` is a website specific subheader. `---` outside of the file header becomes a separator. Relative links beginning with `./` are resolved from the current article. Images from the repository use an `@/assets/...` path.

Do not add `import` or `export` statements to Markdown files. Components are already made available by the website.

## Components

You can use the website components directly in Markdown. Component names are case-sensitive. The easiest place to check their current design is the [component page](/components).

### Content components

`Card` puts content inside a card. `title`, `description`, `footer`, `preset` and `size` are its main fields.

```mdx
<Card title="Important" description="Read this before changing the file." preset="homepage">
  The card can also contain normal Markdown.
</Card>
```

`Button` can link to another page. Available variants are `primary`, `secondary`, `tertiary`, `blue`, `purple`, `blurple`, `red`, `danger`, `green` and `locked`. Available sizes are `sm`, `md`, `icon` and `iconButton`.

```mdx
<Button href="https://github.com/VanillaSquared/Website" external variant="blue">
  Open GitHub
</Button>
```

`Tag` displays a small label. Its variants are `default`, `subtle`, `accent`, `low`, `medium`, `high`, `codeRed` and `locked`.

```mdx
<Tag variant="accent">Website</Tag>
```

`Separator` adds the same separator as `---`.

```mdx
<Separator />
```

`CodeBlock` is normally created by a fenced code block, but can also be used directly with `code` and `language`.

```mdx
<CodeBlock code={'npm run build'} language="shell" />
```

`Markdown` renders a short Markdown string inside a component.

```mdx
<Markdown value={'**Bold text** and `code`'} />
```

### Data components

`JsonTree` and `JsonTreeItem` are used to explain JSON formats. A tree item accepts `type`, `contents`, `collapsible` and `defaultOpen`. Available type icons are `array`, `boolean`, `byte`, `double`, `float`, `int`, `integer`, `long`, `number`, `object`, `short` and `string`. Multiple types can be separated by commas.

```mdx
<JsonTree>
  <JsonTreeItem type="object" contents="The root object.">
    <JsonTreeItem type="string" contents="**name**: The displayed name." />
    <JsonTreeItem type="boolean" contents="**enabled**: Whether this is enabled." />
  </JsonTreeItem>
</JsonTree>
```

`JsonTypeIcon` displays one of those type icons on its own.

```mdx
<JsonTypeIcon type="string, number" title="Allowed value types" />
```

`FileTree` displays folders and files. Every node needs a unique `id` and a `label`. Set `type` to `file` for files; everything else is treated as a folder.

```mdx
<FileTree nodes={[
  {
    id: 'docs',
    label: 'docs',
    children: [
      { id: 'example', label: 'example.md', type: 'file' }
    ]
  }
]} />
```

Normal Markdown tables use the website `Table` component automatically. You can also use `<Table>` directly when you need to write the table as HTML.

### Interactive components

The following components are also available, although they are mainly useful for component examples rather than normal articles:

- `Checkmark`: a check, cross or unconfirmed mark. The useful fields are `checked`, `defaultChecked`, `interactive`, `size`, `variant` and `icon`.
- `CollapsibleCategory`: collapsible content with `title`, `id`, `icon` and `defaultOpen`.
- `ColorPicker`: a color input with `label`, `defaultValue`, `locked` and `disabled`.
- `FileUpload`: a file input with `label`, `description`, `fileTypes`, `maxFileSize`, `maxFiles`, `multiple`, `compact` and `locked`.
- `MultiSelect`: a multiple choice input with `label`, `options`, `defaultValue`, `min`, `max` and `locked`.
- `SearchBar`: a search input with `placeholder`, `defaultValue`, `action`, `showPreview`, `variant` and `locked`.
- `Tabs`: a tab bar with `tabs`, `value`, `line` and `inset`. Changing tabs requires page code, so docs should only use this for a static example.
- `TextInput`: a text input with `label`, `sampleText`, `defaultValue`, `type`, `lines`, `maxLines`, `maxCharacters`, `filter` and `locked`.
- `Toggle`: a toggle with `label`, `description`, `defaultChecked`, `disabled` and `locked`.
- `CategoryNavigation`: the nested navigation used by the docs sidebar. It accepts `items` and `selectedId`, but you should normally let the docs page create this automatically.

Here is a small example which doesn't require any page code:

```mdx
<CollapsibleCategory id="example-fields" title="Example fields" defaultOpen>
  <Toggle label="Enabled" defaultChecked />
  <TextInput label="Name" sampleText="Example" />
</CollapsibleCategory>
```

## File Headers

The header at the top of a Markdown file is called frontmatter. It starts and ends with `---`. Header field names are case-sensitive.

### Docs

```yaml
---
title: Markdown
description: The supported Markdown syntax, website components and header fields.
order: 1
sidebarCard:
  enabled: true
  title: Quick information
  description: A short description.
  image: "@/assets/docs/example.svg"
  imageAlt: Description of the image
  imageDisplay: item
  details:
    - label: Type
      value: Guide
---
```

- `title`: The page name. If left out, the filename is turned into a title.
- `description`: Used by search and as the page description.
- `order`: Controls the position in the docs sidebar. Lower numbers are shown first.
- `sidebarCard`: Adds an information card beside the article. Leave it out when no card is needed.
- `sidebarCard.enabled`: Set this to `false` to hide the card.
- `sidebarCard.title`: The card title. Defaults to `Quick information`.
- `sidebarCard.description`: Text shown in the card.
- `sidebarCard.image`: An image stored under `src/assets/`.
- `sidebarCard.imageAlt`: A description of the image.
- `sidebarCard.imageDisplay`: Use `item` for item images. Every other value uses the normal image style.
- `sidebarCard.details`: A list of label and value rows.

Only `title`, `description`, `order` and `sidebarCard` are read by the docs. Unknown fields do nothing.

### News

```yaml
---
title: Website Patchnotes 29/07/2026
tag: patchnotes
image: "@/assets/news/generic_website_image.png"
imageAlt: Website patchnotes
showImageOnPage: false
author: PainterFlow11
authorImage: "@/assets/news/generic_website_image.png"
published_date: 29/07/2026
private: false
---
```

- `title`: The article title. If left out, the filename is turned into a title.
- `tag`: One or more comma separated tags. Available tags are `patchnotes`, `announcement` and `other`. It defaults to `other`.
- `image`: The article image. It has to be stored under `src/assets/news/`.
- `imageAlt`: A description of the article image.
- `showImageOnPage`: Whether the image is also shown at the top of the article. Defaults to `true` and has to be `true` or `false`.
- `author`: The displayed author name.
- `authorImage`: The author's image. It also has to be stored under `src/assets/news/`.
- `published_date`: Required and written as `dd/mm/yyyy`. This also controls the order on the news page.
- `private`: Set this to `true` to remove the article from the news page and its route.

### Bugs

```yaml
---
id: vsq-3
title: Short explanation of the problem
author: PainterFlow11
created_date: 30/07/2026
category: vanilla-squared
priority: Medium
status: Unconfirmed
fixed: false
affectedVersions:
  - 2.12.0-snapshot.1
fixedVersion: null
---
```

- `id`: The public bug ID. Use `vsq-` for Vanilla Squared and `web-` for website bugs, followed by the next unused number. If left out, the filename is used.
- `title`: A short explanation of the bug.
- `author`: The name of the person who reported it. Defaults to `Unknown`.
- `created_date`: Required and written as `dd/mm/yyyy`.
- `category`: Required. Available categories are `vanilla-squared` and `website`.
- `priority`: Available priorities are `Low`, `Medium`, `High`, `Code Red` and `unset`. It defaults to `unset`.
- `status`: Available statuses are `Fixed`, `Unfixable`, `Unconfirmed`, `Confirmed`, `Works as intended` and `Vanilla bug`. It defaults to `Unconfirmed`.
- `fixed`: `true` or `false`. A status of `Fixed` also marks the report as fixed.
- `affectedVersions`: A list of affected versions. It becomes `Unknown` when empty.
- `fixedVersion`: The version containing the fix, or `null` when it has not been fixed.

The build checks dates, tags, bug categories, priorities, statuses and image paths. If one of those is wrong, `npm run build` will tell you which file needs to be fixed.
