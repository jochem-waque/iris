/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {
  ApplicationIntegrationType,
  Colors,
  heading,
  InteractionContextType,
  MessageFlags,
} from "discord.js"
import d from "fluent-commands"

export const Remove = d
  .contextMenuCommand("Remove reactions")
  .message()
  .integrationTypes(ApplicationIntegrationType.GuildInstall)
  .contexts(InteractionContextType.Guild)
  .handler(async (interaction) => {
    if (interaction.targetMessage.author.id !== interaction.user.id) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        components: [
          d
            .container(
              d.text(heading("Can't remove reactions")),
              d.text(
                "You can't remove reactions from messages that aren't yours!",
              ),
            )
            .accent(Colors.Red)
            .build(),
        ],
      })
      return
    }

    await interaction.deferReply({
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    })
    await interaction.deleteReply()

    await interaction.targetMessage.reactions.removeAll()
  })
