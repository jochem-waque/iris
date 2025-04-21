import { desc, eq } from "drizzle-orm"
import d from "fluent-commands"
import { Database } from "../../../index.mjs"
import { guildConfigTable } from "../../../schema.mjs"
import { serverStreamingPingSettings } from "../util.mjs"

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
          ...old,
          id: undefined,
          timestamp: undefined,
          guild_id: interaction.guildId,
          allow_streaming_opt_out: value === "true",
        })
        .returning()
    })

    await interaction.update(serverStreamingPingSettings(guildConfig))
  })
