import { desc, eq } from "drizzle-orm"
import d from "fluent-commands"
import { Database } from "../../../index.mjs"
import { guildConfigTable, memberConfigTable } from "../../../schema.mjs"
import { joinPings } from "../commands/pings.mjs"
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

    const [guildConfig] = await Database.select()
      .from(guildConfigTable)
      .where(eq(guildConfigTable.guild_id, interaction.guildId))
      .orderBy(desc(guildConfigTable.timestamp))
      .limit(1)

    const [oldMemberConfig] = await Database.select()
      .from(memberConfigTable)
      .where(eq(memberConfigTable.guild_id, interaction.guildId))
      .orderBy(desc(memberConfigTable.timestamp))
      .limit(1)

    const { guild } = joinPings(guildConfig)
    if (value === "false" && !guild.allowOptOut) {
      await interaction.update({
        components: [d.row(joinPingSettings(guildConfig, oldMemberConfig))],
      })
      return
    }

    let cooldown: number | undefined = parseInt(value)
    if (isNaN(cooldown)) {
      cooldown = undefined
    }

    if (cooldown !== undefined && cooldown > guild.maxCooldown) {
      await interaction.update({
        components: [d.row(joinPingSettings(guildConfig, oldMemberConfig))],
      })
      return
    }

    const [memberConfig] = await Database.insert(memberConfigTable)
      .values({
        user_id: interaction.user.id,
        guild_id: interaction.guild.id,
        disable_streaming_pings: oldMemberConfig?.disable_streaming_pings,
        streaming_ping_cooldown: oldMemberConfig?.streaming_ping_cooldown,
        disable_join_pings: value === "false",
        join_ping_cooldown: cooldown,
      })
      .returning()

    await interaction.update({
      components: [d.row(joinPingSettings(guildConfig, memberConfig))],
    })
  })

export function joinPingSettings(
  guildConfig?: typeof guildConfigTable.$inferSelect,
  memberConfig?: typeof memberConfigTable.$inferSelect,
) {
  const { guild, member } = joinPings(guildConfig, memberConfig)

  const component = JoinPingSettings.build([member.toString()] as Parameters<
    (typeof JoinPingSettings)["build"]
  >[0])

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
