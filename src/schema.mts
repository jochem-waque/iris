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
    last_used: int({ mode: "timestamp_ms" }).default(
      sql`(UNIXEPOCH('subsecond') * 1000)`,
    ),
    guild_id: text().notNull(),
  },
  (table) => [unique().on(table.label, table.guild_id)],
)

// Add reactions to users in the mention table
export const mentionTable = sqliteTable("mention", {
  id: int().primaryKey(),
  user_id: text().notNull().unique(),
})

// All current voice status messages
export const messageTable = sqliteTable("message", {
  id: int().primaryKey(),
  channel_id: text().notNull(),
  message_id: text().notNull().unique(),
  voice_id: text().notNull().unique(),
})

// Links between text and voice channels
export const linkTable = sqliteTable("link", {
  id: int().primaryKey(),
  text_id: text().notNull(),
  voice_id: text().notNull().unique(),
})

// Server configuration
export const guildConfigTable = sqliteTable("config", {
  id: int().primaryKey(),
  guild_id: text().notNull(),
  timestamp: int({ mode: "timestamp_ms" })
    .notNull()
    .default(sql`(UNIXEPOCH('subsecond') * 1000)`),
  allow_join_opt_out: int({ mode: "boolean" }).notNull().default(true),
  max_join_ping_cooldown: int().notNull().default(0),
  default_join_ping_cooldown: int().notNull().default(0),
  allow_streaming_opt_out: int({ mode: "boolean" }).notNull().default(false),
  max_streaming_ping_cooldown: int().notNull().default(0),
  default_streaming_ping_cooldown: int().notNull().default(0),
})

// Member configuration
export const memberConfigTable = sqliteTable("member_config", {
  id: int().primaryKey(),
  user_id: text().notNull(),
  guild_id: text().notNull(),
  timestamp: int({ mode: "timestamp_ms" })
    .notNull()
    .default(sql`(UNIXEPOCH('subsecond') * 1000)`),
  disable_join_pings: int({ mode: "boolean" }),
  join_ping_cooldown: int(),
  disable_streaming_pings: int({ mode: "boolean" }),
  streaming_ping_cooldown: int(),
})
