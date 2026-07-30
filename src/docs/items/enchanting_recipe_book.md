---
title: Enchanting Recipe Book
description: Learn a recipe for the new enchanting table.
order: 1
sidebarCard:
  enabled: true
  title: Enchanting Recipe Book
  image: "@/assets/docs/items/enchant_recipe.png"
  imageAlt: Enchanting Recipe Book
  imageDisplay: item
  description: Unlocks one or more enchanting recipes.
  details:
    - label: Item ID
      value: "vsq:enchant_recipe"
    - label: Stack size
      value: "16"
    - label: Enchantment glint
      value: Always
---

The Enchanting Recipe Book replaces Enchanted Books in Vanilla Squareds progression. Each book stores one or more recipes for the new enchanting table.

## Obtaining

Enchanting Recipe Books are generated anywhere an Enchanted Book would normally be offered as loot. The source decides which recipe can be stored in the book.

| Source | Examples |
| --- | --- |
| Structure loot | Dungeons, Ancient Cities, Strongholds, Trial Chambers and other structure chests |
| Fishing | Replaces Enchanted Books from the treasure pool |
| Piglin bartering | Uses the Piglin recipe pool |
| Librarian trades | Uses a recipe pool based on the villagers biome type |

A single source does not contain every recipe. For example, [Void Strike](/docs/enchanting/void_strike) is found in End City treasure while [Swirling](/docs/enchanting/swirling) is found in Trial Chamber vaults.

## Usage

Hold the book and right-click to learn every unknown enchanting recipe stored inside it. Learned recipes are added to the recipe book inside the enchanting table.

The book is consumed when at least one recipe is learned. It is not consumed when all of its recipes are already known, and a message is shown above the hotbar instead. Players in Creative Mode keep the book after learning its recipes.

A book with no loaded `vsq:enchanting` recipe does nothing. Normal crafting recipes and recipes removed by a data pack cannot be learned with this item.

Read [Enchanting](/docs/enchanting) for how to use a learned recipe.

## Item properties

Enchanting Recipe Books always have an enchantment glint and stack up to 16. Books only stack when their stored recipe list is the same.

| Property | Value |
| --- | --- |
| Item ID | `vsq:enchant_recipe` |
| Maximum stack size | 16 |
| Creative tab | Tools and Utilities |
