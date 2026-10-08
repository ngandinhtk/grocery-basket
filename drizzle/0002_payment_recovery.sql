ALTER TABLE payment_orders ADD COLUMN next_verify_at text;
--> statement-breakpoint
CREATE TABLE payment_attempt_history (
 request_id text PRIMARY KEY NOT NULL,
 user_id text NOT NULL,
 order_id text,
 environment text NOT NULL,
 status text NOT NULL,
 capture_id text,
 paid_at text,
 reason text NOT NULL,
 created_at text NOT NULL,
 archived_at text NOT NULL
);
--> statement-breakpoint
CREATE INDEX payment_attempt_user_idx ON payment_attempt_history (user_id);
