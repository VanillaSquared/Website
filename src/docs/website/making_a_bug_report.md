---
title: Making a Bug Report
description: How to submit a useful bug report.
order: 2
---

Before creating a report, check the [bug page](/bugs) to make sure the same problem has not already been reported. Select the plus button on that page to open the bug reporter. You do not need to sign in.

## What to Include

Use a short, specific title and report one problem at a time. Explain what happened, what should have happened, and the exact steps someone else can follow to reproduce it.

Select the correct category, Minecraft version, Vanilla Squared version, and operating system. Use `Not applicable` only when an environment field does not apply, such as the mod version for a website problem.

A useful description looks like this:

```md
When an enchanting recipe is selected, closing and reopening the enchanting table clears the selected recipe.

How to reproduce:
1. Open an enchanting table.
2. Select any unlocked recipe.
3. Close the screen.
4. Open the same enchanting table again.

The recipe should still be selected, but no recipe is selected.
```

Attachments are not supported. Do not include access tokens, private server addresses, personal information, or any other sensitive data. Bug descriptions support standard sanitized Markdown, but not raw HTML, JSX, MDX expressions, imports, exports, or custom components.

New reports always begin with an unconfirmed status and no assigned priority. These fields cannot be selected by the reporter.
