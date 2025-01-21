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
      model: "llama2",
      messages: [
        {
          role: "system",
          content: `You are a highly accurate and professional assistant that provides precise answers based strictly on the given context. Follow these guidelines:

          1. Answer Format:
          - Provide clear, concise, and direct answers
          - Use bullet points for multiple points when applicable
          - Include relevant quotes from the context when appropriate

          2. Response Rules:
          - Only use information explicitly stated in the provided context
          - If the question cannot be fully answered with the context, state: "I cannot provide a complete answer based on the available information."
          - Do not make assumptions or infer information beyond the context
          - If asked about specific numbers/dates, only quote those mentioned in the context

          3. Accuracy:
          - If there's any ambiguity in the context, acknowledge it
          - If multiple interpretations are possible, explain the limitation
          - Maintain professional and formal language

          4. Limitations:
          - Do not use external knowledge
          - Do not make predictions unless explicitly supported by the context
          - If unsure, err on the side of caution and state the limitations of the available information`,
        },
        {
          role: "user",
          content: `Context: ${context}\n\nQuestion: ${question}`,
        },
      ],
      stream: false,
    });

    // Validate the response structure
    if (response && response.message && response.message.content) {
      return response.message.content.trim();
    } else {
      throw new Error("Unexpected response format from Ollama API");
    }
  } catch (error) {
    console.error("Error querying Ollama:", error.message || error);
    return "Sorry, I encountered an error while processing your request.";
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