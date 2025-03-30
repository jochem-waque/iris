/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import d from "fluent-commands"
import { Database } from "../../../index.mjs"
import { mentionTable } from "../../../schema.mjs"

const reactions = ["❌", "✅", "🤔", "❓", "⏲️", "💬", "‼️"]

export const ReactOnMention = d
  .event("messageCreate")
  .handler(async (message) => {
    if (message.author.bot) {
      return
    }

    const users = await Database.select().from(mentionTable)

    const clone = message.mentions.parsedUsers.clone()
    clone.delete(message.author.id)

    if (!clone.hasAny(...users.map((user) => user.user_id))) {
      return
    }

    for (const reaction of reactions) {
      await message.react(reaction)
    }
  })
