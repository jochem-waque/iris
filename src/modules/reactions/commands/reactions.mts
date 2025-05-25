/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { ApplicationIntegrationType, InteractionContextType } from "discord.js"
import d from "fluent-commands"
import { Add } from "./reactions/add.mjs"
import { Toggle } from "./reactions/toggle.mjs"

export const Reactions = d
  .slashCommand("reactions", "Commands related to reactions")
  .integrationTypes(ApplicationIntegrationType.GuildInstall)
  .contexts(InteractionContextType.Guild)
  .subcommands({
    toggle: Toggle,
    add: Add,
  })
