/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import d from "disfluent"
import { Guide } from "./commands/guide.mjs"
import { Info } from "./commands/info.mjs"
import { Startup } from "./events/startup.mjs"

export const General = d
  .module("general")
  .addCommand(Guide)
  .addCommand(Info)
  .addEventHandler(Startup)
