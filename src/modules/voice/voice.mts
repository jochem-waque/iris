/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import d from "disfluent"
import { Activities } from "./commands/activities.mjs"
import { Link } from "./commands/link.mjs"
import { Pings } from "./commands/pings.mjs"
import { Server } from "./commands/server.mjs"
import { FirstJoin } from "./events/firstJoin.mjs"
import { LastLeave } from "./events/lastLeave.mjs"
import { MemberStreams } from "./events/memberStreams.mjs"
import { ModalAdapter } from "./events/modalAdapter.mjs"
import { SubsequentJoin } from "./events/subsequentJoin.mjs"

export const Voice = d
  .module("voice")
  .addCommand(Activities)
  .addCommand(Link)
  .addCommand(Pings)
  .addCommand(Server)
  .addEventHandler(FirstJoin)
  .addEventHandler(LastLeave)
  .addEventHandler(MemberStreams)
  .addEventHandler(ModalAdapter)
  .addEventHandler(SubsequentJoin)
