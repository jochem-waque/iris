/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {
  EmbedBuilder,
  Guild,
  MessageFlags,
  StringSelectMenuBuilder,
  unorderedList,
} from "discord.js"
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
    }

    const deleted = await Database.delete(activitiesTable)
      .where(
        inArray(
          activitiesTable.id,
          interaction.values.map((value) => parseInt(value)),
        ),
      )
      .returning()

    await interaction.update({
      components: [
        d.row(await removeActivityDropdown(interaction.guild)).build(),
      ],
    })

    await interaction.followUp({
      flags: MessageFlags.Ephemeral,
      embeds: [
        new EmbedBuilder()
          .setTitle(
            `Removed ${deleted.length} ${deleted.length === 1 ? "entry" : "entries"}`,
          )
          .setDescription(unorderedList(deleted.map((entry) => entry.label))),
      ],
    })
  })

export async function removeActivityDropdown(guild: Guild) {
  const activities = await Database.select()
    .from(activitiesTable)
    .where(eq(activitiesTable.guild_id, guild.id))
    .orderBy(desc(activitiesTable.last_used))
    .limit(25)

  const options = activities.map(({ id, label }) =>
    d.select().stringOption(id.toString()).builder.setLabel(label),
  )

  // TODO empty with() feels off
  const dropdown = RemoveActivityDropdown.with()
  dropdown.addOptions(...options)
  dropdown.setMaxValues(options.length)

  return StringSelectMenuBuilder.from(dropdown)
}
