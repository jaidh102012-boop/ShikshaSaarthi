// server/server.js
import express from "express";
import multer from "multer";
import cors from "cors";
import { ChatCompletion } from "g4f";

const app = express();
app.use(cors());
app.use(express.json());

// File storage (uploads/)
const upload = multer({ dest: "server/uploads/" });

// ---- Chat API ----
app.post("/api/saarthi", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "No prompt" });

    const g4f = new ChatCompletion({
      model: "gpt-4o-mini", // free fast model
    });

    const reply = await g4f.create({
      messages: [
        {
          role: "system",
          content:
            "You are SAARTHI, a free study chatbot that helps students with notes, questions, and concepts. Keep answers short and clear.",
        },
        { role: "user", content: prompt },
      ],
    });

    res.json({ reply: reply.choices?.[0]?.message?.content || "No reply." });
  } catch (err) {
    console.error(err);
    res.json({ reply: "⚠️ Free model unavailable now. Try again later." });
  }
});

// ---- File upload ----
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const fileInfo = {
      name: file.originalname,
      path: `/uploads/${file.filename}`,
      type: file.mimetype,
    };
    res.json({ success: true, file: fileInfo });
  } catch (err) {
    res.status(500).json({ error: "Upload failed" });
  }
});

// Static serve uploads
app.use("/uploads", express.static("server/uploads"));

// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`✅ SAARTHI backend running at http://localhost:${PORT}`));
