import { GoogleGenAI, Type } from "@google/genai";
import axios from "axios";
import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { StoryboardScene } from "../../types.js";

// Initialize Gemini client with proper telemetry headers
const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export class AIService {
  private static isValidApiKey(key: string | undefined): boolean {
    if (!key) return false;
    const trimmed = key.trim();
    if (trimmed === "") return false;
    if (
      trimmed.toLowerCase().includes("your_") ||
      trimmed.toLowerCase().includes("placeholder") ||
      trimmed.toLowerCase().includes("<") ||
      trimmed.toLowerCase().includes("key_here") ||
      trimmed.length < 10
    ) {
      return false;
    }
    return true;
  }

  private static isValidClaudeKey(key: string | undefined): boolean {
    if (!key) return false;
    const trimmed = key.trim();
    return trimmed.toLowerCase().startsWith("sk-ant-") && trimmed.length > 20;
  }

  private static createWavHeader(pcmLength: number, sampleRate: number): Buffer {
    const header = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(36 + pcmLength, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16); // subchunk1size
    header.writeUInt16LE(1, 20); // audio format (PCM = 1)
    header.writeUInt16LE(1, 22); // num channels (mono = 1)
    header.writeUInt32LE(sampleRate, 24); // sample rate (e.g. 24000)
    header.writeUInt32LE(sampleRate * 2, 28); // byte rate (sampleRate * numChannels * bitsPerSample/8)
    header.writeUInt16LE(2, 32); // block align (numChannels * bitsPerSample/8)
    header.writeUInt16LE(16, 34); // bits per sample (16)
    header.write("data", 36);
    header.writeUInt32LE(pcmLength, 40);
    return header;
  }

  private static async retry<T>(
    fn: () => Promise<T>,
    logFn: (msg: string) => void,
    retries = 3,
    delay = 2000
  ): Promise<T> {
    try {
      return await fn();
    } catch (err: any) {
      if (retries > 0) {
        logFn(`Gemini API call failed (${err.message || err}). Retrying in ${delay}ms... (${retries} attempts left)`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.retry(fn, logFn, retries - 1, delay * 2);
      }
      throw err;
    }
  }

  private static async callGeminiWithRobustFallback<T>(
    operation: (modelName: string) => Promise<T>,
    logFn: (msg: string) => void,
    candidateModels: string[]
  ): Promise<T> {
    let lastError: any = null;

    for (let i = 0; i < candidateModels.length; i++) {
      const model = candidateModels[i];
      const isLast = i === candidateModels.length - 1;
      
      logFn(`Attempting Gemini call with model: ${model}...`);
      try {
        // Quick retry (1 retry after 1500ms if 503/UNAVAILABLE or transient error)
        return await this.retry(() => operation(model), logFn, 1, 1500);
      } catch (err: any) {
        lastError = err;
        const errStr = typeof err === 'object' && err !== null ? (err.message || JSON.stringify(err)) : String(err);
        logFn(`Model ${model} failed: ${errStr}`);
        
        if (!isLast) {
          logFn(`Transitioning to fallback model: ${candidateModels[i + 1]}...`);
        }
      }
    }

    throw lastError || new Error("All Gemini fallback models exhausted.");
  }

  private static async callGeminiWithFallback<T>(
    operation: (modelName: string) => Promise<T>,
    logFn: (msg: string) => void,
    primaryModel = "gemini-3.5-flash",
    fallbackModel = "gemini-3.1-flash-lite"
  ): Promise<T> {
    return this.callGeminiWithRobustFallback(
      operation,
      logFn,
      [primaryModel, "gemini-flash-latest", fallbackModel]
    );
  }

  private static getClaudeHeaders() {
    const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || "";
    return {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    };
  }

  private static getElevenLabsHeaders() {
    return {
      "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
      "content-type": "application/json",
    };
  }

  private static getHiggsfieldHeaders() {
    return {
      "Authorization": `Bearer ${process.env.HIGGSFIELD_API_KEY || ""}`,
      "content-type": "application/json",
    };
  }

  /**
   * Step 1: Generate Lyrics
   */
  public static async generateLyrics(
    topic: string,
    ageGroup: string,
    language: string,
    songStyle: string,
    logFn: (msg: string) => void
  ): Promise<string> {
    const prompt = `Write a cute, rhyming, educational children's song about: "${topic}".
Target Age Group: ${ageGroup}
Language: ${language}
Song Style: ${songStyle}
The song should be structured exactly as:
[Verse 1]
(4 simple lines)

[Chorus]
(4 simple catch lines, easy to repeat)

[Verse 2]
(4 simple lines)

[Chorus]
(Repeat chorus)

[Ending]
(2 simple lines of closure)`;

    const claudeKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (this.isValidClaudeKey(claudeKey)) {
      logFn("Calling Claude API for lyrics generation...");
      try {
        const response = await axios.post(
          "https://api.anthropic.com/v1/messages",
          {
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1500,
            messages: [{ role: "user", content: prompt }],
          },
          { headers: this.getClaudeHeaders() }
        );
        const text = response.data.content[0].text;
        logFn("Lyrics successfully generated by Claude!");
        return text;
      } catch (err: any) {
        logFn(`Claude API failed (${err.message}). Falling back to Gemini...`);
      }
    }

    logFn("Calling Gemini API (gemini-3.5-flash) for lyrics generation...");
    const text = await this.callGeminiWithFallback(
      (model) =>
        gemini.models.generateContent({
          model: model,
          contents: prompt,
        }).then((res) => res.text || ""),
      logFn
    );
    logFn("Lyrics successfully generated by Gemini!");
    return text;
  }

  /**
   * Step 2: Generate Storyboard
   */
  public static async generateStoryboard(
    lyrics: string,
    topic: string,
    videoStyle: string,
    logFn: (msg: string) => void
  ): Promise<StoryboardScene[]> {
    const prompt = `Based on the following children's lyrics, create a detailed, highly consistent 4-scene storyboard for a 1-minute video.
Lyrics:
${lyrics}

Topic: ${topic}
Video Visual Style: ${videoStyle} (e.g. Pixar-like, colorful, friendly, consistent characters)

Create exactly 4 scenes. Provide the response as a JSON array matching the StoryboardScene structure:
[
  {
    "id": 1,
    "timeStart": 0,
    "timeEnd": 15,
    "visual": "A detailed description of the physical action, characters, and settings for image generator. E.g. 'A cute yellow teddy bear brushing its white teeth with a small blue toothbrush in a bright, colorful cartoon bathroom.'",
    "cameraMovement": "E.g. 'Slow pan right'",
    "character": "Describe character details for consistency. E.g. 'Cute fluffy yellow teddy bear with big sparkly brown eyes'",
    "animation": "E.g. 'Teddy bear is smiling and moving the toothbrush back and forth'",
    "background": "E.g. 'Bright tiled bathroom with bubbles floating and a friendly sun looking in the window'",
    "mood": "E.g. 'Cheerful, playful'",
    "colorPalette": "E.g. 'Warm pastels, bright blues and yellows'",
    "subtitle": "Text overlay for lyrics during this scene",
    "narration": "Narration text corresponding to this scene"
  }
]
`;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          timeStart: { type: Type.NUMBER },
          timeEnd: { type: Type.NUMBER },
          visual: { type: Type.STRING },
          cameraMovement: { type: Type.STRING },
          character: { type: Type.STRING },
          animation: { type: Type.STRING },
          background: { type: Type.STRING },
          mood: { type: Type.STRING },
          colorPalette: { type: Type.STRING },
          subtitle: { type: Type.STRING },
          narration: { type: Type.STRING },
        },
        required: [
          "id",
          "timeStart",
          "timeEnd",
          "visual",
          "cameraMovement",
          "character",
          "animation",
          "background",
          "mood",
          "colorPalette",
          "subtitle",
          "narration",
        ],
      },
    };

    const claudeKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (this.isValidClaudeKey(claudeKey)) {
      logFn("Calling Claude API for storyboard generation...");
      try {
        const response = await axios.post(
          "https://api.anthropic.com/v1/messages",
          {
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 3000,
            messages: [{ role: "user", content: prompt + "\nOutput strictly raw JSON." }],
          },
          { headers: this.getClaudeHeaders() }
        );
        const text = response.data.content[0].text;
        const cleaned = text.substring(text.indexOf("["), text.lastIndexOf("]") + 1);
        const parsed = JSON.parse(cleaned);
        logFn("Storyboard successfully generated by Claude!");
        return parsed;
      } catch (err: any) {
        logFn(`Claude Storyboard generation failed (${err.message}). Falling back to Gemini...`);
      }
    }

    logFn("Calling Gemini API (gemini-3.5-flash) with responseSchema for storyboard...");
    const responseText = await this.callGeminiWithFallback(
      (model) =>
        gemini.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        }).then((res) => res.text || "[]"),
      logFn
    );

    const parsed = JSON.parse(responseText || "[]");
    logFn(`Storyboard successfully generated by Gemini with ${parsed.length} scenes!`);
    return parsed;
  }

  /**
   * Step 3: Generate Background Music Track
   */
  public static async generateMusic(
    stylePrompt: string,
    duration: number,
    logFn: (msg: string) => void
  ): Promise<Buffer> {
    const elApiKey = process.env.ELEVENLABS_API_KEY;
    if (elApiKey) {
      logFn(`Calling ElevenLabs sound-effects/music API for backing track of style: "${stylePrompt}"...`);
      try {
        // Use ElevenLabs Sound Effects/Audio Generation endpoint for playful music loop
        const response = await axios.post(
          "https://api.elevenlabs.io/v1/sound-effects",
          {
            text: `Upbeat, playful children's song instrumental music track, happy marimba, playful acoustic guitar, ${stylePrompt}`,
            duration_seconds: Math.min(duration, 30), // Clamp to ElevenLabs max limits if any
            prompt_influence: 0.8,
          },
          {
            headers: this.getElevenLabsHeaders(),
            responseType: "arraybuffer",
          }
        );
        logFn("Background music successfully generated via ElevenLabs!");
        return Buffer.from(response.data);
      } catch (err: any) {
        logFn(`ElevenLabs Music API failed (${err.message}). Using local synthesis...`);
      }
    }

    logFn("ElevenLabs key missing/failed. Creating local playful synthesizer loop...");
    // Let's return an empty buffer or handle procedural fallback in the video service
    return Buffer.alloc(0);
  }

  /**
   * Step 4: Generate Vocals (Singing/Narration)
   */
  public static async generateVocals(
    lyricsText: string,
    voiceStyle: string,
    language: string,
    logFn: (msg: string) => void
  ): Promise<Buffer> {
    const cleanLyrics = lyricsText.replace(/\[.*?\]/g, "").trim(); // Remove section headers [Chorus] etc.
    const elApiKey = process.env.ELEVENLABS_API_KEY;

    if (this.isValidApiKey(elApiKey)) {
      logFn(`Calling ElevenLabs TTS for vocal synthesis (${voiceStyle})...`);
      try {
        // Default voice IDs (pre-made cute or friendly voices)
        // Rachel: 21m00Tcm4TlvDq8ikWAM, Lily: pMsXgTz6vjD9cInZ3W4f
        const voiceId = "pMsXgTz6vjD9cInZ3W4f"; // Lily (cheerful, young)
        const response = await axios.post(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            text: cleanLyrics,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.4,
              use_speaker_boost: true,
            },
          },
          {
            headers: this.getElevenLabsHeaders(),
            responseType: "arraybuffer",
          }
        );
        logFn("Vocals successfully generated via ElevenLabs!");
        return Buffer.from(response.data);
      } catch (err: any) {
        logFn(`ElevenLabs TTS failed (${err.message}). Falling back to Gemini TTS...`);
      }
    }

    logFn("Calling Gemini TTS API (gemini-3.1-flash-tts-preview) for children vocals...");
    try {
      const response = await this.retry(
        () =>
          gemini.models.generateContent({
            model: "gemini-3.1-flash-tts-preview",
            contents: [{ parts: [{ text: `Read this song lyrics cheerfully and rhythmically with pauses: ${cleanLyrics}` }] }],
            config: {
              responseModalities: ["AUDIO" as any],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: "Puck" }, // Puck is energetic and cute
                },
              },
            },
          }),
        logFn,
        5,
        3000
      );

      const part = response.candidates?.[0]?.content?.parts?.[0];
      const base64Audio = part?.inlineData?.data;
      const mimeType = part?.inlineData?.mimeType || "";
      if (base64Audio) {
        logFn(`Vocals successfully generated by Gemini TTS! (MimeType: ${mimeType})`);
        const audioBuffer = Buffer.from(base64Audio, "base64");
        const isWav = audioBuffer.slice(0, 4).toString("ascii") === "RIFF";
        const isMp3 = mimeType.includes("mpeg") || mimeType.includes("mp3") || audioBuffer.slice(0, 3).toString("hex") === "494433" || audioBuffer.slice(0, 2).toString("hex") === "fffb";

        if (!isWav && !isMp3) {
          logFn("Detected raw PCM from Gemini TTS, prepending 24kHz 16-bit mono WAV header...");
          const header = this.createWavHeader(audioBuffer.length, 24000);
          return Buffer.concat([header, audioBuffer]);
        }
        return audioBuffer;
      }
    } catch (err: any) {
      logFn(`Gemini TTS also failed: ${err.message}. Creating procedural narrator...`);
    }

    return Buffer.alloc(0);
  }

  /**
   * Step 6: Generate Scene Images
   */
  public static async generateSceneImage(
    prompt: string,
    index: number,
    logFn: (msg: string) => void
  ): Promise<Buffer> {
    const hfApiKey = process.env.HIGGSFIELD_API_KEY;
    if (this.isValidApiKey(hfApiKey)) {
      logFn(`Calling Higgsfield Image Generation API for Scene ${index}...`);
      try {
        const response = await axios.post(
          "https://api.higgsfield.ai/v1/images/generations",
          {
            prompt: `Pixar style, extremely colorful, children friendly illustration: ${prompt}, 3d render, cute character design, consistent details, 16:9 aspect ratio, UHD, masterpiece`,
            aspect_ratio: "16:9",
            num_images: 1,
          },
          { headers: this.getHiggsfieldHeaders() }
        );
        const imageUrl = response.data.images[0].url;
        logFn(`Higgsfield Image generated: downloading...`);
        const imgDownload = await axios.get(imageUrl, { responseType: "arraybuffer" });
        return Buffer.from(imgDownload.data);
      } catch (err: any) {
        logFn(`Higgsfield Image API failed (${err.message}). Falling back to Gemini...`);
      }
    }

    logFn(`Generating Scene ${index} image with Gemini...`);
    try {
      const imgBuffer = await this.callGeminiWithRobustFallback(
        async (model) => {
          const response = await gemini.models.generateContent({
            model: model,
            contents: {
              parts: [
                {
                  text: `Beautiful, ultra-high-quality, Pixar-style 3D animated children's book illustration. Extremely colorful, warm pastel tones, friendly characters, rich texture. Scene details: ${prompt}`,
                },
              ],
            },
            config: {
              imageConfig: {
                aspectRatio: "16:9",
                ...(model === "gemini-3.1-flash-image" ? { imageSize: "1K" } : {}),
              },
            },
          });
          
          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData?.data) {
              return Buffer.from(part.inlineData.data, "base64");
            }
          }
          throw new Error("No inline data returned in image response parts.");
        },
        logFn,
        ["gemini-3.1-flash-image", "gemini-3.1-flash-lite-image"]
      );

      logFn(`Gemini successfully generated image for Scene ${index}!`);
      return imgBuffer;
    } catch (err: any) {
      logFn(`Gemini image generation failed completely: ${err.message || err}. Falling back to gorgeous procedural vector image generation...`);
      return await this.generateProceduralSceneImage(prompt, index, logFn);
    }
  }

  /**
   * Procedural SVG-to-PNG Vector fallback generator when APIs fail or quotas are exceeded
   */
  public static async generateProceduralSceneImage(
    prompt: string,
    index: number,
    logFn: (msg: string) => void
  ): Promise<Buffer> {
    logFn(`Generating beautiful procedural vector SVG illustration for Scene ${index}...`);
    const gradients = [
      { start: "#4f46e5", end: "#7c3aed" }, // Indigo to Violet
      { start: "#db2777", end: "#e11d48" }, // Pink to Rose
      { start: "#0891b2", end: "#2563eb" }, // Cyan to Blue
      { start: "#059669", end: "#0d9488" }, // Emerald to Teal
      { start: "#d97706", end: "#ea580c" }, // Amber to Orange
      { start: "#7c3aed", end: "#db2777" }, // Violet to Pink
    ];
    const grad = gradients[index % gradients.length];

    // Helper to wrap text nicely
    const wrapText = (text: string, maxChars: number): string[] => {
      const words = text.split(" ");
      const lines: string[] = [];
      let current = "";
      for (const w of words) {
        if ((current + " " + w).trim().length <= maxChars) {
          current = (current + " " + w).trim();
        } else {
          if (current) lines.push(current);
          current = w;
        }
      }
      if (current) lines.push(current);
      return lines;
    };

    const textLines = wrapText(prompt, 55);
    let textElements = "";
    const yStart = 380 - (textLines.length * 20);
    for (let i = 0; i < textLines.length; i++) {
      const escapedText = textLines[i]
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
      textElements += `<text x="640" y="${yStart + i * 40}" font-family="'Inter', system-ui, sans-serif" font-size="28" font-weight="500" fill="#ffffff" text-anchor="middle" opacity="0.95">${escapedText}</text>\n`;
    }

    const svgString = `
<svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${grad.start}" />
      <stop offset="100%" stop-color="${grad.end}" />
    </linearGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.5" />
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="1280" height="720" fill="url(#bgGrad)" />
  <rect width="1280" height="720" fill="url(#vignette)" />

  <!-- Animated Vector Backdrops (Hills / Waves) -->
  <path d="M-100 720 L-100 550 Q250 400 640 550 T1380 480 L1380 720 Z" fill="#ffffff" opacity="0.1" />
  <path d="M-100 720 L-100 600 Q320 500 700 620 T1380 550 L1380 720 Z" fill="#ffffff" opacity="0.15" />

  <!-- Decorative Sparkles / Stars -->
  <g fill="#ffffff" opacity="0.4">
    <circle cx="200" cy="150" r="4" />
    <circle cx="1080" cy="120" r="6" />
    <circle cx="150" cy="450" r="3" />
    <circle cx="1150" cy="550" r="5" />
    <path d="M 640,110 L 643,120 L 653,120 L 645,126 L 648,136 L 640,130 L 632,136 L 635,126 L 627,120 L 637,120 Z" />
  </g>

  <!-- Frame Border -->
  <rect x="40" y="40" width="1200" height="640" rx="24" fill="none" stroke="#ffffff" stroke-width="4" stroke-opacity="0.3" />

  <!-- Header Banner -->
  <rect x="540" y="70" width="200" height="46" rx="23" fill="#ffffff" fill-opacity="0.2" />
  <text x="640" y="100" font-family="'Space Grotesk', 'Inter', system-ui, sans-serif" font-size="18" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="2">SCENE ${index}</text>

  <!-- Illustration Placeholder Icon in the Center -->
  <g transform="translate(640, 200)" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.9">
    <circle cx="0" cy="0" r="32" stroke-dasharray="10, 6" />
    <circle cx="0" cy="0" r="16" fill="#ffffff" fill-opacity="0.3" />
  </g>

  <!-- Content Text -->
  ${textElements}

  <!-- Footer Credit -->
  <text x="640" y="640" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="500" fill="#ffffff" text-anchor="middle" opacity="0.5" letter-spacing="1">STORYBOARD GENERATED SUCCESSFULLY</text>
</svg>
    `.trim();

    const tempSvgPath = path.join("/tmp", `scene_${index}_${Date.now()}.svg`);
    const tempPngPath = path.join("/tmp", `scene_${index}_${Date.now()}.png`);

    try {
      await fs.writeFile(tempSvgPath, svgString, "utf-8");
      
      const cmd = `ffmpeg -y -i "${tempSvgPath}" "${tempPngPath}"`;
      await new Promise<void>((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`Failed to convert SVG to PNG: ${error.message}\nStderr: ${stderr}`));
          } else {
            resolve();
          }
        });
      });

      const buffer = await fs.readFile(tempPngPath);
      await fs.unlink(tempSvgPath).catch(() => {});
      await fs.unlink(tempPngPath).catch(() => {});

      logFn(`Generated gorgeous procedural vector illustration for Scene ${index}!`);
      return buffer;
    } catch (err: any) {
      logFn(`Procedural illustration generation failed: ${err.message}. Creating solid color background fallback...`);
      try {
        const fallbackCmd = `ffmpeg -y -f lavfi -i color=c=0x${grad.start.replace("#", "")}:s=1280x720:d=1 -vframes 1 "${tempPngPath}"`;
        await new Promise<void>((resolve, reject) => {
          exec(fallbackCmd, (error) => {
            if (error) reject(error);
            else resolve();
          });
        });
        const buffer = await fs.readFile(tempPngPath);
        await fs.unlink(tempPngPath).catch(() => {});
        return buffer;
      } catch (lastErr: any) {
        throw new Error(`Failed to generate any image for Scene ${index}: ${lastErr.message}`);
      }
    }
  }

  /**
   * Step 7: Higgsfield Animation API
   */
  public static async generateSceneVideo(
    imagePath: string,
    prompt: string,
    index: number,
    logFn: (msg: string) => void
  ): Promise<Buffer | null> {
    const hfApiKey = process.env.HIGGSFIELD_API_KEY;
    if (this.isValidApiKey(hfApiKey)) {
      logFn(`Calling Higgsfield Video Animation API for Scene ${index}...`);
      try {
        // Read the image and convert to base64 for Higgsfield image-to-video prompt
        const imgBuffer = await fs.readFile(imagePath);
        const imgBase64 = imgBuffer.toString("base64");

        const response = await axios.post(
          "https://api.higgsfield.ai/v1/videos/generations",
          {
            image: `data:image/png;base64,${imgBase64}`,
            prompt: `Soft gentle camera panning, character smiling and subtle movement, beautiful animated scene: ${prompt}`,
            duration: 5,
            aspect_ratio: "16:9",
          },
          { headers: this.getHiggsfieldHeaders() }
        );

        const videoUrl = response.data.video_url;
        logFn(`Higgsfield Video generated! Downloading animated scene...`);
        const videoDownload = await axios.get(videoUrl, { responseType: "arraybuffer" });
        return Buffer.from(videoDownload.data);
      } catch (err: any) {
        logFn(`Higgsfield Animation failed (${err.message}). Local Ken Burns transition will be used instead.`);
      }
    }

    logFn(`No Higgsfield video key or API failed. Using local Ken Burns pan/zoom animator for Scene ${index}.`);
    return null; // Signals to video renderer to use local image animation
  }
}
