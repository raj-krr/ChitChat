# ChitChat 💬

ChitChat is a real-time chat application built with a modern full-stack architecture,
focused on performance, scalability, and clean separation of concerns.

The project is designed to simulate a production-grade messaging platform,
including authentication, real-time communication, and structured frontend/backend workflows.

---

## ✨ Why ChitChat?

Most chat applications hide complexity behind simple UI.
ChitChat is built to **embrace that complexity**—handling real-time messaging,
state synchronization, pagination, and socket-driven updates in a clean and maintainable way.

This project prioritizes:
- Real-world architecture
- Clean code separation
- Scalable real-time communication
- Industry-aligned development practices

---

## 🚀 Core Capabilities

- Secure user authentication
- One-to-one real-time messaging
- Socket-based message delivery
- Optimistic UI updates
- Message pagination & scroll preservation
- Reply-to message support
- Modular frontend and backend separation
- Extensible architecture for future AI integration

---

## 🏗️ Architecture Overview

ChitChat follows a client-server architecture with a dedicated real-time layer:

- **Frontend**: Manages UI, state, socket listeners, and user interactions
- **Backend**: Handles authentication, APIs, message persistence, and socket events
- **Realtime Layer**: Socket.io enables instant bi-directional communication
- **Database**: MongoDB stores users, chats, and messages

---

## 📁 Project Structure

```txt
chitchat/
├── frontend/     # Client-side application (React + Vite)
├── backend/      # Server-side APIs & socket server
└── README.md     # Project overview
```
## 🛠️ Technology Stack

### Frontend
- React (Vite)
- Context API
- Custom Hooks
- Socket.io Client

### Backend
- Node.js
- Express
- MongoDB
- JWT Authentication
- Socket.io

---

## ⚙️ Getting Started

```bash
# Clone the repository
git clone https://github.com/raj-krr/chitchat.git

# Start backend
cd backend
npm install
npm run dev

# Start frontend
cd frontend
npm install
npm run dev
```
## 🔒 Authentication Flow (High Level)

1. User registers or logs in  
2. Backend issues a JWT  
3. Token is stored on the client  
4. Authenticated API requests and socket connections use the token  

---

## 🌐 Realtime Messaging Flow

1. User sends a message  
2. Frontend updates the UI optimistically  
3. Message is emitted through a socket event  
4. Backend validates and persists the message  
5. Receiver is notified instantly via socket  

---

## 🧪 Project Status

- ✅ Authentication system implemented  
- ✅ Core real-time messaging  
- ✅ Message pagination & UI optimization  
- ✅Delivery/read receipts 
- ✅Media handling improvements 
- ✅AI-assistence
- 🚧Audio and video chat  

---

## 🤝 Contributing

Contributions are welcome.  
Please follow the existing project structure and coding conventions.  
Refer to the frontend and backend READMEs for implementation details.

---

## 📄 License

MIT License

