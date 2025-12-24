CREATE TYPE "public"."feedback_flag" AS ENUM('pick', 'reject');--> statement-breakpoint
CREATE TYPE "public"."image_status" AS ENUM('processing', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'photographer', 'client');--> statement-breakpoint
CREATE TABLE "album_clients" (
	"album_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	CONSTRAINT "album_clients_album_id_client_id_pk" PRIMARY KEY("album_id","client_id")
);
--> statement-breakpoint
CREATE TABLE "album_photographers" (
	"album_id" uuid NOT NULL,
	"photographer_id" uuid NOT NULL,
	CONSTRAINT "album_photographers_album_id_photographer_id_pk" PRIMARY KEY("album_id","photographer_id")
);
--> statement-breakpoint
CREATE TABLE "albums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" varchar(1000),
	"owner_photographer_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"modified_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_user_id" uuid NOT NULL,
	"album_id" uuid,
	"image_id" uuid,
	"body" varchar(2000) NOT NULL,
	"parent_comment_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"modified_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "image_feedback" (
	"image_id" uuid NOT NULL,
	"client_user_id" uuid NOT NULL,
	"flag" "feedback_flag",
	"rating" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"modified_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "image_feedback_image_id_client_user_id_pk" PRIMARY KEY("image_id","client_user_id")
);
--> statement-breakpoint
CREATE TABLE "images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"album_id" uuid NOT NULL,
	"uploader_photographer_id" uuid NOT NULL,
	"filename" varchar(255) NOT NULL,
	"title" varchar(255),
	"description" varchar(1000),
	"status" "image_status" DEFAULT 'processing' NOT NULL,
	"storage_key_full" varchar(511),
	"storage_key_thumb" varchar(511),
	"make" varchar(255),
	"model" varchar(255),
	"lens" varchar(255),
	"iso" integer,
	"shutter" varchar(255),
	"aperture" varchar(255),
	"focal_length" varchar(255),
	"captured_at" timestamp,
	"metadata_json" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"modified_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keycloak_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"role" "user_role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"modified_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_keycloak_id_unique" UNIQUE("keycloak_id"),
	CONSTRAINT "user_profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "album_clients" ADD CONSTRAINT "album_clients_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_clients" ADD CONSTRAINT "album_clients_client_id_user_profiles_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_photographers" ADD CONSTRAINT "album_photographers_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_photographers" ADD CONSTRAINT "album_photographers_photographer_id_user_profiles_id_fk" FOREIGN KEY ("photographer_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_owner_photographer_id_user_profiles_id_fk" FOREIGN KEY ("owner_photographer_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_user_id_user_profiles_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_feedback" ADD CONSTRAINT "image_feedback_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_feedback" ADD CONSTRAINT "image_feedback_client_user_id_user_profiles_id_fk" FOREIGN KEY ("client_user_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_uploader_photographer_id_user_profiles_id_fk" FOREIGN KEY ("uploader_photographer_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;