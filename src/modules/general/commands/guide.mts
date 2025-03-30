/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { EmbedBuilder, MessageFlags } from "discord.js"
import d from "fluent-commands"

export const Guide = d
  .slashCommand(
    "guide",
    "Shows more in-depth information on how to use the bot",
  )
  .handler(async (interaction) => {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [
        new EmbedBuilder()
          .setTitle("Voice topics guide")
          .setDescription(
            `While being silly and quippy in voice channel topics can be fun as a little inside joke for your friend group, it can leave those with physical disabilities or neurodivergencies out! 

Having a clear-cut description of what's going on in a voice channel can help a lot of people who might have it a bit harder.`,
          )
          .setFields(
            {
              name: "Art example",
              value: `If somebody is streaming art, and most other people are watching and the volume and vibe of the VC is moderate, the topic could be something like:

- "Streaming art + talking | low volume"
- "Streaming art, some Minecraft | chill talk"

A topic like this is clear, concise, and directly conveys what's going on in the channel to those who are not in it already.`,
            },
            {
              name: "Misuse",
              value: `Incorrect use of this feature would be:

- "creature vibes 🐈 🐈"
- "🔥 🔥 🔥 🔥 🔥 "
- "Drawig"

Topics like these are too vague or not helpful in gauging what the environment is like.`,
            },
            {
              name: "Gaming example",
              value: `If people are in a VC, and multiple people are streaming games and everybody's chattering with each other, a channel topic that could help people with physical disabilities and neurodivergencies could be:

- "Gaming, nothing specific | loud"
- "Variety gaming, parallel play | quiet talking"
- "Playing minecraft, talking | loud"

Once again, these topics convey accurately what's going on in a VC to people who are not involved in it. Specifically describing that the conversation isn't related to the games that are being played will allow people to deduce that they can join a VC even if they are not able to play the game.`,
            },
            {
              name: "Misuse",
              value: `Incorrect use of this feature would be:

- "bark bark bark bark"
- "el gaming"

Sure, you said that gaming is going on in the VC, but if somebody isn't in the VC, they're only going to know that you're gaming. They're not going to know which game, whether or not you guys are talking while you game, or the volume of the VC.`,
            },
          ),
      ],
    })
  })
