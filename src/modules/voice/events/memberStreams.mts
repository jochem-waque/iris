/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { ChannelType, PermissionFlagsBits } from "discord.js"
import d from "disfluent"
import { and, desc, eq, not } from "drizzle-orm"
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
      .where(eq(messageTable.voiceId, newState.channelId))
      .orderBy(desc(messageTable.messageId))
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

    const message = await channel.send(messageOptions)

    try {
      Database.insert(messageTable)
        .values({
          channelId: message.channelId,
          messageId: message.id,
          voiceId: newState.channelId,
        })
        .run()
    } catch (e) {
      await message.delete()
      throw e
    }

    const old = Database.delete(messageTable)
      .where(
        and(
          eq(messageTable.voiceId, newState.channelId),
          not(eq(messageTable.messageId, message.id)),
        ),
      )
      .returning()
      .all()

    await deleteOldMessages(channel.guild, old)
  })
