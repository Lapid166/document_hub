CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"version_number" varchar(50) NOT NULL,
	"changelog_raw" text NOT NULL,
	"download_url" varchar(255),
	"file_size" varchar(50),
	"file_type" varchar(50),
	"is_current_active" boolean DEFAULT false,
	"published_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"category_id" uuid,
	"description" text NOT NULL,
	"detailed_description" text NOT NULL,
	"icon" varchar(255) NOT NULL,
	"icon_color" varchar(255) NOT NULL,
	"live_demo_url" varchar(255),
	"download_url" varchar(255),
	"file_size" varchar(50),
	"file_type" varchar(50),
	"downloads_count" integer DEFAULT 0,
	"wp_version" varchar(100),
	"php_version" varchar(100),
	"author" varchar(255) NOT NULL,
	"rating_average" real DEFAULT 5,
	"rating_count" integer DEFAULT 0,
	"slideshow_images" jsonb DEFAULT '[]'::jsonb,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"guides" jsonb DEFAULT '[]'::jsonb,
	"faqs" jsonb DEFAULT '[]'::jsonb,
	"enable_download" boolean DEFAULT false,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_versions" ADD CONSTRAINT "product_versions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_versions" ADD CONSTRAINT "product_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_categories_slug_org" ON "categories" USING btree ("slug","organization_id");--> statement-breakpoint
CREATE INDEX "idx_categories_org" ON "categories" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_product_tag" ON "product_tags" USING btree ("product_id","tag_id");--> statement-breakpoint
CREATE INDEX "idx_product_versions_product" ON "product_versions" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_products_slug_org" ON "products" USING btree ("slug","organization_id");--> statement-breakpoint
CREATE INDEX "idx_products_org" ON "products" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_products_category" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tags_slug_org" ON "tags" USING btree ("slug","organization_id");--> statement-breakpoint
CREATE INDEX "idx_tags_org" ON "tags" USING btree ("organization_id");