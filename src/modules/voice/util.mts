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
  heading,
  HeadingLevel,
  InteractionUpdateOptions,
  Message,
  MessageActionRowComponent,
  MessageCreateOptions,
  MessageFlags,
  RESTJSONErrorCodes,
  Snowflake,
  StringSelectMenuOptionBuilder,
  subtext,
  time,
  TimestampStyles,
  TopLevelComponent,
  userMention,
  VoiceBasedChannel,
  VoiceState,
} from "discord.js"
import d from "disfluent"
import { and, desc, eq, gt, sql } from "drizzle-orm"
import { Blacklist } from "../../blacklist.mjs"
import { Database } from "../../index.mjs"
import {
  activitiesTable,
  guildConfigTable,
  joinCooldownTable,
  linkTable,
  memberConfigTable,
  messageTable,
  streamCooldownTable,
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

function hasCooldown(
  source: "join" | "streaming",
  channelId: string,
  userId: string,
) {
  const table = source === "join" ? joinCooldownTable : streamCooldownTable

  const exists = Database.select({ dummy: sql`1` })
    .from(table)
    .where(
      and(
        gt(table.expiresAt, sql`UNIXEPOCH('subsecond') * 1000`),
        eq(table.channelId, channelId),
        eq(table.userId, userId),
      ),
    )
    .limit(1)
    .get()

  return !!exists
}

function addCooldown(
  source: "join" | "streaming",
  guildId: string,
  channelId: string,
  userId: string,
  millis: number,
) {
  const table = source === "join" ? joinCooldownTable : streamCooldownTable

  Database.insert(table)
    .values({
      channelId,
      userId,
      expiresAt: new Date(Date.now() + millis),
      guildId,
    })
    .onConflictDoUpdate({
      target: [table.userId, table.channelId],
      set: { expiresAt: new Date(Date.now() + millis) },
    })
    .run()
}

export interface VoiceStatusMessageOptions {
  guild: Guild
  source?: "streaming" | "join"
  voiceId?: Snowflake
  activity?: string
  noise?: string
  oldMessage?: Message
  mention?: Snowflake
}

interface VoiceStatus {
  messageOptions: InteractionUpdateOptions & MessageCreateOptions
  status: string | null
  channelId: string | undefined
}

export function voiceStatus(
  options: VoiceStatusMessageOptions,
): Partial<VoiceStatus>
export function voiceStatus(
  options: VoiceStatusMessageOptions & { force: true },
): VoiceStatus
export function voiceStatus({
  force,
  voiceId,
  guild,
  activity,
  noise,
  oldMessage,
  mention,
  source,
}: VoiceStatusMessageOptions & { force?: true }) {
  if (mention && Blacklist.has(mention)) {
    mention = undefined
  }

  if (mention && source && voiceId && hasCooldown(source, voiceId, mention)) {
    mention = undefined
  }

  if (!force && !mention) {
    return {}
  }

  if (mention) {
    const [guildConfig, memberConfig] = Database.transaction((tx) => {
      const guildConfig = tx
        .select()
        .from(guildConfigTable)
        .where(eq(guildConfigTable.guildId, guild.id))
        .orderBy(desc(guildConfigTable.timestamp))
        .limit(1)
        .get()

      const memberConfig = tx
        .select()
        .from(memberConfigTable)
        .where(
          and(
            eq(memberConfigTable.guildId, guild.id),
            eq(memberConfigTable.userId, mention),
          ),
        )
        .orderBy(desc(memberConfigTable.timestamp))
        .limit(1)
        .get()

      return [guildConfig, memberConfig]
    })

    const { member } =
      source === "join"
        ? joinPings(guildConfig, memberConfig)
        : streamingPings(guildConfig, memberConfig)

    if (typeof member === "number" && voiceId && source) {
      addCooldown(source, guild.id, voiceId, mention, member * 60 * 1000)
    }
  }

  voiceId ??= text(findComponentById(oldMessage?.components ?? [], 1))?.slice(
    2,
    -1,
  )
  let lastUpdatedAtText = text(
    findComponentById(oldMessage?.components ?? [], 2),
  )
  if (voiceId && (activity || noise)) {
    lastUpdatedAtText = subtext(
      `Last updated ${time(new Date(), TimestampStyles.RelativeTime)}`,
    )
  }

  activity ??= selectedValue(oldMessage?.resolveComponent(ActivityDropdown.id))
  noise ??= selectedValue(oldMessage?.resolveComponent(NoiseDropdown.id))

  const activities = Database.select()
    .from(activitiesTable)
    .where(eq(activitiesTable.guildId, guild.id))
    .orderBy(desc(activitiesTable.lastUsed))
    .limit(24)
    .all()

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

  const mentionText = []
  if (mention) {
    mentionText.push(d.text(userMention(mention)))
  }

  const footer = []
  if (lastUpdatedAtText) {
    footer.push(d.text(lastUpdatedAtText).id(2))
  }

  const messageOptions: MessageCreateOptions = {
    content: "",
    flags: MessageFlags.IsComponentsV2,
    components: [
      d
        .container(
          d.text(heading("Voice channel topic")),
          d.text(
            "Please make sure that the activity and noise level that you select are representative of what is happening in the VC, and not relevant to just you or your stream.",
          ),
          ...mentionText,
          d.text(heading("Channel", HeadingLevel.Two)),
          d.text(channelMention(voiceId ?? "")).id(1),
          d.row(activityDropdown),
          d.row(noiseDropdown),
          ...footer,
        )
        .build(),
    ],
  }

  return {
    messageOptions,
    status:
      currentActivity || currentNoise
        ? `${formatOption(currentActivity) ?? ""} | ${formatOption(currentNoise)?.toLowerCase() ?? ""}`
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
  const link = Database.select()
    .from(linkTable)
    .where(eq(linkTable.voiceId, channel.id))
    .limit(1)
    .get()

  if (!link) {
    return channel
  }

  let linkedChannel
  try {
    linkedChannel = await channel.guild.channels.fetch(link.textId)
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

export async function deleteOldMessages(
  guild: Guild,
  old: (typeof messageTable.$inferSelect)[],
) {
  for (const message of old) {
    let channel
    try {
      channel = await guild.channels.fetch(message.channelId)
    } catch (e) {
      console.error(e)
      continue
    }

    if (!channel?.isTextBased()) {
      continue
    }

    try {
      await channel.messages.delete(message.messageId)
    } catch (e) {
      console.error(e)
      continue
    }
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
    channel = await guild.channels.fetch(old.channelId)
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
    message = await channel.messages.fetch(old.messageId)
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
    d.row(ServerJoinPingOptOut.with([guild.allowOptOut ? "true" : "false"])),
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
      ServerStreamingPingOptOut.with([guild.allowOptOut ? "true" : "false"]),
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

  return `${option.data.emoji.name} ${option.data.label ?? ""}`
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
