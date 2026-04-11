CREATE TYPE "public"."payment_line_type" AS ENUM('rent', 'vat', 'group_expense', 'manual_charge');--> statement-breakpoint
CREATE TABLE "manual_charges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" uuid NOT NULL,
	"description" varchar(255) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"period_month" smallint NOT NULL,
	"period_year" smallint NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"type" "payment_line_type" NOT NULL,
	"description" varchar(255) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"group_expense_id" uuid,
	"manual_charge_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "base_rent" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "vat_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "manual_charges" ADD CONSTRAINT "manual_charges_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_line_items" ADD CONSTRAINT "payment_line_items_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_line_items" ADD CONSTRAINT "payment_line_items_group_expense_id_group_expenses_id_fk" FOREIGN KEY ("group_expense_id") REFERENCES "public"."group_expenses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_line_items" ADD CONSTRAINT "payment_line_items_manual_charge_id_manual_charges_id_fk" FOREIGN KEY ("manual_charge_id") REFERENCES "public"."manual_charges"("id") ON DELETE set null ON UPDATE no action;