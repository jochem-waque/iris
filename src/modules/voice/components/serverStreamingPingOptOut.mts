import { desc, eq } from "drizzle-orm"
import d from "fluent-commands"
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
        .where(eq(guildConfigTable.guild_id, interaction.guildId))
        .orderBy(desc(guildConfigTable.timestamp))
        .limit(1)
        .get()

      return tx
        .insert(guildConfigTable)
        .values({
          guild_id: interaction.guildId,
          allow_join_opt_out: old?.allow_join_opt_out,
          max_join_ping_cooldown: old?.max_join_ping_cooldown,
          default_join_ping_cooldown: old?.default_join_ping_cooldown,
          max_streaming_ping_cooldown: old?.max_streaming_ping_cooldown,
          default_streaming_ping_cooldown: old?.default_streaming_ping_cooldown,
          allow_streaming_opt_out: value === "true",
        })
        .returning()
        .get()
    })

    await interaction.update(serverSettingsMessage(guildConfig))
  })
