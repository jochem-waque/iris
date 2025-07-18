import { and, desc, eq } from "drizzle-orm"
import d from "fluent-commands"
import { Database } from "../../../index.mjs"
import { guildConfigTable, memberConfigTable } from "../../../schema.mjs"
import { joinPings, pingsMessage } from "../commands/pings.mjs"
import { Cooldowns } from "../cooldown.mjs"

export const JoinPingSettings = d
  .select()
  .string("member_join_pings")
  .options({
    // TODO swap label and value?
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
        .where(eq(guildConfigTable.guild_id, interaction.guildId))
        .orderBy(desc(guildConfigTable.timestamp))
        .limit(1)
        .get()

      const { guild } = joinPings(guildConfig)

      const oldMemberConfig = tx
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
          user_id: interaction.user.id,
          guild_id: interaction.guildId,
          disable_streaming_pings: oldMemberConfig?.disable_streaming_pings,
          streaming_ping_cooldown: oldMemberConfig?.streaming_ping_cooldown,
          disable_join_pings: disabled,
          join_ping_cooldown: cooldown,
        })
        .returning()
        .get()

      return [guildConfig, memberConfig]
    })

    await interaction.update(pingsMessage(guildConfig, memberConfig))
  })

export function joinPingSettings(
  guildConfig?: typeof guildConfigTable.$inferSelect,
  memberConfig?: typeof memberConfigTable.$inferSelect,
) {
  const { guild, member } = joinPings(guildConfig, memberConfig)

  const component = JoinPingSettings.with([member.toString()])

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
