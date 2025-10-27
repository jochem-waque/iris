DELETE FROM `join_cooldown`;--> statement-breakpoint
DELETE FROM `stream_cooldown`;--> statement-breakpoint

ALTER TABLE `join_cooldown` ADD `guild_id` text NOT NULL;--> statement-breakpoint
ALTER TABLE `stream_cooldown` ADD `guild_id` text NOT NULL;