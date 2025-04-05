/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { EmbedBuilder, MessageFlags } from "discord.js"
import d from "fluent-commands"
import { Reactions } from "../../reactions/commands/reactions.mjs"
import { TogglePings } from "../../voice/commands/togglePings.mjs"

export const Info = d
  .slashCommand("info", "Displays information about the bot")
  .handler(async (interaction) => {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [
        new EmbedBuilder()
          .setTitle("Bot information")
          .setDescription(
            `Iris is a multi-purpose tool used to accommodate and make servers accessible for physically disabled members. It includes a reaction-based communication system for those with voice access technology on their devices due to physical disability. It also incorporates a reminder system for setting appropriate voice channel topics.`,
          )
          .setFields(
            {
              name: "Reactions",
              value: `If you mention anybody who's on the whitelist of this bot, Discord reactions will be added to your message to accommodate for those who use voice access communication features on their devices. The emojis and what they signify are as follows:

❌ ⁠— No
✅ ⁠— Yes
🤔 ⁠— Let me think about it; maybe
❓ ⁠— I'm confused; clarify
⏲️ ⁠— Maybe later; busy
💬 ⁠— Can we VC about this?; no other option applies
‼️ ⁠— Acknowledgment; I understand

You can also add reactions to your messages by right clicking (or long pressing) them and selecting the "Add reactions" command under "Apps", or to your latest message by using the ${Reactions.id ? `</${Reactions.name} add:${Reactions.id}>` : "/reactions add"} command.

If these reactions weren't supposed to be added to your message, you can right click (or long press) on your message and select the "Remove reactions" command under "Apps".`,
            },
            {
              name: "Voice topics",
              value: `If you are a desktop Discord user, you should be familiar with the voice channel topic feature. This feature allows you to label voice channels with what's currently happening. For people with voice accessibility features on their devices, or even neurodivergent people, it's sometimes hard to gauge what's going on in a voice channel if the topic isn't set. Taking the time to set a clear channel topic will allow people with problems on that spectrum to more comfortably be able to join a voice channel.

When you join a voice channel, the bot will remind you to set the channel topic. You can opt out from this feature using ${TogglePings.id ? `</${TogglePings.name} toggle:${TogglePings.id}>` : "/toggle pings"}.

If you begin streaming in a voice channel, you will be reminded once more to set the channel topic. This feature cannot be opted out of.

The message sent by the bot contains dropdowns to help you easily set an appropriate channel topic. You are not required to use these dropdowns, and can manually set the topic if you want.`,
            },
          ),
      ],
    })
  })
