/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { eq } from "drizzle-orm"
import d from "fluent-commands"
import { Database } from "../../../index.mjs"
import { joinPingsTable, messageTable } from "../../../schema.mjs"
import { voiceChannelStates, voiceStateIsBot, voiceStatus } from "../util.mjs"

export const SubsequentJoin = d
  .event("voiceStateUpdate")
  .handler(async (oldState, newState) => {
    if (!newState.channel || oldState.channelId === newState.channelId) {
      return
    }

    if (await voiceStateIsBot(newState)) {
      return
    }

    const states = voiceChannelStates(newState.channel)
    if (states.size <= 1) {
      return
    }

    const [noPing] = await Database.select()
      .from(joinPingsTable)
      .where(eq(joinPingsTable.user_id, newState.id))
      .limit(1)

    if (noPing) {
      return
    }

    const [old] = await Database.delete(messageTable)
      .where(eq(messageTable.channel_id, newState.channel.id))
      .returning()

    if (!old) {
      return
    }

    const oldMessage = await newState.channel.messages.fetch(old.message_id)

    const { messageOptions } = await voiceStatus({
      channel: newState.channel,
      oldMessage,
      mention: newState.id,
    })

    const message = await newState.channel.send(messageOptions)

    await Database.insert(messageTable).values({
      channel_id: message.channelId,
      message_id: message.id,
    })

    await oldMessage.delete()
  })
