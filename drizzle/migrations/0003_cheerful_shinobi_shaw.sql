ALTER TYPE "public"."payment_status" ADD VALUE 'cancelled';--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "cancelled_reason" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "cancelled_at" timestamp;