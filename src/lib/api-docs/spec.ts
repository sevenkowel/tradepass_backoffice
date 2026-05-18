/**
 * API Documentation Spec
 * Comprehensive API reference for the TradePass SaaS platform.
 */

export interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  auth: string;
  request?: Record<string, { type: string; required: boolean; description: string }>;
  response?: Record<string, { type: string; description: string }>;
  errors?: { code: number; message: string }[];
}

export interface ApiGroup {
  name: string;
  description: string;
  endpoints: ApiEndpoint[];
}

export const API_SPEC: ApiGroup[] = [
  {
    name: "Authentication",
    description: "User authentication and session management",
    endpoints: [
      {
        method: "POST",
        path: "/api/auth/register",
        description: "Register a new user account",
        auth: "None",
        request: {
          email: { type: "string", required: true, description: "User email address" },
          password: { type: "string", required: true, description: "Min 8 characters" },
          name: { type: "string", required: false, description: "Display name" },
        },
        response: {
          success: { type: "boolean", description: "Registration status" },
          userId: { type: "string", description: "Created user ID" },
        },
        errors: [
          { code: 400, message: "Invalid email or password" },
          { code: 409, message: "Email already exists" },
        ],
      },
      {
        method: "POST",
        path: "/api/auth/login",
        description: "Authenticate and receive JWT token",
        auth: "None",
        request: {
          email: { type: "string", required: true, description: "User email" },
          password: { type: "string", required: true, description: "User password" },
        },
        response: {
          token: { type: "string", description: "JWT access token" },
          refreshToken: { type: "string", description: "Refresh token" },
          user: { type: "object", description: "User profile" },
        },
        errors: [{ code: 401, message: "Invalid credentials" }],
      },
      {
        method: "POST",
        path: "/api/auth/refresh",
        description: "Refresh expired access token",
        auth: "Refresh Token",
        request: {
          refreshToken: { type: "string", required: true, description: "Valid refresh token" },
        },
        response: {
          token: { type: "string", description: "New JWT access token" },
        },
      },
    ],
  },
  {
    name: "Tenants",
    description: "Tenant management and configuration",
    endpoints: [
      {
        method: "GET",
        path: "/api/tenants",
        description: "List all tenants for current user",
        auth: "JWT",
        response: {
          tenants: { type: "array", description: "List of tenant objects" },
        },
      },
      {
        method: "POST",
        path: "/api/tenants",
        description: "Create a new tenant",
        auth: "JWT",
        request: {
          name: { type: "string", required: true, description: "Tenant name" },
          slug: { type: "string", required: true, description: "Unique slug" },
        },
        response: {
          tenant: { type: "object", description: "Created tenant" },
        },
      },
      {
        method: "GET",
        path: "/api/tenants/:id",
        description: "Get tenant details",
        auth: "JWT",
        response: {
          tenant: { type: "object", description: "Tenant with members and config" },
        },
      },
      {
        method: "PATCH",
        path: "/api/tenants/:id",
        description: "Update tenant configuration",
        auth: "JWT (Owner/Admin)",
        request: {
          name: { type: "string", required: false, description: "New tenant name" },
          brandName: { type: "string", required: false, description: "Brand name" },
          primaryColor: { type: "string", required: false, description: "Hex color" },
        },
      },
    ],
  },
  {
    name: "Billing",
    description: "Subscription, invoices, and payments",
    endpoints: [
      {
        method: "GET",
        path: "/api/console/billing",
        description: "Get billing overview",
        auth: "JWT",
        response: {
          subscription: { type: "object", description: "Current subscription" },
          invoices: { type: "array", description: "Invoice history" },
        },
      },
      {
        method: "POST",
        path: "/api/console/billing/checkout-session",
        description: "Create Stripe checkout session",
        auth: "JWT",
        request: {
          plan: { type: "string", required: true, description: "Plan ID" },
          yearly: { type: "boolean", required: false, description: "Annual billing" },
          currency: { type: "string", required: false, description: "Currency code" },
        },
        response: {
          url: { type: "string", description: "Stripe checkout URL" },
          sessionId: { type: "string", description: "Checkout session ID" },
        },
      },
      {
        method: "GET",
        path: "/api/console/billing/verify-session",
        description: "Verify checkout session payment status",
        auth: "JWT",
        request: {
          session_id: { type: "string", required: true, description: "Stripe session ID" },
        },
        response: {
          paid: { type: "boolean", description: "Payment confirmed" },
          invoice: { type: "object", description: "Invoice details" },
        },
      },
    ],
  },
  {
    name: "Product Modules",
    description: "Growth Engine, Trade Engine, Trading Engine subscriptions",
    endpoints: [
      {
        method: "GET",
        path: "/api/console/modules",
        description: "List all modules with subscription status",
        auth: "JWT",
        request: {
          tenantId: { type: "string", required: true, description: "Tenant ID" },
        },
        response: {
          modules: { type: "array", description: "Module list with subscription" },
        },
      },
      {
        method: "POST",
        path: "/api/console/modules/subscribe",
        description: "Subscribe to a module (trial or paid)",
        auth: "JWT (Owner)",
        request: {
          tenantId: { type: "string", required: true, description: "Tenant ID" },
          moduleCode: { type: "string", required: true, description: "Module code" },
          plan: { type: "string", required: true, description: "Plan code" },
          trial: { type: "boolean", required: false, description: "Start trial" },
        },
      },
      {
        method: "PATCH",
        path: "/api/console/modules/config",
        description: "Update module configuration",
        auth: "JWT (Owner/Admin)",
        request: {
          tenantId: { type: "string", required: true, description: "Tenant ID" },
          moduleCode: { type: "string", required: true, description: "Module code" },
          config: { type: "object", required: true, description: "Module config JSON" },
        },
      },
    ],
  },
  {
    name: "Promo Codes",
    description: "Promotional code validation and management",
    endpoints: [
      {
        method: "POST",
        path: "/api/console/promo/validate",
        description: "Validate and calculate promo code discount",
        auth: "JWT",
        request: {
          code: { type: "string", required: true, description: "Promo code" },
          amount: { type: "number", required: true, description: "Order amount" },
          currency: { type: "string", required: false, description: "Currency" },
          plan: { type: "string", required: false, description: "Plan ID" },
          moduleCode: { type: "string", required: false, description: "Module code" },
        },
        response: {
          valid: { type: "boolean", description: "Is code valid" },
          appliedAmount: { type: "number", description: "Discount amount" },
          finalAmount: { type: "number", description: "Amount after discount" },
        },
      },
    ],
  },
  {
    name: "Webhooks",
    description: "Stripe webhook events",
    endpoints: [
      {
        method: "POST",
        path: "/api/webhooks/stripe",
        description: "Receive Stripe webhook events",
        auth: "Stripe Signature",
        request: {
          event: { type: "object", required: true, description: "Stripe event payload" },
        },
        response: {
          received: { type: "boolean", description: "Event processed" },
        },
      },
    ],
  },
  {
    name: "Health",
    description: "System health monitoring",
    endpoints: [
      {
        method: "GET",
        path: "/api/health",
        description: "Check system health status",
        auth: "None",
        response: {
          status: { type: "string", description: "healthy | degraded | unhealthy" },
          checks: { type: "object", description: "Individual check results" },
          version: { type: "string", description: "App version" },
        },
      },
    ],
  },
];
