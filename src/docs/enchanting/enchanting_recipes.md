---
title: Enchanting Recipes
description: The enchanting recipe JSON format and how to add custom recipes.
order: 3
---

Enchanting recipes are data-driven and can be added or replaced by data packs.

Recipe files belong in `data/<namespace>/recipe/<path>.json`. The file path becomes the recipe ID. For example, `data/example/recipe/frost_walker.json` defines `example:frost_walker`.

## JSON format

- **Root object**
  - **`type`**: String. Required. Must be `vsq:enchanting`.
  - **`category`**: String. Required. The recipe book tab: `weapons`, `tools`, `armor`, or `util`.
  - **`group`**: String. Optional. Recipes with the same non-empty group are grouped in the recipe book. Defaults to an empty string.
  - **`description`**: [Text component](https://minecraft.wiki/w/Raw_JSON_text_format). Required. Text shown in the recipe tooltip. A plain string, `text` object, or `translate` object can be used.
  - **`icon`**: Object. Required. Controls how the recipe appears in the recipe book.
    - **`id`**: Item ID. Required. Must be one item, not an item tag.
    - **`components`**: Data component patch. Required, but may be `{}`. Components such as `minecraft:item_name`, `minecraft:lore`, and `minecraft:enchantment_glint_override` can customize the icon.
  - **`material`**: Ingredient object. Required. The ingredient placed in the material slot, normally lapis lazuli.
    - **`item`**: Item ID or item tag. Required unless `fabric:type` is used. Prefix tags with `#`.
    - **`fabric:type`**: Fabric custom ingredient type. Optional alternative to `item`. Other fields depend on that ingredient type.
    - **`count`**: Level-based value. Optional; defaults to `1`.
  - **`ingredients`**: Array. Required. Must contain exactly four ingredient objects. They are matched without regard to order.
    - **Ingredient object**
      - **`item`**: Item ID or item tag. Required unless `fabric:type` is used.
      - **`fabric:type`**: Fabric custom ingredient type. Optional alternative to `item`.
      - **`count`**: Level-based value. Optional; defaults to `1`.
  - **`blocks`**: Array. Optional. Nearby block requirements. Defaults to an empty array.
    - **Block requirement object**
      - **`block`**: Block ID or block tag. Required. Prefix tags with `#`.
      - **`count`**: Level-based value. Optional; defaults to `1`.
  - **`level`**: Level-based value. Required. Experience levels consumed when applying the enchantment.
  - **`enchantment`**: Enchantment ID. Required. The enchantment applied by the recipe.

The icon does not decide which items can be enchanted. Supported items, maximum levels, and incompatible enchantments come from the enchantment's own definition and are enforced automatically.

`level_multiplier` is obsolete and causes the recipe to fail. Use `level` instead.

### Categories

| Value | Intended recipes |
| --- | --- |
| `weapons` | Swords, bows, tridents, and other weapons |
| `tools` | Pickaxes, axes, shovels, and similar tools |
| `armor` | Armor and wearable equipment |
| `util` | General-purpose enchantments |

The category only controls recipe book organization. It does not change which items accept the enchantment.

### Ingredient objects

An exact item:

```json
{
  "item": "minecraft:diamond",
  "count": 2
}
```

Any item in a tag:

```json
{
  "item": "#minecraft:coals"
}
```

Omitting `count` uses one item. The material and all four cross ingredients use this same format.

### Block requirement objects

```json
{
  "block": "#vsq:enchantment_blocks",
  "count": 6
}
```

For a block tag, all matching nearby blocks count toward the requirement. Multiple entries in `blocks` are separate requirements and must all be met.

### Level-based values

`material.count`, `ingredients[].count`, `blocks[].count`, and `level` use Minecraft's `LevelBasedValue` format.

A number stays constant:

```json
"count": 3
```

A linear value scales with the enchantment level being applied:

```json
"count": {
  "type": "minecraft:linear",
  "base": 2,
  "per_level_above_first": 3
}
```

| Target level | Result |
| --- | ---: |
| I | 2 |
| II | 5 |
| III | 8 |

Other value types supported by Minecraft's `LevelBasedValue` codec can also be used. Results are rounded down. Item counts are clamped to valid stack sizes, block counts have a minimum of `1`, and experience costs have a minimum of `0`.

## Creating a custom recipe

This example adds a Frost Walker recipe.

### 1. Create the recipe file

Create `data/example/recipe/frost_walker.json` in your data pack:

```json
{
  "type": "vsq:enchanting",
  "category": "armor",
  "group": "boots",
  "description": "Adds Frost Walker to compatible boots.",
  "icon": {
    "id": "minecraft:diamond_boots",
    "components": {
      "minecraft:item_name": {
        "text": "Frost Walker",
        "color": "aqua"
      },
      "minecraft:enchantment_glint_override": true
    }
  },
  "material": {
    "item": "minecraft:lapis_lazuli",
    "count": {
      "type": "minecraft:linear",
      "base": 3,
      "per_level_above_first": 2
    }
  },
  "ingredients": [
    {
      "item": "minecraft:packed_ice",
      "count": 2
    },
    {
      "item": "minecraft:snow_block"
    },
    {
      "item": "minecraft:blue_ice"
    },
    {
      "item": "minecraft:leather_boots"
    }
  ],
  "blocks": [
    {
      "block": "#vsq:enchantment_blocks",
      "count": 6
    }
  ],
  "level": {
    "type": "minecraft:linear",
    "base": 6,
    "per_level_above_first": 4
  },
  "enchantment": "minecraft:frost_walker"
}
```

Use an existing enchantment ID, or the ID of a custom enchantment supplied by your data pack or mod. Keep exactly four entries in `ingredients`.

### 2. Load and test it

Run `/reload`. Invalid recipes are skipped and an error is written to the server log.

Unlock the recipe for yourself:

```mcfunction
/recipe give @s example:frost_walker
```

Open an enchanting table with compatible boots and verify its ingredients, block requirement, level cost, and upgrades.

### 3. Add it to recipe-book loot

The recipe works without a loot tag, but players will only get it through commands. To include it in the default Enchanting Recipe Book pool, create `data/vsq/tags/recipe/default.json`:

```json
{
  "values": [
    "example:frost_walker"
  ]
}
```

For more controlled distribution, add it to a specific Vanilla Squared recipe tag such as `vsq:fishing`, `vsq:ancient_city_chest`, or `vsq:villager/librarian/snow`. Entries must be direct recipe IDs; nested `#tag` references are not supported.
