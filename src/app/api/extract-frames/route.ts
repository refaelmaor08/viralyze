import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, readdir, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegPath: string | null = require('ffmpeg-static');
import { buildTimestamps } from '@/lib/buildTimestamps';

export const maxDuration = 120;
export const runtime = 'nodejs';

const execFileAsync = promisify(execFile);

const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200 MB

export async function POST(req: NextRequest): Promise<NextResponse> {
  const sessionId = randomBytes(8).toString('hex');
  const videoPath = join(tmpdir(), `vz_${sessionId}.video`);
  const frameDir  = join(tmpdir(), `vz_frames_${sessionId}`);

  try {
    const formData = await req.formData();
    const videoFile = formData.get('video') as File | null;
    const durationStr = formData.get('duration') as string | null;

    if (!videoFile) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    // Validate file type — accept any video MIME or empty type (common on iOS)
    const mimeType = videoFile.type || '';
    const isVideoByMime = !mimeType || mimeType.startsWith('video/');
    const isVideoByExt  = /\.(mp4|mov|m4v|webm|avi|hevc|mkv|3gp)$/i.test(videoFile.name);
    if (!isVideoByMime && !isVideoByExt) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate size
    if (videoFile.size > MAX_VIDEO_BYTES) {
      return NextResponse.json(
        { error: 'הסרטון גדול מדי (מקסימום 200MB עבור עיבוד שרת)' },
        { status: 413 },
      );
    }

    if (!ffmpegPath) {
      return NextResponse.json({ error: 'FFmpeg not available' }, { status: 500 });
    }

    const duration = durationStr ? parseFloat(durationStr) : 0;

    // Write video to temp file — all arguments below are hardcoded constants
    const videoBuffer = await videoFile.arrayBuffer();
    await writeFile(videoPath, Buffer.from(videoBuffer));
    await mkdir(frameDir, { recursive: true });

    // Extract at 2fps — covers hook zone (0.5s intervals) and gives dense body coverage.
    // scale=480:-2 preserves aspect ratio, rounds height to even (required by many codecs).
    // All FFmpeg arguments are hardcoded; no user input is passed to the command.
    const ffmpegArgs = [
      '-hide_banner',
      '-loglevel', 'error',
      '-i', videoPath,
      '-vf', 'fps=2,scale=480:-2:flags=lanczos',
      '-q:v', '5',
      '-f', 'image2',
      join(frameDir, 'frame_%04d.jpg'),
    ];

    await execFileAsync(ffmpegPath, ffmpegArgs, {
      timeout: 85_000,
      maxBuffer: 4 * 1024 * 1024,
    });

    // Enumerate extracted frames (sorted: frame_0001.jpg, frame_0002.jpg, ...)
    const frameFiles = (await readdir(frameDir))
      .filter((f) => f.endsWith('.jpg'))
      .sort();

    if (frameFiles.length === 0) {
      return NextResponse.json({ error: 'FFmpeg extracted 0 frames' }, { status: 422 });
    }

    // Each frame N (1-indexed) corresponds to t = (N-1) * 0.5s at fps=2
    const FPS = 2;
    const allTs = frameFiles.map((_, i) => parseFloat(((i) / FPS).toFixed(2)));
    const actualDuration = duration > 0 ? duration : frameFiles.length / FPS;

    // Select frames closest to the buildTimestamps targets (same logic as browser path)
    const targets = buildTimestamps(actualDuration);
    const used = new Set<number>();
    const selectedIndices: number[] = [];

    for (const target of targets) {
      let bestIdx = -1;
      let bestDist = Infinity;
      for (let i = 0; i < allTs.length; i++) {
        if (used.has(i)) continue;
        const dist = Math.abs(allTs[i] - target);
        if (dist < bestDist) { bestDist = dist; bestIdx = i; }
      }
      if (bestIdx >= 0) { used.add(bestIdx); selectedIndices.push(bestIdx); }
    }

    // Sort by ascending timestamp
    selectedIndices.sort((a, b) => allTs[a] - allTs[b]);

    // Read selected frames as base64 JPEG data URLs
    const frames: string[] = [];
    const frameTimestamps: number[] = [];

    for (const idx of selectedIndices) {
      const frameBuf = await readFile(join(frameDir, frameFiles[idx]));
      frames.push(`data:image/jpeg;base64,${frameBuf.toString('base64')}`);
      frameTimestamps.push(allTs[idx]);
    }

    return NextResponse.json({
      frames,
      frameTimestamps,
      sceneChanges: [] as number[],
      editingPace: 'medium' as const,
      cutsPerSecond: 0,
      extractionPath: 'server-ffmpeg',
    });

  } finally {
    // Always remove temp files — never leave video data on disk
    await Promise.allSettled([
      rm(videoPath, { force: true }),
      rm(frameDir, { recursive: true, force: true }),
    ]);
  }
}
