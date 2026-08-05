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
- fixed the Table component sometimes being buggy

# Bug Reporter
- Fixed [bug-4](../../bugs/4): Website docs category is above the Datapacks category.
- Fixed [bug-5](../../bugs/5): Bug report filter button flicker.
- Fixed [bug-6](../../bugs/6): When zooming in too far the labels of the filters disappear in /news
- Fixed [bug-9](../../bugs/9): the link styling is not applied in headers
- Fixed [bug-10](../../bugs/10): the news page tags text is unreadable in flashbang mode
- Fixed [bug-11](../../bugs/11): Weird Warning in the console yapping about some random image