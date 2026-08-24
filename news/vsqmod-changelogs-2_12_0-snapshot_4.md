---
title: Vanilla² -2.12.0-snapshot.4
tag: vsq-snap
image: "@cdn/news/vsq-2-12-0-snapshot-4.png"
showImageOnPage: true
author: PainterFlow11
authorImage: "@cdn/news/painterflow11.png"
authorLink: https://bsky.app/profile/painterflow11.bsky.social
published_date: 24/08/2026
---

# Changelogs

This is the final snapshot for -2.12.0, I wanted to add a bit more but I didn't really have any ideas that are worth implementing(some of them were things Mojang might add themselves very soon). There is a new Sponge Sulfur Cube which drains water and dries in the nether.

# Gameplay

## Sulfur Cube
- added sulfur cube with sponge   
    - the max limit for absorbing is 1280 blocks of water   
    - dries in custom dimensions which dry water too, just like water   
   
# Technical

## NBT Tags
- added new NBT tag: `VSQSpongeAbsorbedWater` for counting the amount of water a sulfur cube sponge absorbed so far

## Tags
- added `vsq:sulfur_cube_archetype/dries_water` which lists blocks that can be used to dry water when they are in a sulfur cube.
- added `vsq:sulfur_cube_archetype/powers_redstone` which lists blocks that can be used to power surrounding Redstone components when in a sulfur cube.

---
-# *Note: changelogs without any credits are made by [PainterFlow11](https://github.com/PainterFlow).*

<Button href="https://www.curseforge.com/minecraft/mc-mods/vsq/files/8723300" variant="curseforge" external>Download on Curseforge</Button>
<Button href="https://modrinth.com/mod/vsq/version/-2.12.0-snapshot.4" variant="modrinth" external>Download on Modrinth</Button>
