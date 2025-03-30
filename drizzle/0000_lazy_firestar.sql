CREATE TABLE `activity` (
	`id` integer PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`last_used` integer DEFAULT (UNIXEPOCH('subsecond') * 1000),
	`guild_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activity_label_guild_id_unique` ON `activity` (`label`,`guild_id`);--> statement-breakpoint
CREATE TABLE `join_ping` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `join_ping_user_id_unique` ON `join_ping` (`user_id`);--> statement-breakpoint
CREATE TABLE `mention` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mention_user_id_unique` ON `mention` (`user_id`);--> statement-breakpoint
CREATE TABLE `message` (
	`id` integer PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`message_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `message_channel_id_unique` ON `message` (`channel_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `message_message_id_unique` ON `message` (`message_id`);