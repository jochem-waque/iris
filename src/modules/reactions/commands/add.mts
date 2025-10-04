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
import d from "disfluent"
import { Emojis } from "../events/reactOnMention.mjs"

export const Add = d
  .contextMenuCommand("Add reactions")
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
              d.text(heading("Can't add reactions")),
              d.text("You can't add reactions to messages that aren't yours!"),
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

    for (const emoji of Emojis) {
      await interaction.targetMessage.react(emoji)
    }
  })
