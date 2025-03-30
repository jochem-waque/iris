/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Colors, EmbedBuilder, MessageFlags } from "discord.js"
import { eq } from "drizzle-orm"
import d from "fluent-commands"
import { Database } from "../../../index.mjs"
import { joinPingsTable } from "../../../schema.mjs"

export const TogglePings = d
  .slashCommand("pings", "Commands related to pings")
  .subcommands({
    toggle: d
      .subcommand("Toggle pings for when you join a non-empty voice channel")
      .handler(async (interaction) => {
        const stored = await Database.transaction(async (tx) => {
          const [existing] = await tx
            .delete(joinPingsTable)
            .where(eq(joinPingsTable.user_id, interaction.user.id))
            .returning()

          if (existing) {
            return false
          }

          const [inserted] = await tx
            .insert(joinPingsTable)
            .values({ user_id: interaction.user.id })
            .returning()

          return inserted !== undefined
        })

        if (stored) {
          await interaction.reply({
            flags: MessageFlags.Ephemeral,
            embeds: [
              new EmbedBuilder()
                .setTitle("Join pings disabled")
                .setDescription(
                  "You will now no longer be pinged whenever you join a voice channel.",
                )
                .setColor(Colors.Red),
            ],
          })
          return
        }

        await interaction.reply({
          flags: MessageFlags.Ephemeral,
          embeds: [
            new EmbedBuilder()
              .setTitle("Join pings enabled")
              .setDescription(
                "You will now be pinged whenever you join a voice channel!",
              )
              .setColor(Colors.Green),
          ],
        })
      }),
  })
