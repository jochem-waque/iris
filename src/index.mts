/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {
  BaseInteraction,
  bold,
  DiscordAPIError,
  GatewayIntentBits,
  heading,
  MessageFlags,
  Partials,
  subtext,
} from "discord.js"
import d from "disfluent"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import { General } from "./modules/general/general.mjs"
import { Reactions } from "./modules/reactions/reactions.mjs"
import { Voice } from "./modules/voice/voice.mjs"
import { Env } from "./variables.mjs"

export const Database = drizzle(Env.dbFileName)

migrate(Database, { migrationsFolder: "./drizzle" })

let bot = d
  .bot({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildExpressions,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.MessageContent,
    ],
    partials: [
      Partials.User,
      Partials.Channel,
      Partials.GuildMember,
      Partials.Message,
      Partials.Reaction,
      Partials.GuildScheduledEvent,
      Partials.ThreadMember,
    ],
  })
  .addModule(General)
  .addModule(Voice)
  .addModule(Reactions)
  .errorHandler((context) => {
    let interaction: BaseInteraction | undefined
    if ("interaction" in context) {
      interaction = context.interaction
    }

    if (
      "handlerParameters" in context &&
      context.handlerParameters?.[0] instanceof BaseInteraction
    ) {
      interaction = context.handlerParameters[0]
    }

    if (!interaction) {
      return
    }

    if (!interaction?.isRepliable()) {
      return
    }

    const footer = []
    if (context.error instanceof DiscordAPIError) {
      footer.push(
        d.text(subtext(`${context.error.name} ${context.error.message}`)),
      )
    }

    const reply = {
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      components: [
        d
          .container(
            d.text(heading("An error occurred")),
            d.text(
              `An error occurred while handling this interaction. Please ensure that the bot has the necessary permissions to perform its actions. ${bold("The bot has to be manually given the Set Voice Channel Status permission")}.`,
            ),
            d.text(
              "If the permissions are setup correctly, feel free to open an issue on GitHub or message @lucasfloof on Discord directly.",
            ),
            ...footer,
          )
          .build(),
      ],
    }

    if (interaction.replied) {
      interaction.followUp(reply).catch(console.error)
      return
    }

    interaction.reply(reply).catch(console.error)
  })
  .register()

if (Env.webhookUrl) {
  bot = bot.addErrorWebhook(Env.webhookUrl)
}

await bot.login(Env.botToken)
