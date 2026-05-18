-- AlterTable
ALTER TABLE "invoices" ADD COLUMN "payment_method" TEXT;
ALTER TABLE "invoices" ADD COLUMN "stripe_checkout_session_id" TEXT;
ALTER TABLE "invoices" ADD COLUMN "stripe_customer_id" TEXT;
ALTER TABLE "invoices" ADD COLUMN "stripe_payment_intent_id" TEXT;
ALTER TABLE "invoices" ADD COLUMN "stripe_subscription_id" TEXT;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN "grace_period_ends_at" DATETIME;

-- CreateTable
CREATE TABLE "stripe_customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "default_currency" TEXT NOT NULL DEFAULT 'USD',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "stripe_customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tenant_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "brand" TEXT,
    "auth" TEXT,
    "kyc" TEXT,
    "trading" TEXT,
    "payment" TEXT,
    "channels" TEXT,
    "mvp_mode" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tenant_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tenant_features" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "feature_key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "requires_upgrade" BOOLEAN NOT NULL DEFAULT false,
    "upgrade_target" TEXT,
    "reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tenant_features_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tenant_domains" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "cname_target" TEXT,
    "ssl_status" TEXT,
    "verified_at" DATETIME,
    "failed_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tenant_domains_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tenant_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sent_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" DATETIME,
    "channel" TEXT NOT NULL DEFAULT 'in_app',
    "metadata" TEXT,
    CONSTRAINT "tenant_notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tenant_data_retentions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "retention_days" INTEGER NOT NULL DEFAULT 90,
    "retention_ends_at" DATETIME NOT NULL,
    "data_exported" BOOLEAN NOT NULL DEFAULT false,
    "export_url" TEXT,
    "export_requested_at" DATETIME,
    "purged_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tenant_data_retentions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kyc_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "region_code" TEXT NOT NULL,
    "kyc_level" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "document_type" TEXT,
    "document_front_url" TEXT,
    "document_back_url" TEXT,
    "selfie_url" TEXT,
    "ocr_confidence" REAL,
    "liveness_passed" BOOLEAN,
    "aml_passed" BOOLEAN DEFAULT false,
    "aml_risk_score" REAL,
    "personal_info" TEXT,
    "flags" TEXT NOT NULL DEFAULT '[]',
    "submitted_at" DATETIME,
    "reviewed_at" DATETIME,
    "reviewed_by" TEXT,
    "rejection_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "kyc_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kyc_review_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kyc_id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kyc_review_logs_kyc_id_fkey" FOREIGN KEY ("kyc_id") REFERENCES "kyc_records" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kyc_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payload" TEXT NOT NULL,
    "response" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "mt_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "mt_login" TEXT NOT NULL,
    "mt_password" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "leverage" INTEGER NOT NULL DEFAULT 100,
    "balance" REAL NOT NULL DEFAULT 0,
    "equity" REAL NOT NULL DEFAULT 0,
    "margin" REAL NOT NULL DEFAULT 0,
    "free_margin" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "mt_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 0,
    "frozen" REAL NOT NULL DEFAULT 0,
    "available" REAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "fee" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "method" TEXT,
    "tx_hash" TEXT,
    "address" TEXT,
    "description" TEXT,
    "metadata" TEXT,
    "processed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "account_id" TEXT NOT NULL,
    "mt_ticket" TEXT,
    "symbol" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "volume" REAL NOT NULL,
    "open_price" REAL NOT NULL,
    "close_price" REAL,
    "profit" REAL DEFAULT 0,
    "swap" REAL DEFAULT 0,
    "commission" REAL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',
    "open_time" DATETIME NOT NULL,
    "close_time" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "orders_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "mt_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "account_id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "volume" REAL NOT NULL,
    "open_price" REAL NOT NULL,
    "current_price" REAL,
    "profit" REAL DEFAULT 0,
    "swap" REAL DEFAULT 0,
    "open_time" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "positions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "mt_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ib_partners" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "code" TEXT NOT NULL,
    "commission_rate" REAL NOT NULL DEFAULT 0,
    "total_commission" REAL NOT NULL DEFAULT 0,
    "total_clients" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ib_partners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "commission_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ib_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "order_id" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "period" TEXT NOT NULL,
    "paid_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "commission_records_ib_id_fkey" FOREIGN KEY ("ib_id") REFERENCES "ib_partners" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "risk_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "user_id" TEXT NOT NULL,
    "account_id" TEXT,
    "description" TEXT,
    "metadata" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" DATETIME,
    "resolved_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "blacklist_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "reason" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" DATETIME
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "action_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discount_type" TEXT NOT NULL,
    "discount_value" REAL NOT NULL,
    "max_uses" INTEGER NOT NULL DEFAULT 0,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "valid_from" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" DATETIME,
    "applicable_plans" TEXT,
    "applicable_modules" TEXT,
    "min_amount" REAL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "product_modules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "module_code" TEXT NOT NULL,
    "module_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "plan_name" TEXT,
    "features" TEXT,
    "config" TEXT,
    "seat_limit" INTEGER NOT NULL DEFAULT 0,
    "current_seats" INTEGER NOT NULL DEFAULT 0,
    "trial_ends_at" DATETIME,
    "starts_at" DATETIME,
    "ends_at" DATETIME,
    "auto_renew" BOOLEAN NOT NULL DEFAULT true,
    "price_monthly" REAL,
    "price_yearly" REAL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "product_modules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "oauth2_apps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "client_id" TEXT NOT NULL,
    "client_secret" TEXT NOT NULL,
    "redirect_uris" TEXT NOT NULL,
    "scopes" TEXT NOT NULL DEFAULT '["read","write"]',
    "status" TEXT NOT NULL DEFAULT 'active',
    "rate_limit" INTEGER NOT NULL DEFAULT 1000,
    "last_used_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "oauth2_apps_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "client_identities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "doc_number_hash" TEXT NOT NULL,
    "doc_number_last4" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "issued_at" DATETIME,
    "expires_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "client_payment_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "account_hash" TEXT NOT NULL,
    "account_last4" TEXT NOT NULL,
    "provider" TEXT,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "client_fund_flow_links" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source_user_id" TEXT NOT NULL,
    "target_user_id" TEXT NOT NULL,
    "amount_usd" REAL NOT NULL,
    "tx_count" INTEGER NOT NULL DEFAULT 1,
    "first_seen_at" DATETIME NOT NULL,
    "last_seen_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "client_relationship_scores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id_a" TEXT NOT NULL,
    "user_id_b" TEXT NOT NULL,
    "total_score" INTEGER NOT NULL,
    "hard_count" INTEGER NOT NULL DEFAULT 0,
    "medium_count" INTEGER NOT NULL DEFAULT 0,
    "soft_count" INTEGER NOT NULL DEFAULT 0,
    "edge_kinds" TEXT NOT NULL,
    "evidence_json" TEXT NOT NULL,
    "calculated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_client_devices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "ip_subnet" TEXT,
    "isp" TEXT,
    "country" TEXT,
    "city" TEXT,
    "device_id" TEXT NOT NULL,
    "browser_fingerprint" TEXT,
    "mobile_ad_id" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "timezone" TEXT,
    "sessions_count" INTEGER NOT NULL DEFAULT 1,
    "is_risky" BOOLEAN NOT NULL DEFAULT false,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "last_used_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_client_devices" ("browser", "city", "country", "created_at", "device_id", "id", "ip_address", "is_current", "is_risky", "last_used_at", "os", "timezone", "user_id") SELECT "browser", "city", "country", "created_at", "device_id", "id", "ip_address", "is_current", "is_risky", "last_used_at", "os", "timezone", "user_id" FROM "client_devices";
DROP TABLE "client_devices";
ALTER TABLE "new_client_devices" RENAME TO "client_devices";
CREATE INDEX "client_devices_user_id_last_used_at_idx" ON "client_devices"("user_id", "last_used_at");
CREATE INDEX "client_devices_ip_address_idx" ON "client_devices"("ip_address");
CREATE INDEX "client_devices_ip_subnet_idx" ON "client_devices"("ip_subnet");
CREATE INDEX "client_devices_device_id_idx" ON "client_devices"("device_id");
CREATE INDEX "client_devices_browser_fingerprint_idx" ON "client_devices"("browser_fingerprint");
CREATE INDEX "client_devices_mobile_ad_id_idx" ON "client_devices"("mobile_ad_id");
CREATE TABLE "new_tenant_onboardings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "step" INTEGER NOT NULL DEFAULT 1,
    "data" TEXT NOT NULL DEFAULT '{}',
    "deadline" DATETIME,
    "completed_steps" TEXT,
    "skipped_steps" TEXT,
    "locked_steps" TEXT,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tenant_onboardings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_tenant_onboardings" ("created_at", "data", "deadline", "id", "status", "step", "tenant_id", "updated_at") SELECT "created_at", "data", "deadline", "id", "status", "step", "tenant_id", "updated_at" FROM "tenant_onboardings";
DROP TABLE "tenant_onboardings";
ALTER TABLE "new_tenant_onboardings" RENAME TO "tenant_onboardings";
CREATE UNIQUE INDEX "tenant_onboardings_tenant_id_key" ON "tenant_onboardings"("tenant_id");
CREATE TABLE "new_tenants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'trial',
    "region" TEXT NOT NULL DEFAULT 'ap-southeast-1',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "locale" TEXT NOT NULL DEFAULT 'zh-CN',
    "domain_whitelist" TEXT,
    "trial_ends_at" DATETIME,
    "owner_id" TEXT NOT NULL,
    "brand_name" TEXT,
    "slogan" TEXT,
    "favicon_url" TEXT,
    "primary_color" TEXT DEFAULT '#1a73e8',
    "subdomain" TEXT,
    "custom_domain" TEXT,
    "custom_domain_verified" BOOLEAN NOT NULL DEFAULT false,
    "plan" TEXT NOT NULL DEFAULT 'mvp',
    "max_users" INTEGER NOT NULL DEFAULT 10,
    "max_accounts" INTEGER NOT NULL DEFAULT 5,
    "grace_period_ends_at" DATETIME,
    "retention_expires_at" DATETIME,
    "downgrade_reason" TEXT,
    "onboarding_locked" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tenants_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_tenants" ("created_at", "domain_whitelist", "id", "locale", "logo_url", "name", "owner_id", "region", "slug", "status", "timezone", "trial_ends_at", "updated_at") SELECT "created_at", "domain_whitelist", "id", "locale", "logo_url", "name", "owner_id", "region", "slug", "status", "timezone", "trial_ends_at", "updated_at" FROM "tenants";
DROP TABLE "tenants";
ALTER TABLE "new_tenants" RENAME TO "tenants";
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
CREATE UNIQUE INDEX "tenants_subdomain_key" ON "tenants"("subdomain");
CREATE UNIQUE INDEX "tenants_custom_domain_key" ON "tenants"("custom_domain");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending_verification',
    "email_verified_at" DATETIME,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "kyc_status" TEXT DEFAULT 'not_started',
    "two_factor_secret" TEXT,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" DATETIME,
    "onboarding_completed_at" DATETIME,
    "onboarding_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_users" ("created_at", "email", "email_verified_at", "id", "kyc_status", "last_login_at", "name", "password_hash", "phone", "status", "updated_at") SELECT "created_at", "email", "email_verified_at", "id", "kyc_status", "last_login_at", "name", "password_hash", "phone", "status", "updated_at" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "stripe_customers_tenant_id_key" ON "stripe_customers"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_customers_stripe_customer_id_key" ON "stripe_customers"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_configs_tenant_id_key" ON "tenant_configs"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_features_tenant_id_feature_key_key" ON "tenant_features"("tenant_id", "feature_key");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_domains_domain_key" ON "tenant_domains"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_data_retentions_tenant_id_key" ON "tenant_data_retentions"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_records_user_id_key" ON "kyc_records"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "mt_accounts_mt_login_key" ON "mt_accounts"("mt_login");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_currency_key" ON "wallets"("user_id", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "orders_mt_ticket_key" ON "orders"("mt_ticket");

-- CreateIndex
CREATE UNIQUE INDEX "ib_partners_user_id_key" ON "ib_partners"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ib_partners_code_key" ON "ib_partners"("code");

-- CreateIndex
CREATE UNIQUE INDEX "blacklist_entries_type_value_key" ON "blacklist_entries"("type", "value");

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "product_modules_tenant_id_module_code_key" ON "product_modules"("tenant_id", "module_code");

-- CreateIndex
CREATE UNIQUE INDEX "oauth2_apps_client_id_key" ON "oauth2_apps"("client_id");

-- CreateIndex
CREATE INDEX "client_identities_doc_type_doc_number_hash_idx" ON "client_identities"("doc_type", "doc_number_hash");

-- CreateIndex
CREATE INDEX "client_identities_user_id_idx" ON "client_identities"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_identities_user_id_doc_type_key" ON "client_identities"("user_id", "doc_type");

-- CreateIndex
CREATE INDEX "client_payment_accounts_type_account_hash_idx" ON "client_payment_accounts"("type", "account_hash");

-- CreateIndex
CREATE INDEX "client_payment_accounts_user_id_idx" ON "client_payment_accounts"("user_id");

-- CreateIndex
CREATE INDEX "client_fund_flow_links_source_user_id_idx" ON "client_fund_flow_links"("source_user_id");

-- CreateIndex
CREATE INDEX "client_fund_flow_links_target_user_id_idx" ON "client_fund_flow_links"("target_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_fund_flow_links_source_user_id_target_user_id_key" ON "client_fund_flow_links"("source_user_id", "target_user_id");

-- CreateIndex
CREATE INDEX "client_relationship_scores_user_id_a_idx" ON "client_relationship_scores"("user_id_a");

-- CreateIndex
CREATE INDEX "client_relationship_scores_user_id_b_idx" ON "client_relationship_scores"("user_id_b");

-- CreateIndex
CREATE INDEX "client_relationship_scores_total_score_idx" ON "client_relationship_scores"("total_score");

-- CreateIndex
CREATE UNIQUE INDEX "client_relationship_scores_user_id_a_user_id_b_key" ON "client_relationship_scores"("user_id_a", "user_id_b");

┌─────────────────────────────────────────────────────────┐
│  Update available 5.22.0 -> 7.8.0                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
