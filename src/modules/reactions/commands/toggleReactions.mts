/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Colors, EmbedBuilder, MessageFlags } from "discord.js"
import { eq } from "drizzle-orm"
import d from "fluent-commands"
import { Database } from "../../../index.mjs"
import { mentionTable } from "../../../schema.mjs"

export const ToggleReactions = d
  .slashCommand("reactions", "Commands related to reactions")
  .subcommands({
    toggle: d
      .subcommand(
        "Toggle whether reactions are added to messages that ping you",
      )
      .handler(async (interaction) => {
        const stored = await Database.transaction(async (tx) => {
          const [existing] = await tx
            .delete(mentionTable)
            .where(eq(mentionTable.user_id, interaction.user.id))
            .returning()

          if (existing) {
            return false
          }

          const [inserted] = await tx
            .insert(mentionTable)
            .values({ user_id: interaction.user.id })
            .returning()

          return inserted !== undefined
        })

        if (stored) {
          await interaction.reply({
            flags: MessageFlags.Ephemeral,
            embeds: [
              new EmbedBuilder()
                .setTitle("Reactions enabled")
                .setDescription(
                  "Reactions will now be added to messages that ping you!",
                )
                .setColor(Colors.Green),
            ],
          })
          return
        }

        await interaction.reply({
          flags: MessageFlags.Ephemeral,
          embeds: [
            new EmbedBuilder()
              .setTitle("Reactions disabled")
              .setDescription(
                "Reactions will now no longer be added to messages that ping you.",
              )
              .setColor(Colors.Red),
          ],
        })
      }),
  })
