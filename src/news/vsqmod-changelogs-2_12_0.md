---
title: Vanilla² -2.12.0
tag: vsq-release
image: "@cdn/news/vsq-2-12-0.png"
showImageOnPage: true
author: PainterFlow11
authorImage: "@cdn/news/painterflow11.png"
authorLink: https://bsky.app/profile/painterflow11.bsky.social
published_date: 13/09/2026
private: true
---

# Changelogs

# Gameplay

## Sulfur Cube
- added sulfur cube with sponge   
    - the max limit for absorbing is 1280 blocks of water   
    - dries in custom dimensions which dry water too, just like water
- added Redstone Sulfur Cube which powers Redstone components in a 1 block radius around it

## Sulfur Goo
- added sulfur goo which can drop from sulfur cube
- sulfur goo can be combined with coal and bone meal to make 2 gunpowder
- sulfur goo can be used to breed sulfur cubes

## Sulfur Spike
- you can now put a sulfur spike under a block under a lava source block to fill up a cauldron below the sulfur spike with lava
- you can now put a sulfur spike under a block under a water source block to fill up a cauldron below the sulfur spike with water
- you can now put a sulfur spike under a block under a water source block to drastically increase oxidization speed of copper block variants if they are below the sulfur spike and if they are not waxed/already fully oxidized.
   
## Enchantment Table   
- fixed groups not showing the text to expand groups   
- changed icons of all enchantments   
- also did quite a lot of polishing work on the enchantment table   

## Creative
- moved the enchanting recipe book after the book and quill (*in the creative inventory*)

# Technical
- reduced the size of the GitHub repository a bit ([the_jan_craft](https://github.com/pxlarified))
- bumped Fabric API from `0.152.2+26.2` to `0.154.2+26.2`

## Recipes
- moved all recipes from `vsq/recipes` to `vsq/recipe`

## Enchanting Recipes   
- added `icon` field which defines the item to display in the recipe book   
- removed `name` field, the name is now manually defined in the `item_name` component of the `icon` field and the name of the enchanting book in the UI is derived from the enchantments definition   
- fixed enchanting recipe groups UI being a bit broken

## NBT Tags   
- added new `vsq:powerRedstone: INT` NBT tag which controls how much Redstone power should be given of by an entity, ranges from 0-15, 0 meaning it emits now Redstone power.   
- added new NBT tag: `VSQSpongeAbsorbedWater` for counting the amount of water a sulfur cube sponge absorbed so far

## Tags
- added `vsq:sulfur_cube_archetype/dries_water` which lists blocks that can be used to dry water when they are in a sulfur cube.
- added `vsq:sulfur_cube_archetype/powers_redstone` which lists blocks that can be used to power surrounding Redstone components when in a sulfur cube.
- moved all recipe tags from `vsq/tags/recipes` to `vsq/tags/recipe`

# Bugfixes
- fixed vsq-57: Groups don't display their "Right-click for more" text in the lore when hovering over the icon in the recipe book.
- fixed vsq-58: The preview for groups is just completely broken.
- fixed vsq-59: the `minecraft:tooltips_display` data component cannot hide the `vsq:enchantment` data components tooltip
- fixed vsq-60: cooldown state could be rapidly dropped in edge cases when spam relogging   
- fixed vsq-61: VSQEnchantmentEffects where initialized twice   
- fixed vsq-62: Enchantment effects from the offhand could be used in the mainhand in some cases   
- fixed vsq-63: Missing translation for 2 tags
- fixed vsq-64: Redundant code in swirling
- fixed vsq-65: when switching from swirling to a non-swirling enchanted item, the player animation would freeze and bug out

---
-# *Note: changelogs without any credits are made by [PainterFlow11](https://github.com/PainterFlow).*

<Button href="https://modrinth.com/mod/vsq/version/-2.12.0" variant="modrinth" external>Download on Modrinth</Button>
