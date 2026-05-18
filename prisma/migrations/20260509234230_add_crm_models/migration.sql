-- CreateTable
CREATE TABLE "client_notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mentions" TEXT NOT NULL DEFAULT '[]',
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "note_type" TEXT NOT NULL DEFAULT 'general',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "client_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#94a3b8',
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "auto_rule" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "client_tag_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "assigned_by" TEXT,
    "assigned_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "client_tag_assignments_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "client_tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "client_segments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filter" TEXT NOT NULL DEFAULT '{}',
    "is_dynamic" BOOLEAN NOT NULL DEFAULT true,
    "user_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "client_devices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "device_id" TEXT NOT NULL,
    "browser" TEXT,
    "os" TEXT,
    "timezone" TEXT,
    "is_risky" BOOLEAN NOT NULL DEFAULT false,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "last_used_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "client_agreements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "agreement_type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "signed_at" DATETIME NOT NULL,
    "signed_ip" TEXT NOT NULL,
    "pdf_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'signed',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "crm_cases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "case_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "sla" TEXT,
    "reviewer_id" TEXT,
    "comments" TEXT NOT NULL DEFAULT '[]',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "crm_tickets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticket_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "subject" TEXT NOT NULL,
    "assigned_to_id" TEXT,
    "messages" TEXT NOT NULL DEFAULT '[]',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "crm_timeline_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "operator_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "crm_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "operator_id" TEXT,
    "operator_name" TEXT NOT NULL DEFAULT 'system',
    "action" TEXT NOT NULL,
    "target_field" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "ip_address" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "client_notes_user_id_created_at_idx" ON "client_notes"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "client_tags_name_key" ON "client_tags"("name");

-- CreateIndex
CREATE INDEX "client_tag_assignments_user_id_idx" ON "client_tag_assignments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_tag_assignments_user_id_tag_id_key" ON "client_tag_assignments"("user_id", "tag_id");

-- CreateIndex
CREATE INDEX "client_devices_user_id_last_used_at_idx" ON "client_devices"("user_id", "last_used_at");

-- CreateIndex
CREATE INDEX "client_devices_ip_address_idx" ON "client_devices"("ip_address");

-- CreateIndex
CREATE INDEX "client_devices_device_id_idx" ON "client_devices"("device_id");

-- CreateIndex
CREATE INDEX "client_agreements_user_id_idx" ON "client_agreements"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_cases_case_id_key" ON "crm_cases"("case_id");

-- CreateIndex
CREATE INDEX "crm_cases_user_id_status_idx" ON "crm_cases"("user_id", "status");

-- CreateIndex
CREATE INDEX "crm_cases_status_priority_idx" ON "crm_cases"("status", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "crm_tickets_ticket_id_key" ON "crm_tickets"("ticket_id");

-- CreateIndex
CREATE INDEX "crm_tickets_user_id_status_idx" ON "crm_tickets"("user_id", "status");

-- CreateIndex
CREATE INDEX "crm_tickets_status_priority_idx" ON "crm_tickets"("status", "priority");

-- CreateIndex
CREATE INDEX "crm_timeline_events_user_id_created_at_idx" ON "crm_timeline_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "crm_audit_logs_user_id_created_at_idx" ON "crm_audit_logs"("user_id", "created_at");

