/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { heading, MessageFlags } from "discord.js"
import d from "fluent-commands"
import { removeActivityDropdown } from "../components/removeActivityDropdown.mjs"

export const Activities = d
  .slashCommand("activities", "Commands related to voice channel activities")
  .subcommands({
    remove: d
      .subcommand("Remove voice channel activities from the dropdown menu")
      .handler(async (interaction) => {
        if (!interaction.inCachedGuild()) {
          return
        }

        await interaction.reply({
          flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
          components: [
            d
              .container(
                d.text(heading("Remove activities")),
                d.text(
                  "Select the activities you'd like to remove from the voice channel activity dropdown.",
                ),
                d.row(await removeActivityDropdown(interaction.guild)),
              )
              .build(),
          ],
        })
      }),
  })
