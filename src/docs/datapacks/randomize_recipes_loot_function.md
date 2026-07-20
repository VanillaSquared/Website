---
title: Randomize Recipes Loot Function
description: Select a random recipe from a recipe tag and store it on generated loot.
order: 5
---

Vanilla Squared also adds a new loot function which allows you to randomize recipes in the recipe book. This can be neatly used for datapacks that have custom unlockable features hidden in custom/vanilla structures. When implementing this I imagined that you can use this to make every recipe in the game hidden in a structure, requiring the player to explore the world and progress their way through the game to obtain the items required to beat the game. However I assume you might have something else on your mind.


`vsq:randomize_recipes` selects one loaded recipe from a [recipe tag](/docs/datapacks/recipe_tags) and writes it to the item's `minecraft:recipes` component.

## Format

```json
{
  "function": "vsq:randomize_recipes",
  "tag": "example:treasure"
}
```

`tag` is the recipe tag ID without a leading `#`. Standard loot-function `conditions` are also supported.

Selection is uniform after missing or unloaded recipes are filtered out. The function replaces the item's existing `minecraft:recipes` component. If the tag is missing, empty, or has no loaded recipes, the loot stack is removed and a warning is written to the server log.

## Loot-table entry

This entry creates an Enchanting Recipe Book containing one recipe from `example:treasure`:

```json
{
  "type": "minecraft:item",
  "name": "vsq:enchant_recipe",
  "functions": [
    {
      "function": "vsq:randomize_recipes",
      "tag": "example:treasure"
    }
  ]
}
```

Put the entry in a normal loot-table pool. Its weight, conditions, and pool rolls control whether the book drops; the function only chooses which recipe it contains.

The function accepts every loaded recipe type and can be used on any item. However, `vsq:enchant_recipe` only unlocks `vsq:enchanting` recipes. Keep tags used for Enchanting Recipe Books limited to enchanting recipes.

To add a recipe to Vanilla Squared's existing enchanted-book replacements, extend the appropriate built-in tag instead of replacing the full loot table. See [Add the recipe to loot](/docs/datapacks/enchanting/enchanting_recipes#add-the-recipe-to-loot).
