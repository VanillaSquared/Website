---
title: Website Patchnotes 30/07/2026
tag: patchnotes
image: "@/assets/news/generic_website_image.png"
showImageOnPage: false
author: PainterFlow11
authorImage: "@/assets/news/generic_website_image.png"
published_date: 30/07/2026
---

This update mainly removes the login system and remakes bug reports to now use markdown. It also adds a lot of docs.
The reason for this is because I noticed that I could just reuse the system used for writing docs and news articles in the bug reporter and it would save a lot of time and effort maintaining the login system in the future. I will probably add a light mode eventually(*just because settings are gone doesn't mean I didn't forget about this*). In other news, I will also remake the front page to display some content from the actual page itself(*maybe today*) and I will probably also make some automation scripts for publishing updates. Except for the previously mentioned things, there is barely anything to still work on, meaning the Website will soon be done.

# Essential Changes
- removed all traces of settings/login/authentication/permission systems

## /bugs
- now uses .md files similar to /news and /docs to report bugs.
- you can report bugs through cloning the repo on github and merging it.

## /news
- no longer uses creation date to sort, it now has a published date field.

## /docs
- added docs for all new/modified items in the mod
- added docs for all new/remade enchantments in the mod
- added docs for reporting a bug in the website
- added docs for editing the docs in the website
- added docs for markdown in the website

## Other
- removed some components which were only there because of the login system