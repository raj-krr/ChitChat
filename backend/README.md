# 🚀 ChitChat Backend

ChitChat Backend is a **production-ready real-time chat server** built with **Node.js, Express, TypeScript, MongoDB, and Socket.IO**.  
It powers authentication, messaging, friendships, notifications, file uploads, and real-time events for the ChitChat application.

---

## 🧠 Architecture Overview

- REST APIs for authentication, users, chats, friends, and notifications
- Socket.IO for real-time messaging and presence
- JWT-based authentication with refresh tokens
- OTP-based email verification and password reset
- Modular, scalable TypeScript architecture

---

## 🛠 Tech Stack

- Node.js
- Express
- TypeScript
- MongoDB + Mongoose
- Socket.IO
- JWT (Access & Refresh Tokens)
- bcrypt
- Multer
- Nodemailer
- AWS S3
- Docker

---

## 📂 Folder Structure

```txt
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
│ ├── socket.ts
│ ├── socketEmitter.ts
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
2. OTP sent to email
3. Email verification
4. Login
5. JWT access & refresh tokens issued
6. Protected routes secured via middleware

---

## 🌐 API Routes

### 🔑 Auth (`/api/auth`)
```http
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
```http
GET /getuser
POST /updateprofile
POST /uploadprofilephoto
POST /removeprofilephoto
```

### 💬 Chat (`/api/message`)
```http
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
```http
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
```http
### 🔔 Notifications (`/api/notifications`)
GET /
POST /read/:id
POST /read-all
```

---

## 🔌 Real-Time (Socket.IO)

- Real-time messaging
- Online/offline presence
- Message delivery & read receipts
- Typing indicators
- Notification events

---

## ⚙️ Environment Variables

Create a `.env` file:

```env
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
## ▶️ Running Locally

```bash
npm install
npm run dev
```
Server runs on: `http://localhost:5000`

---
## 🐳 Docker
Build and run with Docker:

```bash
docker build -t chitchat-backend .
docker run -p 5000:5000 chitchat-backend
```
## 🧪 Scripts
```bash
npm run dev          # Start development server with nodemon
npm run build        # Build for production
npm start            # Start production server
```
## 🛡 Security
- Passwords hashed with bcrypt
- JWT for secure authentication 
- Input validation and sanitization
- Cookie-based token handling
- CORS configuration
- Protected routes via middleware
- Rate limiting (to be implemented)
---

## 📄 License

This project is intended for learning, portfolio, and development use.
