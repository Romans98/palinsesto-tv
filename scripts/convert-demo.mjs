/**
 * Converte il video registrato (docs/demo.webm) in MP4 H.264, il formato che GitHub
 * riproduce quando il video viene caricato nel README dall'editor web.
 *
 * Uso: npm run demo:mp4
 * Richiede il pacchetto di sviluppo `ffmpeg-static` (npm install -D ffmpeg-static).
 */
import { execFile } from 'node:child_process';
import { stat } from 'node:fs/promises';
import { promisify } from 'node:util';

const INPUT = 'docs/demo.webm';
const OUTPUT = 'docs/demo.mp4';

let ffmpeg;
try {
  ({ default: ffmpeg } = await import('ffmpeg-static'));
} catch {
  console.error('ffmpeg-static non è installato: esegui "npm install -D ffmpeg-static" e riprova.');
  process.exit(1);
}

await promisify(execFile)(ffmpeg, [
  '-y',
  '-i', INPUT,
  '-c:v', 'libx264',
  '-pix_fmt', 'yuv420p', // compatibile con tutti i lettori, compreso quello di GitHub
  '-crf', '23',
  '-preset', 'slow',
  '-movflags', '+faststart', // la riproduzione parte prima che il file sia scaricato tutto
  '-an',
  OUTPUT,
]);

const { size } = await stat(OUTPUT);
console.log(`Video salvato in ${OUTPUT} (${(size / 1024 / 1024).toFixed(1)} MB)`);
