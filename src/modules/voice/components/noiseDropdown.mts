/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import d from "fluent-commands"
import { setVoiceChannelStatus, voiceStatus } from "../util.mjs"

export const NoiseDropdown = d
  .select()
  .string("noise")
  .placeholder("Select the noise level")
  .options({
    Silent: d.select().stringOption("silent").emoji("🔇"),
    Low: d.select().stringOption("quiet").emoji("🔈"),
    Medium: d.select().stringOption("moderate").emoji("🔉"),
    Loud: d.select().stringOption("loud").emoji("🔊"),
  })
  .handler(async (interaction) => {
    if (!interaction.channel?.isVoiceBased() || !interaction.values[0]) {
      return
    }

    const { messageOptions, status } = await voiceStatus({
      noise: interaction.values[0],
      oldMessage: interaction.message,
      channel: interaction.channel,
    })

    await interaction.update(messageOptions)

    await setVoiceChannelStatus(interaction.channel, status)
  })
