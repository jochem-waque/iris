/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Colors, heading, MessageFlags } from "discord.js"
import d from "disfluent"
import { eq } from "drizzle-orm"
import { Database } from "../../../../index.mjs"
import { mentionTable } from "../../../../schema.mjs"

export const Toggle = d
  .subcommand("Toggle whether reactions are added to messages that ping you")
  .handler(async (interaction) => {
    const stored = Database.transaction((tx) => {
      const existing = tx
        .delete(mentionTable)
        .where(eq(mentionTable.user_id, interaction.user.id))
        .returning()
        .get()

      if (existing) {
        return false
      }

      const inserted = tx
        .insert(mentionTable)
        .values({ user_id: interaction.user.id })
        .returning()
        .get()

      return inserted !== undefined
    })

    if (stored) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        components: [
          d
            .container(
              d.text(heading("Reactions enabled")),
              d.text("Reactions will now be added to messages that ping you!"),
            )
            .accent(Colors.Green)
            .build(),
        ],
      })
      return
    }

    await interaction.reply({
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      components: [
        d
          .container(
            d.text(heading("Reactions disabled")),
            d.text(
              "Reactions will no longer be added to messages that ping you",
            ),
          )
          .accent(Colors.Red)
          .build(),
      ],
    })
  })
