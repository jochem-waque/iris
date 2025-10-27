import d from "disfluent"
import { desc, eq } from "drizzle-orm"
import { Database } from "../../../index.mjs"
import { guildConfigTable } from "../../../schema.mjs"
import { serverSettingsMessage } from "../commands/server.mjs"
import { Cooldowns } from "../cooldown.mjs"

export const ServerDefaultJoinPingCooldown = d
  .select()
  .string("server_default_join_ping_cooldown")
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
          allowStreamingOptOut: old?.allowStreamingOptOut,
          maxStreamingPingCooldown: old?.maxStreamingPingCooldown,
          defaultStreamingPingCooldown: old?.defaultStreamingPingCooldown,
          defaultJoinPingCooldown: number,
          maxJoinPingCooldown: Math.max(
            number,
            old?.maxJoinPingCooldown ??
              Number(guildConfigTable.maxJoinPingCooldown.default),
          ),
        })
        .returning()
        .get()
    })

    await interaction.update(serverSettingsMessage(guildConfig))
  })
