# Leads Agent 🤖📞

An automated AI-powered lead qualification and call dispatching backend built with Node 22, Express 5, Supabase, and Bolna AI voice agents.

---

## 🚀 Overview
**Leads Agent** automates lead engagement by triggering AI-driven voice calls via Bolna AI, tracking live call statuses and transcripts in Supabase, capturing high-intent signals mid-call, and orchestrating automated follow-ups via WhatsApp.

---

## 🛠 Tech Stack
- **Runtime**: Node.js v22 (ESM)
- **Framework**: Express 5
- **Database**: Supabase (PostgreSQL with Row Level Security & Indexes)
- **Voice AI Engine**: Bolna AI API
- **Messaging**: Meta WhatsApp Cloud API
- **Deployment**: Railway

---

## 📁 Project Structure

```
Leads_Agent/
├── server.js                   # Server entry point & environment validation
├── .nvmrc                      # Node 22 version specification
├── public/                     # Static assets / demo page
├── supabase/
│   └── schema.sql              # Supabase tables (leads, calls, callbacks, webhook_events)
└── src/
    ├── app.js                  # Express app initialization & middleware configuration
    ├── config/                 # Environment validation (env.js) & Supabase client (supabase.js)
    ├── controllers/            # Request handlers (call.controller.js, bolna.controller.js, etc.)
    ├── middleware/             # Security & error handling (auth.middleware.js, error.middleware.js)
    ├── models/                 # Database access models (lead.model.js, call.model.js, etc.)
    ├── routes/                 # Express router mapping (health, call, bolna)
    ├── services/               # Third-party integrations (bolna.service.js)
    └── utils/                  # Helper utilities (phone.js, callStatus.js, dbError.js)
```

---

## 📅 Development Log

### Day 1: Foundation, Architecture & Database Schema
- **System Blueprint**: Designed clean, modular project structure separating routes, controllers, services, models, and config.
- **Database Architecture**: Drafted Supabase PostgreSQL schema (`supabase/schema.sql`) covering:
  - `leads`: Lead profile storage, contact info, language, and lead temperature (`hot`, `warm`, `cold`).
  - `calls`: Detailed call logs, execution IDs, status, duration, transcripts, and summaries.
  - `callbacks`: Scheduled follow-ups with retry tracking and index filters.
  - `webhook_events`: Idempotent webhook event logging to prevent duplicate processing.
- **Core Server & Middleware**: Initialized Express 5 with JSON raw-body parsing, central error handling, timing-safe API secret authentication (`x-call-secret`, `x-webhook-secret`), and phone number normalization (E.164 standard).
- **Data Models**: Built reusable model handlers (`lead.model.js`, `call.model.js`, `webhookEvent.model.js`) wrapping Supabase client queries.

### Day 2: Bolna Voice AI Wiring & Mid-Call Telemetry
- Express 5 backend on Railway (Node 22 pinned), Supabase tables live, Bolna AI API fully wired.
- **Mid-call Trigger**: Integrated Bolna pre-call webhook (carries call ID + user number) for high-intent capture; main tool endpoint responds with instant ACK (`{ status: 'noted' }`) to keep call latency minimal.
- **Idempotency & Sanitization**: Implemented payload sanitization to strip API header echo logs before saving to Supabase, paired with `webhook_events` deduplication.
- **Measured Metrics**:
  - LLM first token latency: **~280–390 ms**
  - First audio packet latency: **~110 ms**
  - Cost efficiency: **~$0.04 per 1-minute call**
- **Observed Issues**:
  - STT occasionally mishears short English phrases.
  - User silence timers (5s / 7s) sometimes cut real human pauses.
- **Debugging Lesson**: `%(to_number)s` / `%(execution_id)s` placeholders in tool parameters made requests fail silently; resolved by extracting fields from the pre-call payload structure directly.