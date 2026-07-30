---
title: Dash
description: Launch yourself forward and damage anything caught in the dash.
order: 3
sidebarCard:
  enabled: true
  title: Dash
  description: A special enchantment used for quick movement and damage.
  details:
    - label: Slot
      value: Special
    - label: Maximum level
      value: "III"
    - label: Items
      value: Swords, Axes, Spears and Tridents
---

Dash is a special weapon enchantment which launches the user forward. Anything hit during the movement takes heavy damage.

## Obtaining

The Dash Enchanting Recipe can be found in Dungeon chests, Trial Chamber vaults and Snowy Librarian trades. Right-click the [Enchanting Recipe Book](/docs/items/enchanting_recipe_book) containing it before using the recipe at an enchanting table.

### Enchanting recipe

| Level being applied | Lapis | Sword | Wind Charges | Slimeballs | Rabbits Feet | Chiseled Bookshelves | Levels |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| I | 2 | 1 | 3 | 2 | 2 | 3 | 3 |
| II | 5 | 1 | 4 | 3 | 3 | 9 | 7 |
| III | 8 | 1 | 5 | 4 | 4 | 15 | 11 |

The Sword is an ingredient and is consumed with the other materials. The item receiving Dash can be any supported weapon.

## Usage

Hold the enchanted weapon in your main hand and press the **Enchantment Hotkey**, which is **Left Alt** by default. The player is launched in the direction they are looking and enters the lunging state.

An entity hit during the lunge takes 10 damage per enchantment level. Dash damage uses the custom `vsq:eviscerate` damage type.

| Level | Uses before cooldown | Damage | Dash range | Damage taken while dashing | Cooldown |
| --- | ---: | ---: | ---: | ---: | ---: |
| I | 1 | 10 | 2.5 blocks | 1.2x | 4 seconds |
| II | 2 | 20 | 3.85 blocks | 1.35x | 8 seconds |
| III | 3 | 30 | 5.2 blocks | 1.5x | 12 seconds |

The cooldown starts after every available use has been spent. Remaining uses and cooldown time are shown above the hotbar.

### Restrictions

Dash cannot start while the user is:

- In water
- Gliding with an Elytra
- Riding another entity
- Below 7 food points in Survival or Adventure Mode

Creative Mode ignores the food requirement. The increased incoming damage remains active during the dash, so it is possible to take more damage than the attack deals.

## Supported items

Dash can be applied to Swords, Axes, Spears and Tridents. It uses one Special slot and is active only while the enchanted item is held in the main hand.

## Data values

| Property | Value |
| --- | --- |
| Enchantment ID | `vsq:dash` |
| Recipe ID | `vsq:dash` |
| Maximum level | III |
| Enchantment slot | Special |
