/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { eq } from "drizzle-orm"
import d from "fluent-commands"
import { Database } from "../../../index.mjs"
import { messageTable } from "../../../schema.mjs"
import { voiceChannelStates, voiceStateIsBot, voiceStatus } from "../util.mjs"

export const FirstJoin = d
  .event("voiceStateUpdate")
  .handler(async (oldState, newState) => {
    if (!newState.channel || oldState.channelId === newState.channelId) {
      return
    }

    if (await voiceStateIsBot(newState)) {
      return
    }

    const states = voiceChannelStates(newState.channel)
    if (states.size > 1) {
      return
    }

    const { messageOptions } = await voiceStatus({
      channel: newState.channel,
      mention: newState.id,
    })

    const message = await newState.channel.send(messageOptions)

    const [old] = await Database.delete(messageTable)
      .where(eq(messageTable.channel_id, message.channelId))
      .returning()

    await Database.insert(messageTable).values({
      channel_id: message.channelId,
      message_id: message.id,
    })

    if (old) {
      await message.channel.messages.delete(old.message_id)
    }
  })
