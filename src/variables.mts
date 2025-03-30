/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import camelcaseKeys from "camelcase-keys"
import { z } from "zod"

export const Env = await z
  .object({ BOT_TOKEN: z.string(), DB_FILE_NAME: z.string() })
  .transform((arg) => camelcaseKeys(arg))
  .parseAsync(process.env)
