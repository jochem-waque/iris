import { desc, eq } from "drizzle-orm"
import d from "fluent-commands"
import { Database } from "../../../index.mjs"
import { guildConfigTable } from "../../../schema.mjs"
import { Cooldowns } from "../cooldown.mjs"
import { serverStreamingPingSettings } from "../util.mjs"

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
          default_streaming_ping_cooldown: number,
          max_streaming_ping_cooldown: Math.max(
            number,
            old?.max_streaming_ping_cooldown ?? 0,
          ),
        })
        .returning()
    })

    await interaction.update(serverStreamingPingSettings(guildConfig))
  })
