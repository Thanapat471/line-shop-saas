@AGENTS.md
# LINE Shop SaaS

LINE Shop SaaS is a multi-tenant order management system for small Thai merchants who sell through LINE Official Account. The goal is to replace manual chat-based order handling with a workflow that captures orders automatically, shows them in a real-time dashboard, and sends status updates back to customers through LINE.

This README is the project's source of truth for product scope, MVP flow, architecture decisions, and planned libraries so future AI/codegen runs do not drift.

## Product Summary

- Target users: small online merchants in Thailand selling through LINE OA
- Business model: monthly SaaS subscription charged to merchants
- Main value: reduce manual order taking, centralize order management, and keep customer communication inside LINE

## Core User Flow

1. Customer sends a message or order request in LINE OA.
2. LINE sends a webhook event to the app backend.
3. The app verifies the LINE signature and parses the incoming event.
4. The system creates or updates the customer record and creates an order.
5. The merchant sees the new order in a real-time dashboard.
6. The merchant updates the order status from the dashboard.
7. The system sends the updated status back to the customer through LINE automatically.
8. Completed orders are used for daily sales summaries and reports.

## MVP Scope

- Merchant can manage products or menu items
- System can receive order requests from LINE automatically
- Merchant dashboard shows orders in real time
- Merchant can update order status
- System sends LINE notifications back to the customer
- Dashboard shows daily sales summary

## Recommended Order Statuses For This Project

This project is closer to social commerce than a restaurant POS, so the order lifecycle should stay simple:

- `new`
- `waiting_payment`
- `paid`
- `processing`
- `shipped`
- `completed`
- `cancelled`

Recommended rule for MVP:

- Automatic: `new`, `waiting_payment`
- Manual by merchant: `paid`, `processing`, `shipped`, `completed`, `cancelled`

## Architecture Overview

### Frontend

- Next.js with App Router
- Tailwind CSS
- shadcn/ui

### Backend and Data

- Supabase PostgreSQL for core relational data
- Supabase Auth for merchant authentication
- Supabase Realtime for dashboard updates
- Supabase Storage for product images and assets

### LINE Integration

- LINE Messaging API for webhook events and outbound notifications
- LINE LIFF for in-LINE mini app flows when needed later

### Payments

- Stripe for merchant subscription billing
- GB Prime Pay for customer-facing PromptPay QR or order payment flow

### Deployment and Communication

- Vercel for app deployment
- Resend for transactional email

## Development Phases

Do not build everything at once. Build in these phases:

1. Define the MVP flow and database schema.
2. Set up Supabase tables, auth, and realtime.
3. Set up LINE Messaging API and a working webhook endpoint.
4. Save incoming LINE messages and create orders.
5. Build the merchant dashboard for real-time order management.
6. Add order status updates and push LINE notifications.
7. Add daily sales reporting.
8. Add Stripe subscriptions and GB Prime Pay after the core flow is stable.

## Planned Data Model

These are the first core entities we expect to need:

- `shops`
- `users`
- `line_channels`
- `customers`
- `products`
- `orders`
- `order_items`
- `order_status_logs`
- `subscriptions`

Notes:

- The system must be multi-tenant from day one.
- Every business record should belong to a shop.
- Subscription billing for merchants must stay separate from customer order payments.

## Library Plan

The list below is the intended stack for the product. Some packages are planned and may not be installed yet.

### UI and Styling

- `tailwindcss`
- `shadcn/ui`
- `clsx`
- `tailwind-merge`

### State and Data Fetching

- `zustand`
- `@tanstack/react-query`
- `zod`

### Forms

- `react-hook-form`
- `@hookform/resolvers`

### Charts and Dashboard

- `recharts`
- `tremor`

### Date and Time

- `date-fns`
- `react-day-picker`

### Supabase and LINE

- `@supabase/supabase-js`
- `@line/bot-sdk`

### Payments

- `stripe`
- `@stripe/stripe-js`
- `@stripe/react-stripe-js`

### Auth and Utilities

- `better-auth` or `next-auth`
- `resend`
- `uploadthing`

## Installed Today vs Planned

The current repository is still at the starter stage. As of now, the installed packages in `package.json` are mainly:

- `next`
- `react`
- `react-dom`
- `tailwindcss`
- `typescript`
- `eslint`

Everything else in the library plan above should be treated as planned until explicitly installed and configured.

## Guardrails For Future AI Work

When extending this project, keep these rules in mind:

- Do not implement LINE, dashboard, payment, and subscription in one pass.
- Do not design UI before confirming the data model and order flow.
- Do not assume a restaurant workflow; this project is for online selling through LINE OA.
- Keep the order flow simple before adding automation.
- Keep merchant subscription billing separate from customer order payment.
- Update this README when major product or architecture decisions change.

## Suggested Next Step

The safest next task is:

1. finalize the MVP order flow
2. design the initial database schema
3. then start backend integration
