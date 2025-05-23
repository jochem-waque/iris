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

        const guildConfig = Database.select()
          .from(guildConfigTable)
          .where(eq(guildConfigTable.guild_id, interaction.guildId))
          .orderBy(desc(guildConfigTable.timestamp))
          .limit(1)
          .get()

        await interaction.reply(serverSettingsMessage(guildConfig))
      }),
  })

export function serverSettingsMessage(
  guildConfig?: typeof guildConfigTable.$inferSelect,
) {
  return {
    content: "",
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    components: [
      d
        .container(
          d.text(heading("Join pings")),
          ...serverJoinPingSettings(guildConfig),
          d.separator(),
          d.text(heading("Streaming pings")),
          ...serverStreamingPingSettings(guildConfig),
        )
        .build(),
    ],
  }
}
