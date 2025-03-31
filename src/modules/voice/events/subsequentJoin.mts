/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { ChannelType } from "discord.js"
import { eq } from "drizzle-orm"
import d from "fluent-commands"
import { Database } from "../../../index.mjs"
import { joinPingsTable, messageTable } from "../../../schema.mjs"
import {
  fetchOldMessage,
  getTextChannel,
  voiceChannelStates,
  voiceStateIsBot,
  voiceStatus,
  VoiceStatusMessageOptions,
} from "../util.mjs"

export const SubsequentJoin = d
  .event("voiceStateUpdate")
  .handler(async (oldState, newState) => {
    if (!newState.channel || oldState.channelId === newState.channelId) {
      return
    }

    if (
      newState.channelId === newState.channel.guild.afkChannelId ||
      newState.channel.type === ChannelType.GuildStageVoice
    ) {
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
      .where(eq(messageTable.voice_id, newState.channel.id))
      .returning()

    const options: VoiceStatusMessageOptions = {
      voiceId: newState.channel.id,
      guild: newState.guild,
      mention: newState.id,
    }

    const oldMessage = await fetchOldMessage(newState.guild, old)
    if (oldMessage) {
      options.oldMessage = oldMessage
    }

    const { messageOptions } = await voiceStatus(options)

    const channel = await getTextChannel(newState.channel)

    const message = await channel.send(messageOptions)

    await Database.insert(messageTable).values({
      channel_id: message.channelId,
      message_id: message.id,
      voice_id: newState.channel.id,
    })

    await oldMessage?.delete()
  })
