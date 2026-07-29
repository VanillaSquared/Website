---
title: Randomize Enchantment Slots Loot Function
description: Randomize the enchantment slot capacities of generated loot.
order: 5
---

Vanilla Squared adds enchantment slots to enchantable items. `vsq:randomize_enchantment_slots` lets a loot table randomize how many slots a generated item has.

## Format

```json
{
  "function": "vsq:randomize_enchantment_slots",
  "min_capacity": 1,
  "max_capacity": 4
}
```

`min_capacity` and `max_capacity` are optional integers from `0` to `64`. They default to `1` and `4`. If the minimum is greater than the maximum, the values are swapped. Standard loot-function `conditions` are also supported.

Each supported slot category receives its own random capacity within the inclusive range. Categories which the item does not support are not added. Special enchantment slots keep the fixed capacity defined by the item and are never randomized.

Existing enchantments are preserved. If an item already has more enchantments in a category than the selected capacity, that category remains large enough to contain them. Items without enchantment slots are left unchanged.

## Loot-table entry

This entry creates a diamond sword with between two and six slots in each of its randomizable categories:

```json
{
  "type": "minecraft:item",
  "name": "minecraft:diamond_sword",
  "functions": [
    {
      "function": "vsq:randomize_enchantment_slots",
      "min_capacity": 2,
      "max_capacity": 6
    }
  ]
}
```

Put the entry in a normal loot-table pool. Its conditions, weight, and pool rolls control whether the item drops; the function only changes its enchantment slot capacities.

*Developers Note: I have thought about making the function per enchantment slot category and not just for all enchantment slot categories, but this is currently not needed in-game, I might add it one day but for now it would be pretty useless to me.*