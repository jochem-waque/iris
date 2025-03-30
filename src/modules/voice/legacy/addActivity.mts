/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { TextInputBuilder, TextInputStyle } from "discord.js"
import { Database } from "../../../index.mjs"
import { activitiesTable } from "../../../schema.mjs"
import { setVoiceChannelStatus, voiceStatus } from "../util.mjs"
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
    if (!interaction.channel?.isVoiceBased() || !interaction.isFromMessage()) {
      return
    }

    const [newActivity] = await Database.insert(activitiesTable)
      .values({ label: name, guild_id: interaction.channel.guildId })
      .onConflictDoUpdate({
        target: [activitiesTable.label, activitiesTable.guild_id],
        set: { last_used: new Date() },
      })
      .returning()

    if (!newActivity) {
      return
    }

    const { messageOptions, status } = await voiceStatus({
      activity: newActivity.id.toString(),
      oldMessage: interaction.message,
      channel: interaction.channel,
    })

    await interaction.deferUpdate()
    await interaction.message?.edit(messageOptions)
    await setVoiceChannelStatus(interaction.channel, status)
  },
})
