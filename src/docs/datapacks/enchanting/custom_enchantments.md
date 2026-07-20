---
title: Custom Enchantments
description: Define custom enchantments with item profiles, enchantment slots, effects, and special abilities.
order: 4
---

Using Datapacks you are able to create your own custom enchantments, this is already possible in Vanilla, but thanks to Vanilla Squareds new special enchantments, you are able to easily incorporate a keybind with cooldown bar and limits into your enchantments. I have to admit this part is heavily undertested and likely might not work in every case so please report any bugs to us on the [bug tracker](/bugs). I will try to fix them as soon as possible. This article will go over how to define custom enchantments, it will go through each and every one of the new enchantment effects added by the mod itself and also showcase how to implement special enchantments.

For further documentation on the Vanilla parts of custom enchantments, please check out the [Minecraft Wiki](https://minecraft.wiki/w/Enchantment_definition) page for custom enchantments.

Enchantment definitions are data-pack files. Place them at:

```text
data/<namespace>/enchantment/<path>.json
```

The file `data/example/enchantment/whirlwind.json` has the enchantment ID `example:whirlwind`.

## JSON format

The top-level fields `description`, `supported_items`, `primary_items`, `weight`, and `anvil_cost` use the vanilla enchantment format. Vanilla Squared moves the remaining settings into `profiles`.

<JsonTree>
  <JsonTreeItem type="object" contents="The enchantment definition.">
    <JsonTreeItem type="text component" contents="**description**: A [text component](https://minecraft.wiki/w/Text_component_format) that is used to display the enchantment on items." />
    <JsonTreeItem type="string" contents="**supported_items**: An [item ID](https://minecraft.wiki/w/Item) or item tag beginning with `#`." />
    <JsonTreeItem type="string" contents="**primary_items** *(optional)*: Items on which the enchantment may appear through normal enchanting." />
    <JsonTreeItem type="integer" contents="**weight**: Selection weight used by random enchanting. *(Unused due to Vanilla Squareds custom enchanting table)*" />
    <JsonTreeItem type="integer" contents="**anvil_cost**: Anvil cost multiplier." />
    <JsonTreeItem type="array" contents="**profiles**: Item-specific definitions. The first matching profile is used.">
      <JsonTreeItem type="object" contents="An enchantment profile.">
        <JsonTreeItem type="object" contents="**requirement** *(optional)*: Restricts this profile to an item or item tag.">
          <JsonTreeItem type="string" contents="**type**: `item` for the enchanted item, or `projectile_takeover` for the item which fired a projectile." />
          <JsonTreeItem type="string" contents="**item**: An [item ID](https://minecraft.wiki/w/Item) or item tag beginning with `#`." />
        </JsonTreeItem>
        <JsonTreeItem type="string" contents="**enchantment_slot**: `special`, `damage`, `secondary`, `defense`, `util`, or `curse`." />
        <JsonTreeItem type="string, array" contents="**exclusive_set** *(optional)*: Enchantments incompatible with this profile." />
        <JsonTreeItem type="integer" contents="**max_level**: Maximum level, from 1 to 255." />
        <JsonTreeItem type="object" contents="**effects** *(optional)*: Enchantment Effect Components." >
          <JsonTreeItem type="array" contents="**<component ID>**: An effect component">
            <JsonTreeItem type="none" contents="Fields depending on the component" />
          </JsonTreeItem>
        </JsonTreeItem>
        <JsonTreeItem type="object" contents="**special** *(optional)*: Makes the profile activatable with the special-enchantment key.">
          <JsonTreeItem type="number, object" contents="**cooldown**: Cooldown in seconds. Accepts a constant or [level-based value](https://minecraft.wiki/w/Enchantment_definition#Level-based_value)." />
          <JsonTreeItem type="string" contents="**display_limit** *(optional)*: `effect_id` -- which effects uses should be displayed in the bar. *(not defined = none)*" />
          <JsonTreeItem type="string" contents="**cooldown_after_limit** *(optional)*: Delays the cooldown until this effect's uses are exhausted." />
        </JsonTreeItem>
        <JsonTreeItem type="array" contents="**slots**: List of Equipment Slots that this enchantment works in." >
          <JsonTreeItem type="string" contents="one of any, `hand`, `mainhand`, `offhand`, `armor`, `feet`, `legs`, `chest`, `head`, `body`, `saddle` -- a slot" />
        </JsonTreeItem>
        <JsonTreeItem type="object" contents="**min_cost**: A [level-based value](https://minecraft.wiki/w/Enchantment_definition#Level-based_value) -- Minimum enchanting cost." />
        <JsonTreeItem type="object" contents="**max_cost**: A [level-based value](https://minecraft.wiki/w/Enchantment_definition#Level-based_value) -- Maximum enchanting cost." />
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

`limit` accepts a constant or a [level-based value](https://minecraft.wiki/w/Enchantment_definition#Level-based_value). If omitted inside the effect's `special` object, it defaults to `1`. Effects without this object do not consume a use, but still require the special profile to be active.

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

Run `/reload` or rejoin your world, after that, run this command:

```mcfunction
/enchant @s example:whirlwind 1
```

## Added effect components

Vanilla effect components remain available inside each profile. If you want to know more about those, checkout the [mc wiki](https://minecraft.wiki/w/Enchantment_definition#Effect_components).s

### `vsq:swirling`

Runs when the player presses the special-enchantment key.

<JsonTree>
  <JsonTreeItem type="array" contents="The `vsq:swirling` component.">
    <JsonTreeItem type="object" contents="A targeted entity effect.">
      <JsonTreeItem type="string" contents="**effect_id**: Unique ID used by special limits and the cooldown display." />
      <JsonTreeItem type="string" contents="**enchanted**: `attacker` or `damaging_entity`. `victim` is not available for this component." />
      <JsonTreeItem type="string" contents="**affected**: `attacker` or `damaging_entity`. Both resolve to the player using the ability." />
      <JsonTreeItem type="object" contents="**effect**: The entity effect to run." />
      <JsonTreeItem type="object" contents="**requirements** *(optional)*: A vanilla loot condition." />
      <JsonTreeItem type="object" contents="**special** *(optional)*: Use limit for this effect.">
        <JsonTreeItem type="number, object" contents="**limit** *(optional)*: Constant or a level-based value. Defaults to `1`." />
      </JsonTreeItem>
    </JsonTreeItem>
  </JsonTreeItem>
</JsonTree>

### `vsq:post_block`

Runs after an attack is blocked. It uses the same targeted-effect structure as `minecraft:post_attack`.

<JsonTree>
  <JsonTreeItem type="array" contents="The `vsq:post_block` component.">
    <JsonTreeItem type="object" contents="A targeted entity effect.">
      <JsonTreeItem type="string" contents="**effect_id**: Unique effect ID." />
      <JsonTreeItem type="string" contents="**enchanted**: `attacker` when used by the weapon, or `victim` when used by the blocking item." />
      <JsonTreeItem type="string" contents="**affected**: `attacker`, `damaging_entity`, or `victim`." />
      <JsonTreeItem type="object" contents="**effect**: The entity effect to run." />
      <JsonTreeItem type="object" contents="**requirements** *(optional)*: A vanilla loot condition evaluated against the blocked attack." />
      <JsonTreeItem type="object" contents="**special** *(optional)*: Use limit for special profiles.">
        <JsonTreeItem type="number, object" contents="**limit** *(optional)*: Constant or a [level-based value](https://minecraft.wiki/w/Enchantment_definition#Level-based_value). Defaults to `1`." />
      </JsonTreeItem>
    </JsonTreeItem>
  </JsonTreeItem>
</JsonTree>

### `vsq:channeling_path`

Runs while a `vsq:channeling` effect travels to another target.

<JsonTree>
  <JsonTreeItem type="array" contents="The `vsq:channeling_path` component.">
    <JsonTreeItem type="object" contents="A targeted location effect.">
      <JsonTreeItem type="string" contents="**effect_id**: Unique effect ID." />
      <JsonTreeItem type="string" contents="**enchanted**: `attacker`, `damaging_entity`, or `victim`." />
      <JsonTreeItem type="string" contents="**affected**: `attacker`, `damaging_entity`, or `victim`." />
      <JsonTreeItem type="object" contents="**effect**: The location effect applied along the channeling path." />
      <JsonTreeItem type="object" contents="**requirements** *(optional)*: A vanilla loot condition." />
      <JsonTreeItem type="object" contents="**special** *(optional)*: Use limit for special profiles.">
        <JsonTreeItem type="number, object" contents="**limit** *(optional)*: Constant or a [level-based value](https://minecraft.wiki/w/Enchantment_definition#Level-based_value). Defaults to `1`." />
      </JsonTreeItem>
    </JsonTreeItem>
  </JsonTreeItem>
</JsonTree>

## Added entity effects

These objects are placed directly in an effect entry's `effect` field. They may also be nested inside a `minecraft:all_of` effect.

### `vsq:begin_swirling`

Starts an area attack around the affected entity. Durations are measured in seconds.

<JsonTree>
  <JsonTreeItem type="object" contents="The `vsq:begin_swirling` entity effect.">
    <JsonTreeItem type="string" contents="**type**: Must be `vsq:begin_swirling`." />
    <JsonTreeItem type="number, object" contents="**duration**: Duration as a constant or [level-based value](https://minecraft.wiki/w/Enchantment_definition#Level-based_value)." />
    <JsonTreeItem type="number, object" contents="**warmup_duration** *(optional)*: Delay before the first hit. Defaults to `0.35`." />
    <JsonTreeItem type="number, object" contents="**radius**: Effect radius. Values are clamped from 0 to 16." />
    <JsonTreeItem type="integer" contents="**hit_interval** *(optional)*: Ticks between hits. Defaults to `4` and has a minimum of `1`." />
    <JsonTreeItem type="object" contents="**damage**: Damage dealt by each hit.">
      <JsonTreeItem type="string" contents="**damage_type**: Damage type ID." />
      <JsonTreeItem type="number" contents="**amount**: Damage amount." />
    </JsonTreeItem>
  </JsonTreeItem>
</JsonTree>

### `vsq:begin_lunging`

Launches the affected entity in its facing direction.

<JsonTree>
  <JsonTreeItem type="object" contents="The `vsq:begin_lunging` entity effect.">
    <JsonTreeItem type="string" contents="**type**: Must be `vsq:begin_lunging`." />
    <JsonTreeItem type="array" contents="**direction** *(optional)*: Local `[x, y, z]` direction added to the entity's look direction. Defaults to `[0, 0, 1]`." />
    <JsonTreeItem type="array" contents="**coordinate_scale** *(optional)*: `[x, y, z]` multiplier applied to the direction. Defaults to `[1, 1, 1]`." />
    <JsonTreeItem type="number, object" contents="**magnitude**: Launch strength as a constant or [level-based value](https://minecraft.wiki/w/Enchantment_definition#Level-based_value)." />
    <JsonTreeItem type="number" contents="**speed** *(optional)*: Speed multiplier. Defaults to `1`." />
    <JsonTreeItem type="number, object" contents="**damage_taken_multiplier** *(optional)*: Incoming damage multiplier while lunging. Defaults to `1`." />
    <JsonTreeItem type="number, object" contents="**range**: Maximum travel range. Values are clamped from 0 to 7." />
  </JsonTreeItem>
</JsonTree>

### `vsq:channeling`

Creates a path through matching entities, starting from the affected entity.

<JsonTree>
  <JsonTreeItem type="object" contents="The `vsq:channeling` entity effect.">
    <JsonTreeItem type="string" contents="**type**: Must be `vsq:channeling`." />
    <JsonTreeItem type="object" contents="**algorithm**: Vanilla entity predicate used to select targets." />
    <JsonTreeItem type="number, object" contents="**target_limit**: Maximum targets as a constant or [level-based value](https://minecraft.wiki/w/Enchantment_definition#Level-based_value)." />
    <JsonTreeItem type="number, object" contents="**block_limit** *(optional)*: Maximum path length through blocks. Defaults to `16`." />
    <JsonTreeItem type="string" contents="**particle_path** *(optional)*: Particle path ID. Defaults to `vsq:lightning`." />
    <JsonTreeItem type="number, object" contents="**duration**: Path duration as a constant or [level-based value](https://minecraft.wiki/w/Enchantment_definition#Level-based_value)." />
    <JsonTreeItem type="string" contents="**pass_through**: Block ID or block tag beginning with `#` through which the path may travel." />
  </JsonTreeItem>
</JsonTree>

### `vsq:send_chat_msg`

Sends a system message to the affected player, or to the enchanted entity when the affected entity is not a player.

<JsonTree>
  <JsonTreeItem type="object" contents="The `vsq:send_chat_msg` entity effect.">
    <JsonTreeItem type="string" contents="**type**: Must be `vsq:send_chat_msg`." />
    <JsonTreeItem type="text component" contents="**message** *(optional)*: Message to send. `$a` inserts the affected entity, `$e` the enchanted entity, and `$i` the enchanted item." />
  </JsonTreeItem>
</JsonTree>
