# 🎨 ChitChat Frontend

ChitChat Frontend is a **modern, production-ready chat application UI** built with **React, TypeScript, Vite, and Tailwind CSS**.  
It provides authentication, real-time messaging, notifications, profile management, and a clean, scalable UI architecture.

---

## 🚀 Features

- Authentication (Login, Register, Email Verification, Password Reset)
- Real-time chat UI (Socket.IO powered)
- Friend system & requests
- Notifications panel
- Profile management
- Dark-themed modern UI
- Responsive design (Desktop & Mobile)
- Protected & public routing
- Scalable, feature-based folder structure

---

## 🛠 Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Axios
- Socket.IO Client
- React Router
- Context API
- Docker & Nginx

---

## 📂 Project Structure

```txt
frontend/
├── public/
├── src/
│ ├── apis/
│ │ ├── auth.api.ts
│ │ ├── axios.ts
│ │ ├── chat.api.ts
│ │ ├── friend.api.ts
│ │ ├── notification.api.ts
│ │ ├── profile.api.ts
│ │ └── socket.ts
│ │
│ ├── components/
│ │ ├── chat/
│ │ │ ├── hooks/
│ │ │ ├── ChatHeader.tsx
│ │ │ ├── ChatWindow.tsx
│ │ │ ├── MessageBubble.tsx
│ │ │ ├── MessageInput.tsx
│ │ │ └── index.ts
│ │ │
│ │ ├── dashboard/
│ │ │ ├── ChatListItem.tsx
│ │ │ ├── EmptyState.tsx
│ │ │ ├── FriendRequests.tsx
│ │ │ ├── FriendsBubble.tsx
│ │ │ ├── FriendsPicker.tsx
│ │ │ ├── FriendsPickerPanel.tsx
│ │ │ ├── FriendsPickerSheet.tsx
│ │ │ ├── SearchResultItem.tsx
│ │ │ ├── SearchResults.tsx
│ │ │ ├── Sidebar.tsx
│ │ │ └── useSidebar.ts
│ │ │
│ │ ├── layout/
│ │ │ ├── AppLayout.tsx
│ │ │ ├── AppNavbar.tsx
│ │ │ └── MobileBottomNav.tsx
│ │ │
│ │ ├── notifications/
│ │ │ ├── NotificationItem.tsx
│ │ │ └── NotificationsPanel.tsx
│ │ │
│ │ ├── profile/
│ │ │ ├── ProfilePeek.tsx
│ │ │ └── useProfilePeek.ts
│ │ │
│ │ └── TopLoader.tsx
│ │
│ ├── context/
│ │ ├── AuthContext.tsx
│ │ ├── NotificationContext.tsx
│ │ └── PresenceContext.tsx
│ │
│ ├── pages/
│ │ ├── auth/
│ │ │ ├── LoginPage.tsx
│ │ │ ├── Register.tsx
│ │ │ ├── ForgotPassword.tsx
│ │ │ ├── ResetPassword.tsx
│ │ │ └── VerifyEmail.tsx
│ │ │
│ │ ├── profile/
│ │ ├── DashboardPage.tsx
│ │ ├── HomePage.tsx
│ │ ├── LogoutLogic.tsx
│ │ ├── NotificationsPage.tsx
│ │ └── SettingsPage.tsx
│ │
│ ├── routes/
│ │ ├── ProtectedRoute.tsx
│ │ └── PublicRoute.tsx
│ │
│ ├── utils/
│ ├── App.tsx
│ ├── main.tsx
│ ├── App.css
│ └── index.css
│
├── .env
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```
## 📥 Installation & Running Locally

```bash
npm install
npm run dev
```
App runs on: `http://localhost:5173`  

---
## 🐳 Docker
Build and run with Docker:  

```bash
docker build -t chitchat-frontend .
docker run -p 5173:80 chitchat-frontend
```
## 🧪 Scripts

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
```

---
## 🔐 Routing Strategy

- **PublicRoute** → Authentication pages
- **ProtectedRoute** → Authenticated application pages
- Context-based authentication guard for route protection

---

## 📡 Real-Time Communication

- Socket.IO client integration
- User presence tracking (online/offline)
- Real-time message updates
- Notification synchronization

---

## 🎯 Design Principles

- Feature-based folder structure
- Clear separation of concerns
- Reusable UI components
- Mobile-first responsive design
- Clean, maintainable codebase

---

## 📄 License

This project is intended for learning, portfolio, and development use.