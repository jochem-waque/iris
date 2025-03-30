/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import d from "fluent-commands"
import { Remove } from "./commands/remove.mjs"
import { ToggleReactions } from "./commands/toggleReactions.mjs"
import { ReactOnMention } from "./events/reactOnMention.mjs"

export const Reactions = d
  .module("reactions")
  .addCommand(Remove)
  .addCommand(ToggleReactions)
  .addEventHandler(ReactOnMention)
