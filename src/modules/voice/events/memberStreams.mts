/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { eq } from "drizzle-orm"
import d from "fluent-commands"
import { Database } from "../../../index.mjs"
import { messageTable } from "../../../schema.mjs"

import { ChannelType } from "discord.js"
import {
  fetchOldMessage,
  getTextChannel,
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

    if (
      newState.channelId === newState.channel.guild.afkChannelId ||
      newState.channel.type === ChannelType.GuildStageVoice
    ) {
      return
    }

    if (await voiceStateIsBot(newState)) {
      return
    }

    const options: VoiceStatusMessageOptions = {
      voiceId: newState.channel.id,
      guild: newState.guild,
      mention: newState.id,
    }

    const [old] = await Database.delete(messageTable)
      .where(eq(messageTable.voice_id, newState.channel.id))
      .returning()

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
