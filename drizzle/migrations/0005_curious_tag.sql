ALTER TABLE "tenants" RENAME COLUMN "dni" TO "cuit_dni";--> statement-breakpoint
ALTER TABLE "tenants" RENAME COLUMN "guarantor_dni" TO "guarantor_cuit_dni";--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "active" boolean DEFAULT true NOT NULL;