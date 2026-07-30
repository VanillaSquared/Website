---
title: Items
description: Every item added or changed by Vanilla Squared.
order: 3
sidebarCard:
  enabled: true
  title: Items
  description: New items and all changes made to Vanilla items.
  details:
    - label: New items
      value: "2"
    - label: Changed item groups
      value: "10"
---

Vanilla Squared adds 2 new items and changes quite a few Vanilla items. This page lists the changes which are easy to miss when you first start playing.

## New items

- [Enchanting Recipe Book](/docs/items/enchanting_recipe_book): Stores a recipe for the new enchanting table.
- [Sulfur Goo](/docs/items/sulfur_goo): Dropped by Sulfur Cubes and used for breeding and Gunpowder.

## Changed items

| Item group | Main changes |
| --- | --- |
| Armor | Armor points, durability and material-specific protection |
| Axes | Damage, speed, reach and shield disabling |
| Enchanted Books | Removed from normal progression |
| Fishing Rods | Durability, hook damage and enchantment effects |
| Potions | Increased stack sizes |
| Shields | Support for enchantment slots |
| Spears | Damage, speed, reach and durability |
| Swords | Attacks pass through small plants |
| Tools | Material durability and durability cost |
| Tridents | Melee damage, speed and reach |

## Armor

Vanilla Squared changes the armor points and durability of every armor set. Durability is based only on the material, meaning that boots and chestplates made from the same material now last the same amount of damage.

### Armor points

| Material | Helmet | Chestplate | Leggings | Boots | Full set |
| --- | ---: | ---: | ---: | ---: | ---: |
| Leather | 2 | 3 | 2 | 1 | 8 |
| Copper | 2 | 4 | 3 | 1 | 10 |
| Chainmail | 3 | 5 | 4 | 1 | 13 |
| Iron | 2 | 6 | 5 | 1 | 14 |
| Gold | 2 | 6 | 5 | 1 | 14 |
| Diamond | 4 | 7 | 6 | 3 | 20 |
| Netherite | 5 | 7 | 6 | 4 | 22 |

The Turtle Shell gives 4 armor points.

### Armor durability

| Material | Durability per piece |
| --- | ---: |
| Leather | 196 |
| Copper | 267 |
| Chainmail | 400 |
| Iron | 425 |
| Gold | 225 |
| Diamond | 550 |
| Netherite | 669 |
| Turtle Shell | 669 |

### Material protections

Some materials protect against damage which normally ignores regular armor:

- Each piece of Chainmail gives 20% protection against mace smashes, dripstone and spear damage.
- Each piece of Gold Armor gives 20% protection against magic damage and attacks using Breach.
- Diamond Armor keeps 2 armor toughness per piece.
- Netherite Armor gives 3 armor toughness per piece. Its helmet, chestplate and boots each give 10% knockback resistance.

Protection from multiple pieces is added together and capped at 100%. Regular armor and enchantment protection are calculated separately. Armor values above 20 still work and are shown as additional rows above the hotbar.

## Axes

Axes keep their place as slow and heavy weapons, but their combat stats now depend on the material.

| Material | Attack damage | Attack speed | Range change |
| --- | ---: | ---: | ---: |
| Wood | 7 | 0.8 | -0.5 |
| Stone | 8 | 0.8 | -0.5 |
| Copper | 8 | 0.8 | -0.5 |
| Iron | 9 | 0.8 | -0.5 |
| Gold | 7 | 0.8 | No change |
| Diamond | 10 | 1.0 | -0.5 |
| Netherite | 11 | 1.0 | -0.5 |

The damage and speed values in the table are the final player attributes shown in the item tooltip. The range change is applied to the players normal interaction range.

Hitting a blocking shield disables it for 5 seconds. An axe loses 1 durability when used for an attack. Its mining speed and effective blocks are unchanged.

## Enchanted Books

Enchanted Books are no longer part of normal progression. Vanilla Squared replaces enchanted book loot and librarian trades with [Enchanting Recipe Books](/docs/items/enchanting_recipe_book).

Stored enchantments are removed from Enchanted Books and they cannot be used to apply enchantments in an anvil. They are also hidden from the Creative inventory. Enchanted Books loaded from an old world are stripped of their stored enchantments.

The replacement only changes Enchanted Books. Normal Books are still used by several enchanting recipes.

## Fishing Rods

Fishing Rod durability is increased to 250. A hook which hits a living entity now deals 0.5 damage and applies 0.4 knockback.

Damage, knockback and post-attack enchantment effects on the Fishing Rod are applied to the hook. This lets the rod work with combat enchantments made for projectile sources.

You can keep a normal weapon in the other hand. When that weapon is an axe, hooking a player who is blocking with a shield damages the shield by 5 durability and disables it for 5 seconds.

The hook uses the custom `vsq:fished` damage type. Its base damage is only 0.5 damage, or a quarter of a heart, so most of its combat value comes from knockback and enchantments.

## Potions

Normal Potions now stack up to 16. Splash Potions and Lingering Potions stack up to 8.

| Potion type | Maximum stack size |
| --- | ---: |
| Potion | 16 |
| Splash Potion | 8 |
| Lingering Potion | 8 |

Every potion in a stack must have the same type and effects, just like any other item with components. Drinking or throwing one potion removes a single item from the stack.

## Shields

Shields can be placed in the new enchanting table even though they are not normally enchantable. A standard shield has 2 Secondary slots, 2 Utility slots and 1 Curse slot.

Axes still disable shields for 5 seconds. This also works when a Fishing Rod hook hits a blocking player while the attacker has an axe in their other hand.

## Spears

Every spear is changed to use Vanilla Squareds material stats. Spears require a fully charged attack and use the stab animation.

| Material | Attack damage | Attack speed |
| --- | ---: | ---: |
| Wood | 2 | 2.8565 |
| Stone | 3 | 2.5545 |
| Copper | 3 | 2.547 |
| Iron | 4 | 2.4675 |
| Gold | 2 | 2.465 |
| Diamond | 5 | 2.45 |
| Netherite | 6 | 2.4 |

The listed damage and speed values are the final player attributes. Spears require a fully charged attack before they can deal damage.

A spear can attack from 2 to 4.5 blocks away, with its kinetic attack reaching between 2 and 6.5 blocks. A spear loses 1 durability per attack.

## Swords

Sword attacks pass through small plants instead of breaking the plant and missing the mob behind it. This includes grass, ferns, bushes, flowers, petals and sugar cane.

The pass-through list includes short and tall grass, dry grass, ferns, bushes, all small and tall flowers, Pink Petals, Wildflowers and Sugar Cane. Cobwebs and solid blocks are still hit normally.

Swords mine Cobwebs at a speed of 15 and lose 1 durability per attack.

## Tools

Vanilla Squared uses one durability value for every tool made from the same material. This applies to Swords, Axes, Spears, Pickaxes, Shovels and Hoes.

| Material | Durability |
| --- | ---: |
| Wood | 75 |
| Stone | 150 |
| Copper | 200 |
| Iron | 250 |
| Gold | 100 |
| Diamond | 1550 |
| Netherite | 2069 |

Pickaxes, Shovels and Hoes lose 2 durability when used as a weapon and 1 durability when used to break a block. Swords, Axes and Spears lose 1 durability per attack.

## Tridents

Tridents deal 9 melee damage, have an attack speed of 1.125 and reach half a block farther than normal.

Their thrown behavior is unchanged. Loyalty, Riptide, Impaling and Channeling still work when the Trident is thrown, but they use Vanilla Squareds rewritten enchantment definitions.

## Enchantment slots

All enchantable items use the new [enchantment slot system](/docs/enchanting#enchantment-slots). One enchantment takes one slot regardless of its level.

| Item group | Damage | Defense | Secondary | Utility | Special | Curse |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Armor | 0 | 3 | 3 | 3 | 0 | 2 |
| Shield | 0 | 0 | 2 | 2 | 0 | 1 |
| Sword, Axe, Spear, Trident, Mace, Bow and Crossbow | 3 | 0 | 2 | 3 | 1 | 1 |
| Pickaxe, Shovel, Hoe, Shears and Flint and Steel | 0 | 0 | 4 | 3 | 0 | 1 |
| Fishing Rod | 0 | 0 | 4 | 3 | 0 | 1 |
| Elytra | 0 | 2 | 3 | 2 | 0 | 1 |

Other enchantable items receive 1 or 2 Utility slots based on their enchantability value and 1 Curse slot.

Loot can randomize these capacities, so equipment found in chests or dropped by mobs may not match the standard values above. Existing enchantments are never removed when a capacity is randomized.
