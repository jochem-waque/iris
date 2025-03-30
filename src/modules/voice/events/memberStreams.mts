/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { eq } from "drizzle-orm"
import d from "fluent-commands"
import { Database } from "../../../index.mjs"
import { messageTable } from "../../../schema.mjs"

import {
  voiceStateIsBot,
  voiceStatus,
  VoiceStatusMessageOptions,
} from "../util.mjs"

export const MemberStreams = d
  .event("voiceStateUpdate")
  .handler(async (oldState, newState) => {
    if (oldState.streaming || !newState.streaming || !newState.channel) {
      return
    }

    if (await voiceStateIsBot(newState)) {
      return
    }

    const options: VoiceStatusMessageOptions = {
      channel: newState.channel,
      mention: newState.id,
    }

    const [old] = await Database.delete(messageTable)
      .where(eq(messageTable.channel_id, newState.channel.id))
      .returning()

    let oldMessage
    if (old) {
      oldMessage = await newState.channel.messages.fetch(old.message_id)
      options.oldMessage = oldMessage
    }

    const { messageOptions } = await voiceStatus(options)

    const message = await newState.channel.send(messageOptions)

    await Database.insert(messageTable).values({
      channel_id: message.channelId,
      message_id: message.id,
    })

    await oldMessage?.delete()
  })
