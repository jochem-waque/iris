/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {
  ApplicationIntegrationType,
  heading,
  InteractionContextType,
  MessageFlags,
  unorderedList,
} from "discord.js"
import d from "disfluent"
import { and, desc, eq } from "drizzle-orm"
import { Database } from "../../../index.mjs"
import { guildConfigTable, memberConfigTable } from "../../../schema.mjs"
import { joinPingSettings } from "../components/joinPingSettings.mjs"
import { streamingPingSettings } from "../components/streamingPingSettings.mjs"

export const Pings = d
  .slashCommand("pings", "Commands related to pings")
  .integrationTypes(ApplicationIntegrationType.GuildInstall)
  .contexts(InteractionContextType.Guild)
  .subcommands({
    configure: d
      .subcommand("Configure ping-related settings")
      .handler(async (interaction) => {
        if (!interaction.inCachedGuild()) {
          return
        }

        const [guildConfig, memberConfig] = Database.transaction((tx) => {
          const guildConfig = tx
            .select()
            .from(guildConfigTable)
            .where(eq(guildConfigTable.guild_id, interaction.guildId))
            .orderBy(desc(guildConfigTable.timestamp))
            .limit(1)
            .get()

          const memberConfig = tx
            .select()
            .from(memberConfigTable)
            .where(
              and(
                eq(memberConfigTable.guild_id, interaction.guildId),
                eq(memberConfigTable.user_id, interaction.user.id),
              ),
            )
            .orderBy(desc(memberConfigTable.timestamp))
            .limit(1)
            .get()

          return [guildConfig, memberConfig]
        })

        await interaction.reply(pingsMessage(guildConfig, memberConfig))
      }),
  })

export function pingsMessage(
  guildConfig?: typeof guildConfigTable.$inferSelect,
  memberConfig?: typeof memberConfigTable.$inferSelect,
) {
  return {
    content: "",
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    components: [
      d
        .container(
          d.text(heading("Join pings")),
          d.text(pingsTexts("join", guildConfig)),
          d.row(joinPingSettings(guildConfig, memberConfig)),
          d.separator(),
          d.text(heading("Streaming pings")),
          d.text(pingsTexts("streaming", guildConfig)),
          d.row(streamingPingSettings(guildConfig, memberConfig)),
        )
        .build(),
    ],
  }
}

function pingsTexts(
  type: "join" | "streaming",
  guildConfig?: typeof guildConfigTable.$inferSelect,
) {
  const strings: string[] = []

  const { guild } =
    type === "join" ? joinPings(guildConfig) : streamingPings(guildConfig)

  if (guild.allowOptOut) {
    strings.push(`This server allows you to opt out from ${type} pings.`)
    strings.push(`This server allows you to set any ${type} ping cooldown.`)
  } else {
    strings.push(
      `This server does not allow you to opt out from ${type} pings.`,
    )

    if (guild.maxCooldown === 0) {
      strings.push(
        `This server does not allow you to set a ${type} ping cooldown.`,
      )
    } else {
      strings.push(
        `This server allows you to set a ${type} ping cooldown up to ${guild.maxCooldown} ${guild.maxCooldown === 1 ? "minute" : "minutes"}.`,
      )
    }
  }

  return unorderedList(strings)
}

export function joinPings(
  guildConfig?: Pick<
    typeof guildConfigTable.$inferSelect,
    | "allow_join_opt_out"
    | "max_join_ping_cooldown"
    | "default_join_ping_cooldown"
  >,
  memberConfig?: Pick<
    typeof memberConfigTable.$inferSelect,
    "disable_join_pings" | "join_ping_cooldown"
  >,
) {
  const guild = {
    allowOptOut:
      guildConfig?.allow_join_opt_out ??
      guildConfigTable.allow_join_opt_out.default === true,
    maxCooldown:
      guildConfig?.max_join_ping_cooldown ??
      Number(guildConfigTable.max_join_ping_cooldown.default),
    defaultCooldown:
      guildConfig?.default_join_ping_cooldown ??
      Number(guildConfigTable.default_join_ping_cooldown.default),
  }

  if (guild.allowOptOut) {
    guild.maxCooldown = Number.MAX_SAFE_INTEGER
  }

  guild.defaultCooldown = Math.min(guild.defaultCooldown, guild.maxCooldown)

  if (memberConfig?.disable_join_pings === false) {
    return { guild, member: true }
  }

  if (memberConfig?.disable_join_pings && guild.allowOptOut) {
    return { guild, member: false }
  }

  if (memberConfig?.join_ping_cooldown) {
    return {
      guild,
      member:
        Math.min(memberConfig.join_ping_cooldown, guild.maxCooldown) || true,
    }
  }

  return { guild, member: guild.defaultCooldown || true }
}

export function streamingPings(
  guildConfig?: Pick<
    typeof guildConfigTable.$inferSelect,
    | "allow_streaming_opt_out"
    | "max_streaming_ping_cooldown"
    | "default_streaming_ping_cooldown"
  >,
  memberConfig?: Pick<
    typeof memberConfigTable.$inferSelect,
    "disable_streaming_pings" | "streaming_ping_cooldown"
  >,
) {
  const guild = {
    allowOptOut:
      guildConfig?.allow_streaming_opt_out ??
      guildConfigTable.allow_streaming_opt_out.default === true,
    maxCooldown:
      guildConfig?.max_streaming_ping_cooldown ??
      Number(guildConfigTable.max_streaming_ping_cooldown.default),
    defaultCooldown:
      guildConfig?.default_streaming_ping_cooldown ??
      Number(guildConfigTable.default_streaming_ping_cooldown.default),
  }

  if (guild.allowOptOut) {
    guild.maxCooldown = Number.MAX_SAFE_INTEGER
  }

  guild.defaultCooldown = Math.min(guild.defaultCooldown, guild.maxCooldown)

  if (memberConfig?.disable_streaming_pings === false) {
    return { guild, member: true }
  }

  if (memberConfig?.disable_streaming_pings && guild.allowOptOut) {
    return { guild, member: false }
  }

  if (memberConfig?.streaming_ping_cooldown) {
    return {
      guild,
      member:
        Math.min(memberConfig.streaming_ping_cooldown, guild.maxCooldown) ||
        true,
    }
  }

  return { guild, member: guild.defaultCooldown || true }
}
