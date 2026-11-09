CREATE TABLE `bottles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`capacity_ml` integer,
	`baseline_g` real,
	`started_at` integer NOT NULL,
	`ended_at` integer
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`firmware` text,
	`first_seen_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`daily_ml` integer NOT NULL,
	`effective_from` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `goals_effective_from_unique` ON `goals` (`effective_from`);--> statement-breakpoint
CREATE TABLE `intakes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`status` text NOT NULL,
	`volume_ml` integer NOT NULL,
	`occurred_at` integer NOT NULL,
	`bottle_id` integer,
	`source_event_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bottle_id`) REFERENCES `bottles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_event_id`) REFERENCES `node_events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `intakes_occurred_at` ON `intakes` (`occurred_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `intakes_source_event` ON `intakes` (`source_event_id`);--> statement-breakpoint
CREATE TABLE `node_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`device_id` text NOT NULL,
	`seq` integer NOT NULL,
	`type` text NOT NULL,
	`weight_g` real,
	`t_ms` integer,
	`uptime_ms` integer NOT NULL,
	`measured_at` integer NOT NULL,
	`received_at` integer NOT NULL,
	`payload` text NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `node_events_device_seq` ON `node_events` (`device_id`,`seq`);--> statement-breakpoint
CREATE INDEX `node_events_device_type` ON `node_events` (`device_id`,`type`,`seq`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`timezone` text NOT NULL,
	`reminders_enabled` integer NOT NULL,
	`reminders_idle_min` integer NOT NULL,
	`reminders_pace_enabled` integer NOT NULL,
	`quiet_hours_start` text NOT NULL,
	`quiet_hours_end` text NOT NULL,
	CONSTRAINT "settings_single_row" CHECK("settings"."id" = 1)
);
