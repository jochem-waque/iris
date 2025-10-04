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
import { ActivityDropdown } from "./components/activityDropdown.mjs"
import { JoinPingSettings } from "./components/joinPingSettings.mjs"
import { NoiseDropdown } from "./components/noiseDropdown.mjs"
import { RemoveActivityDropdown } from "./components/removeActivityDropdown.mjs"
import { ServerDefaultJoinPingCooldown } from "./components/serverDefaultJoinPingCooldown.mjs"
import { ServerDefaultStreamingPingCooldown } from "./components/serverDefaultStreamingPingCooldown.mjs"
import { ServerJoinPingOptOut } from "./components/serverJoinPingOptOut.mjs"
import { ServerMaxJoinPingCooldown } from "./components/serverMaxJoinPingCooldown.mjs"
import { ServerMaxStreamingPingCooldown } from "./components/serverMaxStreamingPingCooldown.mjs"
import { ServerStreamingPingOptOut } from "./components/serverStreamingPingOptOut.mjs"
import { StreamingPingSettings } from "./components/streamingPingSettings.mjs"
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
  .addComponent(ActivityDropdown)
  .addComponent(JoinPingSettings)
  .addComponent(NoiseDropdown)
  .addComponent(RemoveActivityDropdown)
  .addComponent(ServerDefaultJoinPingCooldown)
  .addComponent(ServerDefaultStreamingPingCooldown)
  .addComponent(ServerJoinPingOptOut)
  .addComponent(ServerMaxJoinPingCooldown)
  .addComponent(ServerMaxStreamingPingCooldown)
  .addComponent(ServerStreamingPingOptOut)
  .addComponent(StreamingPingSettings)
  .addEventHandler(FirstJoin)
  .addEventHandler(LastLeave)
  .addEventHandler(MemberStreams)
  .addEventHandler(ModalAdapter)
  .addEventHandler(SubsequentJoin)
