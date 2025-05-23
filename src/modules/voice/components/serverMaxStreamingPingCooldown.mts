import { desc, eq } from "drizzle-orm"
import d from "fluent-commands"
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
          allow_streaming_opt_out: old?.allow_streaming_opt_out,
          max_streaming_ping_cooldown: number,
          default_streaming_ping_cooldown: Math.min(
            old?.default_streaming_ping_cooldown ??
              Number(guildConfigTable.default_streaming_ping_cooldown.default),
            number,
          ),
        })
        .returning()
        .get()
    })

    await interaction.update(serverSettingsMessage(guildConfig))
  })
