import d from "fluent-commands"

export const Cooldowns = {
  "At most once every 30 minutes": d.select().stringOption("30").emoji("⏱️"),
  "At most once every hour": d.select().stringOption("60").emoji("⏱️"),
  "At most once every 4 hours": d
    .select()
    .stringOption((4 * 60).toString())
    .emoji("⏱️"),
  "At most once every 12 hours": d
    .select()
    .stringOption((12 * 60).toString())
    .emoji("⏱️"),
  "At most once every day": d
    .select()
    .stringOption((24 * 60).toString())
    .emoji("⏱️"),
}
