/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { eq } from "drizzle-orm"
import d from "fluent-commands"
import { Database } from "../../../index.mjs"
import { activitiesTable } from "../../../schema.mjs"
import { AddActivity } from "../legacy/addActivity.mjs"
import { setVoiceChannelStatus, voiceStatus } from "../util.mjs"

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
    if (!interaction.values[0] || !interaction.channel?.isVoiceBased()) {
      return
    }

    if (interaction.values[0] === "add_new") {
      await interaction.showModal(AddActivity())
      return
    }

    await Database.update(activitiesTable)
      .set({ last_used: new Date() })
      .where(eq(activitiesTable.id, parseInt(interaction.values[0])))

    const { messageOptions, status } = await voiceStatus({
      activity: interaction.values[0],
      oldMessage: interaction.message,
      channel: interaction.channel,
    })

    await interaction.update(messageOptions)

    await setVoiceChannelStatus(interaction.channel, status)
  })
