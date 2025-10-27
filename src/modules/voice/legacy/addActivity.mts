/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { TextInputBuilder, TextInputStyle } from "discord.js"
import { Database } from "../../../index.mjs"
import { activitiesTable } from "../../../schema.mjs"
import { conditionallyUpdateStatus, voiceStatus } from "../util.mjs"
import { modal, modalInput } from "./modal.mjs"

export const AddActivity = modal({
  id: "addActivity",
  title: "Add activity",
  components: [
    modalInput(
      "name",
      true,
      new TextInputBuilder()
        .setLabel("Activity name")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Name of a game, show, etc."),
    ),
  ],
  async handle(interaction, { name }) {
    if (!interaction.inCachedGuild() || !interaction.isFromMessage()) {
      return
    }

    const newActivity = Database.insert(activitiesTable)
      .values({ label: name, guildId: interaction.guildId })
      .onConflictDoUpdate({
        target: [activitiesTable.label, activitiesTable.guildId],
        set: { lastUsed: new Date() },
      })
      .returning()
      .get()

    const { messageOptions, status, channelId } = voiceStatus({
      force: true,
      activity: newActivity.id.toString(),
      oldMessage: interaction.message,
      guild: interaction.guild,
    })

    await interaction.update(messageOptions)

    await conditionallyUpdateStatus(interaction, status, channelId)
  },
})
