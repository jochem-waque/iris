/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { ActivityType } from "discord.js"
import d from "disfluent"

export const Startup = d
  .event("ready")
  .once()
  .handler((client) => {
    console.log("Running as", client.user.displayName)

    client.user.setActivity({
      name: "Now works for visible VCs only; update permissions accordingly!",
      type: ActivityType.Custom,
    })

    // FIXME: move into disfluent?
    function exitListener() {
      client
        .destroy()
        .catch(console.error)
        .finally(() => process.exit())
    }

    process.on("SIGINT", exitListener)
    process.on("SIGTERM", exitListener)
  })
