---
title: Enchanting Recipes
description: The enchanting recipe JSON format and how to add custom recipes.
order: 3
---

Enchanting recipes are loaded from data packs. Place them at **data/namespace/recipe/path.json**. The namespace and path become the recipe ID.

## JSON format

<JsonTree>
  <JsonTreeItem type="object" contents="The root object.">
    <JsonTreeItem type="string" contents="**type**: In this case, it's `vsq:enchanting`." />
    <JsonTreeItem type="string" contents="**category**: one of `armor`, `weapons`, `tools`, `util` -- category in the enchanting tables recipe book" />
    <JsonTreeItem type="string" contents="**group** *(optional)*: Group multiple recipes with the same group id together, this will display them as one in the recipe book" />
    <JsonTreeItem type="object" contents="**description**: [Text Component](https://minecraft.wiki/w/Text_component_format) -- the text shown when hovering over the enchant book in the UI" />
    <JsonTreeItem type="object" contents="**icon**: The icon in the recipe book.">
      <JsonTreeItem type="string" contents="**id**: [Item ID](https://minecraft.wiki/w/Java_Edition_data_values#Items), Item Tags are not accepted." />
      <JsonTreeItem type="object" contents="**components**: [Data Components](https://minecraft.wiki/w/Data_component_format) which are applied to the icon in the recipe book." />
    </JsonTreeItem>
    <JsonTreeItem type="boolean" contents="**show_notification** *(optional)*: Determines if a notification is shown when unlocking the recipe. Defaults to `true`." />
    <JsonTreeItem type="object" contents="**material**: The material which is placed in the middle slot of the cross.">
      <JsonTreeItem type="string" contents="**item**: [Item ID](https://minecraft.wiki/w/Java_Edition_data_values#Items) or an [Item Tag](https://minecraft.wiki/w/Item_tag_(Java_Edition)) beginning with `#`." />
      <JsonTreeItem type="integer, object" contents="**count** *(optional)*: A [level-based value](https://minecraft.wiki/w/Enchantment_definition#Level-based_value). Defaults to 1." />
    </JsonTreeItem>
    <JsonTreeItem type="array" contents="**ingredients**: Requires Exactly 4 Ingredients, only 1 out of the 4 is shown here. The order does not matter. They are the 4 cross slots around the middle slot where the lapis usually goes.">
      <JsonTreeItem type="object" contents="">
        <JsonTreeItem type="string" contents="**item**: [Item ID](https://minecraft.wiki/w/Java_Edition_data_values#Items) or an [Item Tag](https://minecraft.wiki/w/Item_tag_(Java_Edition)) beginning with `#`" />
        <JsonTreeItem type="integer, object" contents="**count** *(optional)*: A [level-based value](https://minecraft.wiki/w/Enchantment_definition#Level-based_value). Defaults to 1." />
      </JsonTreeItem>
    </JsonTreeItem>
    <JsonTreeItem type="array" contents="**blocks** *(optional)*: Required Blocks to be placed around the enchantment table in a 2 block range in all directions.">
      <JsonTreeItem type="object" contents="">
        <JsonTreeItem type="string" contents="**block**: [Block ID](https://minecraft.wiki/w/Java_Edition_data_values#Blocks) or a [Block Tag](https://minecraft.wiki/w/Block_tag_(Java_Edition)) beginning with `#`" />
        <JsonTreeItem type="integer, object" contents="**count** *(optional)*: A [level-based value](https://minecraft.wiki/w/Enchantment_definition#Level-based_value). Defaults to 1." />
      </JsonTreeItem>
    </JsonTreeItem>
    <JsonTreeItem type="integer, object" contents="**level** *(optional)*: A [level-based value](https://minecraft.wiki/w/Enchantment_definition#Level-based_value). The amount of levels to be consumed when enchanting." />
    <JsonTreeItem type="string" contents="**enchantment**: [Enchantment ID](https://minecraft.wiki/w/Java_Edition_data_values#Enchantments). The resulting enchantment to apply." />
  </JsonTreeItem>
</JsonTree>

-# The icon only controls recipe book display. Supported items, maximum levels, and incompatible enchantments come from the enchantment definition and are automatically carried over.
-# Other value types supported by Minecraft are accepted. Results are rounded down. Item counts are clamped to valid stack sizes, block counts have a minimum of 1, and experience costs have a minimum of 0.

The old **level_multiplier** field is rejected. Use **level** instead.

## Creating a custom recipe

### 1. Create the file

Create **data/example/recipe/frost_walker.json** in your data pack. This defines the recipe ID **example:frost_walker**.

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

Use an existing enchantment ID or one supplied by another data pack or mod. The ingredients array must always contain four entries.

### 2. Load and test it

Run `/reload` or rejoin your world. Invalid recipes are skipped and reported in the server log.

Grant the recipe for testing:

```mcfunction
/recipe give @s example:frost_walker
```

Open an enchanting table with compatible boots and verify the ingredients, nearby blocks, cost, and upgrades.

### 3. Add it to your own loot table

# Enchanting Recipe Tags will soon undergo a remake, generalizing them more. This is not yet easily possible in the current version of the mod, please be patient.
