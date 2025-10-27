/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {
  ApplicationIntegrationType,
  heading,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js"
import d from "disfluent"
import { desc, eq } from "drizzle-orm"
import { Database } from "../../../index.mjs"
import { guildConfigTable } from "../../../schema.mjs"
import {
  serverJoinPingSettings,
  serverStreamingPingSettings,
} from "../util.mjs"

export const Server = d
  .slashCommand("server", "Commands related to the server")
  .integrationTypes(ApplicationIntegrationType.GuildInstall)
  .contexts(InteractionContextType.Guild)
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
          .where(eq(guildConfigTable.guildId, interaction.guildId))
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
