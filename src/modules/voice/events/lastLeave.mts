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
  deleteOldMessage,
  setVoiceChannelStatus,
  voiceChannelStates,
} from "../util.mjs"

export const LastLeave = d
  .event("voiceStateUpdate")
  .handler(async (oldState, newState) => {
    if (!oldState.channel || oldState.channelId === newState.channelId) {
      return
    }

    const states = voiceChannelStates(oldState.channel)
    if (states.size > 0) {
      return
    }

    const [old] = await Database.delete(messageTable)
      .where(eq(messageTable.voice_id, oldState.channel.id))
      .returning()

    await setVoiceChannelStatus(oldState.channel, null)

    await deleteOldMessage(newState.guild, old)
  })
