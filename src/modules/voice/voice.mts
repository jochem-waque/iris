/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import d from "fluent-commands"
import { Link } from "./commands/link.mjs"
import { TogglePings } from "./commands/togglePings.mjs"
import { ActivityDropdown } from "./components/activityDropdown.mjs"
import { NoiseDropdown } from "./components/noiseDropdown.mjs"
import { FirstJoin } from "./events/firstJoin.mjs"
import { LastLeave } from "./events/lastLeave.mjs"
import { MemberStreams } from "./events/memberStreams.mjs"
import { ModalAdapter } from "./events/modalAdapter.mjs"
import { SubsequentJoin } from "./events/subsequentJoin.mjs"

export const Voice = d
  .module("voice")
  .addCommand(Link)
  .addCommand(TogglePings)
  .addComponent(ActivityDropdown)
  .addComponent(NoiseDropdown)
  .addEventHandler(FirstJoin)
  .addEventHandler(LastLeave)
  .addEventHandler(MemberStreams)
  .addEventHandler(ModalAdapter)
  .addEventHandler(SubsequentJoin)
