/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {
  ApplicationIntegrationType,
  channelMention,
  ChannelType,
  Colors,
  heading,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js"
import { eq } from "drizzle-orm"
import d from "fluent-commands"
import { Database } from "../../../index.mjs"
import { linkTable } from "../../../schema.mjs"

export const Link = d
  .slashCommand("link", "Link a voice channel to a text channel, or unlink it")
  .integrationTypes(ApplicationIntegrationType.GuildInstall)
  .contexts(InteractionContextType.Guild)
  .options({
    voice: d
      .option("The voice channel")
      .channel()
      .channelTypes(ChannelType.GuildVoice)
      .required(),
    text: d
      .option("The text channel")
      .channel()
      .channelTypes(ChannelType.GuildText),
  })
  .defaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .handler(async (interaction, { voice, text }) => {
    if (!text) {
      Database.delete(linkTable).where(eq(linkTable.voice_id, voice.id)).run()

      await interaction.reply({
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        components: [
          d
            .container(
              d.text(heading("Channel unlinked")),
              d.text(
                `${channelMention(voice.id)} is now no longer linked to a separate text channel.`,
              ),
            )
            .accent(Colors.Red)
            .build(),
        ],
      })

      return
    }

    Database.insert(linkTable)
      .values({
        text_id: text.id,
        voice_id: voice.id,
      })
      .onConflictDoUpdate({
        target: linkTable.voice_id,
        set: { text_id: text.id },
      })
      .run()

    await interaction.reply({
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      components: [
        d
          .container(
            d.text(heading("Channel linked")),
            d.text(
              `${channelMention(voice.id)} is now linked to ${channelMention(text.id)}!`,
            ),
          )
          .accent(Colors.Green)
          .build(),
      ],
    })
  })
