---
title: Website Patchnotes 29/07/2026
tag: patchnotes
image: "@/assets/news/generic_website_image.png"
showImageOnPage: false
author: PainterFlow11
private: true
---

This update mainly adds the new /news page. But it also upgrades performance and adds a new doc page.

# Main Page
- added new button which links to the new /news page, the color is just a template for now.

# /news
- added new page
- /news displays any .md file in `src/news/`. [Check the GitHub for examples](https://github.com/VanillaSquared/Website)

*Developers Note: I will add sorting, filters and a searchbar soon, but for now I only got this rough beta. The process of posting the changelogs of the mod will also be automated.*

# /docs
- added collapsible file trees to the File Tree component(currently unused)
- grouped `docs/randomize_recipes_loot_function` under the new `loot-functions` category
- new `docs/loot-functions/randomize_enchantment_slots_loot_function` docs

# Settings
## Design Test
- now loads dynamically

## Developer Settings
- no longer shows the default for a split second

## Bug Panel
- removed loading time for the first and second tab

# Other Noteworthy Changes
- the Card component now has a new variant, which looks like the Cards in the news page, as thats what the new variant is used for.