---
title: Vanilla² -2.12.0-snapshot.2
tag: patchnotes
image: "@/assets/news/vsq-2_12_0-snapshot_2.png"
showImageOnPage: true
author: PainterFlow11
authorImage: "@/assets/news/painterflow11.png"
published_date: 09/08/2026
private: true
---

# Changelogs

The second snapshot for -2.12.0 is coming with a some new functionality for sulfur spikes, they can now drip water and make your copper oxidize way faster! It also comes with some changes to the enchantment table. I'm also fixing some really old bugs that have slipped through all my tests. This caused a nice recode of most enchantment related features: enchanting table, enchanting recipes and even the `vsq:enchantment` data component.

# Gameplay

## Sulfur Spike
- you can now put a sulfur spike under a block under a lava source block to fill up a cauldron below the sulfur spike with lava
- you can now put a sulfur spike under a block under a water source block to fill up a cauldron below the sulfur spike with water
- you can now put a sulfur spike under a block under a water source block to drastically increase oxidization speed of copper block variants if they are below the sulfur spike and if they are not waxed/already fully oxidized.
   
## Enchantment Table   
- fixed groups not showing the text to expand groups   
- changed icons of all enchantments   
- also did quite a lot of polishing work on the enchantment table   
   
# Technical   
- reduced the size of the GitHub repository a bit ([the_jan_craft](https://github.com/pxlarified))
   
## Enchanting Recipes   
- added `icon` field which defines the item to display in the recipe book   
- removed `name` field, the name is now manually defined in the `item_name` component of the `icon` field and the name of the enchanting book in the UI is derived from the enchantments definition   
- fixed enchanting recipe groups UI being a bit broken   
   
# Bugfixes   
- fixed vsq-57: Groups don't display their "Right-click for more" text in the lore when hovering over the icon in the recipe book.   
- fixed vsq-58: The preview for groups is just completely broken.   
- fixed vsq-59: the `minecraft:tooltips_display` data component cannot hide the `vsq:enchantment` data components tooltip  