import Document from "../models/Document.js";
import * as pdfjs from 'pdfjs-dist';
import { readFile, unlink } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up the worker
const pdfjsWorkerPath = path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.mjs');
pdfjs.GlobalWorkerOptions.workerSrc = `file://${pdfjsWorkerPath}`;


export async function processPDFInChunks(filePath, documentId) {
  try {
    const doc = await Document.findById(documentId);
    if (!doc) throw new Error("Document not found");

    doc.metadata.processingStatus = "processing";
    await doc.save();

    // Read file as Buffer
    const dataBuffer = await readFile(filePath);
    // Convert Buffer to Uint8Array
    const uint8Array = new Uint8Array(dataBuffer);

    // Pass Uint8Array to pdfjs
    const loadingTask = pdfjs.getDocument({ data: uint8Array });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    let textContent = "";

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(" ");

      textContent += `Page ${pageNum}:\n${pageText}\n\n`;

      doc.metadata.processingProgress = Math.round((pageNum / numPages) * 100);
      await doc.save();
    }

    doc.content = textContent;
    doc.metadata.processingStatus = "completed";
    doc.metadata.processingProgress = 100;
    doc.metadata.pageCount = numPages;
    await doc.save();

    // Clean up the uploaded file
    await unlink(filePath);
  } catch (error) {
    console.error("PDF processing error:", error);
    const doc = await Document.findById(documentId);
    if (doc) {
      doc.metadata.processingStatus = "error";
      doc.metadata.error = error.message;
      await doc.save();
    }
    throw error;
  }
}
