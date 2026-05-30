// Extracts audio from a video File using the Web Audio API and encodes it as a WAV Blob.
// Zero npm dependencies — WAV is a trivial fixed-header + raw PCM format.

const SAMPLE_RATE = 16000;       // Whisper's native rate
const MAX_DURATION_S = 120;       // cap at 2 min to stay under body size limits

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);           // subchunk size
  view.setUint16(20, 1, true);            // PCM
  view.setUint16(22, 1, true);            // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true);            // block align
  view.setUint16(34, 16, true);           // bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return buffer;
}

export async function extractAudio(file: File): Promise<Blob | null> {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    const arrayBuffer = await file.arrayBuffer();

    const tempCtx = new AudioCtx();
    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await tempCtx.decodeAudioData(arrayBuffer.slice(0));
    } catch {
      await tempCtx.close().catch(() => {});
      return null; // no audio track or unsupported format
    }
    await tempCtx.close().catch(() => {});

    const capDuration = Math.min(audioBuffer.duration, MAX_DURATION_S);
    const sampleCount = Math.ceil(capDuration * SAMPLE_RATE);

    const offlineCtx = new OfflineAudioContext(1, sampleCount, SAMPLE_RATE);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const rendered = await offlineCtx.startRendering();
    const channelData = rendered.getChannelData(0);
    const wavBuffer = encodeWAV(channelData, SAMPLE_RATE);

    return new Blob([wavBuffer], { type: 'audio/wav' });
  } catch {
    return null;
  }
}
