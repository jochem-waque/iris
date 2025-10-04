/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { DiscordAPIError, RESTJSONErrorCodes } from "discord.js"
import d from "disfluent"
import { Database } from "../../../index.mjs"
import { mentionTable } from "../../../schema.mjs"

export const Emojis = ["❌", "✅", "🤔", "❓", "⏲️", "💬", "‼️"]

export const ReactOnMention = d
  .event("messageCreate")
  .handler(async (message) => {
    if (message.author.bot) {
      return
    }

    const users = Database.select().from(mentionTable).all()

    const clone = message.mentions.parsedUsers.clone()
    clone.delete(message.author.id)

    if (!clone.hasAny(...users.map((user) => user.user_id))) {
      return
    }

    for (const emoji of Emojis) {
      try {
        await message.react(emoji)
      } catch (e) {
        if (
          !(e instanceof DiscordAPIError) ||
          e.code !== RESTJSONErrorCodes.ReactionWasBlocked
        ) {
          throw e
        }
      }
    }
  })
