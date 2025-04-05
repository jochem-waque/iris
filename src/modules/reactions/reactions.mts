/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import d from "fluent-commands"
import { Add } from "./commands/add.mjs"
import { Reactions as ReactionsCommand } from "./commands/reactions.mjs"
import { Remove } from "./commands/remove.mjs"
import { ReactOnMention } from "./events/reactOnMention.mjs"

export const Reactions = d
  .module("reactions")
  .addCommand(Remove)
  .addCommand(Add)
  .addCommand(ReactionsCommand)
  .addEventHandler(ReactOnMention)
