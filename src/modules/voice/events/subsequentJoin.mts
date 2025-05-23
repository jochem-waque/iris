/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { ChannelType } from "discord.js"
import { and, desc, eq, not, SQL } from "drizzle-orm"
import d from "fluent-commands"
import { Database } from "../../../index.mjs"
import { messageTable } from "../../../schema.mjs"
import {
  deleteOldMessages,
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

    const options: VoiceStatusMessageOptions = {
      source: "join",
      voiceId: newState.channel.id,
      guild: newState.guild,
      mention: newState.id,
    }

    const last = Database.select()
      .from(messageTable)
      .where(eq(messageTable.voice_id, newState.channel.id))
      .orderBy(desc(messageTable.message_id))
      .get()

    const oldMessage = await fetchOldMessage(newState.guild, last)
    if (oldMessage) {
      options.oldMessage = oldMessage
    }

    const { messageOptions } = voiceStatus(options)
    if (!messageOptions) {
      return
    }

    const channel = await getTextChannel(newState.channel)

    let message
    try {
      message = await channel.send(messageOptions)
    } catch (e) {
      console.error(e)
    }

    let condition: SQL | undefined = eq(
      messageTable.voice_id,
      newState.channel.id,
    )

    if (message) {
      Database.insert(messageTable)
        .values({
          channel_id: message.channelId,
          message_id: message.id,
          voice_id: newState.channel.id,
        })
        .run()

      condition = and(condition, not(eq(messageTable.message_id, message.id)))
    }

    const old = Database.delete(messageTable).where(condition).returning().all()

    await deleteOldMessages(channel.guild, old)
  })
