---
title: Channeling
description: Channeling now chains lightning through nearby mobs without a thunderstorm.
order: 7
sidebarCard:
  enabled: true
  title: Channeling
  description: A complete rework of the Vanilla enchantment.
  details:
    - label: Slot
      value: Damage
    - label: Maximum level
      value: "I"
    - label: Incompatible with
      value: Riptide
---

Channeling is a Vanilla enchantment completely rewritten by Vanilla Squared. Instead of summoning a lightning bolt during thunderstorms, every hit deals lightning damage and chains it into nearby targets.

## Obtaining

The Channeling Enchanting Recipe can be obtained from fishing, Big Ocean Ruin chests, Trial Chamber vaults and Swamp Librarian trades.

### Enchanting recipe

| Lapis | Books | Gold Ingots | Gold Nuggets | Golden Apples | Chiseled Bookshelves | Levels |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 4 | 4 | 4 | 6 | 3 | 9 | 12 |

## Usage

A hit starts a lightning chain at the target and searches for up to 3 nearby living entities. The chain can pass through up to 8 blocks included in the `vsq:channeling` block tag.

Channeling has separate damage values for melee and ranged weapons:

| Weapon | First target | Each chained target |
| --- | ---: | ---: |
| Sword, Axe or Trident | 4-6 | 3 |
| Bow or Crossbow | 6-8 | 5-6 |

The lightning damage is added on top of the weapons normal hit. It uses the `minecraft:lightning_bolt` damage type, but it does not spawn a Vanilla lightning-bolt entity. This means it does not need rain, open sky or a thunderstorm and does not transform mobs as a normal lightning strike would.

Blocks outside the Channeling tag stop a path through them. The built-in tag contains blocks selected for the effect, and data packs can add more blocks without replacing the enchantment.

## Supported items

Channeling can be applied to Swords, Axes, Tridents, Bows and Crossbows. It uses one Damage slot and has only one level.

Channeling is incompatible with Riptide.

## Data values

| Property | Value |
| --- | --- |
| Enchantment ID | `minecraft:channeling` |
| Recipe ID | `vsq:channeling` |
| Maximum level | I |
| Enchantment slot | Damage |
| Maximum chained targets | 3 |
| Maximum block path | 8 |
