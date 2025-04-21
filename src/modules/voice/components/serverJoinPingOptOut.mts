import { desc, eq } from "drizzle-orm"
import d from "fluent-commands"
import { Database } from "../../../index.mjs"
import { guildConfigTable } from "../../../schema.mjs"
import { serverJoinPingSettings } from "../util.mjs"

export const ServerJoinPingOptOut = d
  .select()
  .string("server_join_pings")
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

    const [guildConfig] = await Database.transaction(async (tx) => {
      const [old] = await tx
        .select()
        .from(guildConfigTable)
        .where(eq(guildConfigTable.guild_id, interaction.guildId))
        .orderBy(desc(guildConfigTable.timestamp))
        .limit(1)

      return await tx
        .insert(guildConfigTable)
        .values({
          guild_id: interaction.guildId,
          max_join_ping_cooldown: old?.max_join_ping_cooldown,
          default_join_ping_cooldown: old?.default_join_ping_cooldown,
          allow_streaming_opt_out: old?.allow_streaming_opt_out,
          max_streaming_ping_cooldown: old?.max_streaming_ping_cooldown,
          default_streaming_ping_cooldown: old?.default_streaming_ping_cooldown,
          allow_join_opt_out: value === "true",
        })
        .returning()
    })

    await interaction.update(serverJoinPingSettings(guildConfig))
  })
