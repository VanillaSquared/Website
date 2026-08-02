---
title: Sulfur Spike Dripping
description: Using Sulfur Spikes to fill Cauldrons and oxidize Copper Blocks.
order: 2
sidebarCard:
  enabled: true
  title: Sulfur Spike Dripping
  description: Transfers Water and Lava through a Sulfur Spike.
  details:
    - label: Fluids
      value: Water and Lava
    - label: Maximum distance
      value: "11 blocks"
    - label: Oxidization chance
      value: "84% per random tick"
---

Sulfur Spikes now work similar to Pointed Dripstone. A downward facing Sulfur Spike with a Water or Lava source above it starts dripping the matching fluid from its tip.

## Setup

1. Place a Sulfur Spike facing down from the bottom of a block.
2. Put a Water or Lava source above the block holding the Sulfur Spike.
3. Put a Cauldron or unwaxed Copper Block no more than 11 blocks below the tip.
4. Keep the space between the Sulfur Spike and the target open.

The Sulfur Spike can be longer than one block. The fluid is found from the block above its root and particles are created at the bottom tip.

## Cauldrons

Put a Cauldron up to 11 blocks below the tip of the Sulfur Spike. Water slowly fills an empty or Water Cauldron, while Lava fills an empty Cauldron with Lava.

| Fluid above Sulfur Spike | Cauldron result | Transfer chance per random tick |
| --- | --- | ---: |
| Water | Adds one Water level | 17.578125% |
| Lava | Fills an empty Cauldron with Lava | 5.859375% |

There needs to be an open path between the tip and the Cauldron. Solid blocks and fluids stop the drip, while blocks which leave enough space in the middle can be dripped through.

The Cauldron can be placed from 1 to 11 blocks below the Sulfur Spike tip. A Cauldron which cannot accept the fluid is ignored.

## Oxidizing Copper

Water dripping from a Sulfur Spike oxidizes the first unwaxed Copper Block below its tip. Each successful oxidization moves the block forward by one stage:

1. Copper
2. Exposed Copper
3. Weathered Copper
4. Oxidized Copper

This also works with Copper Stairs, Slabs and the other weathering Copper variants. Block properties such as the direction of Stairs and the type of a Slab stay the same after oxidizing.

The oxidization check has an 84% chance on each random tick of the Sulfur Spike. When Copper is oxidized, that random tick is used for the Copper and does not also fill a Cauldron.

### Restrictions

Copper is not oxidized when:

- The Copper is waxed
- The Copper is already fully Oxidized
- The Copper is more than 11 blocks below the Sulfur Spike tip
- A solid block or fluid blocks the dripping path
- The fluid above the Sulfur Spike is Lava

Only the first Copper Block in the dripping path is changed. It blocks any Copper placed farther down, even after it becomes fully Oxidized, until it is removed.

## Dripping properties

| Property | Water | Lava |
| --- | ---: | ---: |
| Fills Cauldrons | Yes | Yes |
| Oxidizes Copper | Yes | No |
| Cauldron transfer chance | 17.578125% | 5.859375% |
| Copper oxidization chance | 84% | 0% |
| Maximum target distance | 11 blocks | 11 blocks |
