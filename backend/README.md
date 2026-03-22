# 🚀 ChitChat Backend

ChitChat Backend is a **production-grade real-time communication server** built with
**Node.js, Express, TypeScript, MongoDB, Socket.IO, and WebRTC signaling**.

It powers **authentication, messaging, friendships, notifications, media handling, and real-time audio/video communication**, forming the backbone of the ChitChat platform.

---

## 🌐 Live API

⚡ https://chitchatt.tech/api

> Handles authentication, messaging, real-time events, and WebRTC signaling.

---

## 🧠 Architecture Overview

* REST APIs for authentication, users, chats, friends, and notifications
* Socket.IO for real-time messaging, presence, and signaling
* WebRTC signaling layer for audio/video calling
* JWT-based authentication with access & refresh tokens
* OTP-based email verification and password reset
* Modular, scalable TypeScript architecture

---

## 🚀 Core Capabilities

### 🔐 Authentication & Security

* JWT-based authentication (access + refresh tokens)
* OTP email verification system
* Secure password reset flow
* Protected routes via middleware
* Cookie-based session handling

### 💬 Messaging System

* One-to-one real-time messaging
* Message persistence with MongoDB
* Delivery & read receipts
* Message reactions
* Message deletion (for me / everyone)
* Pagination support

### 📞 Real-Time Communication

* Socket.IO-based event system
* Online/offline presence tracking
* Typing indicators
* Notification events
* 📹 WebRTC signaling for audio/video calls

### 📁 Media Handling

* File uploads via Multer
* AWS S3 integration for storage
* Profile image upload & management

### 🤖 AI Integration

* AI bot support via Gemini integration
* Extensible AI service layer

---

## 🛠 Tech Stack

### Core Backend

* Node.js
* Express
* TypeScript

### Database & ORM

* MongoDB
* Mongoose

### Realtime & Communication

* Socket.IO
* WebRTC (signaling layer)

### Auth & Security

* JWT (Access & Refresh Tokens)
* bcrypt

### File & Media

* Multer
* AWS S3

### Services

* Nodemailer (Email/OTP)
* Gemini API (AI)

### DevOps

* Docker

---

## 📂 Folder Structure

```txt id="bk29xp"
backend/
├── dist/
├── src/
│ ├── controllers/
│ │ ├── user/
│ │ │ ├── auth.controllers.ts
│ │ │ └── profile.controllers.ts
│ │ ├── messages/
│ │ │ ├── chat.controller.ts
│ │ │ ├── friendcontroller.ts
│ │ │ └── notification.controller.ts
│ │ └── health.controller.ts
│ │
│ ├── libs/
│ │ ├── aiBot.ts
│ │ ├── db.ts
│ │ ├── emailConfig.ts
│ │ ├── gemini.ts
│ │ ├── multer.ts
│ │ └── s3.ts
│ │
│ ├── middlewares/
│ │ ├── auth.middleware.ts
│ │ └── chatPermission.middleware.ts
│ │
│ ├── models/
│ ├── routes/
│ │ ├── authRoute.ts
│ │ ├── friendRoute.ts
│ │ ├── meRoutes.ts
│ │ ├── messageRoute.ts
│ │ └── notificationRoute.ts
│ │
│ ├── utils/
│ ├── socket.ts              # Socket.IO server
│ ├── socketEmitter.ts      # Event emitter layer
│ ├── app.ts
│ └── index.ts
│
├── uploads/
├── .env
├── Dockerfile
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🔐 Authentication Flow

1. User registers
2. OTP is sent via email
3. Email verification
4. User logs in
5. JWT access & refresh tokens issued
6. Protected routes accessed with middleware

---

## 🌐 API Routes

### 🔑 Auth (`/api/auth`)

```http id="a1x92s"
POST /register
POST /verifyEmail
POST /login
POST /resendverificationcode
POST /forgotPassword
POST /updatepassword
POST /logout
GET /check
POST /refresh
```

### 👤 Profile (`/api/me`)

```http id="v93k2d"
GET /getuser
POST /updateprofile
POST /uploadprofilephoto
POST /removeprofilephoto
```

### 💬 Chat (`/api/message`)

```http id="p39x8s"
GET /chats
GET /chat/:id
POST /send/:id
POST /chat/read/:id
DELETE /chat/:messageId
DELETE /:messageId
DELETE /me/:messageId
POST /:messageId/react
```

### 👥 Friends (`/api/friends`)

```http id="m20x8z"
GET /allusers
GET /
POST /request
POST /accept/:requestId
POST /reject/:requestId
GET /requests
POST /block/:id
POST /unfriend/:id
DELETE /request/:id
```

### 🔔 Notifications (`/api/notifications`)

```http id="n20zz1"
GET /
POST /read/:id
POST /read-all
```

---

## 🔌 Real-Time & Calling System

### Messaging Events

* Real-time message delivery
* Read & delivery receipts
* Typing indicators
* Presence tracking

### 📞 Calling (WebRTC Signaling)

1. Caller emits `call-user` event
2. Backend forwards signaling data via Socket.IO
3. Offer/Answer exchange handled through socket events
4. ICE candidates relayed between peers
5. Peer-to-peer connection established

> ⚡ Backend acts as signaling server, not media server

---

## ⚙️ Environment Variables

```env id="env992"
PORT=5000
MONGO_URI=mongodb://localhost:27017/chitchat

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

EMAIL_USER=your_email
EMAIL_PASS=your_email_password

FRONTEND_URL=http://localhost:5173

AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_BUCKET_NAME=your_bucket
AWS_REGION=your_region

NODE_ENV=development
```

---

## ▶️ Running Locally

```bash id="run882"
npm install
npm run dev
```

Server runs on: `http://localhost:5000`

---

## 🐳 Docker

```bash id="dock992"
docker build -t chitchat-backend .
docker run -p 5000:5000 chitchat-backend
```

---

## 🧪 Scripts

```bash id="scr882"
npm run dev          # Development (nodemon)
npm run build        # Build TypeScript
npm start            # Production server
```

---

## 🛡 Security

* Password hashing with bcrypt
* JWT-based authentication
* Secure cookie handling
* Input validation & sanitization
* CORS configuration
* Route protection middleware
* Rate limiting 

---

## 🧠 Engineering Highlights

* Scalable modular architecture
* Event-driven socket system
* WebRTC signaling implementation
* Separation of concerns (controllers, services, sockets)
* Cloud storage integration (AWS S3)
* AI-ready backend design

---

## 📄 License

This project is intended for learning, portfolio, and development use.
