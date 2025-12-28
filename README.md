# EAMCET AI Learning Platform

## 🚀 How to Run the Project

This project consists of two parts: the **Node.js Backend** and the **React Frontend**. You need to run both for the application to work.

### Prerequisites
- Node.js installed.
- API Keys set up in `.env` files (Supabase & Groq).

### Step 1: Start the Backend Server
This handles the AI logic (Groq) and Database (Supabase).

1. Open a terminal.
2. Navigate to the server directory:
   ```bash
   cd server
   ```
3. Install dependencies (if first time):
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
   *You should see: `Server running on port 5001`*

### Step 2: Start the Frontend Client
This runs the User Interface (React + Vite).

1. Open a **new** terminal (keep the server running).
2. Navigate to the client directory:
   ```bash
   cd client
   ```
3. Install dependencies (if first time):
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   *You should see: `Local: http://localhost:5173/`*

### Step 3: Access the App
Open your browser and go to: **[http://localhost:5173](http://localhost:5173)**

---

## Troubleshooting
- **Port 5001/5173 already in use?** Stop other running node processes or restart your PC.
- **AI not responding?** Check if the Backend terminal shows any errors. Ensure your `GROQ_API_KEY` in `server/.env` is correct.
