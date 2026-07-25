# 🚀 ChitChat — Features Overview & Product Roadmap

**Live Domain**: [chitchatt.tech](https://chitchatt.tech)  
**Architecture**: React 19 + TypeScript + Vite + Tailwind/Mantine (Frontend) | Express 5 + Node.js + MongoDB + Socket.io + WebRTC (Backend)  
**AI Engine**: Groq API (`llama-3.3-70b-versatile`)  
**Media Provider**: Cloudinary (`uploadMediaFile`)

---

## 🟢 CURRENT LIVE FEATURES (v1.0)

### 1. 💬 Real-Time 1-to-1 Messaging
* **Socket.io Architecture**: WebSocket connection authenticated via JWT handshake.
* **Message Delivery States**: Real-time status tracking (`sending` ⏳ → `sent` ✓ → `delivered` ✓✓ → `read` blue ticks).
* **Typing Indicators**: Real-time "is typing..." event emissions and UI feedback.
* **Online Presence**: Real-time online/offline status detection for contacts.
* **Anti-Spam & Flood Protection**: Socket-level rate limiting (800ms cooldown) and flood detection (max 25 msgs/10s with automated 60s mute).

### 2. 📞 WebRTC Audio & Video Calling
* **Full Call Lifecycle**: Initiate → Ringing → Answer / Reject → Connected → End.
* **Busy & Missed Call Handling**: Auto-cutoff after 30s timeout, busy detection when user is already in a call, missed call notification records.
* **Media Controls**: Mute/unmute microphone, enable/disable video camera, flip camera, toggle speaker.
* **Ringtone & Audio Feedback**: Custom ringtone, dialtone, and call disconnect audio feedback.
* **P2P Signaling**: Socket.io ICE candidate and SDP offer/answer exchange.

### 3. 🤖 AI Bot Integration (Groq Llama 3.3 70B)
* **First-Class AI User**: Treated as a dedicated system user (`isBot: true`).
* **High-Speed Inference**: Direct HTTP integration with Groq (`llama-3.3-70b-versatile`).
* **Conversational Context**: Keeps memory of the last 6 messages in thread for intelligent, context-aware replies.
* **Typing Simulation**: Simulates typing indicator delay before sending AI responses.
* **Rule-Based Fallback**: Rule-based fallback mechanism when Groq API limit or key issue occurs.

### 4. 📁 Rich Media & Voice Messages
* **Cloudinary Uploads**: Images, video files, document PDFs, and audio recordings uploaded via Cloudinary.
* **Voice Recording UX**: Custom audio recorder with slide-to-cancel and lock-to-record capabilities.
* **File Previews**: Interactive preview modals before sending media attachments.

### 5. 🔑 Auth & Security System
* **Dual Token Authentication**: JWT access token + refresh token rotation.
* **Cookie-Based Storage**: Secure HttpOnly cookies for token management.
* **Email Verification & OTP**: Nodemailer integration for email OTP verification on registration and password reset.
* **Multi-Layered Security**: Helmet HTTP headers, CORS origin whitelist, and multi-tier Express rate limiters.

### 6. 👥 Friend & Notification System
* **Friend Lifecycle**: Send, accept, reject, or cancel friend requests.
* **User Management**: Block/unblock users, unfriend, and search users by username.
* **Real-time Notifications**: Badge counts, unread counters, and notification feed for social actions.

### 7. 🛠️ DevOps & Infrastructure
* **Containerized Deployment**: Docker & Docker Compose setup for frontend and backend.
* **CI/CD Pipeline**: GitHub Actions with SHA-tagged Docker images and automated rollback on deployment failure.
* **Production Hosting**: Vercel (Frontend), Render / AWS EC2 (Backend), Cloudinary (Media), routed via custom domain `chitchatt.tech`.

---

## 🧹 CLEANUP & DE-BLOAT RECOMMENDATIONS (Lighten Codebase)

| Service | Unused Package / File | Why Remove | Impact |
|---------|-----------------------|------------|--------|
| **Backend** | `@google/generative-ai` | Switched to Groq API ([groq.ts](file:///c:/Users/ASUS/Desktop/Project/Chat_app/backend/src/libs/groq.ts)) | Reduces `node_modules` size & build time |
| **Backend** | `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` | Switched to Cloudinary for media uploads | Saves ~45MB of heavy AWS SDK bloat |
| **Backend** | `s3.ts` ([s3.ts](file:///c:/Users/ASUS/Desktop/Project/Chat_app/backend/src/libs/s3.ts)) | Unused AWS client config file | Dead code removal |
| **Backend** | `socket.io-client` & `@types/socket.io-client` | Backend is a socket server (`socket.io`), client library is unnecessary in backend | Removes redundant dependency |
| **Frontend** | `@tabler/icons-react` | 0 references across frontend code (app uses Lucide icons) | Reduces bundle size |
| **Frontend** | `dotenv` & `@types/dotenv` | Vite uses `import.meta.env` natively; `dotenv` is Node-only | Clean runtime dependencies |

---

## 🔮 FUTURE ROADMAP & EXTRAORDINARY FEATURES (v2.0)

### 📌 Tier 1: Engineering Core, Security & Quality (High Priority)
1. **Codebase Cleanup & De-bloat**: Remove unused dependencies listed above to optimize Render build speed and decrease Vercel bundle size.
2. **Zod Input Validation**: Add Zod schema validation middleware to all HTTP endpoints to enforce strict data contracts.
3. **Automated Testing Suite**: Implement API unit & integration tests using Jest and Supertest (target 80%+ endpoint coverage).
4. **Model Naming Cleanup**: Rename typos (`UserMOdel` → `UserModel`, `notification.modal.ts` → `notification.model.ts`).
5. **Centralized Error Middleware & Winston Logging**: Replace fragmented `console.log` statements with structured JSON logging.

### 📌 Tier 2: Real-Time Performance & Infrastructure Boost
6. **Redis Caching & Pub/Sub Adapter**: Integrate Redis for online user presence caching and Socket.io Redis Adapter for horizontal backend scaling.
7. **TURN Server Integration**: Add TURN relay credentials (e.g., via Metered.ca / Twilio) to guarantee 99.9% WebRTC call connection success rates on strict mobile 4G/5G networks.
8. **Render Keep-Alive Endpoint**: Create an automated heartbeat ping mechanism to prevent Render free-tier cold starts (~30s delay after inactivity).
9. **Web Push Notifications**: Web Push API (Service Worker + VAPID) to deliver call/message alerts when browser tab is closed.

### 📌 Tier 3: Supercharged AI Features (Groq Llama 3.3 70B)
10. **AI Smart Reply Chips**: Use Groq to generate 3 context-aware quick response suggestions under incoming messages.
11. **In-Chat AI Assistant (`@chitchat`)**: Allow users to tag `@chitchat` in any conversation for instant answers, code generation, and translation via Groq.
12. **Unread Message Summarizer**: A "Catch Me Up" button in active group chats to summarize unread messages into concise bullet points using Groq.

### 📌 Tier 4: Product & Social Extensions
13. **Group Chat Support**: Multi-participant `Chat` model, group roles (Admin, Moderator, Member), group invite links (`chitchatt.tech/join/:code`).
14. **Screen Sharing & Video Background Effects**: Tab/window sharing and virtual background blur during WebRTC video calls.
15. **24-Hour Stories / Status Updates**: Instagram/WhatsApp-like media updates stored in Cloudinary that auto-expire after 24 hours.
16. **End-to-End Encryption (E2EE)**: Client-side AES-GCM encryption for private 1-on-1 messaging threads.
17. **Message Pinning & Full-Text Search**: Pin key messages to the header and search message history via MongoDB Atlas Search.
