---
title: Enchanting Recipes
description: The enchanting recipe format and how to distribute custom recipes as loot.
order: 3
---

With the help of Datapacks, you are able to create your own custom recipe for the enchanting table.
Custom enchanting recipes allow you to define things like block requirements, item requirements, level requirements and the rewarding enchantment. You could use this for its intended purposes, aka enchanting, but especially with the ability to easily include block and level requirements, you can probably create a lot of cool things.

Enchanting recipes are data-pack recipes. Place them at:

```text
data/<namespace>/recipe/<path>.json
```

The file `data/example/recipe/frost_walker.json` has the recipe ID `example:frost_walker`.

## JSON format

<JsonTree>
  <JsonTreeItem type="object" contents="The recipe object.">
    <JsonTreeItem type="string" contents="**type**: Must be `vsq:enchanting`." />
    <JsonTreeItem type="string" contents="**category**: `armor`, `weapons`, `tools`, or `util`. Controls the recipe-book tab." />
    <JsonTreeItem type="string" contents="**group** *(optional)*: Groups similar recipes into one recipe-book entry." />
    <JsonTreeItem type="text component" contents="**description**: Text shown when the recipe is hovered." />
    <JsonTreeItem type="object" contents="**icon**: Recipe-book icon. This does not control which items can be enchanted.">
      <JsonTreeItem type="string" contents="**id**: An item ID. Item tags are not accepted." />
      <JsonTreeItem type="object" contents="**components** *(optional)*: Data components applied to the icon." />
    </JsonTreeItem>
    <JsonTreeItem type="object" contents="**material**: The ingredient in the middle material slot.">
      <JsonTreeItem type="string" contents="**item**: An item ID or item tag beginning with `#`." />
      <JsonTreeItem type="integer or object" contents="**count** *(optional)*: A level-based value. Defaults to `1`." />
    </JsonTreeItem>
    <JsonTreeItem type="array" contents="**ingredients**: Exactly four ingredients for the four outer slots. Their order does not matter.">
      <JsonTreeItem type="object" contents="An ingredient.">
        <JsonTreeItem type="string" contents="**item**: An item ID or item tag beginning with `#`." />
        <JsonTreeItem type="integer or object" contents="**count** *(optional)*: A level-based value. Defaults to `1`." />
      </JsonTreeItem>
    </JsonTreeItem>
    <JsonTreeItem type="array" contents="**blocks** *(optional)*: Blocks required within two blocks of the enchanting table.">
      <JsonTreeItem type="object" contents="A block requirement.">
        <JsonTreeItem type="string" contents="**block**: A block ID or block tag beginning with `#`." />
        <JsonTreeItem type="integer or object" contents="**count** *(optional)*: A level-based value. Defaults to `1`." />
      </JsonTreeItem>
    </JsonTreeItem>
    <JsonTreeItem type="integer or object" contents="**level**: A level-based value for the number of experience levels consumed." />
    <JsonTreeItem type="string" contents="**enchantment**: The enchantment applied by the recipe." />
  </JsonTreeItem>
</JsonTree>

Counts and the level cost are evaluated against the enchantment level being applied. Results are rounded down. Item counts are clamped to valid stack sizes, block counts have a minimum of 1, and level costs have a minimum of 0.

The old `level_multiplier` field is not supported. Use `level` instead.

## Example recipe

Create `data/example/recipe/frost_walker.json`:

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
    "count": 3
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

Use an existing enchantment ID or one added by another data pack or mod. Supported items, maximum levels, and incompatibilities come from that enchantment's definition.

Run `/reload`, then grant the recipe for testing:

```mcfunction
/recipe give @s example:frost_walker
```

Invalid recipes are skipped and reported in the server log.

## Add the recipe to loot

Vanilla Squared replaces enchanted-book loot with Enchanting Recipe Books. Each loot source selects a recipe from a [recipe tag](/docs/datapacks/recipe_tags).

To add the example recipe to ancient city chests, create:

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

Using the `vsq` namespace here intentionally adds to Vanilla Squared's existing tag. Do not set `replace` to `true` unless you want to remove its default recipes.

Common distribution tags are:

| Loot source | Recipe tag |
| --- | --- |
| Unmapped loot tables | `vsq:default` |
| Ancient city | `vsq:ancient_city_chest` |
| Mineshaft | `vsq:mineshaft_chest` |
| Monster room | `vsq:monster_room_chest` |
| Stronghold library | `vsq:stronghold_library_chest` |
| Trial chamber rewards | `vsq:trial_chamber_vault` |
| Fishing treasure | `vsq:fishing` |
| Piglin bartering | `vsq:piglin_bartering` |
| Librarian fallback | `vsq:villager/librarian/default` |

Other built-in tags can be found under `data/vsq/tags/recipe` in the mod file. All valid recipes in a tag have an equal chance of being selected.

For a new loot-table entry, use the [`vsq:randomize_recipes` loot function](/docs/datapacks/randomize_recipes_loot_function) instead.

### Enchanting Recipe Books

The `vsq:enchant_recipe` item only unlocks recipes of type `vsq:enchanting`. Recipe tags and `vsq:randomize_recipes` can contain any recipe type, but a non-enchanting recipe on this item is rejected and the book is not consumed.
