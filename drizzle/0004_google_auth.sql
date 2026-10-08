CREATE TABLE google_users (
 id TEXT PRIMARY KEY NOT NULL,
 google_sub TEXT NOT NULL UNIQUE,
 email TEXT NOT NULL,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE google_sessions (
 token_hash TEXT PRIMARY KEY NOT NULL,
 user_id TEXT NOT NULL REFERENCES google_users(id) ON DELETE CASCADE,
 expires_at TEXT NOT NULL,
 created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX google_sessions_expiry_idx ON google_sessions (expires_at);
--> statement-breakpoint
CREATE TABLE google_oauth_states (
 state_hash TEXT PRIMARY KEY NOT NULL,
 code_verifier TEXT NOT NULL,
 return_to TEXT NOT NULL,
 expires_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX google_oauth_states_expiry_idx ON google_oauth_states (expires_at);
