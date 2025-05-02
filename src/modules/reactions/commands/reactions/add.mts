/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {
  Colors,
  DiscordAPIError,
  MessageFlags,
  RESTJSONErrorCodes,
} from "discord.js"
import d from "fluent-commands"
import { Emojis } from "../../events/reactOnMention.mjs"

export const Add = d
  .subcommand("Add reactions to your latest message")
  .handler(async (interaction) => {
    if (!interaction.inCachedGuild() || !interaction.channel) {
      return
    }

    await interaction.deferReply({
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    })

    const messages = await interaction.channel.messages.fetch({
      limit: 100,
      before: interaction.id,
    })

    const first = messages.find(
      (message) => message.author.id === interaction.user.id,
    )
    if (!first) {
      await interaction.editReply({
        content: "",
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        components: [
          d
            .container(
              d.text(`# No message found
Couldn't find a message to add reactions to!`),
            )
            .accent(Colors.Red)
            .build(),
        ],
      })
      return
    }

    await interaction.editReply({
      content: "",
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      components: [
        d
          .container(
            d.text(`# Adding reactions
Adding reactions to ${first.url}`),
          )
          .accent(Colors.Green)
          .build(),
      ],
    })

    try {
      for (const emoji of Emojis) {
        await first.react(emoji)
      }
    } catch (e) {
      if (
        !(e instanceof DiscordAPIError) ||
        e.code !== RESTJSONErrorCodes.MissingAccess
      ) {
        throw e
      }

      await interaction.editReply({
        content: "",
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        components: [
          d
            .container(
              d.text(`# Adding reactions
I don't have permission to add reactions to ${first.url}!`),
            )
            .accent(Colors.Red)
            .build(),
        ],
      })
      return
    }

    await interaction.deleteReply()
  })
