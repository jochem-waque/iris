CREATE TABLE `join_cooldown` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`channel_id` text NOT NULL,
	`expiresAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `join_cooldown_channel_id_user_id_unique` ON `join_cooldown` (`channel_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `stream_cooldown` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`channel_id` text NOT NULL,
	`expiresAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stream_cooldown_channel_id_user_id_unique` ON `stream_cooldown` (`channel_id`,`user_id`);