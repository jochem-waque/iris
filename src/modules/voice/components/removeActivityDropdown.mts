/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Guild, heading, MessageFlags, unorderedList } from "discord.js"
import { desc, eq, inArray } from "drizzle-orm"
import d from "fluent-commands"
import { Database } from "../../../index.mjs"
import { activitiesTable } from "../../../schema.mjs"

export const RemoveActivityDropdown = d
  .select()
  .string("remove_activity")
  .placeholder("Activities you'd like to remove")
  .options({})
  .minValues(1)
  .handler(async (interaction) => {
    if (!interaction.inCachedGuild()) {
      return
    }

    if (interaction.values.length === 0) {
      await interaction.deferUpdate()
      return
    }

    const deleted = Database.delete(activitiesTable)
      .where(
        inArray(
          activitiesTable.id,
          interaction.values.map((value) => parseInt(value)),
        ),
      )
      .returning()
      .all()

    const dropdown = removeActivityDropdown(interaction.guild)

    await interaction.update({
      content: "",
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      components: [
        d
          .container(
            d.row(dropdown),
            d.text(
              heading(
                `Removed ${deleted.length} ${deleted.length === 1 ? "entry" : "entries"}`,
              ),
            ),
            d.text(unorderedList(deleted.map((entry) => entry.label))),
          )
          .build(),
      ],
    })
  })

export function removeActivityDropdown(guild: Guild) {
  const activities = Database.select()
    .from(activitiesTable)
    .where(eq(activitiesTable.guild_id, guild.id))
    .orderBy(desc(activitiesTable.last_used))
    .limit(25)
    .all()

  // TODO empty with() feels off
  const dropdown = RemoveActivityDropdown.with()

  if (activities.length === 0) {
    dropdown.addOptions(
      d.select().stringOption("disabled").builder.setLabel("disabled"),
    )
    dropdown.setDisabled(true)
    dropdown.setPlaceholder("No activities to remove")
    return dropdown
  }

  const options = activities.map(({ id, label }) =>
    d.select().stringOption(id.toString()).builder.setLabel(label),
  )

  dropdown.addOptions(...options)
  dropdown.setMaxValues(options.length)

  return dropdown
}
