DROP INDEX `join_cooldown_channel_id_user_id_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `join_cooldown_guild_id_user_id_unique` ON `join_cooldown` (`guild_id`,`user_id`);--> statement-breakpoint
ALTER TABLE `join_cooldown` DROP COLUMN `channel_id`;--> statement-breakpoint
DROP INDEX `stream_cooldown_channel_id_user_id_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `stream_cooldown_guild_id_user_id_unique` ON `stream_cooldown` (`guild_id`,`user_id`);--> statement-breakpoint
ALTER TABLE `stream_cooldown` DROP COLUMN `channel_id`;