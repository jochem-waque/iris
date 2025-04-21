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
  deleteOldMessage,
  getTextChannel,
  voiceChannelStates,
  voiceStateIsBot,
  voiceStatus,
} from "../util.mjs"

export const FirstJoin = d
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
    if (states.size > 1) {
      return
    }

    const { messageOptions } = await voiceStatus({
      source: "join",
      force: true,
      voiceId: newState.channel.id,
      guild: newState.guild,
      mention: newState.id,
    })

    const voiceChannel = newState.channel

    const channel = await getTextChannel(voiceChannel)

    await Database.transaction(async (tx) => {
      const [old] = await tx
        .delete(messageTable)
        .where(eq(messageTable.voice_id, voiceChannel.id))
        .returning()

      const message = await channel.send(messageOptions)

      await tx.insert(messageTable).values({
        channel_id: message.channelId,
        message_id: message.id,
        voice_id: voiceChannel.id,
      })

      await deleteOldMessage(channel.guild, old)
    })
  })
