CREATE TYPE "public"."invoice_type" AS ENUM('A', 'B');--> statement-breakpoint
CREATE TYPE "public"."tax_condition" AS ENUM('monotributista', 'responsable_inscripto', 'consumidor_final', 'exento');--> statement-breakpoint
CREATE TABLE "invoice_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_type" "unit_type" NOT NULL,
	"template" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_templates_unit_type_unique" UNIQUE("unit_type")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"invoice_type" "invoice_type" NOT NULL,
	"cbte_tipo" smallint NOT NULL,
	"punto_venta" smallint NOT NULL,
	"cbte_nro" integer NOT NULL,
	"cae" varchar(20) NOT NULL,
	"cae_fch_vto" varchar(10) NOT NULL,
	"cbte_fch" varchar(10) NOT NULL,
	"imp_neto" numeric(12, 2) NOT NULL,
	"imp_iva" numeric(12, 2) NOT NULL,
	"imp_op_ex" numeric(12, 2) NOT NULL,
	"imp_total" numeric(12, 2) NOT NULL,
	"doc_tipo" smallint NOT NULL,
	"doc_nro" varchar(20) NOT NULL,
	"recipient_name" varchar(255) NOT NULL,
	"recipient_tax_condition" "tax_condition" NOT NULL,
	"condicion_iva_receptor_id" smallint NOT NULL,
	"period_month" smallint NOT NULL,
	"period_year" smallint NOT NULL,
	"fch_serv_desde" varchar(10) NOT NULL,
	"fch_serv_hasta" varchar(10) NOT NULL,
	"description" text NOT NULL,
	"unit_type" "unit_type" NOT NULL,
	"issued_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "tax_condition" "tax_condition";--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;