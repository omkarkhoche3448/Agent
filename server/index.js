import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';
import { connectDB } from './config/database.js';
import documentRoutes from './routes/documentRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import { SlackService } from './services/slackService.js';
import { createUploadsDirectory } from './middleware/upload.js';
import Document from "./models/Document.js";
import ollama from 'ollama';
import dns from 'dns';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Create uploads directory
createUploadsDirectory();

// Routes
app.use('/api/documents', documentRoutes);
app.use('/api/upload', uploadRoutes);

// Ollama query helper function
async function queryOllama(question, context) {
  try {
    const response = await ollama.chat({
      model: 'llama2',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that answers questions based on the provided context. Only answer using information from the context provided. If the information is not in the context, say "I cannot answer this question based on the available information."`
        },
        {
          role: 'user',
          content: `Context: ${context}\n\nQuestion: ${question}`
        }
      ],
      stream: false
    });

    return response.message.content;
  } catch (error) {
    console.error('Error querying Ollama:', error);
    throw error;
  }
}

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const documents = await Document.find({});
    const context = documents.map(doc => doc.content).join('\n\n');
    
    if (!context) {
      return res.json({ response: "No documents found in knowledge base." });
    }

    const response = await queryOllama(message, context);
    res.json({ response });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ 
      error: 'Error processing chat request',
      message: error.message 
    });
  }
});

// Test Ollama endpoint
app.get('/api/test-ollama', async (req, res) => {
  try {
    const response = await queryOllama("Test connection", "");
    res.json({ 
      status: 'success', 
      message: 'Ollama is working correctly',
      response: response 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Error testing Ollama',
      error: error.message 
    });
  }
});

// Error handling
app.use(errorHandler);

// Initialize and start Slack service
let slackService;
if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_SIGNING_SECRET && process.env.SLACK_APP_TOKEN) {
  try {
    console.log('Initializing Slack service...');
    slackService = new SlackService(process.env.SLACK_BOT_TOKEN);
    await slackService.start();
    console.log('Slack service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Slack service:', error);
  }
} else {
  console.log('Missing Slack environment variables:');
  console.log('SLACK_BOT_TOKEN:', !!process.env.SLACK_BOT_TOKEN);
  console.log('SLACK_SIGNING_SECRET:', !!process.env.SLACK_SIGNING_SECRET);
  console.log('SLACK_APP_TOKEN:', !!process.env.SLACK_APP_TOKEN);
}

// Start server
app.listen(PORT, async () => {
  try {
    await connectDB();
    console.log(`Server running on port ${PORT}`);
    
    console.log("Testing Ollama connection...");
    try {
      await queryOllama("Test connection", "");
      console.log("🤖 Ollama is ready to use");
    } catch (error) {
      console.log("⚠️ Warning: Ollama connection failed");
      console.error("Make sure Ollama is installed and running locally");
    }
  } catch (error) {
    console.error("Server startup error:", error);
  }
});