/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { EmbedBuilder, MessageFlags } from "discord.js"
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
          flags: MessageFlags.Ephemeral,
          embeds: [
            new EmbedBuilder()
              .setTitle("Remove activities")
              .setDescription(
                "Select the activities you'd like to remove from the voice channel activity dropdown.",
              ),
          ],
          components: [d.row(await removeActivityDropdown(interaction.guild))],
        })
      }),
  })
