/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {
  ApplicationIntegrationType,
  heading,
  HeadingLevel,
  InteractionContextType,
  MessageFlags,
  unorderedList,
} from "discord.js"
import d from "disfluent"

export const Guide = d
  .slashCommand(
    "guide",
    "Shows more in-depth information on how to use the bot",
  )
  .integrationTypes(
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall,
  )
  .contexts(
    InteractionContextType.BotDM,
    InteractionContextType.Guild,
    InteractionContextType.PrivateChannel,
  )
  .handler(async (interaction) => {
    await interaction.reply({
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      components: [
        d
          .container(
            d.section(
              d.text(heading("Voice topics guide")),
              d.text(
                "While being silly and quippy in voice channel topics can be fun as a little inside joke for your friend group, it can leave those with physical disabilities or neurodivergencies out!",
              ),
              d.text(
                "Having a clear-cut description of what's going on in a voice channel can help a lot of people who might have it a bit harder.",
              ),
              d.thumbnail(interaction.client.user.displayAvatarURL()),
            ),
            d.text(heading("Art example", HeadingLevel.Two)),
            d.text(
              "If somebody is streaming art, and most other people are watching and the volume and vibe of the VC is moderate, the topic could be something like:",
            ),
            d.text(
              unorderedList([
                '"Streaming art + talking | low volume"',
                '"Streaming art, some Minecraft | chill talk"',
              ]),
            ),
            d.text(
              "A topic like this is clear, concise, and directly conveys what's going on in the channel to those who are not in it already.",
            ),
            d.text(heading("Misuse", HeadingLevel.Three)),
            d.text("Incorrect use of this feature would be:"),
            d.text(
              unorderedList([
                '"creature vibes 🐈 🐈"',
                '"🔥 🔥 🔥 🔥 🔥 "',
                '"Drawig"',
              ]),
            ),
            d.text(
              "Topics like these are too vague or not helpful in gauging what the environment is like.",
            ),
            d.text(heading("Gaming example", HeadingLevel.Two)),
            d.text(
              "If people are in a VC, and multiple people are streaming games and everybody's chattering with each other, a channel topic that could help people with physical disabilities and neurodivergencies could be:",
            ),
            d.text(
              unorderedList([
                '"Gaming, nothing specific | loud"',
                '"Variety gaming, parallel play | quiet talking"',
                '"Playing minecraft, talking | loud"',
              ]),
            ),
            d.text(heading("Misuse", HeadingLevel.Three)),
            d.text(unorderedList(['"bark bark bark bark"', '"el gaming"'])),
            d.text(
              "Sure, you said that gaming is going on in the VC, but if somebody isn't in the VC, they're only going to know that you're gaming. They're not going to know which game, whether or not you guys are talking while you game, or the volume of the VC.",
            ),
          )
          .build(),
      ],
    })
  })
