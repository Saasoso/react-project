import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ChatOpenAI } from "@langchain/openai";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Document } from "@langchain/core/documents";

const app = express();
app.use(cors());
app.use(express.json()); // Parse JSON request body

const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const fileName = req.body.fileName || req.file.originalname;
    const filePath = path.join('uploads', fileName);
    await fs.promises.rename(req.file.path, filePath);
    res.status(200).send('File uploaded successfully');
    console.log(filePath);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Error uploading file');
  }
});

app.post('/process', async (req, res) => {
  const { filePath, userInput } = req.body;

  try {
    const chatModel = new ChatOpenAI({ apiKey: "sk-proj-5paUoRLCWJaigWZAVBTVT3BlbkFJrqf0vOec1Xg4PTqzKXx4",
     model: "gpt-3.5-turbo", temperature: 0.1 });
    const splitter = new RecursiveCharacterTextSplitter();
    const loader = filePath.endsWith(".pdf") ? new PDFLoader(filePath, "text") : new TextLoader(filePath);
    const splitDocs = await loader.loadAndSplit(splitter);

    const prompt = ChatPromptTemplate.fromTemplate(`**Hey there!** I'm Chat, your friendly AI assistant. Let's explore some concepts together. **Here's some background information to help you understand:** <context> {context} </context> **Now, let's get to the question!** **Question:** {input} **Explanation:** This question is asking about [**explain the key concepts or focus of the question**]. Understanding [**mention specific elements or areas of knowledge crucial for answering the question**] will be helpful in solving it. **Feel free to ask me anything related to this topic or rephrase the question if needed!**`);
    const documentChain = await createStuffDocumentsChain({ llm: chatModel, prompt });

    const context = [new Document({ pageContent: splitDocs.map(doc => doc.pageContent).join(' ') })];
    console.log(userInput)
    const output = await documentChain.invoke({ input: userInput, context });

    res.status(200).json({ output });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).send('Error processing file');
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});