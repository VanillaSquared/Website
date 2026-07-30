---
title: Items
description: Every item added or changed by Vanilla Squared.
order: 3
sidebarCard:
  enabled: true
  title: Items
  image: "@/assets/docs/items/swords.png"
  imageAlt: Diamond Sword
  description: New items and all changes made to Vanilla items.
  details:
    - label: New items
      value: "2"
    - label: Changed item groups
      value: "10"
---

Vanilla Squared adds 2 new items and changes quite a few Vanilla items. This page lists the changes which are easy to miss when you first start playing.

## New items

- [Enchanting Recipe Book](/docs/items/enchanting_recipe_book)
- [Sulfur Goo](/docs/items/sulfur_goo)

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

Protection from multiple pieces is added together and capped at 100%.

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

Hitting a blocking shield disables it for 5 seconds. An axe loses 1 durability when used for an attack.

## Enchanted Books

Enchanted Books are no longer part of normal progression. Vanilla Squared replaces enchanted book loot and librarian trades with [Enchanting Recipe Books](/docs/items/enchanting_recipe_book).

Stored enchantments are removed from Enchanted Books and they cannot be used to apply enchantments in an anvil. They are also hidden from the Creative inventory.

## Fishing Rods

Fishing Rod durability is increased to 250. A hook which hits a living entity now deals 0.5 damage and applies 0.4 knockback.

Damage, knockback and post-attack enchantment effects on the Fishing Rod are applied to the hook. This lets the rod work with combat enchantments made for projectile sources.

You can keep a normal weapon in the other hand. When that weapon is an axe, hooking a player who is blocking with a shield damages the shield by 5 durability and disables it for 5 seconds.

## Potions

Normal Potions now stack up to 16. Splash Potions and Lingering Potions stack up to 8.

Every potion in a stack must have the same type and effects, just like any other item with components.

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

A spear can attack from 2 to 4.5 blocks away, with its kinetic attack reaching between 2 and 6.5 blocks. It loses 1 durability per attack.

## Swords

Sword attacks pass through small plants instead of breaking the plant and missing the mob behind it. This includes grass, ferns, bushes, flowers, petals and sugar cane.

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

Their thrown behavior is unchanged, but they support the expanded weapon enchantment selection and the new enchantment slots.

All enchantable items also use the new [enchantment slot system](/docs/enchanting#enchantment-slots). The sections here only go over changes specific to the item itself.
