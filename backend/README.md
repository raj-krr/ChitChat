# ChitChat - Backend Platform

[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express-v5.1.0-lightgrey.svg)](https://expressjs.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-v4.8.1-black.svg)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%20v9.0-green.svg)](https://mongoosejs.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-v2.5-blue.svg)](https://cloudinary.com/)
[![Groq AI](https://img.shields.io/badge/Groq%20AI-Llama%203.3--70B-orange.svg)](https://groq.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

**ChitChat Backend** is a high-performance, real-time communication platform engineered to power 1-on-1 messaging, multi-participant group chats, WebRTC audio/video call signaling, Groq AI-assisted smart replies, and Cloudinary media processing. Built using Node.js, Express 5, TypeScript 5.9, Socket.io 4.8, and MongoDB, ChitChat Backend handles low-latency WebSocket events, anti-spam rate limiting, dual-token JWT authentication, and automated error handling.

> 🔗 **Repositories Ecosystem**:
> - ⚙️ **Backend Service (This Directory)**: [https://github.com/raj-krr/chitchat/tree/main/backend](https://github.com/raj-krr/chitchat/tree/main/backend)
> - 🎨 **Frontend Client**: [https://github.com/raj-krr/chitchat/tree/main/frontend](https://github.com/raj-krr/chitchat/tree/main/frontend)
> - 🌐 **Live Platform**: [https://chitchatt.tech](https://chitchatt.tech)

---

## 🎯 Full-Stack Context & Problem ChitChat Solves

Building a real-time communication platform introduces distinct technical challenges that standard CRUD backends cannot handle:

1. **High-Frequency Messaging & Anti-Spam Bottlenecks**: Relaying instant messages and presence updates across connected users can cause socket flooding. ChitChat Backend solves this via an in-memory **Sliding-Window Anti-Spam Engine** (800ms cooldown, 25 msgs/10s flood cap with 60s temporary mute).
2. **WebRTC Peer Signaling**: Establishing direct WebRTC audio/video streams requires low-latency signaling (`call-user`, `answer-call`, `ice-candidate`, `call-busy`, `call-missed`) to exchange SDP offers/answers and ICE candidates reliably.
3. **Groq AI Integration & Smart Assistance**: Processing conversational context with Groq's `llama-3.3-70b-versatile` LLM engine to deliver smart reply suggestions and automated bot responses with human-like typing delay simulations.
4. **Secure Multi-Tier Authentication**: Enforcing secure cookie-based access & refresh token rotation, Nodemailer OTP email verification for signups and password resets, and Zod input validation schemas.

---

## 🚀 Key Backend Capabilities

### 1. 💬 Real-Time Socket.io & Anti-Spam Engine
- **Authenticated Handshakes**: Validates JWT access tokens passed via HttpOnly cookies or socket handshake auth payloads.
- **Presence & Room Management**: Dedicated socket rooms per user (`socket.join(userId)`) and group chats (`group:${groupId}`).
- **Sliding-Window Anti-Spam**: In-memory rate limiting and automated mute timers preventing socket flooding.
- **Typing Indicators & Receipts**: Broadcasts `typing`, `stop-typing`, `user-online`, `user-offline`, and message status receipts (`sent`, `delivered`, `read`).

### 2. 📹 WebRTC Audio & Video Signaling Subsystem
- **Full Call Lifecycle**: Manages socket events for initiating calls, answering, rejecting, terminating, and relaying candidate updates.
- **Busy & Missed Call Handling**: Tracks active calls (`ongoingCalls` Map) to automatically return `call-busy` or trigger 30s call timeouts.

### 3. 🤖 Groq AI Assistant & Smart Reply Generator
- **First-Class AI User**: Special `isBot: true` system user handling AI interactions.
- **Context-Aware Inference**: Leverages Groq API (`llama-3.3-70b-versatile`) with rolling message context (last 6 messages).
- **Smart Reply Chips**: Exposes `/api/ai/smart-replies` endpoint generating 3 quick context-aware reply options.

### 4. 📁 Cloud Media Upload Pipeline
- **Cloudinary Integration**: Direct file uploader handling images, audio voice notes, videos, and document attachments with metadata extraction.

### 5. 🔐 Security, Middleware & Data Integrity
- **Dual JWT Token Security**: Access tokens paired with refresh token rotation stored in HttpOnly cookies.
- **Zod Input Validation**: Strict validation middleware enforcing schemas on auth, profile, group, and message endpoints.
- **Global Error Handling**: Centralized error middleware catching Mongoose validation errors, JWT exceptions, and 500 runtime errors.
- **Security Headers & CORS**: Helmet HTTP security headers and CORS origin whitelist (`chitchatt.tech`).

---

## 🏗️ Backend Architecture

```
                               ┌───────────────────────────────────┐
                               │       Client Requests (REST)      │
                               └─────────────────┬─────────────────┘
                                                 │
                                                 ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          Express 5 Middleware & Routing Layer                          │
│ ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────────────────────┐ │
│ │  authMiddleware.ts   │  │ validate.middleware  │  │   chatPermission.middleware    │ │
│ └──────────┬───────────┘  └──────────┬───────────┘  └───────────────┬────────────────┘ │
└────────────┼─────────────────────────┼──────────────────────────────┼──────────────────┘
             │                         │                              │
             ▼                         ▼                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                             Controllers & Logic Layer                                  │
│ ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────────────────────┐ │
│ │  auth.controllers    │  │   chat.controller    │  │    group / friend controller   │ │
│ └──────────┬───────────┘  └──────────┬───────────┘  └───────────────┬────────────────┘ │
└────────────┼─────────────────────────┼──────────────────────────────┼──────────────────┘
             │                         │                              │
             ▼                         ▼                              ▼
 ┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────────┐
 │ Mongoose Models (DB)  │   │ Cloudinary Media CDN  │   │  Groq Llama 3.3 AI Engine │
 └───────────────────────┘   └───────────────────────┘   └───────────────────────────┘
```

---

## 📊 Database Models (Mongoose Schemas)

| Model | File Location | Description |
| :--- | :--- | :--- |
| **User** | `src/models/user.model.ts` | Credentials, hashed password (bcrypt), OTP verification code, avatar, status, and socket state. |
| **Message** | `src/models/message.model.ts` | Text content, file attachments, reactions, replyTo quotes, delivery receipts (`sent`/`delivered`/`read`), and `deletedFor` list. Compound index on `{ senderId, receiverId, createdAt }`. |
| **Group** | `src/models/group.model.ts` | Multi-user group metadata, group admin reference, member arrays (1-10 members limit), and unique invite codes. |
| **FriendRequest** | `src/models/friendRequest.model.ts` | Friend request relationships between sender and receiver with status states (`pending`, `accepted`, `rejected`). |
| **Notification** | `src/models/notification.model.ts` | Real-time user notifications for friend requests, missed calls, and system alerts. |

---

## 🔌 API & Socket Event Reference

### REST API Endpoints

#### 🔑 Authentication (`/api/auth`)
- **`POST /register`**: Register new user account & send OTP verification email.
- **`POST /verifyEmail`**: Verify email address using 6-digit OTP code.
- **`POST /login`**: Authenticate credentials & issue JWT tokens in cookies.
- **`POST /resendverificationcode`**: Resend OTP email code.
- **`POST /forgotPassword`**: Initiate password reset with OTP email.
- **`POST /updatepassword`**: Reset password using valid OTP code.
- **`POST /logout`**: Clear authentication cookies.
- **`GET /check`**: Check current authenticated user session.
- **`POST /refresh`**: Refresh access token using valid refresh token.

#### 👤 Profile & User (`/api/me`)
- **`GET /getuser`**: Retrieve authenticated user profile details.
- **`POST /updateprofile`**: Update username, bio, and status details.
- **`POST /uploadprofilephoto`**: Upload and update profile avatar via Cloudinary.
- **`POST /removeprofilephoto`**: Remove custom profile photo.

#### 💬 Messaging (`/api/message`)
- **`GET /chats`**: Fetch recent chat conversation list with unread counts.
- **`GET /chat/:id`**: Fetch message history between users with pagination.
- **`POST /send/:id`**: Send message or attachment to user/AI bot.
- **`POST /chat/read/:id`**: Mark conversation messages as read.
- **`DELETE /chat/:messageId`**: Delete message for everyone.
- **`DELETE /me/:messageId`**: Delete message for current user.
- **`POST /:messageId/react`**: Add emoji reaction to message.

#### 👥 Friends & Social (`/api/friends`)
- **`GET /allusers`**: Fetch all system users for search and exploration.
- **`GET /`**: Fetch user's current friends list.
- **`POST /request`**: Send friend request.
- **`POST /accept/:requestId`**: Accept pending friend request.
- **`POST /reject/:requestId`**: Reject pending friend request.
- **`GET /requests`**: Fetch incoming/outgoing friend requests.
- **`POST /block/:id`**: Block specific user.
- **`POST /unfriend/:id`**: Unfriend user.

#### 👨‍👩‍👧‍👦 Group Chats (`/api/groups`)
- **`POST /create`**: Create new group chat.
- **`GET /my-groups`**: Fetch groups current user belongs to.
- **`GET /:groupId`**: Fetch group details and member list.
- **`POST /join/:inviteCode`**: Join group via unique invite code.
- **`POST /:groupId/add-member`**: Add member to group (Admin only).
- **`POST /:groupId/leave`**: Leave group chat.

#### 🤖 AI Assistance (`/api/ai`)
- **`POST /smart-replies`**: Generate 3 context-aware reply chips using Groq AI.

#### 🩺 System Health (`/api/health`)
- **`GET /`**: System uptime, process memory metrics, and MongoDB connection state.

---

### Socket.io Event Matrix

| Event Name | Direction | Payload Description |
| :--- | :--- | :--- |
| **`connection`** | Client ➔ Server | Establishes authenticated WebSocket connection. |
| **`user-online`** | Server ➔ Client | Broadcasts user online status to all connected clients. |
| **`user-offline`** | Server ➔ Client | Broadcasts user offline status with last seen timestamp. |
| **`typing`** | Client ⇄ Server | Emits typing indicator to recipient user ID. |
| **`stop-typing`** | Client ⇄ Server | Emits stop-typing event to recipient user ID. |
| **`send_message`** | Client ➔ Server | Transmits real-time message payload with anti-spam check. |
| **`receive_message`** | Server ➔ Client | Delivers instant message payload to recipient socket room. |
| **`call-user`** | Client ➔ Server | Initiates WebRTC call offer (`to`, `offer`, `type`). |
| **`incoming-call`** | Server ➔ Client | Relays call offer to target user socket. |
| **`answer-call`** | Client ⇄ Server | Relays WebRTC SDP answer back to caller. |
| **`reject-call`** | Client ⇄ Server | Notifies caller that call was rejected. |
| **`end-call`** | Client ⇄ Server | Terminates active call session for both participants. |
| **`ice-candidate`** | Client ⇄ Server | Relays ICE candidates between WebRTC peers. |
| **`join-group-room`** | Client ➔ Server | Joins socket client to specific group room (`group:${groupId}`). |

---

## 📁 Directory Layout

```
backend/
├── dist/                      # Compiled JavaScript build output
├── uploads/                   # Temporary file upload staging
├── src/
│   ├── __tests__/             # Automated Jest integration tests
│   │   ├── auth.test.ts       # Auth API tests
│   │   └── message.test.ts    # Message API tests
│   ├── controllers/           # Controller Layer
│   │   ├── messages/          # Chat, friend, notification controllers
│   │   ├── user/              # Auth & profile controllers
│   │   ├── ai.controller.ts   # Groq AI smart reply controller
│   │   ├── group.controller.ts# Group chat controller
│   │   └── health.controller.ts# Health check controller
│   ├── libs/                  # Third-party integrations
│   │   ├── db.ts              # MongoDB connection client
│   │   ├── emailConfig.ts     # Nodemailer transport setup
│   │   ├── groq.ts            # Groq Llama 3.3 REST SDK client
│   │   └── uploadHelper.ts    # Cloudinary media uploader
│   ├── middlewares/           # Express Middlewares
│   │   ├── auth.middleware.ts # JWT authentication guard
│   │   ├── chatPermission.middleware.ts # Chat permission & block check
│   │   ├── errorHandler.middleware.ts # Centralized error handler
│   │   └── validate.middleware.ts     # Zod input validation guard
│   ├── models/                # Mongoose Models (5 Schemas)
│   ├── routes/                # Express Routers
│   ├── schemas/               # Zod validation schemas
│   ├── socket.ts              # Socket.io server & anti-spam engine
│   ├── socketEmitter.ts      # Global socket emission helper
│   ├── app.ts                 # Express application configuration
│   └── index.ts               # Entrypoint: DB connect, server start
├── Dockerfile                 # Production Docker configuration
├── jest.config.js             # Jest testing configuration
├── package.json               # Node.js dependencies & scripts
├── tsconfig.json              # TypeScript configuration
└── README.md                  # Backend Documentation
```

---

## 🚀 Local Setup & Installation

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **MongoDB**: Local instance or MongoDB Atlas Connection String
- **Cloudinary Account**: Cloud Name, API Key, API Secret
- **Groq API Key**: For AI bot & smart replies
- **SMTP Credentials**: Gmail/SendGrid for OTP verification emails

### 2. Environment Configuration
Create a `.env` file in the `backend/` directory:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/chitchat

# JWT Token Secrets
ACCESS_TOKEN_SECRET=your_jwt_access_secret_key
REFRESH_TOKEN_SECRET=your_jwt_refresh_secret_key

# Frontend Client URL
FRONTEND_URL=http://localhost:5173

# Cloudinary Setup
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Groq AI Service
GROQ_API_KEY=gsk_your_groq_api_key

# SMTP Email Setup
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_smtp_app_password
```

### 3. Installation & Server Launch

```bash
cd backend

# Install dependencies
npm install

# Run TypeScript development server
npm run dev

# Run automated Jest test suite
npm test
```

The backend server will start at `http://localhost:5000`. Health status can be checked at `http://localhost:5000/api/health`.

---

## 🐳 Docker Deployment

To build and run the backend container using Docker:

```bash
# Build Docker image
docker build -t chitchat-backend .

# Run Docker container
docker run -d -p 5000:5000 --env-file .env chitchat-backend
```

---

## 📄 License
Licensed under the [ISC License](LICENSE).
