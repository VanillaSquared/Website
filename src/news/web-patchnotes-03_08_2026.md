---
title: Website Patchnotes 03/08/2026
tag: patchnotes
image: "@/assets/news/generic_website_image.png"
showImageOnPage: false
author: PainterFlow11
authorImage: "@/assets/news/painterflow11.png"
authorLink: https://bsky.app/profile/painterflow11.bsky.social
published_date: 03/08/2026
---
-# Website V0.1.1 (*Developers Note: "from now on I will actually add Version numbering to the Website"*)

Welcome to the Vanilla Squared website, to celebrate the release of the website, I've decided to add some new features to the site.
These are mostly minor things but I think they greatly improve the user experience.

## /bugs
- changed the + button to a ? button which now opens a modal with a mini-guide on how to make a bug report.

## /news
- the announcement tag now has a unique color
- the other tag now has a unique color
- the author card is now clickable
- the .md files now have a new field: `authorLink` - if its not present then the author card is not clickable

## Other Changes
- added a small version number to the `Footer` component

# Bug Reporter
- Fixed [web-2](../../bugs/web-2): Bug report filter button flicker.
- Fixed [web-6](../../bugs/web-6): the link styling is not applied in headers
- Confirmed [web-7](../../bugs/web-7): the news page tags text is unreadable in flashbang mode