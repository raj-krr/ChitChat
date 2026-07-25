# 🚀 ChitChat (chitchatt.tech) — Comprehensive Feature Specification & Master Roadmap

**Live Production Domain**: [chitchatt.tech](https://chitchatt.tech)  
**Dual-Deployment Architecture**:
1. **Active Staging/Production**: Vercel (Frontend) + Render (Backend) + Cloudinary (Media)
2. **AWS EC2 Production Ready**: Automated GitHub Actions CI/CD ([deploy.yml](file:///c:/Users/ASUS/Desktop/Project/Chat_app/.github/workflows/deploy.yml)) + Docker Compose ([docker-compose.yml](file:///c:/Users/ASUS/Desktop/Project/Chat_app/docker-compose.yml)) + Docker Hub (`rajkrr/chat_app_*`) for 1-click deployment to AWS EC2 + AWS S3 anytime.

**Tech Stack**:
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS / DaisyUI / Mantine
- **Backend**: Node.js + Express 5 + Mongoose 9 + Socket.io 4 + WebRTC
- **AI Engine**: Groq API (`llama-3.3-70b-versatile`) via direct REST client ([groq.ts](file:///c:/Users/ASUS/Desktop/Project/Chat_app/backend/src/libs/groq.ts))
- **Media Infrastructure**: Cloudinary storage via streamlined uploader ([uploadHelper.ts](file:///c:/Users/ASUS/Desktop/Project/Chat_app/backend/src/libs/uploadHelper.ts))

---

## 🟢 1. CURRENT LIVE FEATURES (v1.0)

### 1.1 Dual-Deployment & DevOps Engine (AWS + Render/Vercel)
* **1-Click AWS EC2 Deployment**: Pre-configured GitHub Actions pipeline (`deploy.yml`) on `production` branch.
* **Docker Containerization**: Dockerfiles for both services + `docker-compose.yml` orchestrating container builds with SHA-tagging and automated rollback on EC2 failures.
* **Streamlined Media Storage**: Cloudinary upload pipeline handling image, video, audio, and document uploads.

### 1.2 Real-Time Messaging & Presence
* **WebSockets via Socket.io**: Handshake authenticated using JWT HttpOnly cookies or auth tokens.
* **Message Delivery States**: `sending` ⏳ → `sent` ✓ → `delivered` ✓✓ → `read` 🔵.
* **Online Presence & Typing Indicators**: Real-time `user-online`, `user-offline`, `typing`, and `stop-typing` broadcasts.
* **Anti-Spam & Flood Protection**: In-memory rate limiting (800ms cooldown) and sliding-window flood detection (25 msgs/10s triggers 60s temporary mute).

### 1.3 WebRTC Audio & Video Calling
* **P2P Signaling**: Socket.io signals ICE candidates, SDP offers, and SDP answers between peers.
* **Complete Call Lifecycle**: Initiate → Ringing → Answer / Reject → Connected State → End Call.
* **Busy & Missed Call Handling**: Auto-busy notification if user is in another call; 30-second auto-timeout for unanswered calls.
* **In-Call Media Controls**: Mute/unmute microphone, toggle video feed, flip camera, toggle speaker.
* **Ringtone Audio Effects**: Web Audio API ringtones for incoming and outgoing call states.

### 1.4 AI Chatbot Integration (Groq Llama 3.3 70B)
* **First-Class AI User**: Treated as a dedicated system user (`isBot: true`).
* **High-Speed Inference**: Direct REST integration with Groq API (`llama-3.3-70b-versatile`).
* **Rolling Context Memory**: Maintains memory of the last 6 messages in thread.
* **Human-like Delays**: Simulates typing indicator delay before delivering AI responses.
* **Rule-Based Fallback**: Graceful fallback generator if API rate limits occur.

### 1.5 Authentication & Security System
* **Dual-Token JWT Architecture**: Access Token + Refresh Token rotation in HttpOnly cookies.
* **Email OTP Verification**: Nodemailer integration for email verification on sign-up and password reset.
* **Middleware Chain**: Helmet headers, CORS origin whitelist, tiered Express rate limiters, and chat permission validation.

---

## 🧹 2. COMPLETED CODEBASE CLEANUP & SECURITY FIXES (Phase 1 Completed ✅)

| Service | Category | Action Taken | Reason & Impact | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Backend** | Library Fix | Streamlined [uploadHelper.ts](file:///c:/Users/ASUS/Desktop/Project/Chat_app/backend/src/libs/uploadHelper.ts) | Removed broken imports of deleted `s3.ts` and uninstalled `@aws-sdk/client-s3`. | ✅ **Fixed** |
| **Backend** | Security | Protected `POST /:messageId/react` in [messageRoute.ts](file:///c:/Users/ASUS/Desktop/Project/Chat_app/backend/src/routes/messageRoute.ts) | Added missing `authMiddleware` to reaction endpoint. | ✅ **Fixed** |
| **Backend** | Security | OTP expiration calculation in [auth.controllers.ts](file:///c:/Users/ASUS/Desktop/Project/Chat_app/backend/src/controllers/user/auth.controllers.ts) | Changed password reset OTP expiry from 5 hours to 5 minutes (`Date.now() + 5 * 60 * 1000`). | ✅ **Fixed** |
| **Backend** | Security | Hardened Socket CORS in [index.ts](file:///c:/Users/ASUS/Desktop/Project/Chat_app/backend/src/index.ts) | Replaced `.vercel.app` wildcard with exact production domain whitelist. | ✅ **Fixed** |
| **Backend** | Stability | Process crash listeners in [index.ts](file:///c:/Users/ASUS/Desktop/Project/Chat_app/backend/src/index.ts) | Added `unhandledRejection` and `uncaughtException` process handlers. | ✅ **Fixed** |
| **Backend** | Clean Code | Removed `punycode` import in [auth.middleware.ts](file:///c:/Users/ASUS/Desktop/Project/Chat_app/backend/src/middlewares/auth.middleware.ts) | Removed dead import of deprecated Node module. | ✅ **Fixed** |
| **Backend** | Clean Code | Removed `console.error` import in [auth.controllers.ts](file:///c:/Users/ASUS/Desktop/Project/Chat_app/backend/src/controllers/user/auth.controllers.ts) | Removed unused import. | ✅ **Fixed** |
| **Backend** | Clean Code | Simplified block check in [chatPermission.middleware.ts](file:///c:/Users/ASUS/Desktop/Project/Chat_app/backend/src/middlewares/chatPermission.middleware.ts) | Collapsed duplicate nested `if (receiverBlockedSender)` block. | ✅ **Fixed** |

---

## 🚦 3. MASTER PRIORITIZED ROADMAP (v2.0)

```
 ┌──────────────────────────────────────────────────────────────┐
 │ ✅ Phase 1: Security Hardening & Core Bug Fixes              │ (COMPLETED)
 └────────────────────────────┬─────────────────────────────────┘
                              │
 ┌────────────────────────────▼─────────────────────────────────┐
 │ Phase 2: Data Integrity, Zod Validation & Jest Test Suite    │ (Data & Quality)
 └────────────────────────────┬─────────────────────────────────┘
                              │
 ┌────────────────────────────▼─────────────────────────────────┐
 │ Phase 3: UI/UX Modernization & Multi-Theme Engine            │ (Visual Polish)
 └────────────────────────────┬─────────────────────────────────┘
                              │
 ┌────────────────────────────▼─────────────────────────────────┐
 │ Phase 4: WebRTC Call Reliability & Infrastructure Hardening  │ (Network & Infra)
 └────────────────────────────┬─────────────────────────────────┘
                              │
 ┌────────────────────────────▼─────────────────────────────────┐
 │ Phase 5: Groq AI Smart Features & Group Chat Scaling         │ (Product Expansion)
 └──────────────────────────────────────────────────────────────┘
```

### 📌 Phase 2: Data Integrity, Zod Validation & Jest API Test Suite (Quality Priority)
1. **Zod Validation Middleware**: Enforce strict data contract schemas for Register, Login, Reset Password, and Messaging endpoints.
2. **Centralized Error Handler & Winston Logging**: Replace fragmented `console.error` logs with structured JSON logging and a global Express error middleware.
3. **Fix Model Export Typos & Add Indexes**: Rename `UserMOdel` → `UserModel`, `MessageModal` → `MessageModel`, `notification.modal.ts` → `notification.model.ts` (project-wide find & replace). Add compound index `{ senderId: 1, receiverId: 1, createdAt: -1 }`.
4. **Jest + Supertest Integration Test Suite**: Write 15+ automated API tests covering auth, token refresh, message sending, and socket authorization.

### 📌 Phase 3: UI/UX Modernization & Multi-Theme Engine (Visual Priority)
5. **Theme Provider Engine (`ThemeContext.tsx`)**: Multi-theme switcher supporting `'light' | 'dark' | 'cyberpunk' | 'system'` synced with `localStorage`, Tailwind `.dark` class, AND Mantine `forceColorScheme` (so Mantine UI components switch themes smoothly alongside Tailwind).
6. **Semantic Class Refactoring**: Refactor hardcoded dark classes across `ChatWindow`, `Sidebar`, `MessageBubble`, and `ChatHeader` to dual-theme semantic classes (`bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100`).
7. **Complete Settings Page Build ([SettingsPage.tsx](file:///c:/Users/ASUS/Desktop/Project/Chat_app/frontend/src/pages/SettingsPage.tsx))**: Build interactive theme picker card grid, wallpaper customizer, profile editing, and notification controls.
8. **Bubble Hover Actions & Floating Glass Dock**: Add floating glass navbar and message bubble hover action bar (Quick Reactions, Reply Quote, Copy, Delete).
9. **Auth Guard `<CallWindow />` & Type-safe Contexts**: Wrap `<CallWindow />` so call UI only loads for authenticated users, and define strict TypeScript interfaces for `CallContext` and `AuthContext`.

### 📌 Phase 4: WebRTC Call Reliability & Infrastructure Hardening
10. **TURN Server Relay Integration**: Configure WebRTC ICE servers with TURN relay credentials (e.g. Metered.ca / Twilio) to guarantee **99.9% audio/video call connection success** across strict mobile 4G/5G networks.
11. **Self-Host Audio Assets**: Move ringtone/dialtone audio files from external `mixkit.co` CDN to local `/public/audio/` assets.
12. **Render Cold-Start Keep-Alive**: Enhance `/api/health` in [health.controller.ts](file:///c:/Users/ASUS/Desktop/Project/Chat_app/backend/src/controllers/health.controller.ts) and configure UptimeRobot ping monitor to keep Render backend warm 24/7.
13. **Web Push Notifications (VAPID / Service Worker)**: Deliver push alerts for incoming calls and unread messages when browser tab is closed.
14. **Graceful Shutdown Handler**: Add `SIGTERM` handler in `index.ts` for clean WebSocket disconnect and MongoDB close on server restarts.

### 📌 Phase 5: Groq AI Smart Features & Group Chat Scaling
15. **AI Smart Reply Chips**: Use Groq (`llama-3.3-70b-versatile`) to generate 3 context-aware reply chips above the text input.
16. **In-Chat `@chitchat` Assistant**: Tag `@chitchat` in any 1-on-1 or group chat for instant AI answers, coding help, or translation.
17. **Group Chat Engine**: Multi-participant `Chat` model with admin roles, member controls, and shareable invite URLs (`chitchatt.tech/join/:code`).
18. **Cursor-Based Message Pagination**: Replace `skip()`-based pagination with `createdAt` cursor pagination for optimal performance at 50,000+ messages.
19. **Redis Caching & Socket Pub/Sub Adapter**: Replace in-memory JS Maps (`onlineUsers`, `ongoingCalls`) in [socket.ts](file:///c:/Users/ASUS/Desktop/Project/Chat_app/backend/src/socket.ts) with Redis for horizontal scaling on AWS EC2 or Render.
