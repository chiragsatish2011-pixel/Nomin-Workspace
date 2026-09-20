import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Nomin Workspace schema.
 *
 * Every table hangs off `users`, and every user-owned row cascades on
 * delete — removing an account removes its content in one statement rather
 * than leaving orphans behind.
 */

// Role enum: "admin" | "member". New users default to "member".
export const roleEnum = pgEnum("role", ["admin", "member"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  // bcrypt hash of the user's password. NEVER store plaintext.
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("member"),
  displayName: text("display_name"),
  department: text("department"),
  jobTitle: text("job_title"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

/**
 * Checkpoints — the team's shared progress timeline. Visible to everyone in
 * the workspace; editable and deletable by the author or an admin.
 */
export const checkpoints = pgTable(
  "checkpoints",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    note: text("note").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("checkpoints_user_id_idx").on(t.userId),
    // The timeline reads newest-first, so the sort column is indexed.
    index("checkpoints_created_at_idx").on(t.createdAt),
  ]
);

export type Checkpoint = typeof checkpoints.$inferSelect;
export type NewCheckpoint = typeof checkpoints.$inferInsert;

/**
 * Projects — described bundles of work the team publishes to each other.
 * The section UI is a shell for now; the table is the contract it will fill.
 */
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("projects_user_id_idx").on(t.userId),
    index("projects_created_at_idx").on(t.createdAt),
  ]
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export const conversationTypeEnum = pgEnum("conversation_type", [
  "direct",
  "group",
]);

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: conversationTypeEnum("type").notNull(),
  // Group display name. NULL for direct conversations, whose name is
  // derived from the other participant at read time.
  name: text("name"),
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

export const conversationParticipants = pgTable(
  "conversation_participants",
  {
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    // Watermark for unread badges. NULL = never read.
    lastReadAt: timestamp("last_read_at", { withTimezone: true }),
  },
  (t) => [index("conversation_participants_user_idx").on(t.userId)]
);

export type ConversationParticipant =
  typeof conversationParticipants.$inferSelect;
export type NewConversationParticipant =
  typeof conversationParticipants.$inferInsert;

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Scopes every message to exactly one conversation.
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("chat_messages_conversation_idx").on(t.conversationId),
    index("chat_messages_user_id_idx").on(t.userId),
  ]
);

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;

/**
 * Files — metadata rows for the shared workspace drive. The bytes live in
 * whichever object store the deployment configures; this table is the
 * index the UI browses.
 */
export const files = pgTable(
  "files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // NULL = workspace root. Self-referencing, so folders nest.
    parentId: uuid("parent_id"),
    isFolder: boolean("is_folder").notNull().default(false),
    // Byte size as text: JS numbers lose precision past 2^53, and file
    // sizes are only ever displayed or summed, never arithmetic-critical.
    sizeBytes: text("size_bytes"),
    mimeType: text("mime_type"),
    storageKey: text("storage_key"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("files_parent_idx").on(t.parentId),
    index("files_user_id_idx").on(t.userId),
  ]
);

export type WorkspaceFile = typeof files.$inferSelect;
export type NewWorkspaceFile = typeof files.$inferInsert;
