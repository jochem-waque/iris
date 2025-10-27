/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { sql } from "drizzle-orm"
import { int, sqliteTable, text, unique } from "drizzle-orm/sqlite-core"

// Activities used for the dropdown
export const activitiesTable = sqliteTable(
  "activity",
  {
    id: int().primaryKey(),
    label: text().notNull(),
    lastUsed: int("last_used", { mode: "timestamp_ms" }).default(
      sql`(UNIXEPOCH('subsecond') * 1000)`,
    ),
    guildId: text("guild_id").notNull(),
  },
  (table) => [unique().on(table.label, table.guildId)],
)

// Add reactions to users in the mention table
export const mentionTable = sqliteTable("mention", {
  id: int().primaryKey(),
  userId: text("user_id").notNull().unique(),
})

// All current voice status messages
export const messageTable = sqliteTable("message", {
  id: int().primaryKey(),
  channelId: text("channel_id").notNull(),
  messageId: text("message_id").notNull().unique(),
  voiceId: text("voice_id").notNull(),
})

// Links between text and voice channels
export const linkTable = sqliteTable("link", {
  id: int().primaryKey(),
  textId: text("text_id").notNull(),
  voiceId: text("voice_id").notNull().unique(),
})

// Server configuration
export const guildConfigTable = sqliteTable("config", {
  id: int().primaryKey(),
  guildId: text("guild_id").notNull(),
  timestamp: int({ mode: "timestamp_ms" })
    .notNull()
    .default(sql`(UNIXEPOCH('subsecond') * 1000)`),
  allowJoinOptOut: int("allow_join_opt_out", { mode: "boolean" })
    .notNull()
    .default(true),
  maxJoinPingCooldown: int("max_join_ping_cooldown").notNull().default(0),
  defaultJoinPingCooldown: int("default_join_ping_cooldown")
    .notNull()
    .default(0),
  allowStreamingOptOut: int("allow_streaming_opt_out", { mode: "boolean" })
    .notNull()
    .default(false),
  maxStreamingPingCooldown: int("max_streaming_ping_cooldown")
    .notNull()
    .default(0),
  defaultStreamingPingCooldown: int("default_streaming_ping_cooldown")
    .notNull()
    .default(0),
})

// Member configuration
export const memberConfigTable = sqliteTable("member_config", {
  id: int().primaryKey(),
  userId: text("user_id").notNull(),
  guildId: text("guild_id").notNull(),
  timestamp: int({ mode: "timestamp_ms" })
    .notNull()
    .default(sql`(UNIXEPOCH('subsecond') * 1000)`),
  disableJoinPings: int("disable_join_pings", { mode: "boolean" }),
  joinPingCooldown: int("join_ping_cooldown"),
  disableStreamingPings: int("disable_streaming_pings", { mode: "boolean" }),
  streamingPingCooldown: int("streaming_ping_cooldown"),
})

export const joinCooldownTable = sqliteTable(
  "join_cooldown",
  {
    id: int().primaryKey(),
    userId: text("user_id").notNull(),
    channelId: text("channel_id").notNull(),
    guildId: text("guild_id").notNull(),
    expiresAt: int("expiresAt", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [unique().on(table.channelId, table.userId)],
)

export const streamCooldownTable = sqliteTable(
  "stream_cooldown",
  {
    id: int().primaryKey(),
    userId: text("user_id").notNull(),
    channelId: text("channel_id").notNull(),
    guildId: text("guild_id").notNull(),
    expiresAt: int("expiresAt", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [unique().on(table.channelId, table.userId)],
)
