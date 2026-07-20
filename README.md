# LullabyAI Studio 🚀

LullabyAI Studio is an autonomous, production-ready, full-stack video generation suite that automatically creates children's songs (1-2 minutes long) with synchronized audio layers, custom Pixar-like consistent illustrations, panning scene animations, and karaoke-timed subtitle overlays from a single text prompt.

Designed with **Clean Architecture**, the application is fully modular, highly scalable, and optimized for Linux servers (such as Ubuntu 24.04 LTS) with zero local graphical processing units (GPU) required.

---

## 🎨 System Architecture & Pipeline Flow

The generator operates on a **10-Step Incremental Pipeline** managed via an asynchronous task queue:

1. **Lyrics Generation (Step 1)**: Accepts a topic, language, style, and age group, producing structured, educational rhyming lyrics via **Claude** (or pre-authenticated **Gemini** as an automatic zero-config fallback).
2. **Storyboard Design (Step 2)**: Formulates 4 sequential scenes specifying physical actions, character descriptions, backgrounds, cameras, and subtitles using structured AI JSON outputs.
3. **Background Music (Step 3)**: Generates a backing track with ElevenLabs Music API or creates a charming, rhythmic, procedural 8-bit kids WAV loop programmatically using frequency synthesizer math.
4. **Vocal Synthesis (Step 4)**: Synthesizes high-quality, young, energetic children's vocals matching the lyrics via ElevenLabs or Gemini TTS (`gemini-3.1-flash-tts-preview`).
5. **Audio Mixing (Step 5)**: Uses local **FFmpeg** to seamlessly mix voice and instrumental backing layers into a master `song.wav`.
6. **Scene Illustration (Step 6)**: Generates premium 16:9 Pixar-style illustrations for each storyboard scene parallelly using Higgsfield or **Gemini Image Generation** (`gemini-3.1-flash-image`).
7. **Clip Animation (Step 7)**: Animates scene frames using Higgsfield's image-to-video API or executes local, high-fidelity Ken Burns panning/zooming filters with FFmpeg.
8. **Karaoke Subtitles (Step 8)**: Translates storyboard timings into a beautifully styled Advanced SubStation Alpha (`.ass`) karaoke subtitle file.
9. **FFmpeg Assembly (Step 9)**: Blends the animated scene video clips, binds the mixed master audio, and burns the styled subtitles into a single production-ready 1080p 30fps H264/AAC MP4 video.
10. **Data Archival (Step 10)**: Commits all final assets, intermediate states, and logs to `storage/projects/{project_id}/`.

---

## 📁 Workspace Folder Structure

```text
/
├── server.ts                 # Master full-stack Express server
├── package.json              # Dependency manifest (Vite, TSX, Esbuild)
├── tsconfig.json             # TypeScript rules
├── vite.config.ts            # Vite compiler alias & reverse proxy configurations
├── src/
│   ├── App.tsx               # Whimsical React Creative Studio Dashboard
│   ├── index.css             # Tailwind style sheets
│   ├── main.tsx              # React mounting root
│   ├── types.ts              # Global robust shared types
│   └── server/
│       └── services/
│           ├── ai.ts         # Claude, ElevenLabs, Higgsfield & Gemini API Client
│           ├── video.ts      # FFmpeg command builders & Synthesizers
│           └── queue.ts      # Persistent Job Queue & Generation logging
├── storage/                  # Local assets persistence (Created on startup)
│   ├── projects/             # Completed & Active project compilation targets
│   │   └── proj_xxxxxx/      # Specific project directory
│   │       ├── lyrics.txt
│   │       ├── storyboard.json
│   │       ├── project.json  # Comprehensive operational costs & stats metadata
│   │       ├── generation.log # Detailed step-by-step logs with timestamps
│   │       ├── music.mp3     # Instrumental stem
│   │       ├── vocals.wav    # Voice stem
│   │       ├── song.wav      # Master mixdown
│   │       ├── subtitles.ass # Styled subtitle source
│   │       ├── output.mp4    # Final exported H264 MP4 children's video
│   │       ├── images/       # Extracted 16:9 illustration frames
│   │       └── animations/   # Generated 15-second movie clips
│   ├── music/
│   ├── videos/
│   ├── images/
│   └── temp/
└── logs/                     # Global service logger targets
```

---

## ⚙️ Ubuntu 24.04 LTS Installation Guide

Follow these simple steps to install all necessary prerequisites and launch the application on a fresh Ubuntu 24.04 LTS Linux server:

### 1. Update Packages & Install FFmpeg
Log into your Linux terminal and install the essential build utilities and FFmpeg (including `libass` for burning subtitles):
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential curl ffmpeg libass-dev git
```

Verify that FFmpeg is successfully installed with subtitle capabilities:
```bash
ffmpeg -version
```

### 2. Install Node.js LTS
Install Node.js 20+ using Node Source:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify that Node and NPM are ready:
```bash
node -v
npm -v
```

### 3. Clone and Configure Secrets
Clone your project repository, go to the root folder, and create your production environment configuration file:
```bash
cp .env.example .env
```

Open `.env` in your favorite terminal editor (e.g., `nano`) and configure your API credentials:
```env
# Server Ingress Port
PORT=3000

# Required for default zero-config backings
GEMINI_API_KEY="your_gemini_api_key"

# Optional (Set to enable premium third-party AI models)
CLAUDE_API_KEY="your_anthropic_claude_api_key"
ELEVENLABS_API_KEY="your_eleven_labs_api_key"
HIGGSFIELD_API_KEY="your_higgsfield_api_key"
```

---

## 🏃 Run Instructions

### Development Server
Launches the full-stack Express service alongside Vite's Hot-Reload middleware:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view your dashboard.

### Production Compiling & Starting
Bundles both client-side static assets (Vite) and server-side ESM modules (Esbuild) for lightning-fast container startups:
```bash
npm run build
npm start
```

---

## 🛡️ Production Daemon Setup (Systemd)

To ensure the Children's Song generator automatically restarts upon server reboots or exceptions, create a systemd background daemon:

1. Create a service file:
```bash
sudo nano /etc/systemd/system/lullaby.service
```

2. Paste the following configuration (replace `/path/to/your/app` with your absolute project folder path, and `ubuntu` with your standard Linux user):
```ini
[Unit]
Description=LullabyAI Studio Production Daemon
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/path/to/your/app
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=NODE_ENV=production
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

3. Enable and boot up the background service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable lullaby
sudo systemctl start lullaby
```

4. Monitor live daemon logs:
```bash
sudo systemctl status lullaby
sudo journalctl -u lullaby -f --no-pager
```
