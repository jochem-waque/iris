/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {
  AnyComponent,
  APISelectMenuOption,
  BaseInteraction,
  channelMention,
  ComponentType,
  DiscordAPIError,
  EmbedBuilder,
  Guild,
  InteractionUpdateOptions,
  Message,
  MessageCreateOptions,
  RESTJSONErrorCodes,
  Snowflake,
  userMention,
  VoiceBasedChannel,
  VoiceState,
} from "discord.js"
import { desc, eq } from "drizzle-orm"
import d from "fluent-commands"
import { Database } from "../../index.mjs"
import { activitiesTable, linkTable, messageTable } from "../../schema.mjs"
import { ActivityDropdown } from "./components/activityDropdown.mjs"
import { NoiseDropdown } from "./components/noiseDropdown.mjs"

export type VoiceStatusMessageOptions = {
  guild: Guild
  voiceId?: Snowflake
  activity?: string
  noise?: string
  oldMessage?: Message
  mention?: Snowflake
}

export async function voiceStatus({
  voiceId,
  guild,
  activity,
  noise,
  oldMessage,
  mention,
}: VoiceStatusMessageOptions) {
  activity ??= selectedValue(oldMessage?.components[0]?.components[0]?.data)
  noise ??= selectedValue(oldMessage?.components[1]?.components[0]?.data)
  voiceId ??= oldMessage?.embeds[0]?.fields[0]?.value.slice(2, -1)

  const activities = await Database.select()
    .from(activitiesTable)
    .where(eq(activitiesTable.guild_id, guild.id))
    .orderBy(desc(activitiesTable.last_used))
    .limit(24)

  const options = activities.map(({ id, label }) =>
    d.select().stringOption(id.toString()).builder.setLabel(label),
  )

  const activityDropdown = ActivityDropdown.build()
  activityDropdown.options.unshift(
    ...options.map((builder) => builder.toJSON()),
  )

  const noiseDropdown = NoiseDropdown.build(noise ? [noise as never] : [])

  const currentActivity = activityDropdown.options.find(
    (option) => option.value === activity,
  )
  if (currentActivity) {
    currentActivity.default = true
  }

  const currentNoise = noiseDropdown.options.find(
    (option) => option.value === noise,
  )
  if (currentNoise) {
    currentNoise.default = true
  }

  const embed = new EmbedBuilder()
    .setTitle("Voice channel topic")
    .setDescription(
      "Please make sure that the activity and noise level that you select are representative of what is happening in the VC, and not relevant to just you or your stream.",
    )

  if (voiceId) {
    embed.setFields({ name: "Channel", value: channelMention(voiceId) })
  }

  const messageOptions: InteractionUpdateOptions & MessageCreateOptions = {
    components: [d.row(activityDropdown), d.row(noiseDropdown)],
    embeds: [embed],
  }

  if (mention) {
    messageOptions.content = `\n${userMention(mention)}`
  }

  return {
    messageOptions,
    status:
      currentActivity || currentNoise
        ? `${formatOption(currentActivity)} | ${formatOption(currentNoise).toLowerCase()}`
        : null,
    channelId: voiceId,
  }
}

// FIXME
export async function setVoiceChannelStatus(
  channel: VoiceBasedChannel,
  status: string | null,
) {
  await channel.client.rest.put(`/channels/${channel.id}/voice-status`, {
    body: {
      status,
    },
  })
}

export function voiceChannelStates(channel: VoiceBasedChannel) {
  return channel.guild.voiceStates.cache.filter(
    (state) => state.channelId === channel.id,
  )
}

// TODO filtering voice states might be better
export async function voiceStateIsBot(state: VoiceState) {
  if (state.member) {
    return state.member.user.bot
  }

  const user = await state.client.users.fetch(state.id)
  return user.bot
}

export async function getTextChannel(channel: VoiceBasedChannel) {
  const [link] = await Database.select()
    .from(linkTable)
    .where(eq(linkTable.voice_id, channel.id))
    .limit(1)

  if (!link) {
    return channel
  }

  let linkedChannel
  try {
    linkedChannel = await channel.guild.channels.fetch(link.text_id)
  } catch (e) {
    if (
      !(e instanceof DiscordAPIError) ||
      e.code !== RESTJSONErrorCodes.UnknownChannel
    ) {
      throw e
    }

    return channel
  }

  return linkedChannel?.isTextBased() ? linkedChannel : channel
}

export async function deleteOldMessage(
  guild: Guild,
  old?: typeof messageTable.$inferSelect,
) {
  if (!old) {
    return
  }

  let channel
  try {
    channel = await guild.channels.fetch(old.channel_id)
  } catch (e) {
    if (
      !(e instanceof DiscordAPIError) ||
      e.code !== RESTJSONErrorCodes.UnknownChannel
    ) {
      throw e
    }

    return
  }

  if (!channel?.isTextBased()) {
    return
  }

  try {
    await channel.messages.delete(old.message_id)
  } catch (e) {
    if (
      !(e instanceof DiscordAPIError) ||
      e.code !== RESTJSONErrorCodes.UnknownMessage
    ) {
      throw e
    }

    return
  }
}

export async function fetchOldMessage(
  guild: Guild,
  old?: typeof messageTable.$inferSelect,
) {
  if (!old) {
    return null
  }

  let channel
  try {
    channel = await guild.channels.fetch(old.channel_id)
  } catch (e) {
    if (
      !(e instanceof DiscordAPIError) ||
      e.code !== RESTJSONErrorCodes.UnknownChannel
    ) {
      throw e
    }

    return
  }

  if (!channel?.isTextBased()) {
    return null
  }

  let message
  try {
    message = await channel.messages.fetch(old.message_id)
  } catch (e) {
    if (
      !(e instanceof DiscordAPIError) ||
      e.code !== RESTJSONErrorCodes.UnknownMessage
    ) {
      throw e
    }

    return null
  }

  return message
}

export async function conditionallyUpdateStatus(
  interaction: BaseInteraction<"cached">,
  status: string | null,
  channelId?: string,
) {
  if (interaction.channel?.isVoiceBased()) {
    await setVoiceChannelStatus(interaction.channel, status)
    return
  }

  if (!channelId) {
    return
  }

  const channel = await interaction.guild.channels.fetch(channelId)
  if (channel?.isVoiceBased()) {
    await setVoiceChannelStatus(channel, status)
  }
}

function formatOption(option?: APISelectMenuOption) {
  if (!option) {
    return "unset"
  }

  if (!option.emoji?.name) {
    return option.label
  }

  return `${option.emoji.name} ${option.label}`
}

function selectedValue(component?: AnyComponent) {
  if (component?.type !== ComponentType.StringSelect) {
    return undefined
  }

  const selected = component.options.find((option) => option.default)
  if (!selected) {
    return undefined
  }

  return selected.value
}
