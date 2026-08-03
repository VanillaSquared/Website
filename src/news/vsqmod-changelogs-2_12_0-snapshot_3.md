---
title: Vanilla² -2.12.0-snapshot.3.1
tag: patchnotes
image: "@/assets/news/vsq-2_12_0-snapshot_3.png"
showImageOnPage: true
author: PainterFlow11
authorImage: "@/assets/news/painterflow11.png"
authorLink: https://bsky.app/profile/painterflow11.bsky.social
published_date: 16/08/2026
private: true
---

# Changelogs

This snapshot is adding the Redstone Sulfur Cube. By putting a Block of Redstone inside a Sulfur Cube, you now have a moving power source that powers all Redstone components in a 1 block radius around it! It also fixes quite a few older bugs.   
*Developers Note: The original version of this snapshot had a bug where every Sulfur Cube acted like a Sulfur Cube with redstone, the old version is still available on GitHub, but this is the fixed build.*

# Gameplay

- added Redstone Sulfur Cube which powers Redstone components in a 1 block radius around it

# Technical   
- bumped Fabric API from `0.152.2+26.2` to `0.154.2+26.2`
   
## NBT Tags   
- added new `vsq:powerRedstone: INT` NBT tag which controls how much Redstone power should be given of by an entity, ranges from 0-15, 0 meaning it emits now Redstone power.   
   
# Bugfixes   
- fixed vsq-60: cooldown state could be rapidly dropped in edge cases when spam relogging   
- fixed vsq-61: VSQEnchantmentEffects where initialized twice   
- fixed vsq-62: Enchantment effects from the offhand could be used in the mainhand in some cases   
- fixed vsq-63: Missing translation for 2 tags   
- fixed vsq-64: Redundant code in swirling   
- fixed vsq-65: when switching from swirling to a non-swirling enchanted item, the player animation would freeze and bug out
