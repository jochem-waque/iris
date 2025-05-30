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
import d from "fluent-commands"
import { Reactions } from "../../reactions/commands/reactions.mjs"
import { Pings } from "../../voice/commands/pings.mjs"
import { Server } from "../../voice/commands/server.mjs"

export const Info = d
  .slashCommand("info", "Displays information about the bot")
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
              d.text(heading("Bot information")),
              d.text(
                "Iris is a multi-purpose tool used to accommodate and make servers accessible for physically disabled members. It includes a reaction-based communication system for those with voice access technology on their devices due to physical disability. It also incorporates a reminder system for setting appropriate voice channel topics.",
              ),
              d.thumbnail(interaction.client.user.displayAvatarURL()),
            ),
            d.text(heading("Reactions", HeadingLevel.Two)),
            d.text(
              "If you mention anybody who's on the whitelist of this bot, Discord reactions will be added to your message to accommodate for those who use voice access communication features on their devices. The emojis and what they signify are as follows:",
            ),
            d.text(
              unorderedList([
                "❌ ⁠— No",
                "✅ ⁠— Yes",
                "🤔 ⁠— Let me think about it; maybe",
                "❓ ⁠— I'm confused; clarify",
                "⏲️ ⁠— Maybe later; busy",
                "💬 ⁠— Can we VC about this?; no other option applies",
                "‼️ ⁠— Acknowledgment; I understand",
              ]),
            ),
            d.text(
              `You can also add reactions to your messages by right clicking (or long pressing) them and selecting the "Add reactions" command under "Apps", or to your latest message by using the ${Reactions.id ? `</${Reactions.name} add:${Reactions.id}>` : "/reactions add"} command.`,
            ),
            d.text(
              `If these reactions weren't supposed to be added to your message, you can right click (or long press) on your message and select the "Remove reactions" command under "Apps".`,
            ),
            d.text(heading("Voice channel topics", HeadingLevel.Two)),
            d.text(
              "If you are a desktop Discord user, you should be familiar with the voice channel topic feature. This feature allows you to label voice channels with what's currently happening. For people with voice accessibility features on their devices, or even neurodivergent people, it's sometimes hard to gauge what's going on in a voice channel if the topic isn't set. Taking the time to set a clear channel topic will allow people with problems on that spectrum to more comfortably be able to join a voice channel.",
            ),
            d.text(
              "When you join a voice channel, the bot will remind you to set the channel topic.",
            ),
            d.text(
              "If you begin streaming in a voice channel, you will be reminded once more to set the channel topic.",
            ),
            d.text(
              "The message sent by the bot contains dropdowns to help you easily set an appropriate channel topic. You are not required to use these dropdowns, and can manually set the topic if you want.",
            ),
            d.text(heading("Ping configuration", HeadingLevel.Two)),
            d.text(
              `Pings can be configured using the ${Pings.id ? `</${Pings.name} configure:${Pings.id}>` : "/pings configure"} command. Server owners can change settings for their server using ${Server.id ? `</${Server.name} pings:${Server.id}>` : "/server pings"}.`,
            ),
          )
          .build(),
      ],
    })
  })
