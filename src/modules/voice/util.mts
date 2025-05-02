/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {
  AnyComponent,
  BaseInteraction,
  channelMention,
  ComponentType,
  DiscordAPIError,
  Guild,
  InteractionUpdateOptions,
  Message,
  MessageActionRowComponent,
  MessageCreateOptions,
  MessageFlags,
  RESTJSONErrorCodes,
  Snowflake,
  StringSelectMenuOptionBuilder,
  TopLevelComponent,
  userMention,
  VoiceBasedChannel,
  VoiceState,
} from "discord.js"
import { and, desc, eq } from "drizzle-orm"
import d from "fluent-commands"
import { Blacklist } from "../../blacklist.mjs"
import { Database } from "../../index.mjs"
import {
  activitiesTable,
  guildConfigTable,
  linkTable,
  memberConfigTable,
  messageTable,
} from "../../schema.mjs"
import { joinPings, streamingPings } from "./commands/pings.mjs"
import { ActivityDropdown } from "./components/activityDropdown.mjs"
import { NoiseDropdown } from "./components/noiseDropdown.mjs"
import { ServerDefaultJoinPingCooldown } from "./components/serverDefaultJoinPingCooldown.mjs"
import { ServerDefaultStreamingPingCooldown } from "./components/serverDefaultStreamingPingCooldown.mjs"
import { ServerJoinPingOptOut } from "./components/serverJoinPingOptOut.mjs"
import { ServerMaxJoinPingCooldown } from "./components/serverMaxJoinPingCooldown.mjs"
import { ServerMaxStreamingPingCooldown } from "./components/serverMaxStreamingPingCooldown.mjs"
import { ServerStreamingPingOptOut } from "./components/serverStreamingPingOptOut.mjs"

const JoinCooldowns = new Set<string>()
const StreamingCooldowns = new Set<string>()

export type VoiceStatusMessageOptions = {
  guild: Guild
  source?: "streaming" | "join"
  voiceId?: Snowflake
  activity?: string
  noise?: string
  oldMessage?: Message
  mention?: Snowflake
}

type VoiceStatus = {
  messageOptions: InteractionUpdateOptions & MessageCreateOptions
  status: string | null
  channelId: string | undefined
}

export async function voiceStatus(
  options: VoiceStatusMessageOptions,
): Promise<Partial<VoiceStatus>>
export async function voiceStatus(
  options: VoiceStatusMessageOptions & { force: true },
): Promise<VoiceStatus>
export async function voiceStatus({
  force,
  voiceId,
  guild,
  activity,
  noise,
  oldMessage,
  mention,
  source,
}: VoiceStatusMessageOptions & { force?: true }) {
  const key = `${guild.id}-${mention}`

  if (mention && Blacklist.has(mention)) {
    mention = undefined
  }

  if (mention && source) {
    if (
      (source === "join" && JoinCooldowns.has(key)) ||
      (source === "streaming" && StreamingCooldowns.has(key))
    ) {
      mention = undefined
    }
  }

  if (!force && !mention) {
    return {}
  }

  if (mention) {
    const [guildConfig, memberConfig] = await Database.transaction(
      async (tx) => {
        const [guildConfig] = await tx
          .select()
          .from(guildConfigTable)
          .where(eq(guildConfigTable.guild_id, guild.id))
          .orderBy(desc(guildConfigTable.timestamp))
          .limit(1)

        const [memberConfig] = await tx
          .select()
          .from(memberConfigTable)
          .where(
            and(
              eq(memberConfigTable.guild_id, guild.id),
              eq(memberConfigTable.user_id, mention),
            ),
          )
          .orderBy(desc(memberConfigTable.timestamp))
          .limit(1)

        return [guildConfig, memberConfig]
      },
    )

    const { member } =
      source === "join"
        ? joinPings(guildConfig, memberConfig)
        : streamingPings(guildConfig, memberConfig)

    if (typeof member === "number") {
      switch (source) {
        case "join":
          JoinCooldowns.add(key)
          setTimeout(
            () => {
              JoinCooldowns.delete(key)
            },
            member * 60 * 1000,
          )

          break
        case "streaming":
          StreamingCooldowns.add(key)
          setTimeout(
            () => {
              StreamingCooldowns.delete(key)
            },
            member * 60 * 1000,
          )

          break
      }
    }
  }

  // FIXME wait for discord.js fix
  activity ??= selectedValue(oldMessage?.resolveComponent(ActivityDropdown.id))
  noise ??= selectedValue(oldMessage?.resolveComponent(NoiseDropdown.id))
  voiceId ??= text(findComponentById(oldMessage?.components ?? [], 1))?.slice(
    2,
    -1,
  )

  const activities = await Database.select()
    .from(activitiesTable)
    .where(eq(activitiesTable.guild_id, guild.id))
    .orderBy(desc(activitiesTable.last_used))
    .limit(24)

  const options = activities.map(({ id, label }) =>
    d.select().stringOption(id.toString()).builder.setLabel(label),
  )

  const activityDropdown = ActivityDropdown.with().spliceOptions(
    0,
    0,
    ...options,
  )

  const noiseDropdown = NoiseDropdown.with(noise ? [noise as never] : [])

  const currentActivity = activityDropdown.options.find(
    (option) => option.data.value === activity,
  )
  if (currentActivity) {
    currentActivity.setDefault(true)
  }

  const currentNoise = noiseDropdown.options.find(
    (option) => option.data.value === noise,
  )
  if (currentNoise) {
    currentNoise.setDefault(true)
  }

  const messageOptions: MessageCreateOptions = {
    content: "",
    flags: MessageFlags.IsComponentsV2,
    components: [
      d
        .container(
          d.text(`# Voice channel topic
Please make sure that the activity and noise level that you select are representative of what is happening in the VC, and not relevant to just you or your stream.${mention ? `\n${userMention(mention)}` : ""}
## Channel`),
          d.text(channelMention(voiceId ?? "")).id(1),
          d.row(activityDropdown),
          d.row(noiseDropdown),
        )
        .build(),
    ],
  }

  return {
    messageOptions,
    status:
      currentActivity || currentNoise
        ? `${formatOption(currentActivity)} | ${formatOption(currentNoise)?.toLowerCase()}`
        : null,
    channelId: voiceId,
  }
}

// FIXME
export async function setVoiceChannelStatus(
  channel: VoiceBasedChannel,
  status: string | null,
) {
  try {
    await channel.client.rest.put(`/channels/${channel.id}/voice-status`, {
      body: {
        status,
      },
    })
  } catch (e) {
    if (
      !(e instanceof DiscordAPIError) ||
      (e.code !== RESTJSONErrorCodes.MissingAccess &&
        e.code !== RESTJSONErrorCodes.CannotExecuteActionOnThisChannelType)
    ) {
      throw e
    }
  }
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
      e instanceof DiscordAPIError &&
      (e.code === RESTJSONErrorCodes.UnknownMessage ||
        e.code === RESTJSONErrorCodes.MissingAccess)
    ) {
      return null
    }

    throw e
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

export function serverJoinPingSettings(
  config?: typeof guildConfigTable.$inferSelect,
) {
  const { guild } = joinPings(config)

  const maxCooldown = ServerMaxJoinPingCooldown.with([
    guild.maxCooldown.toString() as "0",
  ])
  if (guild.allowOptOut) {
    maxCooldown.setDisabled(true)
  }

  return [
    d.row(
      ServerJoinPingOptOut.with([
        guild.allowOptOut === true ? "true" : "false",
      ]),
    ),
    d.row(
      ServerDefaultJoinPingCooldown.with([
        guild.defaultCooldown.toString() as "0",
      ]),
    ),
    d.row(maxCooldown),
  ]
}

export function serverStreamingPingSettings(
  config?: typeof guildConfigTable.$inferSelect,
) {
  const { guild } = streamingPings(config)

  const maxCooldown = ServerMaxStreamingPingCooldown.with([
    guild.maxCooldown.toString() as "0",
  ])
  if (guild.allowOptOut) {
    maxCooldown.setDisabled(true)
  }

  return [
    d.row(
      ServerStreamingPingOptOut.with([
        guild.allowOptOut === true ? "true" : "false",
      ]),
    ),
    d.row(
      ServerDefaultStreamingPingCooldown.with([
        guild.defaultCooldown.toString() as "0",
      ]),
    ),
    d.row(maxCooldown),
  ]
}

function formatOption(option?: StringSelectMenuOptionBuilder) {
  if (!option) {
    return "unset"
  }

  if (!option.data.emoji?.name) {
    return option.data.label
  }

  return `${option.data.emoji.name} ${option.data.label}`
}

function selectedValue(component?: MessageActionRowComponent | null) {
  if (component?.type !== ComponentType.StringSelect) {
    return undefined
  }

  const selected = component.options.find((option) => option.default)
  if (!selected) {
    return undefined
  }

  return selected.value
}

function flatten(components: AnyComponent[]): AnyComponent[] {
  return components.flatMap<AnyComponent>((component) => {
    switch (component.type) {
      case ComponentType.ActionRow:
        return component.components
      case ComponentType.Container:
        return flatten(component.components)
      case ComponentType.Section:
        return [...component.components, component.accessory]
      default:
        return [component]
    }
  })
}

function findComponentById(
  components: TopLevelComponent[],
  id: number,
): AnyComponent | undefined {
  // @ts-expect-error I don't think I can fix this
  return flatten(components).find((component) => component.id === id)
}

function text(component?: AnyComponent) {
  return component?.type === ComponentType.TextDisplay
    ? component.content
    : undefined
}
