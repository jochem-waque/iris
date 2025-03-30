/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Colors, EmbedBuilder, MessageFlags } from "discord.js"
import d from "fluent-commands"

export const Remove = d
  .contextMenuCommand("Remove reactions")
  .message()
  .handler(async (interaction) => {
    if (interaction.targetMessage.author.id !== interaction.user.id) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [
          new EmbedBuilder()
            .setTitle("Can't remove reactions")
            .setDescription(
              "You can't remove reactions from messages that aren't yours!",
            )
            .setColor(Colors.Red),
        ],
      })
      return
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    await interaction.deleteReply()

    await interaction.targetMessage.reactions.removeAll()
  })
