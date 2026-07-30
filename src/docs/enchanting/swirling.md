---
title: Swirling
description: Spin with a Mace or Spear and repeatedly hit nearby mobs.
order: 5
sidebarCard:
  enabled: true
  title: Swirling
  description: A special enchantment for fighting groups of mobs.
  details:
    - label: Slot
      value: Special
    - label: Maximum level
      value: "I"
    - label: Items
      value: Maces and Spears
---

Swirling is a special enchantment for Maces and Spears. It turns the weapon into a short area attack which repeatedly damages everything around the user.

## Obtaining

The Swirling Enchanting Recipe is found in Trial Chamber vaults. It is not included in structure chests, fishing or Librarian trades.

### Enchanting recipe

| Lapis | Books | Breeze Rods | Wind Charges | Feathers | Chiseled Bookshelves | Levels |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 3 | 2 | 2 | 4 | 2 | 12 | 6 |

## Usage

Hold the enchanted Mace or Spear and press the **Enchantment Hotkey**, which is **Left Alt** by default. Swirling has a 0.4 second warmup followed by a 4 second attack.

During the attack, every living entity within 3.5 blocks takes 6.5 damage once every 4 ticks. The attack uses the custom `vsq:swirled` damage type and resets the targets normal damage immunity for each pulse. This allows every pulse to deal damage instead of only the first one.

Swirling does not distinguish between hostile mobs, passive mobs and other players. Anything living inside the radius can be hit, except for the user.

| Property | Value |
| --- | --- |
| Warmup | 0.4 seconds |
| Attack duration | 4 seconds |
| Radius | 3.5 blocks |
| Damage per pulse | 6.5 |
| Time between pulses | 4 ticks |
| Uses before cooldown | 1 |
| Cooldown | 8 seconds |

### Penalties

Activating Swirling applies Slowness IV for 10 seconds and Weakness II for 6 seconds. Horizontal movement is also heavily reduced during the warmup.

The attack pauses if a weapon with Swirling is no longer held in either hand. Holding one again resumes the remaining duration.

## Supported items

Swirling can be applied to Maces and every Spear material. It uses one Special slot.

## Data values

| Property | Value |
| --- | --- |
| Enchantment ID | `vsq:swirling` |
| Recipe ID | `vsq:swirling` |
| Maximum level | I |
| Enchantment slot | Special |
