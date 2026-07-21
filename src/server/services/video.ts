import { exec, spawn } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import { StoryboardScene } from "../../types.js";

export class VideoService {
  /**
   * Generates a beautiful ASS Subtitle file for karaoke style
   */
  public static async generateAssSubtitles(
    scenes: StoryboardScene[],
    outputPath: string
  ): Promise<void> {
    let events = "";

    // Add a title slide subtitle if needed, or map each scene's subtitle/lyrics
    for (const scene of scenes) {
      const startStr = this.formatTimeForAss(scene.timeStart);
      const endStr = this.formatTimeForAss(scene.timeEnd);
      const text = scene.subtitle.replace(/"/g, '\\"');

      // Dialogue line
      events += `Dialogue: 0,${startStr},${endStr},Karaoke,,0,0,0,,{\\fad(300,300)}${text}\n`;
    }

    const content = `[Script Info]
Title: Children Song Karaoke
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Karaoke,Comic Sans MS,54,&H00FFFFFF,&H0000FFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,3,1,2,30,30,100,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events}`;

    await fs.writeFile(outputPath, content, "utf-8");
  }

  private static formatTimeForAss(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);

    const pad = (num: number, size: number) => num.toString().padStart(size, "0");
    return `${hours}:${pad(mins, 2)}:${pad(secs, 2)}.${pad(ms, 2)}`;
  }

  /**
   * Synthesizes a cute, upbeat children's instrumental track programmatically.
   * This is a 100% reliable local fallback generating a beautiful 8-bit WAV.
   */
  public static async synthesizeProceduralMusic(
    outputPath: string,
    durationSeconds: number
  ): Promise<void> {
    const sampleRate = 22050;
    const numSamples = sampleRate * durationSeconds;
    const buffer = Buffer.alloc(44 + numSamples * 2); // 44 bytes WAV header + 16-bit PCM

    // Write WAV header
    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(36 + numSamples * 2, 4);
    buffer.write("WAVE", 8);
    buffer.write("fmt ", 12);
    buffer.writeUInt32LE(16, 16); // subchunk1size
    buffer.writeUInt16LE(1, 20); // audio format (PCM)
    buffer.writeUInt16LE(1, 22); // num channels (1 - mono)
    buffer.writeUInt32LE(sampleRate, 24); // sample rate
    buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
    buffer.writeUInt16LE(2, 32); // block align
    buffer.writeUInt16LE(16, 34); // bits per sample
    buffer.write("data", 36);
    buffer.writeUInt32LE(numSamples * 2, 40);

    // Chords progress: C (I) -> G (V) -> Am (vi) -> F (IV)
    // Twinkle-like simple arpeggio
    const chords = [
      [261.63, 329.63, 392.0], // C (C4, E4, G4)
      [196.0, 246.94, 293.66], // G (G3, B3, D4)
      [220.0, 261.63, 329.63], // Am (A3, C4, E4)
      [174.61, 220.0, 261.63], // F (F3, A3, C4)
    ];

    const notes = [
      261.63, 261.63, 392.0, 392.0, 440.0, 440.0, 392.0, // Twinkle Twinkle Little Star
      349.23, 349.23, 329.63, 329.63, 293.66, 293.66, 261.63,
    ];

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;

      // Determine bar and beat (assume 120 bpm, 2 beats per second)
      const beat = Math.floor(t * 2);
      const chordIndex = Math.floor(beat / 4) % chords.length;
      const currentChord = chords[chordIndex];

      // Base layer: Chords synth (triangle-like wave)
      let baseVal = 0;
      for (const freq of currentChord) {
        baseVal += Math.asin(Math.sin(2 * Math.PI * freq * t)) / Math.PI; // Triangle wave
      }
      baseVal /= 3;

      // Lead layer: Simple nursery melody (pulse wave with envelope)
      const noteIndex = Math.floor(beat) % notes.length;
      const noteFreq = notes[noteIndex];
      const beatProgress = (t * 2) % 1;
      const envelope = Math.max(0, 1 - beatProgress * 1.5); // decay effect

      const leadVal = (Math.sin(2 * Math.PI * noteFreq * t) > 0 ? 1 : -1) * 0.15 * envelope;

      // Combine, master volume and write 16-bit signed PCM
      const mixed = (baseVal * 0.25 + leadVal) * 0.8;
      const sample = Math.floor(Math.max(-1, Math.min(1, mixed)) * 32767);
      buffer.writeInt16LE(sample, offset);
      offset += 2;
    }

    await fs.writeFile(outputPath, buffer);
  }

  /**
   * Helper to run an external command safely
   */
  private static runCommand(cmd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`${error.message}\nStderr: ${stderr}`));
        } else {
          resolve(stdout);
        }
      });
    });
  }

  /**
   * Compiles scene images into animated scene clips using FFmpeg's zoompan filter (Ken Burns effect)
   */
  public static async animateSceneImage(
    imagePath: string,
    outputPath: string,
    duration: number,
    logFn: (msg: string) => void
  ): Promise<void> {
    logFn(`Rendering smooth Ken Burns animation for ${imagePath}...`);

    // We animate at 30 fps. Number of frames = duration * 30
    const framesCount = duration * 30;

    // High quality Ken Burns pan/zoom filter
    const filter = `zoompan=z='min(zoom+0.0005,1.1)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${framesCount}:s=1920x1080`;

    const cmd = `ffmpeg -y -loop 1 -i "${imagePath}" -vf "${filter}" -c:v libx264 -t ${duration} -pix_fmt yuv420p -r 30 "${outputPath}"`;

    await this.runCommand(cmd);
    logFn(`Scene animation rendered successfully: ${outputPath}`);
  }

  /**
   * Mix vocals and music together
   */
  public static async mixAudio(
    vocalsPath: string,
    musicPath: string,
    outputPath: string,
    duration: number,
    logFn: (msg: string) => void
  ): Promise<void> {
    logFn(`Mixing vocals and instrumental tracks...`);
    const hasVocals = await fs.stat(vocalsPath).then((s) => s.size > 100).catch(() => false);
    const hasMusic = await fs.stat(musicPath).then((s) => s.size > 100).catch(() => false);

    if (hasVocals && hasMusic) {
      // amix filter mixes inputs. We lower music volume slightly to keep vocals clear.
      const filter = `[0:a]volume=1.0[v];[1:a]volume=0.45[m];[v][m]amix=inputs=2:duration=longest:dropout_transition=2[out]`;
      const cmd = `ffmpeg -y -i "${vocalsPath}" -i "${musicPath}" -filter_complex "${filter}" -map "[out]" "${outputPath}"`;
      await this.runCommand(cmd);
    } else if (hasVocals) {
      logFn("Only vocals found, copying to final song output...");
      await fs.copyFile(vocalsPath, outputPath);
    } else if (hasMusic) {
      logFn("Only background music found, copying to final song output...");
      await fs.copyFile(musicPath, outputPath);
    } else {
      logFn(`No valid audio files available to mix. Generating a silent track of ${duration} seconds...`);
      const cmd = `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${duration} "${outputPath}"`;
      await this.runCommand(cmd);
    }
    logFn(`Mixed audio successfully: ${outputPath}`);
  }

  /**
   * Assembles final children's music video from animated scenes, song audio, and overlays the ASS karaoke subtitles.
   */
  public static async renderFinalVideo(
    scenePaths: string[],
    songAudioPath: string,
    subtitlePath: string,
    outputPath: string,
    logFn: (msg: string) => void
  ): Promise<void> {
    logFn(`Starting final H264 MP4 render pipeline...`);

    // 1. Generate transition/concatenation list file for ffmpeg concat demuxer
    const concatListPath = path.join(path.dirname(outputPath), "concat_list.txt");
    let concatContent = "";
    for (const p of scenePaths) {
      concatContent += `file '${path.resolve(p)}'\n`;
    }
    await fs.writeFile(concatListPath, concatContent, "utf-8");

    // 2. Perform the concatenation & audio mix & subtitle burn in
    // Note: To burn ASS subtitles, we use the "ass" or "subtitles" filter.
    // Ensure subtitle path has escaped slashes and colons for ffmpeg's filter parsing.
    const escapedSubPath = subtitlePath.replace(/\\/g, "/").replace(/:/g, "\\:");

    logFn(`Overlaying Subtitles: ${subtitlePath}`);

    // Concat the videos, mix the song audio, and burn in the ASS subtitles
    const cmd = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -i "${songAudioPath}" -vf "ass='${escapedSubPath}'" -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest -b:v 4000k -b:a 192k "${outputPath}"`;

    await this.runCommand(cmd);

    // Clean up temporary list file
    await fs.unlink(concatListPath).catch(() => {});

    logFn(`SUCCESS! Video compiled to production quality MP4: ${outputPath}`);
  }
}
