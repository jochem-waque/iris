import d from "disfluent"
import { desc, eq } from "drizzle-orm"
import { Database } from "../../../index.mjs"
import { guildConfigTable } from "../../../schema.mjs"
import { serverSettingsMessage } from "../commands/server.mjs"
import { Cooldowns } from "../cooldown.mjs"

export const ServerMaxStreamingPingCooldown = d
  .select()
  .string("server_max_streaming_ping_cooldown")
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
          maxJoinPingCooldown: old?.maxJoinPingCooldown,
          defaultJoinPingCooldown: old?.defaultJoinPingCooldown,
          allowStreamingOptOut: old?.allowStreamingOptOut,
          maxStreamingPingCooldown: number,
          defaultStreamingPingCooldown: Math.min(
            old?.defaultStreamingPingCooldown ??
              Number(guildConfigTable.defaultStreamingPingCooldown.default),
            number,
          ),
        })
        .returning()
        .get()
    })

    await interaction.update(serverSettingsMessage(guildConfig))
  })
