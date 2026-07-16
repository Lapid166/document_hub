CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "product_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"version_id" uuid,
	"file_name" varchar(255) NOT NULL,
	"file_url" varchar(255) NOT NULL,
	"raw_content" text NOT NULL,
	"file_type" varchar(50) DEFAULT 'markdown',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_knowledge_vectors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"version_id" uuid,
	"content" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "layout_type" varchar(50) DEFAULT 'plugin_tools_game';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "enable_slideshow" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "enable_guides" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "enable_faqs" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "detailed_description_draft" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "guides_draft" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "faqs_draft" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "custom_fields_draft" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "draft_status" varchar(50) DEFAULT 'no_draft';--> statement-breakpoint
ALTER TABLE "product_documents" ADD CONSTRAINT "product_documents_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_documents" ADD CONSTRAINT "product_documents_version_id_product_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."product_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_knowledge_vectors" ADD CONSTRAINT "product_knowledge_vectors_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_knowledge_vectors" ADD CONSTRAINT "product_knowledge_vectors_version_id_product_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."product_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_product_docs_product" ON "product_documents" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_vectors_product" ON "product_knowledge_vectors" USING btree ("product_id");