---
title: Recipe Tags
description: The enchanting recipe JSON format and how to add custom recipes.
order: 4
---

Recipe tags are located at:

```text
data/<namespace>/tags/recipe/<path>.json
```

Example:

```json
{
  "replace": false,
  "values": [
    "minecraft:bread",
    "vsq:protection",
    "#example:other_recipes",
    {
      "id": "minecraft:iron_ingot_from_smelting",
      "required": false
    }
  ]
}
```

They support:

- Any recipe type, including crafting, smelting, smithing, and enchanting.
- Nested recipe tags using `#namespace:path`.
- Datapack merging and `"replace": true`.
- Optional tag references using `"required": false`.

## Recipe component

Generated items use Minecraft’s vanilla recipes component:

```json
"minecraft:recipes": [
  "<namespace>:"
]
```

The component supports multiple recipes, and the tooltip displays each listed recipe.
