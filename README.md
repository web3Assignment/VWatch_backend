# YouTube Watch Party - System Design & Documentation

Welcome to the comprehensive system design and implementation suite for the **YouTube Watch Party** system. This repository contains the architecture, database schema, frontend/backend integration guides, and scalability blueprints for building a real-time, synchronized YouTube-watching application.

---

## 🚀 System Overview

The system allows users to create or join private rooms, input YouTube video URLs, and watch videos synchronously. Actions such as Play, Pause, and Seek are synchronized in real time using WebSockets. The system enforces Role-Based Access Control (RBAC) to ensure only authorized users (Host and Moderators) can control the playback.

### Core Stack
- **Frontend**: React + JavaScript + Vite, YouTube IFrame API, Socket.io-client, Vanilla CSS / Tailwind.
- **Backend**: Node.js + Express + JavaScript (ES Modules), Socket.io WebSocket server, OOP Room Manager engine.
- **Database**: MySQL (for users, room sessions, audit logs, and persistent chat).
- **Pub/Sub (Scalability)**: Redis Pub/Sub adapter for horizontal scaling.

---

## 📂 Documentation Structure

The design and setup instructions are modularized across the following documents:

1. **[System Architecture & Real-Time Flow](file:///d:/web3Task/docs/architecture.md)**
   - High-level system architecture, client-server layout, and deployment boundaries.
   - Detailed sequence diagrams representing room joining, playback sync events, and role updates.
   - Object-Oriented Programming (OOP) specifications for the WebSocket server classes (`Room`, `Participant`, `RoomManager`).
   - Role-Based Access Control (RBAC) permissions matrix.

2. **[MySQL Database Schema Design](file:///d:/web3Task/docs/database_schema.md)**
   - Entity-Relationship (ER) diagram for MySQL database.
   - DDL (SQL Statements) for initialization of tables (`users`, `rooms`, `participants`, `sessions`, `chat_messages`, `playback_logs`).
   - Indexing and query performance optimizations.
   - Essential queries for authentication validation, session joining, and history retrieval.

3. **[Backend Implementation Guide](file:///d:/web3Task/docs/backend_guide.md)**
   - Project bootstrap, `package.json` with ES Modules configuration.
   - Node.js connection pooling setup with `mysql2`.
   - Complete OOP class code structures for `Room`, `RoomManager`, and `Participant` (in standard JavaScript).
   - Event listening and broadcast handling logic in Socket.io.

4. **[Frontend Implementation Guide](file:///d:/web3Task/docs/frontend_guide.md)**
   - React + JS application bootstrap instructions.
   - Custom Socket.io context provider creation in React.
   - YouTube IFrame API integration with loop-prevention guard logic.
   - Conditional rendering and component lists for role-based access interfaces (Host tools, kick prompts, etc.).

5. **[Deployment & Scalability Blueprint](file:///d:/web3Task/docs/deployment_scalability.md)**
   - Step-by-step production deployment steps (Render/Vercel).
   - Sticky sessions and NGINX reverse-proxy setup.
   - Scaling past 1,000+ concurrent users using Redis Adapter and database read-replicas.
   - Performance tuning (File descriptor limits, Node memory allocations, query caching).

---

## 🛠️ Quick Setup Overview (Local Run)

### Backend Setup
1. Setup a MySQL database instance and execute the schema definitions inside [database_schema.md](file:///d:/web3Task/docs/database_schema.md).
2. Install dependencies:
   ```bash
   cd watch-party-backend
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Create a `.env` file pointing to your backend:
   ```env
   VITE_BACKEND_URL=http://localhost:5000
   ```
2. Install dependencies and start the Vite server:
   ```bash
   cd watch-party-frontend
   npm install
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.
