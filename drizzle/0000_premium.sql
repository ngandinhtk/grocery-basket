CREATE TABLE `payment_orders` (
 `user_id` text PRIMARY KEY NOT NULL,
 `request_id` text NOT NULL UNIQUE,
 `order_id` text UNIQUE,
 `environment` text NOT NULL,
 `status` text NOT NULL DEFAULT 'NEW',
 `capture_id` text UNIQUE,
 `created_at` text NOT NULL,
 `paid_at` text,
 `verified_at` text
);
--> statement-breakpoint
CREATE TABLE `saved_templates` (
 `id` text PRIMARY KEY NOT NULL,
 `user_id` text NOT NULL,
 `name` text NOT NULL,
 `items` text NOT NULL,
 `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `saved_templates_user_idx` ON `saved_templates` (`user_id`);
--> statement-breakpoint
CREATE TABLE `weekly_plans` (
 `user_id` text PRIMARY KEY NOT NULL,
 `days` text NOT NULL,
 `updated_at` text NOT NULL
);
