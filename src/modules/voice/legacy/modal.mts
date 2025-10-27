/**
 * Copyright (C) 2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// TODO: refactor for disfluent

import {
  ActionRowBuilder,
  ComponentType,
  type ModalActionRowComponentBuilder,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
} from "discord.js"

export const Modals = new Map<
  string,
  (interaction: ModalSubmitInteraction) => Promise<void>
>()

type InferModalValues<
  T extends readonly unknown[],
  R extends object = object,
> = T extends readonly [infer TH, ...infer TT]
  ? InferModalValues<
      TT,
      TH extends ReturnType<typeof modalInput>
        ? TH["required"] extends true
          ? R & Record<TH["id"], string>
          : R & Partial<Record<TH["id"], string>>
        : R
    >
  : R

export function modalInput<T extends boolean, TT extends string>(
  id: TT,
  required: T,
  builder: TextInputBuilder,
) {
  builder.setCustomId(id).setRequired(required)
  return { id, required, builder }
}

export function modal<
  T extends string,
  TT extends readonly ReturnType<typeof modalInput>[],
  TTT extends readonly string[],
>({
  id,
  title,
  components,
  handle,
}: {
  id: T
  title: string
  components: readonly [...TT]
  handle: (
    interaction: ModalSubmitInteraction,
    values: InferModalValues<TT>,
    ...args: [...TTT]
  ) => Promise<void>
}) {
  if (Modals.has(id)) {
    throw new Error(`A model with the name ${id} already exists`)
  }

  Modals.set(id, async (interaction) => {
    const values: Record<string, string> = {}
    for (const row of interaction.components.filter(
      (row) => row.type === ComponentType.ActionRow,
    )) {
      for (const input of row.components) {
        if (input.value === "") {
          continue
        }

        values[input.customId] = input.value
      }
    }

    await handle(
      interaction,
      values as InferModalValues<TT>,
      ...(interaction.customId.split(":").slice(1) as [...TTT]),
    )
  })

  function setupForm(
    defaults?: Partial<InferModalValues<TT>>,
    ...args: [...TTT]
  ) {
    return new ModalBuilder()
      .setTitle(title)
      .setCustomId(`${id}:${args.join(":")}`)
      .setComponents(
        components.map((c) => {
          const input = new TextInputBuilder(c.builder.data)
          if (defaults && c.id in defaults) {
            input.setValue((defaults as Record<string, string>)[c.id] as string)
          }

          return new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            input,
          )
        }),
      )
  }

  return setupForm
}
