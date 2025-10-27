/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import d from "disfluent"
import { eq } from "drizzle-orm"
import { Database } from "../../../index.mjs"
import { activitiesTable } from "../../../schema.mjs"
import { AddActivity } from "../legacy/addActivity.mjs"
import { conditionallyUpdateStatus, voiceStatus } from "../util.mjs"

export const ActivityDropdown = d
  .select()
  .string("activity")
  .placeholder("Select the activity")
  .options({
    "Add new": d
      .select()
      .stringOption("add_new" as string)
      .emoji("➕"),
  })
  .handler(async (interaction) => {
    if (!interaction.values[0] || !interaction.inCachedGuild()) {
      return
    }

    if (interaction.values[0] === "add_new") {
      await interaction.showModal(AddActivity())
      return
    }

    Database.update(activitiesTable)
      .set({ lastUsed: new Date() })
      .where(eq(activitiesTable.id, parseInt(interaction.values[0])))
      .run()

    const { messageOptions, status, channelId } = voiceStatus({
      force: true,
      activity: interaction.values[0],
      oldMessage: interaction.message,
      guild: interaction.guild,
    })

    await interaction.update(messageOptions)

    await conditionallyUpdateStatus(interaction, status, channelId)
  })
