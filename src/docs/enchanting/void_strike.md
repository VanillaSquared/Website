---
title: Void Strike
description: Apply Voided and build up extra damage for your next hit.
order: 6
sidebarCard:
  enabled: true
  title: Void Strike
  description: Marks a target so the next hit deals more damage.
  details:
    - label: Slot
      value: Damage
    - label: Maximum level
      value: "III"
    - label: Chance
      value: "25% per hit"
---

Void Strike is a damage enchantment which can mark a target with the **Voided** effect. The next damage taken by that target is multiplied and consumes the effect.

## Obtaining

The Void Strike Enchanting Recipe is found in End City treasure chests. It does not appear in other structure loot or Librarian trades.

### Enchanting recipe

| Level being applied | Lapis | End Stone | Eyes of Ender | End Crystals | Ender Pearls | Chiseled Bookshelves | Levels |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| I | 3 | 1 | 1 | 1 | 2 | 4 | 4 |
| II | 6 | 3 | 2 | 2 | 3 | 8 | 7 |
| III | 9 | 5 | 3 | 3 | 4 | 12 | 10 |

## Usage

Each hit has a 25% chance to apply Voided. Melee attacks must be direct hits, while projectiles from Bows and Crossbows can apply it when they hit their target.

Voided starts with a 1.1 damage multiplier. Higher levels keep the effect active for longer and let its multiplier increase by 0.1 every 5 seconds.

| Level | Duration | 0-5 seconds | 5-10 seconds | 10-15 seconds |
| --- | --- | ---: | ---: | ---: | ---: |
| I | 5 seconds | 1.1x | - | - |
| II | 10 seconds | 1.1x | 1.2x | - |
| III | 15 seconds | 1.1x | 1.2x | 1.3x |

The next valid damage consumes Voided, even when it comes from another player, a mob or the environment. This means you can attack immediately for a reliable 1.1 multiplier or wait for a stronger hit at levels II and III.

Applying Voided again refreshes its duration without lowering a multiplier which has already increased. If the effect expires before the target takes damage, no bonus is dealt.

Damage types in the `vsq:bypasses_voided` tag do not consume or receive the multiplier.

## Supported items

Void Strike can be applied to Swords, Axes, Spears, Tridents, Maces, Bows and Crossbows. It uses one Damage slot. Ranged weapons can activate it from either hand when they fire a projectile.

## Data values

| Property | Value |
| --- | --- |
| Enchantment ID | `vsq:void_strike` |
| Recipe ID | `vsq:void_strike` |
| Effect ID | `vsq:voided` |
| Maximum level | III |
| Enchantment slot | Damage |
