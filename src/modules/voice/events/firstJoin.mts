/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { ChannelType } from "discord.js"
import { and, eq, not, SQL } from "drizzle-orm"
import d from "fluent-commands"
import { Database } from "../../../index.mjs"
import { messageTable } from "../../../schema.mjs"
import {
  deleteOldMessages,
  getTextChannel,
  voiceChannelStates,
  voiceStateIsBot,
  voiceStatus,
} from "../util.mjs"

export const FirstJoin = d
  .event("voiceStateUpdate")
  .handler(async (oldState, newState) => {
    if (
      !newState.channelId ||
      !newState.channel ||
      oldState.channelId === newState.channelId
    ) {
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

    const { messageOptions } = voiceStatus({
      source: "join",
      force: true,
      voiceId: newState.channelId,
      guild: newState.guild,
      mention: newState.id,
    })

    const channel = await getTextChannel(newState.channel)

    let message
    try {
      message = await channel.send(messageOptions)
    } catch (e) {
      console.error(e)
    }

    let condition: SQL | undefined = eq(
      messageTable.voice_id,
      newState.channelId,
    )

    if (message) {
      Database.insert(messageTable)
        .values({
          channel_id: message.channelId,
          message_id: message.id,
          voice_id: newState.channelId,
        })
        .run()

      condition = and(condition, not(eq(messageTable.message_id, message.id)))
    }

    const old = Database.delete(messageTable).where(condition).returning().all()

    await deleteOldMessages(channel.guild, old)
  })
