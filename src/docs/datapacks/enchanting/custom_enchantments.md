---
title: Custom Enchantments
description: Define custom enchantments with item profiles, enchantment slots, effects, and special abilities.
order: 4
---

Using Datapacks you are able to create your own custom enchantments, this is already possible in Vanilla, but thanks to Vanilla Squareds new special enchantments, you are able to easily incorporate a keybind with cooldown bar and limits into your enchantments. I have to admit this part is heavily undertested and likely might not work in every case so please report any bugs to us on the [bug tracker](/bugs). I will try to fix them as soon as possible. This article will go over how to define custom enchantments, it will go through each and every one of the new enchantment effects added by the mod itself and also showcase how to implement special enchantments.

Enchantment definitions are data-pack files. Place them at:

```text
data/<namespace>/enchantment/<path>.json
```

The file `data/example/enchantment/whirlwind.json` has the enchantment ID `example:whirlwind`.

## JSON format

The top-level fields `description`, `supported_items`, `primary_items`, `weight`, and `anvil_cost` use the vanilla enchantment format. Vanilla Squared moves the remaining settings into `profiles`.

<JsonTree>
  <JsonTreeItem type="object" contents="The enchantment definition.">
    <JsonTreeItem type="text component" contents="**description**: The enchantment's displayed name." />
    <JsonTreeItem type="string" contents="**supported_items**: An item ID or item tag beginning with `#`." />
    <JsonTreeItem type="string" contents="**primary_items** *(optional)*: Items on which the enchantment may appear through normal enchanting." />
    <JsonTreeItem type="integer" contents="**weight**: Selection weight used by random enchanting." />
    <JsonTreeItem type="integer" contents="**anvil_cost**: Anvil cost multiplier." />
    <JsonTreeItem type="array" contents="**profiles**: Item-specific definitions. The first matching profile is used.">
      <JsonTreeItem type="object" contents="An enchantment profile.">
        <JsonTreeItem type="object" contents="**requirement** *(optional)*: Restricts this profile to an item or item tag.">
          <JsonTreeItem type="string" contents="**type**: `item` for the enchanted item, or `projectile_takeover` for the item which fired a projectile." />
          <JsonTreeItem type="string" contents="**item**: An item ID or item tag beginning with `#`." />
        </JsonTreeItem>
        <JsonTreeItem type="string" contents="**enchantment_slot**: `special`, `damage`, `secondary`, `defense`, `util`, or `curse`." />
        <JsonTreeItem type="string or array" contents="**exclusive_set** *(optional)*: Enchantments incompatible with this profile." />
        <JsonTreeItem type="integer" contents="**max_level**: Maximum level, from 1 to 255." />
        <JsonTreeItem type="object" contents="**effects** *(optional)*: Vanilla and Vanilla Squared enchantment effect components." />
        <JsonTreeItem type="object" contents="**special** *(optional)*: Makes the profile activatable with the special-enchantment key.">
          <JsonTreeItem type="number or object" contents="**cooldown**: Cooldown in seconds. Accepts a constant or level-based value." />
          <JsonTreeItem type="string" contents="**display_limit** *(optional)*: `effect_id` whose remaining uses are displayed on the HUD." />
          <JsonTreeItem type="string" contents="**cooldown_after_limit** *(optional)*: Delays the cooldown until this effect's uses are exhausted." />
        </JsonTreeItem>
        <JsonTreeItem type="array" contents="**slots**: Vanilla equipment slot groups in which the effects are active, such as `mainhand`, `offhand`, `hand`, or `armor`." />
        <JsonTreeItem type="object" contents="**min_cost**: Minimum enchanting cost, with `base` and `per_level_above_first`." />
        <JsonTreeItem type="object" contents="**max_cost**: Maximum enchanting cost, with `base` and `per_level_above_first`." />
      </JsonTreeItem>
    </JsonTreeItem>
  </JsonTreeItem>
</JsonTree>

Use separate profiles when an enchantment needs different effects or slot types on different items. Put the most specific profile first because only the first match is selected.

`projectile_takeover` lets an enchantment on another equipped item provide effects for a projectile source. For example, an enchantment on a helmet could alter arrows fired from a bow matching the profile's `item` field.

## Special enchantments

A profile containing `special` is activated with the **Special Enchantment** key, which is Left Alt by default. The main-hand enchantment takes priority over the off-hand enchantment. Its cooldown and use count are shown above the hotbar.

Every entry in an `effects` array must have a unique `effect_id`. Add `special` to an effect entry when it should have a limited number of uses during one activation:

```json
{
  "effect_id": "whirlwind_use",
  "special": {
    "limit": 1
  },
  "effect": {
    "type": "vsq:begin_swirling",
    "duration": 3,
    "radius": 3,
    "damage": {
      "damage_type": "minecraft:player_attack",
      "amount": 4
    }
  },
  "enchanted": "attacker",
  "affected": "attacker"
}
```

`limit` accepts a constant or any vanilla level-based value. If omitted inside the effect's `special` object, it defaults to `1`. Effects without this object do not consume a use, but still require the special profile to be active.

## Example enchantment

Create `data/example/enchantment/whirlwind.json`:

```json
{
  "description": {
    "text": "Whirlwind"
  },
  "supported_items": "minecraft:diamond_sword",
  "primary_items": "minecraft:diamond_sword",
  "weight": 2,
  "anvil_cost": 4,
  "profiles": [
    {
      "requirement": {
        "type": "item",
        "item": "minecraft:diamond_sword"
      },
      "enchantment_slot": "special",
      "max_level": 1,
      "effects": {
        "vsq:swirling": [
          {
            "enchanted": "attacker",
            "affected": "attacker",
            "effect_id": "whirlwind_use",
            "special": {
              "limit": 1
            },
            "effect": {
              "type": "vsq:begin_swirling",
              "duration": 3,
              "warmup_duration": 0.25,
              "radius": 3,
              "hit_interval": 4,
              "damage": {
                "damage_type": "minecraft:player_attack",
                "amount": 4
              }
            }
          }
        ]
      },
      "special": {
        "cooldown": 8,
        "display_limit": "whirlwind_use"
      },
      "slots": [
        "mainhand"
      ],
      "min_cost": {
        "base": 10,
        "per_level_above_first": 0
      },
      "max_cost": {
        "base": 30,
        "per_level_above_first": 0
      }
    }
  ]
}
```

Run `/reload`, then apply it for testing:

```mcfunction
/enchant @s example:whirlwind 1
```

To make the enchantment available through the Vanilla Squared enchanting table, also create an [enchanting recipe](/docs/datapacks/enchanting/enchanting_recipes).

## Added effect components

Vanilla effect components remain available inside each profile. Vanilla Squared adds these components:

| Component | Runs when |
| --- | --- |
| `vsq:swirling` | The player presses the special-enchantment key. Uses targeted entity effects. |
| `vsq:post_block` | An attack is blocked. Uses targeted entity effects. |
| `vsq:channeling_path` | A `vsq:channeling` effect travels to another target. Uses targeted location effects. |

## Added entity effects

| Effect type | Important fields |
| --- | --- |
| `vsq:begin_swirling` | `duration`, optional `warmup_duration`, `radius`, optional `hit_interval`, and `damage` containing `damage_type` and `amount`. Durations are in seconds. |
| `vsq:begin_lunging` | `magnitude`, `range`, optional `direction`, `coordinate_scale`, `speed`, and `damage_taken_multiplier`. |
| `vsq:channeling` | `algorithm` entity predicate, `target_limit`, optional `block_limit`, optional `particle_path`, `duration`, and `pass_through` block or block tag. |
| `vsq:send_chat_msg` | `message`, using a text component. `$a` inserts the affected entity, `$e` the enchanted entity, and `$i` the enchanted item. |

Fields which accept a level-based value may use a number or a vanilla value object such as:

```json
{
  "type": "minecraft:linear",
  "base": 4,
  "per_level_above_first": 2
}
```

Invalid enchantment definitions are skipped and reported in the server log.
