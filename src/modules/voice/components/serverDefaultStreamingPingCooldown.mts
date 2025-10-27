import d from "disfluent"
import { desc, eq } from "drizzle-orm"
import { Database } from "../../../index.mjs"
import { guildConfigTable } from "../../../schema.mjs"
import { serverSettingsMessage } from "../commands/server.mjs"
import { Cooldowns } from "../cooldown.mjs"

export const ServerDefaultStreamingPingCooldown = d
  .select()
  .string("server_default_streaming_ping_cooldown")
  .options({
    "Default cooldown: always": d.select().stringOption("0").emoji("✅"),
    ...Object.fromEntries(
      Object.entries(Cooldowns).map(([key, option]) => [
        `Default cooldown: ${key.toLowerCase()}`,
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
          defaultStreamingPingCooldown: number,
          maxStreamingPingCooldown: Math.max(
            number,
            old?.maxStreamingPingCooldown ??
              Number(guildConfigTable.maxStreamingPingCooldown.default),
          ),
        })
        .returning()
        .get()
    })

    await interaction.update(serverSettingsMessage(guildConfig))
  })
