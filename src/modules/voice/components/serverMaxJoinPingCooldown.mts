import d from "disfluent"
import { desc, eq } from "drizzle-orm"
import { Database } from "../../../index.mjs"
import { guildConfigTable } from "../../../schema.mjs"
import { serverSettingsMessage } from "../commands/server.mjs"
import { Cooldowns } from "../cooldown.mjs"

export const ServerMaxJoinPingCooldown = d
  .select()
  .string("server_max_join_ping_cooldown")
  .options({
    "Max cooldown: always": d.select().stringOption("0").emoji("✅"),
    ...Object.fromEntries(
      Object.entries(Cooldowns).map(([key, option]) => [
        `Max cooldown: ${key.toLowerCase()}`,
        option,
      ]),
    ),
  })
  .handler(async (interaction) => {
    const value = interaction.values[0]
    if (value === undefined) {
      return
    }

    const number = parseInt(value)

    if (!interaction.inCachedGuild()) {
      return
    }

    const guildConfig = Database.transaction((tx) => {
      const old = tx
        .select()
        .from(guildConfigTable)
        .where(eq(guildConfigTable.guildId, interaction.guildId))
        .orderBy(desc(guildConfigTable.timestamp))
        .limit(1)
        .get()

      return tx
        .insert(guildConfigTable)
        .values({
          guildId: interaction.guildId,
          allowJoinOptOut: old?.allowJoinOptOut,
          allowStreamingOptOut: old?.allowStreamingOptOut,
          maxStreamingPingCooldown: old?.maxStreamingPingCooldown,
          defaultStreamingPingCooldown: old?.defaultStreamingPingCooldown,
          maxJoinPingCooldown: number,
          defaultJoinPingCooldown: Math.min(
            old?.defaultJoinPingCooldown ??
              Number(guildConfigTable.defaultJoinPingCooldown.default),
            number,
          ),
        })
        .returning()
        .get()
    })

    await interaction.update(serverSettingsMessage(guildConfig))
  })
