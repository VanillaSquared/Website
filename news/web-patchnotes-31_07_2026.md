---
title: Website Patchnotes 31/07/2026
tag: web-patchnotes
image: "@cdn/news/generic-website-image.png"
showImageOnPage: false
author: PainterFlow11
authorImage: "@cdn/news/painterflow11.png"
authorLink: https://bsky.app/profile/painterflow11.bsky.social
published_date: 31/07/2026
---

This Update revamps the front page(as previously announced). But thats not all, [the_jan_craft](https://github.com/pxlarified) remade the entire UI of the bug reporter to match its UI with the rest of the website. I also added ~~flashbang~~ light mode.

## Front Page
- no longer includes false/outdated information.
- the individual cards are now clickable, they will redirect to their docs(if the docs for that card are available)
- removed github button as github was already linked in the footer.
- the features section now has some cool new images.
- there is now a section displaying a maximum of 6 articles from the /news page.

## Bug Reporter
- remade the entire UI of the browser. ([the_jan_craft](https://github.com/pxlarified))
- remade the entire UI of the individual bug view. ([the_jan_craft](https://github.com/pxlarified))

## News
- fixed PainterFlow11 profile picture
- updated the `generic_website_image` to the new front page

## Header
- added a discord invite link to the official vsq discord server

## Added Light/Dark mode
- light/dark mode can be toggled in the header and is saved in cookies on the client.
- default is dark mode

## Added Cookies modal
- accepting cookies is optional.
- currently cookies are only used for the theme.
*Developers Note: I might use cookies for more things in the future, but for now they will only be used to store the theme.*

## Other Changes
- the Cards component got some updates
- added 2 new console commands:
    - displayCookieModal(); - displays the cookie consent modal
    - toggleCookies(boolean); - toggles cookies
- removed database ([the_jan_craft](https://github.com/pxlarified))
- removed borders from all variants of the Tags components ([the_jan_craft](https://github.com/pxlarified))

---
-# *Note: changelogs without any credits are made by [PainterFlow11](https://github.com/PainterFlow).*
