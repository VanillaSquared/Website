---
title: Recipe Tags
description: Data-pack tags used to group recipes for loot generation.
order: 4
---

Recipe tags are Vanilla Squared data-pack files that group recipe IDs. They work with all recipe types, including crafting, smelting, smithing, and `vsq:enchanting`.

Place them at:

```text
data/<namespace>/tags/recipe/<path>.json
```

For example, `data/example/tags/recipe/treasure.json` defines `example:treasure`:

```json
{
  "replace": false,
  "values": [
    "minecraft:bread",
    "vsq:protection",
    "#example:rare_recipes",
    {
      "id": "#compat:extra_recipes",
      "required": false
    }
  ]
}
```

- A recipe ID adds that recipe.
- A value beginning with `#` includes another recipe tag.
- `replace: false` merges values supplied by multiple data packs. It is the default.
- `replace: true` clears values loaded for that tag by lower-priority packs.
- The object form supports `required: false`, which suppresses the warning if a referenced tag is missing.

Nested tags are resolved recursively. Cycles are ignored, and duplicate recipes are removed while keeping their first occurrence.

Recipe tags are separate from Minecraft's item, block, and enchantment tags. They are loaded by Vanilla Squared from the singular `tags/recipe` directory.

## Adding to a Vanilla Squared tag

Use the same namespace and path as the existing tag. This adds a recipe to ancient city Enchanting Recipe Book loot:

```text
data/vsq/tags/recipe/ancient_city_chest.json
```

```json
{
  "replace": false,
  "values": [
    "example:frost_walker"
  ]
}
```

An unknown or unloaded recipe ID can remain in the tag, but [`vsq:randomize_recipes`](/docs/technical/randomize_recipes_loot_function) skips it when selecting loot.

## Recipe item component

The loot function stores selected recipes in Minecraft's `minecraft:recipes` item component:

```json
{
  "minecraft:recipes": [
    "example:frost_walker"
  ]
}
```

The component can hold multiple recipe IDs and displays them in the item tooltip. `vsq:randomize_recipes` writes one randomly selected recipe and replaces any existing value of this component.
