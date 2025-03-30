/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import d from "fluent-commands"

export const Startup = d
  .event("ready")
  .once()
  .handler((client) => {
    console.log("Running as", client.user.displayName)
  })
