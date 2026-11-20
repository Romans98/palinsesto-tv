/**
 * Registra un video dimostrativo dell'app vera, pilotando Chrome con Playwright.
 *
 * Uso: npm run demo:record
 * (esegue la build, avvia `vite preview`, registra e salva il video in docs/demo.webm;
 * per GitHub va poi convertito in MP4 con `npm run demo:mp4`)
 *
 * Durante la registrazione vengono aggiunti alla pagina solo un cursore visibile
 * e una didascalia per scena: l'app è quella reale, con i dati demo iniziali.
 */
import { spawn } from 'node:child_process';
import { mkdir, readdir, rename, rm } from 'node:fs/promises';
import { setTimeout as wait } from 'node:timers/promises';
import { chromium } from 'playwright-core';

const PORT = 4400;
const URL = `http://localhost:${PORT}`;
const VIEWPORT = { width: 1280, height: 720 };
const OUTPUT_DIR = 'docs';
const RAW_DIR = 'docs/.video-raw';

// --- overlay: cursore visibile e didascalie --------------------------------

const overlayScript = () => {
  const install = () => {
    const cursor = document.createElement('div');
    Object.assign(cursor.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '18px',
      height: '18px',
      marginLeft: '-9px',
      marginTop: '-9px',
      borderRadius: '50%',
      background: 'rgba(26, 102, 210, 0.35)',
      border: '2px solid #1a66d2',
      zIndex: '2147483647',
      pointerEvents: 'none',
      transition: 'transform 120ms ease-out',
    });
    document.body.appendChild(cursor);
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    });
    document.addEventListener('mousedown', () => (cursor.style.transform = 'scale(0.7)'));
    document.addEventListener('mouseup', () => (cursor.style.transform = 'scale(1)'));

    const caption = document.createElement('div');
    Object.assign(caption.style, {
      position: 'fixed',
      left: '50%',
      top: '6px',
      transform: 'translateX(-50%)',
      whiteSpace: 'nowrap',
      padding: '8px 16px',
      borderRadius: '8px',
      background: 'rgba(31, 41, 51, 0.92)',
      color: '#fff',
      font: '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      textAlign: 'center',
      zIndex: '2147483646',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 200ms',
    });
    document.body.appendChild(caption);
    window.__caption = (text) => {
      caption.textContent = text;
      caption.style.opacity = text ? '1' : '0';
    };
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
};

// --- helper ----------------------------------------------------------------

async function startPreview() {
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(URL);
      return server;
    } catch {
      await wait(200);
    }
  }
  server.kill();
  throw new Error('vite preview non risponde');
}

function createDirector(page) {
  const caption = (text) => page.evaluate((t) => window.__caption(t), text);

  /** Porta il cursore sull'elemento con un movimento visibile e clicca */
  const click = async (locator) => {
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    if (!box) throw new Error('Elemento non visibile');
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y, { steps: 25 });
    await wait(250);
    await page.mouse.click(x, y);
  };

  const type = (text) => page.keyboard.type(text, { delay: 140 });
  const press = (key) => page.keyboard.press(key);
  const row = (title) => page.locator('tbody tr', { hasText: title }).first();

  return { caption, click, type, press, row };
}

// --- scene -----------------------------------------------------------------

async function record(page) {
  const { caption, click, type, press, row } = createDirector(page);
  const panelButton = (name) => page.getByRole('button', { name, exact: true });
  const dialog = page.getByRole('dialog');

  await page.goto(URL);
  await page.mouse.move(640, 360);
  await wait(800);

  // 1. Il palinsesto
  await caption('Palinsesto con timecode a 25 fps, programmi a orario fisso e pubblicità calcolata');
  await wait(4000);

  // 2. Cascata e sforamento
  await caption('Allungo «Buongiorno a Tutti» di 10 minuti: i programmi successivi slittano');
  await click(row('Buongiorno a Tutti').getByTitle('Modifica la durata'));
  await wait(500);
  await type('02100000');
  await wait(600);
  await press('Enter');
  await wait(1500);
  await caption('La «Rassegna Stampa» delle 09:00 non si sposta: lo sforamento viene segnalato');
  await wait(4000);

  // 3. Tronca
  await caption('«Tronca» accorcia il programma per finire esattamente alle 09:00');
  await click(row('Cartoni Animati').getByRole('button', { name: 'Tronca' }));
  await wait(2000);
  await click(dialog.getByRole('button', { name: 'Tronca' }));
  await wait(2500);

  // 4. Conflitto
  await caption('Concorrenza: inizio a modificare la durata del «Telefilm»…');
  await click(row('Telefilm').getByTitle('Modifica la durata'));
  await wait(500);
  await type('00500000');
  await wait(800);
  await caption('…intanto un altro utente modifica lo stesso programma');
  await click(panelButton('+2 min'));
  await wait(3500);
  await caption('Salvo comunque: i dati sono cambiati, scelgo io quale valore tenere');
  await press('Enter');
  await wait(3500);
  await click(dialog.getByRole('button', { name: 'Usa il mio' }));
  await wait(2000);

  // 5. Modifica di un altro utente
  await caption('Le modifiche degli altri: riga evidenziata e notifica');
  await click(row('Talk Show').locator('td').nth(3));
  await wait(600);
  await click(panelButton('+2 min'));
  // deseleziono la riga per mostrare l'evidenziazione della modifica remota
  await click(row('Talk Show').locator('td').nth(3));
  await wait(3000);

  // 6. Eliminazione
  await caption('Elimino «Soap Opera»: i programmi successivi si anticipano');
  await click(page.getByRole('button', { name: 'Elimina Soap Opera' }).first());
  await wait(2000);
  await click(dialog.getByRole('button', { name: 'Elimina' }));
  await wait(1500);
  await caption('…la pubblicità prima delle 20:00 supera i 12 minuti e viene segnalata');
  await page.locator('tbody tr', { hasText: 'Oltre 12 minuti' }).first().scrollIntoViewIfNeeded();
  await wait(4000);

  await caption('');
  await wait(800);
}

// --- main ------------------------------------------------------------------

const server = await startPreview();
const browser = await chromium.launch({ channel: 'chrome' });
try {
  await rm(RAW_DIR, { recursive: true, force: true });
  await mkdir(RAW_DIR, { recursive: true });

  const context = await browser.newContext({ viewport: VIEWPORT, recordVideo: { dir: RAW_DIR, size: VIEWPORT } });
  await context.addInitScript(overlayScript);
  const page = await context.newPage();
  await record(page);
  await context.close();

  const [file] = await readdir(RAW_DIR);
  await rename(`${RAW_DIR}/${file}`, `${OUTPUT_DIR}/demo.webm`);
  await rm(RAW_DIR, { recursive: true, force: true });
  console.log(`Video salvato in ${OUTPUT_DIR}/demo.webm`);
} finally {
  await browser.close();
  server.kill();
}
