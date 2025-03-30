/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import d from "fluent-commands"
import { Modals } from "../legacy/modal.mjs"

export const ModalAdapter = d
  .event("interactionCreate")
  .handler(async (interaction) => {
    if (!interaction.isModalSubmit()) {
      return
    }

    const [id] = interaction.customId.split(":")
    if (!id) {
      return
    }

    const modal = Modals.get(id)
    if (!modal) {
      return
    }

    await modal(interaction)
  })
