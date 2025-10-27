import d from "disfluent"
import { desc, eq } from "drizzle-orm"
import { Database } from "../../../index.mjs"
import { guildConfigTable } from "../../../schema.mjs"
import { serverSettingsMessage } from "../commands/server.mjs"

export const ServerStreamingPingOptOut = d
  .select()
  .string("server_streaming_pings")
  .options({
    "Allow opt-out": d.select().stringOption("true").emoji("✅"),
    "Disallow opt-out": d.select().stringOption("false").emoji("❌"),
  })
  .handler(async (interaction) => {
    const value = interaction.values[0]
    if (value === undefined) {
      return
    }

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
          maxStreamingPingCooldown: old?.maxStreamingPingCooldown,
          defaultStreamingPingCooldown: old?.defaultStreamingPingCooldown,
          allowStreamingOptOut: value === "true",
        })
        .returning()
        .get()
    })

    await interaction.update(serverSettingsMessage(guildConfig))
  })
