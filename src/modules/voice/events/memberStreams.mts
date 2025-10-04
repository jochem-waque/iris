/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { ChannelType, PermissionFlagsBits } from "discord.js"
import d from "disfluent"
import { and, desc, eq, not, SQL } from "drizzle-orm"
import { Database } from "../../../index.mjs"
import { messageTable } from "../../../schema.mjs"
import {
  deleteOldMessages,
  fetchOldMessage,
  getTextChannel,
  voiceStateIsBot,
  voiceStatus,
  VoiceStatusMessageOptions,
} from "../util.mjs"

export const MemberStreams = d
  .event("voiceStateUpdate")
  .handler(async (oldState, newState) => {
    if (
      oldState.streaming ||
      !newState.streaming ||
      !newState.channelId ||
      !newState.channel
    ) {
      return
    }

    if (
      newState.channelId === newState.channel.guild.afkChannelId ||
      newState.channel.type === ChannelType.GuildStageVoice
    ) {
      return
    }

    if (
      !newState.channel
        .permissionsFor(newState.client.user.id)
        ?.has(PermissionFlagsBits.ViewChannel)
    ) {
      return
    }

    if (await voiceStateIsBot(newState)) {
      return
    }

    const options: VoiceStatusMessageOptions = {
      source: "streaming",
      voiceId: newState.channelId,
      guild: newState.guild,
      mention: newState.id,
    }

    const last = Database.select()
      .from(messageTable)
      .where(eq(messageTable.voice_id, newState.channelId))
      .orderBy(desc(messageTable.message_id))
      .limit(1)
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
