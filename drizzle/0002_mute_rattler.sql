CREATE TABLE `config` (
	`id` integer PRIMARY KEY NOT NULL,
	`guild_id` text NOT NULL,
	`timestamp` integer DEFAULT (UNIXEPOCH('subsecond') * 1000) NOT NULL,
	`allow_join_opt_out` integer DEFAULT true NOT NULL,
	`max_join_ping_cooldown` integer DEFAULT 0 NOT NULL,
	`default_join_ping_cooldown` integer DEFAULT 0 NOT NULL,
	`allow_streaming_opt_out` integer DEFAULT false NOT NULL,
	`max_streaming_ping_cooldown` integer DEFAULT 0 NOT NULL,
	`default_streaming_ping_cooldown` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `member_config` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`guild_id` text NOT NULL,
	`timestamp` integer DEFAULT (UNIXEPOCH('subsecond') * 1000) NOT NULL,
	`disable_join_pings` integer,
	`join_ping_cooldown` integer,
	`disable_streaming_pings` integer,
	`streaming_ping_cooldown` integer
);
--> statement-breakpoint
DROP TABLE `join_ping`;