import * as fs from "fs/promises";
import * as path from "path";
import { Project, StoryboardScene, ProjectLog } from "../../types.js";
import { AIService } from "./ai.js";
import { VideoService } from "./video.js";

export class QueueService {
  private static activeJobs = new Map<string, Project>();
  private static storageDir = path.resolve("./storage");
  private static logsDir = path.resolve("./logs");

  public static async init() {
    // Create base directories
    const dirs = [
      this.storageDir,
      path.join(this.storageDir, "projects"),
      path.join(this.storageDir, "music"),
      path.join(this.storageDir, "videos"),
      path.join(this.storageDir, "images"),
      path.join(this.storageDir, "cache"),
      path.join(this.storageDir, "temp"),
      this.logsDir,
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  public static getProject(id: string): Project | null {
    return this.activeJobs.get(id) || null;
  }

  public static getAllProjectsFromCache(): Project[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Reads all projects from both active cache and storage/projects disk
   */
  public static async getAllProjects(): Promise<Project[]> {
    const projectsMap = new Map<string, Project>();

    // 1. Get from memory cache first
    for (const [id, proj] of this.activeJobs.entries()) {
      projectsMap.set(id, proj);
    }

    // 2. Read from local storage disk
    try {
      const projectsDir = path.join(this.storageDir, "projects");
      const entries = await fs.readdir(projectsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const projectJsonPath = path.join(projectsDir, entry.name, "project.json");
          try {
            const data = await fs.readFile(projectJsonPath, "utf-8");
            const project: Project = JSON.parse(data);
            // Do not overwrite memory jobs with potentially older disk data if currently running
            if (!projectsMap.has(project.id)) {
              projectsMap.set(project.id, project);
            }
          } catch (e) {
            // Ignore corrupted/uninitialized project folders
          }
        }
      }
    } catch (err) {
      // Storage dir might be empty initially
    }

    return Array.from(projectsMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Log helper that outputs to console, in-memory logs, and disk log files
   */
  public static async writeLog(
    projectId: string,
    message: string,
    step?: string
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${step || "SYSTEM"}] ${message}\n`;

    // 1. Write to global logs directory
    const globalLogPath = path.join(this.logsDir, `project-${projectId}.log`);
    await fs.appendFile(globalLogPath, logLine).catch(() => {});

    // 2. Write to project-specific directory
    const projectDir = path.join(this.storageDir, "projects", projectId);
    await fs.mkdir(projectDir, { recursive: true }).catch(() => {});
    const projectLogPath = path.join(projectDir, "generation.log");
    await fs.appendFile(projectLogPath, logLine).catch(() => {});

    console.log(`[Proj: ${projectId}] ${logLine.trim()}`);
  }

  /**
   * Retrieves log content for a given project
   */
  public static async getProjectLogs(projectId: string): Promise<string> {
    const projectLogPath = path.join(this.storageDir, "projects", projectId, "generation.log");
    try {
      return await fs.readFile(projectLogPath, "utf-8");
    } catch {
      return `[${new Date().toISOString()}] No log file found yet for project ${projectId}.`;
    }
  }

  /**
   * Saves project metadata securely to project directory
   */
  public static async saveProjectMetadata(project: Project): Promise<void> {
    const projectDir = path.join(this.storageDir, "projects", project.id);
    await fs.mkdir(projectDir, { recursive: true });
    await fs.writeFile(
      path.join(projectDir, "project.json"),
      JSON.stringify(project, null, 2),
      "utf-8"
    );
  }

  /**
   * Adds a new project generation job to the queue and runs it asynchronously
   */
  public static async createProject(params: {
    topic: string;
    ageGroup: string;
    language: string;
    songStyle: string;
    videoStyle: string;
    voiceStyle: string;
  }): Promise<Project> {
    const id = "proj_" + Math.random().toString(36).substring(2, 11);
    const name = `Song about ${params.topic}`;

    const project: Project = {
      id,
      name,
      topic: params.topic,
      ageGroup: params.ageGroup,
      language: params.language,
      songStyle: params.songStyle,
      videoStyle: params.videoStyle,
      voiceStyle: params.voiceStyle,
      status: "idle",
      currentStep: "Created",
      progress: 0,
      createdAt: new Date().toISOString(),
      duration: 60, // Default 60 seconds duration
      elapsedTime: 0,
      apiCost: 0,
      sceneCount: 4,
      imageCount: 4,
      error: null,
    };

    this.activeJobs.set(id, project);
    await this.saveProjectMetadata(project);
    await this.writeLog(id, `Project created: ${name}`, "INITIALIZE");

    // Start background processing
    this.runPipeline(id).catch((err) => {
      this.writeLog(id, `FATAL PIPELINE EXCEPTION: ${err.message}`, "CRITICAL");
    });

    return project;
  }

  /**
   * Trigger single step retry
   */
  public static async retryStep(projectId: string, stepIndex: number): Promise<Project> {
    const projectList = await this.getAllProjects();
    const existing = projectList.find((p) => p.id === projectId);
    if (!existing) {
      throw new Error(`Project ${projectId} not found.`);
    }

    existing.status = "generating";
    existing.error = null;
    this.activeJobs.set(projectId, existing);

    await this.writeLog(projectId, `Retrying from Step ${stepIndex}...`, "RETRY");

    // Execute background resume/retry
    this.runPipeline(projectId, stepIndex).catch((err) => {
      this.writeLog(projectId, `Step retry exception: ${err.message}`, "CRITICAL");
    });

    return existing;
  }

  /**
   * Main incremental pipeline runner
   */
  private static async runPipeline(projectId: string, startStepIndex = 1) {
    const project = this.activeJobs.get(projectId);
    if (!project) return;

    project.status = "generating";
    const startTime = Date.now();

    const updateProgress = async (stepName: string, progressPercent: number) => {
      project.currentStep = stepName;
      project.progress = progressPercent;
      project.elapsedTime = Math.floor((Date.now() - startTime) / 1000);
      await this.saveProjectMetadata(project);
    };

    const projectDir = path.join(this.storageDir, "projects", projectId);
    const imagesDir = path.join(projectDir, "images");
    const animDir = path.join(projectDir, "animations");

    await fs.mkdir(imagesDir, { recursive: true });
    await fs.mkdir(animDir, { recursive: true });

    try {
      // -----------------------------------------------------------------
      // STEP 1: Generate Lyrics
      // -----------------------------------------------------------------
      if (startStepIndex <= 1 || !project.lyrics) {
        await updateProgress("Generating lyrics (Step 1/10)", 10);
        await this.writeLog(projectId, "Starting lyrics generation...", "STEP 1");
        project.lyrics = await AIService.generateLyrics(
          project.topic,
          project.ageGroup,
          project.language,
          project.songStyle,
          (msg) => this.writeLog(projectId, msg, "STEP 1")
        );
        // Estimate Claude/Gemini Cost: ~$0.002
        project.apiCost += 0.002;
        await this.saveProjectMetadata(project);
        await fs.writeFile(path.join(projectDir, "lyrics.txt"), project.lyrics, "utf-8");
      }

      // -----------------------------------------------------------------
      // STEP 2: Generate Storyboard
      // -----------------------------------------------------------------
      if (startStepIndex <= 2 || !project.storyboard || project.storyboard.length === 0) {
        await updateProgress("Generating storyboard (Step 2/10)", 20);
        await this.writeLog(projectId, "Starting storyboard generation...", "STEP 2");
        project.storyboard = await AIService.generateStoryboard(
          project.lyrics!,
          project.topic,
          project.videoStyle,
          (msg) => this.writeLog(projectId, msg, "STEP 2")
        );
        project.sceneCount = project.storyboard.length;
        project.imageCount = project.storyboard.length;
        // Estimate Cost: ~$0.003
        project.apiCost += 0.003;
        await this.saveProjectMetadata(project);
        await fs.writeFile(
          path.join(projectDir, "storyboard.json"),
          JSON.stringify(project.storyboard, null, 2),
          "utf-8"
        );
      }

      // Ensure paths are ready
      let musicPath = path.join(projectDir, "music.mp3");
      const vocalsPath = path.join(projectDir, "vocals.wav");
      const songPath = path.join(projectDir, "song.wav");
      const subtitlePath = path.join(projectDir, "subtitles.ass");
      const videoOutputPath = path.join(projectDir, "output.mp4");

      // -----------------------------------------------------------------
      // STEP 3: Generate Instrumental Background Music
      // -----------------------------------------------------------------
      if (startStepIndex <= 3) {
        await updateProgress("Generating backing music (Step 3/10)", 30);
        await this.writeLog(projectId, "Generating instrumental background music...", "STEP 3");
        const musicBuf = await AIService.generateMusic(
          project.songStyle,
          project.duration,
          (msg) => this.writeLog(projectId, msg, "STEP 3")
        );

        if (musicBuf.length > 0) {
          await fs.writeFile(musicPath, musicBuf);
          project.apiCost += 0.05; // ElevenLabs credit estimate
        } else {
          await this.writeLog(
            projectId,
            "Synthesizing high-quality procedural children's instrumental loop...",
            "STEP 3"
          );
          musicPath = path.join(projectDir, "music.wav");
          await VideoService.synthesizeProceduralMusic(musicPath, project.duration);
        }
        await this.saveProjectMetadata(project);
      } else {
        const hasMp3 = await fs.stat(musicPath).then((s) => s.size > 0).catch(() => false);
        if (!hasMp3) {
          musicPath = path.join(projectDir, "music.wav");
        }
      }

      // -----------------------------------------------------------------
      // STEP 4: Generate Vocals
      // -----------------------------------------------------------------
      if (startStepIndex <= 4) {
        await updateProgress("Generating vocals (Step 4/10)", 40);
        await this.writeLog(projectId, "Generating vocal stems...", "STEP 4");
        const vocalsBuf = await AIService.generateVocals(
          project.lyrics!,
          project.voiceStyle,
          project.language,
          (msg) => this.writeLog(projectId, msg, "STEP 4")
        );

        if (vocalsBuf.length > 0) {
          await fs.writeFile(vocalsPath, vocalsBuf);
          project.apiCost += 0.10; // ElevenLabs TTS/Gemini TTS cost estimate
        } else {
          await this.writeLog(projectId, "Generating silence/dummy voice stem as fallback...", "STEP 4");
          // Generate an empty audio file or silent backing
          await fs.writeFile(vocalsPath, Buffer.alloc(0));
        }
        await this.saveProjectMetadata(project);
      }

      // -----------------------------------------------------------------
      // STEP 5: Merge Music + Vocals
      // -----------------------------------------------------------------
      if (startStepIndex <= 5) {
        await updateProgress("Mixing audio stem tracks (Step 5/10)", 50);
        await this.writeLog(projectId, "Mixing instrumental background and vocal stems...", "STEP 5");
        await VideoService.mixAudio(
          vocalsPath,
          musicPath,
          songPath,
          project.duration,
          (msg) => this.writeLog(projectId, msg, "STEP 5")
        );
        await this.saveProjectMetadata(project);
      }

      // -----------------------------------------------------------------
      // STEP 6: Generate Scene Images
      // -----------------------------------------------------------------
      if (startStepIndex <= 6) {
        await updateProgress("Generating scene illustrations (Step 6/10)", 60);
        await this.writeLog(projectId, "Starting parallel scene image generation...", "STEP 6");

        // Generate images parallelly
        const imageTasks = project.storyboard!.map(async (scene) => {
          this.writeLog(projectId, `Generating illustration for Scene ${scene.id}...`, "STEP 6");
          const imgBuf = await AIService.generateSceneImage(
            scene.visual,
            scene.id,
            (msg) => this.writeLog(projectId, msg, "STEP 6")
          );

          const sceneImgPath = path.join(imagesDir, `scene_${scene.id}.png`);
          await fs.writeFile(sceneImgPath, imgBuf);

          scene.imageUrl = `/api/projects/${projectId}/images/scene_${scene.id}.png`;
          // Cost: 4 scenes * $0.03
          project.apiCost += 0.03;
        });

        await Promise.all(imageTasks);
        await this.saveProjectMetadata(project);
        await fs.writeFile(
          path.join(projectDir, "storyboard.json"),
          JSON.stringify(project.storyboard, null, 2),
          "utf-8"
        );
      }

      // -----------------------------------------------------------------
      // STEP 7: Animate Scenes
      // -----------------------------------------------------------------
      if (startStepIndex <= 7) {
        await updateProgress("Animating scenes (Step 7/10)", 70);
        await this.writeLog(projectId, "Starting scene animations...", "STEP 7");

        const animTasks = project.storyboard!.map(async (scene) => {
          const sceneImgPath = path.join(imagesDir, `scene_${scene.id}.png`);
          const sceneVideoPath = path.join(animDir, `scene_${scene.id}.mp4`);

          this.writeLog(projectId, `Animating Scene ${scene.id}...`, "STEP 7");
          const videoBuf = await AIService.generateSceneVideo(
            sceneImgPath,
            scene.visual,
            scene.id,
            (msg) => this.writeLog(projectId, msg, "STEP 7")
          );

          if (videoBuf) {
            await fs.writeFile(sceneVideoPath, videoBuf);
            project.apiCost += 0.25; // Higgsfield animation cost estimate
          } else {
            // Local high-fidelity Ken Burns pan/zoom generator
            const duration = scene.timeEnd - scene.timeStart;
            await VideoService.animateSceneImage(
              sceneImgPath,
              sceneVideoPath,
              duration,
              (msg) => this.writeLog(projectId, msg, "STEP 7")
            );
          }

          scene.videoUrl = `/api/projects/${projectId}/animations/scene_${scene.id}.mp4`;
        });

        await Promise.all(animTasks);
        await this.saveProjectMetadata(project);
        await fs.writeFile(
          path.join(projectDir, "storyboard.json"),
          JSON.stringify(project.storyboard, null, 2),
          "utf-8"
        );
      }

      // -----------------------------------------------------------------
      // STEP 8: Generate Subtitles
      // -----------------------------------------------------------------
      if (startStepIndex <= 8) {
        await updateProgress("Structuring karaoke subtitles (Step 8/10)", 80);
        await this.writeLog(projectId, "Generating timing-locked ASS subtitles...", "STEP 8");
        await VideoService.generateAssSubtitles(project.storyboard!, subtitlePath);
        await this.saveProjectMetadata(project);
      }

      // -----------------------------------------------------------------
      // STEP 9: Build Video using FFmpeg
      // -----------------------------------------------------------------
      if (startStepIndex <= 9) {
        await updateProgress("Compiling final movie with FFmpeg (Step 9/10)", 90);
        await this.writeLog(projectId, "Merging animated scenes, sound and subtitles...", "STEP 9");

        const sceneClips = project.storyboard!.map((scene) =>
          path.join(animDir, `scene_${scene.id}.mp4`)
        );

        await VideoService.renderFinalVideo(
          sceneClips,
          songPath,
          subtitlePath,
          videoOutputPath,
          (msg) => this.writeLog(projectId, msg, "STEP 9")
        );
        project.hasVideo = true;
        await this.saveProjectMetadata(project);
      }

      // -----------------------------------------------------------------
      // STEP 10: Complete pipeline and save everything
      // -----------------------------------------------------------------
      await updateProgress("Completed (Step 10/10)", 100);
      project.status = "completed";
      project.elapsedTime = Math.floor((Date.now() - startTime) / 1000);
      await this.saveProjectMetadata(project);
      await this.writeLog(
        projectId,
        `PIPELINE COMPLETED SUCCESSFULLY! Total time: ${project.elapsedTime}s, Cost: $${project.apiCost.toFixed(3)}`,
        "COMPLETE"
      );
    } catch (err: any) {
      project.status = "failed";
      project.error = err.message;
      await this.saveProjectMetadata(project);
      await this.writeLog(projectId, `PIPELINE EXCEPTION OCCURRED: ${err.message}`, "FAILED");
    }
  }
}
