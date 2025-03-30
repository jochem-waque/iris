/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {
  AnyComponent,
  APISelectMenuOption,
  ComponentType,
  heading,
  Message,
  Snowflake,
  userMention,
  VoiceBasedChannel,
  VoiceState,
} from "discord.js"
import { desc, eq } from "drizzle-orm"
import d from "fluent-commands"
import { Database } from "../../index.mjs"
import { activitiesTable } from "../../schema.mjs"
import { ActivityDropdown } from "./components/activityDropdown.mjs"
import { NoiseDropdown } from "./components/noiseDropdown.mjs"

export type VoiceStatusMessageOptions = {
  channel: VoiceBasedChannel
  activity?: string
  noise?: string
  oldMessage?: Message
  mention?: Snowflake
}

export async function voiceStatus({
  channel,
  activity,
  noise,
  oldMessage,
  mention,
}: VoiceStatusMessageOptions) {
  activity ??= selectedValue(oldMessage?.components[0]?.components[0]?.data)
  noise ??= selectedValue(oldMessage?.components[1]?.components[0]?.data)

  const activities = await Database.select()
    .from(activitiesTable)
    .where(eq(activitiesTable.guild_id, channel.guildId))
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

  let content = heading("Voice channel status")
  if (mention) {
    content += `\n${userMention(mention)}`
  }

  return {
    messageOptions: {
      content,
      components: [d.row(activityDropdown), d.row(noiseDropdown)],
    },
    status:
      currentActivity || currentNoise
        ? `${formatOption(currentActivity)} | ${formatOption(currentNoise).toLowerCase()}`
        : null,
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
