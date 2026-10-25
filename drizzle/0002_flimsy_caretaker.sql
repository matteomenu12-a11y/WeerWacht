CREATE TABLE `notification_runtime` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `push_subscriptions` ADD `last_checked_at` text;