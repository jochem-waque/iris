import d from "disfluent"
import { and, desc, eq } from "drizzle-orm"
import { Database } from "../../../index.mjs"
import {
  guildConfigTable,
  memberConfigTable,
  streamCooldownTable,
} from "../../../schema.mjs"
import { pingsMessage, streamingPings } from "../commands/pings.mjs"
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

    const [guildConfig, memberConfig] = Database.transaction((tx) => {
      const guildConfig = tx
        .select()
        .from(guildConfigTable)
        .where(eq(guildConfigTable.guildId, interaction.guildId))
        .orderBy(desc(guildConfigTable.timestamp))
        .limit(1)
        .get()

      const { guild } = streamingPings(guildConfig)

      const oldMemberConfig = tx
        .select()
        .from(memberConfigTable)
        .where(
          and(
            eq(memberConfigTable.guildId, interaction.guildId),
            eq(memberConfigTable.userId, interaction.user.id),
          ),
        )
        .orderBy(desc(memberConfigTable.timestamp))
        .limit(1)
        .get()

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

      const memberConfig = tx
        .insert(memberConfigTable)
        .values({
          userId: interaction.user.id,
          guildId: interaction.guildId,
          disableJoinPings: oldMemberConfig?.disableJoinPings,
          joinPingCooldown: oldMemberConfig?.joinPingCooldown,
          disableStreamingPings: disabled,
          streamingPingCooldown: cooldown,
        })
        .returning()
        .get()

      tx.delete(streamCooldownTable)
        .where(eq(streamCooldownTable.guildId, interaction.guildId))
        .run()

      return [guildConfig, memberConfig]
    })

    await interaction.update(pingsMessage(guildConfig, memberConfig))
  })

export function streamingPingSettings(
  guildConfig?: typeof guildConfigTable.$inferSelect,
  memberConfig?: typeof memberConfigTable.$inferSelect,
) {
  const { guild, member } = streamingPings(guildConfig, memberConfig)

  const component = StreamingPingSettings.with([member.toString()])

  if (!guild.allowOptOut) {
    component.spliceOptions(component.options.length - 1, 1)
  }

  for (let i = 0; i < component.options.length; i++) {
    const option = component.options[i]
    if (!option?.data.value) {
      continue
    }

    const number = parseInt(option.data.value, 10)
    if (isNaN(number)) {
      continue
    }

    if (number <= guild.maxCooldown) {
      continue
    }

    component.spliceOptions(i, 1)
    i--
  }

  return component
}
