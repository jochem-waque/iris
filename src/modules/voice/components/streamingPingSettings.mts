import { and, desc, eq } from "drizzle-orm"
import d from "fluent-commands"
import { Database } from "../../../index.mjs"
import { guildConfigTable, memberConfigTable } from "../../../schema.mjs"
import { streamingPings } from "../commands/pings.mjs"
import { Cooldowns } from "../cooldown.mjs"

export const StreamingPingSettings = d
  .select()
  .string("member_streaming_pings")
  .options({
    Always: d.select().stringOption("true").emoji("✅"),
    ...Cooldowns,
    Never: d.select().stringOption("false").emoji("❌"),
  })
  .handler(async (interaction) => {
    const value = interaction.values[0]
    if (value === undefined) {
      return
    }

    if (!interaction.inCachedGuild()) {
      return
    }

    const [guildConfig, memberConfig] = await Database.transaction(
      async (tx) => {
        const [guildConfig] = await tx
          .select()
          .from(guildConfigTable)
          .where(eq(guildConfigTable.guild_id, interaction.guildId))
          .orderBy(desc(guildConfigTable.timestamp))
          .limit(1)

        const { guild } = streamingPings(guildConfig)

        const [oldMemberConfig] = await tx
          .select()
          .from(memberConfigTable)
          .where(
            and(
              eq(memberConfigTable.guild_id, interaction.guildId),
              eq(memberConfigTable.user_id, interaction.user.id),
            ),
          )
          .orderBy(desc(memberConfigTable.timestamp))
          .limit(1)

        let disabled: boolean | undefined
        let cooldown: number | undefined

        switch (true) {
          case value === "true":
            disabled = false
            break
          case value === "false" && guild.allowOptOut:
            disabled = true
            break
          default:
            cooldown = parseInt(value)
            if (isNaN(cooldown)) {
              cooldown = undefined
              break
            }

            cooldown = Math.min(cooldown, guild.maxCooldown)
            if (cooldown === 0) {
              disabled = false
              cooldown = undefined
            }
        }

        const [memberConfig] = await tx
          .insert(memberConfigTable)
          .values({
            user_id: interaction.user.id,
            guild_id: interaction.guild.id,
            disable_join_pings: oldMemberConfig?.disable_join_pings,
            join_ping_cooldown: oldMemberConfig?.join_ping_cooldown,
            disable_streaming_pings: disabled,
            streaming_ping_cooldown: cooldown,
          })
          .returning()

        return [guildConfig, memberConfig]
      },
    )

    await interaction.update({
      components: [d.row(streamingPingSettings(guildConfig, memberConfig))],
    })
  })

export function streamingPingSettings(
  guildConfig?: typeof guildConfigTable.$inferSelect,
  memberConfig?: typeof memberConfigTable.$inferSelect,
) {
  const { guild, member } = streamingPings(guildConfig, memberConfig)

  const component = StreamingPingSettings.build([
    member.toString(),
  ] as Parameters<(typeof StreamingPingSettings)["build"]>[0])

  if (!guild.allowOptOut) {
    component.options.pop()
  }

  for (let i = 0; i < component.options.length; i++) {
    const option = component.options[i]
    if (!option) {
      continue
    }

    const number = parseInt(option.value, 10)
    if (isNaN(number)) {
      continue
    }

    if (number <= guild.maxCooldown) {
      continue
    }

    component.options.splice(i, 1)
    i--
  }

  return component
}
