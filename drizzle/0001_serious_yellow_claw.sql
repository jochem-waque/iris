CREATE TABLE `link` (
	`id` integer PRIMARY KEY NOT NULL,
	`text_id` text NOT NULL,
	`voice_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `link_voice_id_unique` ON `link` (`voice_id`);--> statement-breakpoint
DELETE FROM `message`;--> statement-breakpoint
DROP INDEX `message_channel_id_unique`;--> statement-breakpoint
ALTER TABLE `message` ADD `voice_id` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `message_voice_id_unique` ON `message` (`voice_id`);