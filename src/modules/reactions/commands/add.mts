/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Colors, EmbedBuilder, MessageFlags } from "discord.js"
import d from "fluent-commands"
import { Emojis } from "../events/reactOnMention.mjs"

export const Add = d
  .contextMenuCommand("Add reactions")
  .message()
  .handler(async (interaction) => {
    if (interaction.targetMessage.author.id !== interaction.user.id) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [
          new EmbedBuilder()
            .setTitle("Can't add reactions")
            .setDescription(
              "You can't add reactions to messages that aren't yours!",
            )
            .setColor(Colors.Red),
        ],
      })
      return
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    await interaction.deleteReply()

    for (const emoji of Emojis) {
      await interaction.targetMessage.react(emoji)
    }
  })
