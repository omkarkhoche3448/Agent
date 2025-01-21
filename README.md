Here's a concise and complete README for your project:

---

A platform for interacting with documents and a Slack bot powered by AI, using **MongoDB** for document storage and **Ollama** for generating responses.

---

## Features

- **Slack Bot Integration**: Listens for user queries and responds with AI-generated answers based on documents.
- **Document Management**: Upload, store, and query documents (PDFs).
- **Real-Time Chat**: Users can query documents through the bot for quick responses.
- **File Uploads**: Upload documents to enrich the bot’s knowledge base.

---

## System Requirements

- **Ollama** (installed locally)
- **MongoDB** (or MongoDB Atlas)

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/omkarkhoche3448/Agent.git
```

### 2. Frontend Setup

1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the frontend:
   ```bash
   npm run dev
   ```

### 3. Server Setup

1. Navigate to the `server` folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the server:
   ```bash
   npm run dev
   ```

### 4. Start Ollama

- Ensure **Ollama** is installed and running locally on your machine (either Windows or Mac).

---

## Environment Variables

Create a `.env` file in the root of both `frontend` and `server` directories and include the following:

```
MONGODB_URI='mongodb://localhost:27017/your-database-name'
SLACK_BOT_TOKEN='xoxb-your-slack-bot-token'
SLACK_SIGNING_SECRET='your-slack-signing-secret'
SLACK_APP_TOKEN='xapp-your-slack-app-token'
PORT=3000

```

---

## Routes and Functionalities

### Backend Routes

1. **`/api/documents`**:
   - **GET**: Retrieves all documents.
   - **POST**: Upload a new document.

2. **`/api/upload`**:
   - **POST**: Upload PDF documents.

3. **`/api/chat`**:
   - **POST**: Query chat message and retrieve AI-generated response based on documents.

### Slack Bot Features

- **Real-Time Messaging**: Responds to user queries with AI-driven content from uploaded documents.
- **Bot Initialization**: Initialized with the Slack OAuth token.

---

## Notes

- Ensure **Ollama** is running locally before using the chat features.
- The Slack bot is initialized only if the **SLACK_OAUTH_TOKEN** is available in the environment.

---

## License

This project is licensed under the MIT License.

--- 

This concise README covers project setup, functionality, and usage in a streamlined format. Let me know if you'd like any more changes!
