
# AI-Powered Slack Bot

A platform that integrates AI-powered Slack bot functionalities and document management, leveraging **MongoDB** for storage and **Ollama** for AI-generated responses.  

---

## Features  

- **Slack Bot Integration**: AI-powered chatbot integrated with Slack channels to answer queries.  
- **Document Management**: Upload and query documents (PDFs) for AI-generated responses.  
- **Real-Time Chat**: Query documents and retrieve insights instantly.  
- **File Uploads**: Enhance bot knowledge with document uploads.  

---

## System Requirements  

- **Ollama** (installed locally on Windows or Mac)  
- **MongoDB** (local or MongoDB Atlas)  
- **Slack Workspace**  

---

## Setup Instructions  

### 1. Clone the Repository  

```bash  
git clone https://github.com/omkarkhoche3448/Agent.git  
```  

### 2. Frontend Setup  

1. Navigate to the `frontend` directory:  
   ```bash  
   cd frontend  
   ```  
2. Install dependencies:  
   ```bash  
   npm install  
   ```  
3. Start the frontend:  
   ```bash  
   npm run dev  
   ```  

### 3. Server Setup  

1. Navigate to the `server` directory:  
   ```bash  
   cd server  
   ```  
2. Install dependencies:  
   ```bash  
   npm install  
   ```  
3. Start the server:  
   ```bash  
   npm run dev  
   ```  

### 4. Configure and Start Ollama  

- Install and run **Ollama** locally (Windows or Mac).  

---

## Slack Bot Configuration  

1. **Create a Slack Workspace**:  
   - Sign up or log in to Slack at [Slack](https://slack.com).  

2. **Create a Slack App**:  
   - Go to [Slack API](https://api.slack.com/apps) and create a new app.  
   - Set the app type to "bot" and configure the scopes needed (e.g., `chat:write`, `channels:read`, etc.).  

3. **Add the App to a Channel**:  
   - Install the app in your workspace and add it to a Slack channel.  

4. **Configure Environment Variables**:  
   - Copy the bot tokens (`SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_APP_TOKEN`) into your `.env` file.  

---

## Environment Variables  

Create a `.env` file in the `server` directory with the following:  

```  
MONGODB_URI='mongodb+srv://your-mongodb-connection'  
SLACK_BOT_TOKEN='xoxb-your-slack-bot-token'  
SLACK_SIGNING_SECRET='your-slack-signing-secret'  
SLACK_APP_TOKEN='xapp-your-slack-app-token'  
PORT=3000  
```  

---

## API Routes  

### Backend  

1. **`/api/documents`**:  
   - **GET**: Retrieve all documents.  
   - **POST**: Upload a document.  

2. **`/api/upload`**:  
   - **POST**: Upload PDF documents.  

3. **`/api/chat`**:  
   - **POST**: Query and retrieve AI-generated responses from documents.  

---

## Notes  

- Ensure **Ollama** is running locally before querying.  
- Add the Slack bot to the desired channel after setup.  
- The Slack bot initializes only if the `SLACK_BOT_TOKEN` is configured.  

---

