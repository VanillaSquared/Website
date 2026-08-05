---
title: Vanilla² -2.12.1
tag: patchnotes
image: "@/assets/news/vsq-2_12_1.png"
showImageOnPage: true
author: PainterFlow11
authorImage: "@/assets/news/painterflow11.png"
authorLink: https://bsky.app/profile/painterflow11.bsky.social
published_date: 30/08/2027
private: true
---

# Changelogs   
As announced, I'll be doing smaller hotfixes until 26.3 releases for now. This hotfix adds some technical features to Redstone and to Datapacks. A suggestion I heard from Redstoners is to allow Redstone dust to send signals through transparent blocks upwards and downwards, so I implemented it. All wooden transparent blocks, observers and a few other minor ones, allow sending Redstone signals upwards, just like in vanilla. But all stone transparent blocks and glowstone, allow sending Redstone signals downwards. Lmk if I missed any bdw.

# Gameplay

- Redstone signals can now be sent upwards through: wooden transparent blocks, observers
- Redstone signals can now be sent downwards through: stone transparent blocks, glowstone
- Redstone signals can be sent in either direction through: all glass variants

# Technical Changes

## Recipe Tags
- Enchanting recipe tags have been overhauled to now be recipe tags, allowing recipes of any type to be grouped together in tags
   
## Loot   
- there is a new loot function called `vsq:randomize_recipes` to randomize recipes on a recipe book component

## Enchantments
- removed `weight` field as it was no longer needed, if it exists in a json, it will be skipped and a warning will be sent in console

---

# [Download on Modrinth](https://modrinth.com/mod/vsq/version/-2.12.1)
-# *Note: changes without any credits are by [PainterFlow11](https://github.com/PainterFlow).*