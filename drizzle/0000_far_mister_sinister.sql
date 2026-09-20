CREATE TYPE "public"."nomin_call_context" AS ENUM('standalone', 'project', 'checkpoint');--> statement-breakpoint
CREATE TYPE "public"."nomin_call_type" AS ENUM('voice', 'video');--> statement-breakpoint
CREATE TYPE "public"."nomin_conversation_type" AS ENUM('direct', 'group');--> statement-breakpoint
CREATE TYPE "public"."nomin_role" AS ENUM('admin', 'member');--> statement-breakpoint
CREATE TABLE "nomin_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "nomin_call_type" NOT NULL,
	"context" "nomin_call_context" DEFAULT 'standalone' NOT NULL,
	"context_id" text,
	"daily_room_name" text NOT NULL,
	"daily_room_url" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "nomin_calls_daily_room_name_unique" UNIQUE("daily_room_name")
);
--> statement-breakpoint
CREATE TABLE "nomin_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"content_json" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nomin_checkpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nomin_conversation_participants" (
	"conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "nomin_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "nomin_conversation_type" NOT NULL,
	"name" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nomin_message_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nomin_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"codebase_drive_id" text NOT NULL,
	"codebase_file_name" text NOT NULL,
	"codebase_file_size" text NOT NULL,
	"preview_drive_id" text,
	"preview_file_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nomin_scheduled_meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"organizer_id" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"duration_minutes" integer DEFAULT 30 NOT NULL,
	"call_type" "nomin_call_type" NOT NULL,
	"rrule" text,
	"invitee_ids" text DEFAULT '[]' NOT NULL,
	"project_id" uuid,
	"excluded_dates" text DEFAULT '[]' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nomin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "nomin_role" DEFAULT 'member' NOT NULL,
	"display_name" text,
	"avatar_drive_id" text,
	"avatar_file_name" text,
	"has_completed_onboarding" boolean DEFAULT false NOT NULL,
	"department" text,
	"job_title" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nomin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "nomin_calls" ADD CONSTRAINT "nomin_calls_created_by_nomin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."nomin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nomin_chat_messages" ADD CONSTRAINT "nomin_chat_messages_conversation_id_nomin_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."nomin_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nomin_chat_messages" ADD CONSTRAINT "nomin_chat_messages_user_id_nomin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."nomin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nomin_checkpoints" ADD CONSTRAINT "nomin_checkpoints_user_id_nomin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."nomin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nomin_conversation_participants" ADD CONSTRAINT "nomin_conversation_participants_conversation_id_nomin_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."nomin_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nomin_conversation_participants" ADD CONSTRAINT "nomin_conversation_participants_user_id_nomin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."nomin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nomin_conversations" ADD CONSTRAINT "nomin_conversations_created_by_nomin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."nomin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nomin_message_reactions" ADD CONSTRAINT "nomin_message_reactions_message_id_nomin_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."nomin_chat_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nomin_message_reactions" ADD CONSTRAINT "nomin_message_reactions_user_id_nomin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."nomin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nomin_projects" ADD CONSTRAINT "nomin_projects_user_id_nomin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."nomin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nomin_scheduled_meetings" ADD CONSTRAINT "nomin_scheduled_meetings_organizer_id_nomin_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."nomin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nomin_scheduled_meetings" ADD CONSTRAINT "nomin_scheduled_meetings_project_id_nomin_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."nomin_projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "nomin_calls_created_by_idx" ON "nomin_calls" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "nomin_calls_expires_at_idx" ON "nomin_calls" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "nomin_chat_messages_user_id_idx" ON "nomin_chat_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "nomin_message_reactions_message_id_idx" ON "nomin_message_reactions" USING btree ("message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "nomin_message_reactions_message_user_unique" ON "nomin_message_reactions" USING btree ("message_id","user_id");--> statement-breakpoint
CREATE INDEX "nomin_projects_user_id_idx" ON "nomin_projects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "nomin_projects_created_at_idx" ON "nomin_projects" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "nomin_scheduled_meetings_organizer_idx" ON "nomin_scheduled_meetings" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "nomin_scheduled_meetings_start_time_idx" ON "nomin_scheduled_meetings" USING btree ("start_time");