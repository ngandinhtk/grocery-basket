CREATE TABLE households (
 id TEXT PRIMARY KEY NOT NULL,
 owner_id TEXT NOT NULL,
 created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE household_members (
 user_id TEXT PRIMARY KEY NOT NULL,
 household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
 role TEXT NOT NULL CHECK (role IN ('owner','member')),
 joined_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX household_members_household_idx ON household_members (household_id);
--> statement-breakpoint
CREATE TABLE household_invites (
 token_hash TEXT PRIMARY KEY NOT NULL,
 household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
 created_by TEXT NOT NULL,
 created_at TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 used_at TEXT
);
--> statement-breakpoint
CREATE INDEX household_invites_household_idx ON household_invites (household_id);
--> statement-breakpoint
CREATE TABLE household_items (
 item_id TEXT PRIMARY KEY NOT NULL,
 household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
 payload TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX household_items_household_idx ON household_items (household_id);
