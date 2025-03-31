/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { readFile } from "fs/promises"
import { z } from "zod"

export const Blacklist = await z
  .array(z.string())
  .transform((arg) => new Set(arg))
  .parseAsync(
    JSON.parse(await readFile("blacklist.json", { encoding: "utf-8" })),
  )
