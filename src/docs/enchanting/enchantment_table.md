---
title: Enchanting Table
description: How to use the Vanilla Squared enchanting table.
order: 3
sidebarCard:
  enabled: true
  title: Enchanting Table
  image: "@/assets/docs/enchantment_table.png"
  imageAlt: The Vanilla Squared enchanting table interface
  description: The table before an enchanting recipe is selected.
  details:
    - label: System
      value: Learned recipes
    - label: Ingredient slots
      value: Lapis and four materials
    - label: Requirements
      value: Levels and nearby blocks
    - label: Result
      value: One chosen enchantment
---

The enchanting table uses learned recipes instead of offering random enchantments.

## Table layout

- **Left slot:** the item you want to enchant.
- **Center slot:** lapis lazuli or another material required by the recipe.
- **Four surrounding slots:** the recipe's other ingredients.
- **Recipe book button:** opens your learned enchanting recipes.
- **Right counters:** show the required experience levels and nearby blocks.
- **Animated book:** applies the selected enchantment.

## Enchanting an item

1. Put the item in the left slot.
2. Open the recipe book and select an enchantment. If you have the materials, they are moved into the correct slots automatically. Missing materials appear as ghost items.
3. Place the required blocks near the table. Blocks are detected up to two blocks away and up to two blocks above it.
4. Hover over the counters to check your levels and the exact block requirements.
5. Click the animated book to enchant the item.

The recipe materials and listed experience levels are consumed. The enchanted item remains in the left slot. Repeating a recipe raises that enchantment by one level until it reaches its maximum.

A recipe cannot be applied if the item lacks a suitable enchantment slot or has an incompatible enchantment.
