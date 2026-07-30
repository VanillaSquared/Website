---
title: Making a Bug Report
description: How to add a useful bug report to the website.
order: 2
---

Bug reports are stored as Markdown files in `src/bugs/`. Before adding one, check the [bug page](/bugs) to make sure the same problem hasn't already been reported. If it has, add any missing information to the existing report instead of making a duplicate.

## What to Include

A bug report should explain what happened, what should have happened and how someone else can cause it. Please also include the exact Vanilla Squared or website version. "Latest" stops being useful as soon as another version releases.

For a mod bug, also include your Minecraft version, Fabric Loader version, Fabric API version and other installed mods if they might be related. Add the crash report or relevant log when the game crashed. Do not paste access tokens, server addresses you want to keep private or anything else sensitive into a report.

A useful report body looks something like this:

```md
When an enchanting recipe is selected, closing and reopening the enchanting table clears the selected recipe.

How to reproduce:
1. Open an enchanting table.
2. Select any unlocked recipe.
3. Close the screen.
4. Open the same enchanting table again.

The recipe should still be selected, but no recipe is selected.
```

Screenshots or short videos are useful for visual problems, but they should not replace the written reproduction steps.

## Adding the Report

Find the newest ID for the correct category in `src/bugs/`, then use the next number. Mod reports use `vsq-` and website reports use `web-`. The filename and `id` should match, for example `src/bugs/web-3.md`.

Add this header for a new Vanilla Squared report:

```yaml
---
id: vsq-3
title: Short explanation of the problem
author: Your name
created_date: 30/07/2026
category: vanilla-squared
priority: unset
status: Unconfirmed
fixed: false
affectedVersions:
  - 2.12.0-snapshot.1
fixedVersion: null
---
```

For a website report, change the ID to `web-3` and the category to `website`. Use the actual date and affected version, not the values from this example. New reports should normally keep `priority: unset` and `status: Unconfirmed` until the problem has been checked.

Write the report below the header. You can use all of the syntax explained in the [Markdown guide](./markdown).

## Updating a Report

Once the problem has been reproduced, change the status to `Confirmed`. If it was fixed, use:

```yaml
status: Fixed
fixed: true
fixedVersion: 2.12.0
```

Use `Works as intended` when the reported behavior is intentional, `Vanilla bug` when the same problem happens without Vanilla Squared and `Unfixable` when there is a clear reason it will not be fixed. Explain that reason in the report body so the status isn't just a dead end.

After adding or updating the report, follow [Committing to the Docs](./committing_to_the_docs) to check and submit the change.
