/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { ChannelType, DiscordAPIError, RESTJSONErrorCodes } from "discord.js"
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

    const old = Database.select()
      .from(messageTable)
      .where(eq(messageTable.voice_id, voiceChannel.id))
      .get()

    const oldMessage = await fetchOldMessage(newState.guild, old)
    if (oldMessage) {
      options.oldMessage = oldMessage
    }

    const { messageOptions } = voiceStatus(options)
    if (!messageOptions) {
      return
    }

    const channel = await getTextChannel(voiceChannel)

    let message
    try {
      message = await channel.send(messageOptions)
    } catch (e) {
      if (
        !(e instanceof DiscordAPIError) ||
        e.code !== RESTJSONErrorCodes.MissingAccess
      ) {
        throw e
      }

      return
    }

    Database.update(messageTable)
      .set({ message_id: message.id })
      .where(eq(messageTable.voice_id, voiceChannel.id))
      .run()

    await oldMessage?.delete()
  })
