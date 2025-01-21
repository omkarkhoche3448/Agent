import pkg from "@slack/bolt";
const { App } = pkg;
import Document from "../models/Document.js";
import ollama from "ollama";

export class SlackService {
  constructor(token) {
    if (
      !process.env.SLACK_APP_TOKEN ||
      !process.env.SLACK_BOT_TOKEN ||
      !process.env.SLACK_SIGNING_SECRET
    ) {
      throw new Error("Missing required Slack credentials");
    }

    this.app = new App({
      token: token,
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      socketMode: true,
      appToken: process.env.SLACK_APP_TOKEN,
      customClientOptions: {
        timeout: 30000,
        reconnect: true,
        retryConfig: {
          minTimeout: 1000,
          maxTimeout: 30000,
          maxRetries: 10,
        },
      },
    });

    this.initializeHandlers();
  }

  async start() {
    try {
      await this.app.start();
      console.log("⚡️ Slack Bolt app is running!");

      const authTest = await this.app.client.auth.test();
      console.log("Bot connected as:", authTest.bot_id);
    } catch (error) {
      console.error("Error starting Slack app:", error);
      throw error;
    }
  }

  initializeHandlers() {

    this.app.message(/hello|hi|hey|hallow/i, async ({ message, say }) => {
      try {
        console.log("Received greeting message:", message);
        await say({
          text: "Hello there! 👋",
          thread_ts: message.thread_ts || message.ts,
        });
      } catch (error) {
        console.error("Error sending greeting response:", error);
      }
    });

    // Handle all other messages
    this.app.message(async ({ message, say }) => {
      try {
        // console.log("Received message:", message);
        if (
          message.text &&
          !message.text.toLowerCase().match(/hello|hi|hey|hallow/i) &&
          !message.bot_id
        ) {
          await this.handleMessage(message, say);
        }
      } catch (error) {
        console.error("Error handling message:", error);
      }
    });

    this.app.error(async (error) => {
      console.error("An error occurred in the Slack app:", error);
    });
  }

  async queryOllama(question, context) {
    try {
      const response = await ollama.chat({
        model: "llama2",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that answers questions based on the provided context.
             Only answer using information from the context provided.`,
          },
          {
            role: "user",
            content: `Context: ${context}\n\nQuestion: ${question}`,
          },
        ],
        stream: false,
      });

      return response.message.content;
    } catch (error) {
      console.error("Error querying Ollama:", error);
      throw error;
    }
  }

  async handleMessage(message, say) {
    try {
      const thinkingMessage = await say({
        text: "Thinking...",
        thread_ts: message.thread_ts || message.ts,
      });

      const documents = await Document.find({});
      const context = documents.map((doc) => doc.content).join("\n\n");

      if (!context) {
        await say({
          text: "I don't have any documents in my knowledge base yet. Please upload some PDF documents first.",
          thread_ts: message.thread_ts || message.ts,
        });
        return;
      }

      const response = await this.queryOllama(message.text, context);

      await say({
        text: response,
        thread_ts: message.thread_ts || message.ts,
      });
    } catch (error) {
      console.error("Error handling message:", error);
      await say({
        text: "Sorry, I encountered an error processing your request.",
        thread_ts: message.thread_ts || message.ts,
      });
    }
  }
}
