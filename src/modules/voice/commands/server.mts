/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { heading, MessageFlags, PermissionFlagsBits } from "discord.js"
import { desc, eq } from "drizzle-orm"
import d from "fluent-commands"
import { Database } from "../../../index.mjs"
import { guildConfigTable } from "../../../schema.mjs"
import {
  serverJoinPingSettings,
  serverStreamingPingSettings,
} from "../util.mjs"

export const Server = d
  .slashCommand("server", "Commands related to the server")
  .defaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .subcommands({
    pings: d
      .subcommand("Configure ping settings for the entire server")
      .handler(async (interaction) => {
        if (!interaction.inCachedGuild()) {
          return
        }

        const [guildConfig] = await Database.select()
          .from(guildConfigTable)
          .where(eq(guildConfigTable.guild_id, interaction.guildId))
          .orderBy(desc(guildConfigTable.timestamp))
          .limit(1)

        await interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: heading("Join pings"),
          ...serverJoinPingSettings(guildConfig),
        })

        await interaction.followUp({
          flags: MessageFlags.Ephemeral,
          content: heading("Streaming pings"),
          ...serverStreamingPingSettings(guildConfig),
        })
      }),
  })
