# ChitChat - Frontend Client Platform

[![React](https://img.shields.io/badge/React-v19.2.0-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-v7.2.4-purple.svg)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3.4.18-06B6D4.svg)](https://tailwindcss.com/)
[![DaisyUI](https://img.shields.io/badge/DaisyUI-v5.5.8-5A0E2D.svg)](https://daisyui.com/)
[![Mantine UI](https://img.shields.io/badge/Mantine-v8.3.10-339AF0.svg)](https://mantine.dev/)
[![Socket.io Client](https://img.shields.io/badge/Socket.io%20Client-v4.8.1-black.svg)](https://socket.io/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

**ChitChat Frontend** is a modern real-time communication web interface built with React 19, Vite 7, TypeScript 5.9, and Tailwind CSS. It delivers an intuitive messaging environment featuring optimistic UI updates, multi-participant video/audio calls (WebRTC), Groq AI smart reply chips, dynamic multi-theme engine, and glassmorphic UI components.

> 🔗 **Repositories Ecosystem**:
> - ⚙️ **Backend Service**: [https://github.com/raj-krr/chitchat/tree/main/backend](https://github.com/raj-krr/chitchat/tree/main/backend)
> - 🎨 **Frontend Client (This Directory)**: [https://github.com/raj-krr/chitchat/tree/main/frontend](https://github.com/raj-krr/chitchat/tree/main/frontend)
> - 🌐 **Live Platform**: [https://chitchatt.tech](https://chitchatt.tech)

---

## 🎯 Full-Stack Context & Problem ChitChat Solves

Building a responsive real-time client UI requires addressing critical user experience and architecture challenges:

1. **Optimistic UI Synchronization**: Waiting for backend HTTP or database persistence creates noticeable UI lag. ChitChat Frontend implements **Optimistic UI Updates with Rollback**, showing message delivery states (`sending` ⏳ ➔ `sent` ✓ ➔ `delivered` ✓✓ ➔ `read` 🔵) instantly.
2. **WebRTC Media Stream & Audio Synthesizer**: Establishing peer video/audio connections across mobile and desktop browsers while handling ringtone synthesis using the Web Audio API without requiring external MP3 network calls.
3. **Multi-Theme System Cohesion**: Synchronizing theme changes across Tailwind CSS (`.dark`), Mantine UI (`forceColorScheme`), and DaisyUI (`data-theme`), persisting preferences seamlessly in `localStorage`.
4. **Context & Modular Custom Hooks Separation**: Keeping component trees clean by encapsulating business logic inside feature hooks (`useCall`, `useNotifications`, `useSidebar`) and React Context providers (`AuthContext`, `CallContext`, `NotificationContext`, `PresenceContext`, `ThemeContext`).

---

## 🚀 Key Frontend Capabilities

### 1. 💬 Interactive Chat Canvas & Optimistic Messaging
- **Instant Message Delivery**: Real-time Socket.io message transmission with optimistic local state updates.
- **Rich Media & Attachments**: File upload previews, image carousels, video player integration, and inline voice message player.
- **Message Interactions**: Reply quote support, emoji reaction picker, delete message for me/everyone, and scroll position preservation.
- **Status & Receipts**: Live online status badges, last seen timestamps, and typing indicators (`X is typing...`).

### 2. 📹 WebRTC Video & Audio Huddle Overlay
- **P2P Audio/Video Calling**: Native WebRTC implementation with STUN/TURN ICE server configuration (`CallContext.tsx`).
- **Call Controls**: Mute/unmute microphone, toggle camera video feed, switch camera source, toggle speaker audio.
- **Ringtone Audio Synthesizer**: Pure Web Audio API synthesizer (`audioSynth.ts`) rendering incoming call ringtones and outgoing dial tones with 0ms network latency.

### 3. 🤖 Groq AI Smart Assistance & Reply Chips
- **AI Conversation Context**: Dedicated AI bot chat interface powered by Groq Llama 3.3.
- **Smart Reply Chips**: Interactive suggestion chips rendered above the chat input box for instant response generation.

### 4. 🎨 Multi-Theme Engine & Glassmorphism UI
- **4 Custom Themes**: `light`, `dark`, `cyberpunk`, and `system` themes synced across Tailwind, Mantine, and DaisyUI.
- **Glassmorphic Aesthetics**: Modern floating glass navigation bar, polished action tooltips, and responsive layout adapter for desktop and mobile viewports.

---

## 🏗️ Frontend Client Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              React 19 Core Application                                │
│ ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────────────────────┐ │
│ │   React Router v7    │  │    Theme Context     │  │       Auth & Guard Layer       │ │
│ │(Protected/Public)    │  │  (Tailwind + Mantine)│  │ (ProtectedRoute / PublicRoute) │ │
│ └──────────┬───────────┘  └──────────┬───────────┘  └───────────────┬────────────────┘ │
└────────────┼─────────────────────────┼──────────────────────────────┼──────────────────┘
             │                         │                              │
             ▼                         ▼                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               Global Context & Hook Layer                              │
│ ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────────────────────┐ │
│ │  Auth / Call Context │  │  Presence / Notif    │  │ Custom Hooks (useCall,         │ │
│ │ (WebRTC & Socket state)│ │ (Online users, alerts)│  │  useNotifications, useSidebar) │ │
│ └──────────┬───────────┘  └──────────┬───────────┘  └───────────────┬────────────────┘ │
└────────────┼─────────────────────────┼──────────────────────────────┼──────────────────┘
             │                         │                              │
             ▼                         ▼                              ▼
 ┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────────┐
 │   Chat Window & UI    │   │  Call Window Overlay  │   │  Settings & Profile Pages │
 └───────────────────────┘   └───────────────────────┘   └───────────────────────────┘
```

---

## 📊 Application Pages & Views

| Page Component | Route Path | Description |
| :--- | :--- | :--- |
| **HomePage** | `/` | Core chat view featuring recent sidebar, message thread canvas, voice message recorder, and Groq AI smart reply chips. |
| **DashboardPage** | `/dashboard` | Workspace overview card layout with quick statistics and recent contacts. |
| **NotificationsPage**| `/notifications`| Real-time notification center listing friend requests, call alerts, and system notifications. |
| **SettingsPage** | `/settings` | Theme switcher card grid, profile customizer, security settings, and app preferences. |
| **LoginPage** | `/login` | User authentication form with password visibility toggle. |
| **RegisterPage** | `/register` | Sign-up registration form with email validation. |
| **VerifyEmailPage** | `/verify-email` | 6-digit OTP code verification input interface. |

---

## 🔌 API & Socket Client Layer

### Custom Contexts & Hooks

| Context / Hook | Location | Primary Function |
| :--- | :--- | :--- |
| **`AuthContext`** | `src/context/AuthContext.tsx` | Manages authenticated user state, login/logout actions, and session validation. |
| **`CallContext`** | `src/context/CallContext.tsx` | Orchestrates WebRTC peer connection, signaling listeners, incoming/outgoing call states, and audio tracks. |
| **`PresenceContext`**| `src/context/PresenceContext.tsx` | Tracks online user IDs via socket broadcasts (`online-users`, `user-online`, `user-offline`). |
| **`NotificationContext`**|`src/context/NotificationContext.tsx`| Fetches and synchronizes live user notifications and unread badge counters. |
| **`ThemeContext`** | `src/context/ThemeContext.tsx` | Manages application-wide theme states (`light`, `dark`, `cyberpunk`, `system`). |
| **`useCall`** | `src/components/call/hooks/useCall.ts` | Accesses active call state, peer streams, mute toggles, and screen options. |
| **`useNotifications`**|`src/hooks/useNotifications.ts` | Triggers native desktop browser push notifications for incoming calls and chat messages. |

---

## 📁 Directory Layout

```
frontend/
├── public/                    # Static assets, icons, and audio assets
├── src/
│   ├── apis/                  # Axios REST API Clients
│   │   ├── auth.api.ts        # Auth API endpoints
│   │   ├── axios.ts           # Axios instance with credentials
│   │   ├── chat.api.ts        # Chat & message API endpoints
│   │   ├── friend.api.ts      # Friend system API endpoints
│   │   ├── notification.api.ts# Notification API endpoints
│   │   ├── profile.api.ts     # User profile API endpoints
│   │   └── socket.ts          # Socket.io client initialization
│   ├── components/            # UI Components
│   │   ├── call/              # WebRTC call window & media overlay
│   │   │   ├── hooks/         # Call state hooks
│   │   │   └── CallWindow.tsx # Interactive call overlay UI
│   │   ├── chat/              # Chat UI sub-system
│   │   │   ├── hooks/         # Chat scroll & state hooks
│   │   │   ├── ChatHeader.tsx # Chat header with user status & call triggers
│   │   │   ├── ChatWindow.tsx # Message thread stream & scroll container
│   │   │   ├── CreateGroupModal.tsx # Group creation dialog
│   │   │   ├── FilePreview.tsx# Media upload modal preview
│   │   │   ├── GroupDetailsModal.tsx # Group members & invite dialog
│   │   │   ├── MessageBubble.tsx# Individual message bubble component
│   │   │   ├── MessageInput.tsx # Message composer & voice recorder
│   │   │   └── SmartReplyChips.tsx # Groq AI suggestion chips
│   │   ├── dashboard/         # Dashboard analytics components
│   │   ├── layout/            # AppNavbar, Sidebar, and AppLayout
│   │   ├── notifications/     # Notification items & lists
│   │   ├── profile/           # Profile card & avatar manager
│   │   └── TopLoader.tsx      # Top progress loader component
│   ├── context/               # Global React Context Providers
│   ├── hooks/                 # Custom React Hooks
│   ├── pages/                 # Page Route Components
│   ├── routes/                # Protected & Public route guards
│   ├── utils/                 # Utility helpers & Web Audio synthesizer (`audioSynth.ts`)
│   ├── App.css                # Global CSS overrides
│   ├── App.tsx                # Main App component with providers & router
│   ├── index.css              # Tailwind & DaisyUI CSS rules
│   └── main.tsx               # Entrypoint bootstrap
├── Dockerfile                 # Production Docker build configuration
├── nginx.conf                 # Nginx web server configuration
├── postcss.config.js          # PostCSS configuration
├── tailwind.config.js         # Tailwind CSS design system config
├── tsconfig.json              # TypeScript root configuration
├── vite.config.ts             # Vite bundler configuration
└── README.md                  # Frontend Documentation
```

---

## 🚀 Local Setup & Installation

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **Backend Service**: Running instance of [ChitChat Backend](https://github.com/raj-krr/chitchat/tree/main/backend) at `http://localhost:5000`

### 2. Environment Configuration
Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Installation & Local Development

```bash
cd frontend

# Install dependencies
npm install

# Launch Vite development server
npm run dev
```

The application will start at `http://localhost:5173`.

---

## 🐳 Docker & Nginx Deployment

To build and serve the production static files using Docker and Nginx:

```bash
# Build Docker image
docker build -t chitchat-frontend .

# Run Docker container with port mapping
docker run -d -p 5173:80 chitchat-frontend
```

---

## 📄 License
Licensed under the [ISC License](LICENSE).
