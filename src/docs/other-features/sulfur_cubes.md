---
title: Sulfur Cubes
description: Breeding Sulfur Cubes and their Redstone Block and Sponge variants.
order: 1
sidebarCard:
  enabled: true
  title: Sulfur Cubes
  description: Breedable mobs with 2 new block variants.
  details:
    - label: Breeding item
      value: Sulfur Goo
    - label: New variants
      value: "2"
    - label: Redstone power
      value: "15"
    - label: Sponge capacity
      value: "1280 blocks"
---

Sulfur Cubes can now be bred and have 2 new variants, one for redstone and another one for removing water. A variant is created by letting a Sulfur Cube swallow the block it needs.

## Breeding

Holding [Sulfur Goo](/docs/items/sulfur_goo) attracts adult Sulfur Cubes. Feed Sulfur Goo to 2 adults and they will create a baby Sulfur Cube after about 3 seconds.

Both parents have a 5 minute breeding cooldown. Sulfur Goo can also be fed to babies to make them grow up faster. The item is not consumed in Creative Mode.

| Property | Value |
| --- | --- |
| Breeding item | Sulfur Goo |
| Time before baby is created | About 3 seconds |
| Parent breeding cooldown | 5 minutes |
| Experience dropped | 1-7 |

## Variants

Sulfur Cubes swallow items dropped near them. Dropping one of the supported blocks creates its matching variant.

| Block swallowed | Variant | Main change |
| --- | --- | --- |
| Redstone Block | Redstone Sulfur Cube | Moves faster and outputs redstone power |
| Sponge | Sponge Sulfur Cube | Removes nearby water |
| Wet Sponge | Wet Sponge Sulfur Cube | Cannot remove water until it dries |

The swallowed block is stored inside the Sulfur Cube and decides which behavior it uses.

## Redstone Sulfur Cube

A Sulfur Cube which swallowed a Redstone Block becomes flat and moves faster. It also outputs a redstone signal of 15 from every block its body is touching.

The signal moves together with the Sulfur Cube, making it possible to create a moving redstone power source. It gives weak power like a normal Redstone Block, meaning it does not strongly power blocks through another solid block.

| Property | Value |
| --- | --- |
| Required block | Redstone Block |
| Signal strength | 15 |
| Signal type | Weak power |
| Archetype | Fast and flat |

## Sponge Sulfur Cube

A Sulfur Cube which swallowed a Sponge starts removing connected water around itself. It searches up to 6 blocks away and can absorb a total of 1280 water blocks before its Sponge becomes a Wet Sponge.

The absorbed amount is saved while the Sulfur Cube is in the world and when it is picked up in a bucket. Replacing the block inside the Sulfur Cube resets the stored amount.

A Wet Sponge does not absorb any more water. Taking the Sulfur Cube into a dimension where water evaporates dries the Sponge again, just like placing a Wet Sponge there. This also works in custom dimensions which have water evaporation enabled.

| Property | Value |
| --- | --- |
| Required block | Sponge |
| Search distance | 6 blocks |
| Maximum capacity | 1280 water blocks |
| Full state | Wet Sponge |
| Drying condition | Water evaporates in the current dimension |

## Data values

The new behavior uses item tags, so data packs can make more blocks create either variant.

| Tag | Usage |
| --- | --- |
| `minecraft:sulfur_cube_food` | Items which can be fed to Sulfur Cubes |
| `minecraft:sulfur_cube_swallowable` | Items a Sulfur Cube is allowed to swallow |
| `minecraft:sulfur_cube_archetype/fast_flat` | Items which give the fast and flat archetype |
| `vsq:sulfur_cube_archetype/powers_redstone` | Items which make a Sulfur Cube output redstone power |
| `vsq:sulfur_cube_archetype/dries_water` | Items which make a Sulfur Cube remove water |

A Sponge Sulfur Cubes current absorbed amount is stored in the `VSQSpongeAbsorbedWater` NBT value. The same value is copied into the buckets entity data when it is picked up.
