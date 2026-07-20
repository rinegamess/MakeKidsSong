import express from "express";
import path from "path";
import * as fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { QueueService } from "./src/server/services/queue.js";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize the Queue and storage directory layout
  await QueueService.init();

  app.use(express.json());

  // -----------------------------------------------------------------
  // REST API Endpoints
  // -----------------------------------------------------------------

  // GET: Retrieve all children song projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await QueueService.getAllProjects();
      res.json(projects);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST: Create and initiate a new video project
  app.post("/api/project", async (req, res) => {
    try {
      const { topic, ageGroup, language, songStyle, videoStyle, voiceStyle } = req.body;
      if (!topic) {
        return res.status(400).json({ error: "Song topic is required." });
      }

      const project = await QueueService.createProject({
        topic,
        ageGroup: ageGroup || "Preschool (3-5)",
        language: language || "English",
        songStyle: songStyle || "Happy & Playful",
        videoStyle: videoStyle || "Pixar 3D",
        voiceStyle: voiceStyle || "Lily (Cheerful Child)",
      });

      res.status(201).json(project);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET: Fetch a specific project metadata
  app.get("/api/project/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const projects = await QueueService.getAllProjects();
      const found = projects.find((p) => p.id === id);
      if (!found) {
        return res.status(404).json({ error: "Project not found." });
      }
      res.json(found);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET: Fetch live generation logs for a project
  app.get("/api/project/:id/logs", async (req, res) => {
    try {
      const { id } = req.params;
      const logs = await QueueService.getProjectLogs(id);
      res.type("text/plain").send(logs);
    } catch (err: any) {
      res.status(500).send("Error reading logs: " + err.message);
    }
  });

  // POST: Retry or resume from a specific pipeline step (e.g. regenerating images or rendering)
  app.post("/api/project/:id/retry", async (req, res) => {
    try {
      const { id } = req.params;
      const { step } = req.body;
      const stepNum = parseInt(step, 10) || 1;

      const project = await QueueService.retryStep(id, stepNum);
      res.json(project);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET: Serve static generated assets (Images)
  app.get("/api/projects/:id/images/:filename", async (req, res) => {
    const { id, filename } = req.params;
    const filePath = path.resolve("./storage/projects", id, "images", filename);
    try {
      await fs.access(filePath);
      res.sendFile(filePath);
    } catch {
      res.status(404).send("Image asset not found.");
    }
  });

  // GET: Serve static generated assets (Scene Animations)
  app.get("/api/projects/:id/animations/:filename", async (req, res) => {
    const { id, filename } = req.params;
    const filePath = path.resolve("./storage/projects", id, "animations", filename);
    try {
      await fs.access(filePath);
      res.sendFile(filePath);
    } catch {
      res.status(404).send("Animation asset not found.");
    }
  });

  // GET: Play/download final output video
  app.get("/api/video/:id", async (req, res) => {
    const { id } = req.params;
    const filePath = path.resolve("./storage/projects", id, "output.mp4");
    try {
      await fs.access(filePath);
      res.setHeader("Content-Type", "video/mp4");
      res.sendFile(filePath);
    } catch {
      res.status(404).send("Final video output not found or still processing.");
    }
  });

  // API placeholders for the direct generator stages as requested
  app.post("/api/generate", (req, res) => res.json({ message: "Task added to background queue" }));
  app.post("/api/storyboard", (req, res) => res.json({ message: "Storyboard update received" }));
  app.post("/api/music", (req, res) => res.json({ message: "Backing track updated" }));
  app.post("/api/images", (req, res) => res.json({ message: "Image generation batch processed" }));
  app.post("/api/render", (req, res) => res.json({ message: "Video rendering pipeline invoked" }));

  // -----------------------------------------------------------------
  // Frontend client routing & Vite Asset serving
  // -----------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    // Development mode: Inject Vite dev server middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve pre-compiled static assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Production Children's Song Generator Server booting up!`);
    console.log(`🌐 Accessible on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server failure:", err);
});
