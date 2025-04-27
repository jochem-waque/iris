/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { ChannelType } from "discord.js"
import { eq } from "drizzle-orm"
import d from "fluent-commands"
import { Database } from "../../../index.mjs"
import { messageTable } from "../../../schema.mjs"
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

    const voiceChannel = newState.channel
    const options: VoiceStatusMessageOptions = {
      source: "join",
      voiceId: voiceChannel.id,
      guild: newState.guild,
      mention: newState.id,
    }

    await Database.transaction(async (tx) => {
      const [old] = await tx
        .select()
        .from(messageTable)
        .where(eq(messageTable.voice_id, voiceChannel.id))

      const oldMessage = await fetchOldMessage(newState.guild, old)
      if (oldMessage) {
        options.oldMessage = oldMessage
      }

      const { messageOptions } = await voiceStatus(options)
      if (!messageOptions) {
        return
      }

      const channel = await getTextChannel(voiceChannel)

      const message = await channel.send(messageOptions)

      await tx
        .delete(messageTable)
        .where(eq(messageTable.voice_id, voiceChannel.id))

      await tx.insert(messageTable).values({
        channel_id: message.channelId,
        message_id: message.id,
        voice_id: voiceChannel.id,
      })

      await oldMessage?.delete()
    })
  })
