/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Colors, EmbedBuilder, MessageFlags } from "discord.js"
import d from "fluent-commands"
import { Emojis } from "../../events/reactOnMention.mjs"

export const Add = d
  .subcommand("Add reactions to your latest message")
  .handler(async (interaction) => {
    if (!interaction.inCachedGuild() || !interaction.channel) {
      return
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    const messages = await interaction.channel.messages.fetch({
      limit: 100,
      before: interaction.id,
    })

    const first = messages.find(
      (message) => message.author.id === interaction.user.id,
    )
    if (!first) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("No message found")
            .setDescription("Couldn't find a message to add reactions to!")
            .setColor(Colors.Red),
        ],
      })
      return
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Adding reactions")
          .setDescription(`Adding reactions to ${first.url}`),
      ],
    })

    for (const emoji of Emojis) {
      await first.react(emoji)
    }

    await interaction.deleteReply()
  })
