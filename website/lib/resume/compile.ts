// Compile a LaTeX string to a PDF buffer using a local TeX engine.
//
// Graceful degradation: if no engine is installed (e.g. a typical serverless
// runtime), compile() returns { pdf: null, available: false } and the caller
// still ships the .tex source. Point LATEX_ENGINE at a binary, or swap in a
// hosted compiler later, without touching callers.

import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface CompileResult {
  pdf: Buffer | null;
  available: boolean; // a toolchain was found and ran
  engine: string | null;
  log: string;
}

const ENGINES = process.env.LATEX_ENGINE
  ? [process.env.LATEX_ENGINE]
  : ['pdflatex', 'xelatex', 'lualatex'];

const TIMEOUT_MS = Number(process.env.LATEX_TIMEOUT_MS ?? 30_000);

interface RunOutput {
  code: number | null;
  out: string;
  missing: boolean; // engine binary not found (ENOENT)
  timedOut: boolean;
}

function runEngine(engine: string, dir: string, file: string): Promise<RunOutput> {
  return new Promise((resolve) => {
    let out = '';
    let timedOut = false;
    let child;
    try {
      child = spawn(
        engine,
        ['-interaction=nonstopmode', '-halt-on-error', '-no-shell-escape', file],
        { cwd: dir },
      );
    } catch {
      resolve({ code: null, out: '', missing: true, timedOut: false });
      return;
    }

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, TIMEOUT_MS);

    child.on('error', (err: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      resolve({ code: null, out, missing: err.code === 'ENOENT', timedOut });
    });
    child.stdout?.on('data', (d) => (out += d.toString()));
    child.stderr?.on('data', (d) => (out += d.toString()));
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, out, missing: false, timedOut });
    });
  });
}

export async function compileLatex(tex: string): Promise<CompileResult> {
  const dir = await mkdtemp(join(tmpdir(), 'referrai-tex-'));
  const texPath = join(dir, 'resume.tex');
  const pdfPath = join(dir, 'resume.pdf');

  try {
    await writeFile(texPath, tex, 'utf8');

    let lastLog = '';
    for (const engine of ENGINES) {
      const res = await runEngine(engine, dir, 'resume.tex');
      if (res.missing) continue; // try next engine
      lastLog = res.out;

      if (res.timedOut) {
        return { pdf: null, available: true, engine, log: 'LaTeX compilation timed out.' };
      }

      try {
        const pdf = await readFile(pdfPath);
        if (pdf.length > 0) {
          return { pdf, available: true, engine, log: res.out };
        }
      } catch {
        // No PDF produced — compilation error. Surface the tail of the log.
        return { pdf: null, available: true, engine, log: tailLog(res.out) };
      }
    }

    // No engine was found at all.
    return {
      pdf: null,
      available: false,
      engine: null,
      log: lastLog || 'No LaTeX engine found (pdflatex/xelatex/lualatex).',
    };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

let cachedAvailability: boolean | null = null;

// Cheap one-time probe so the UI/route can tell the user whether PDFs will compile.
export async function isLatexAvailable(): Promise<boolean> {
  if (cachedAvailability !== null) return cachedAvailability;
  for (const engine of ENGINES) {
    const ok = await new Promise<boolean>((resolve) => {
      let child;
      try {
        child = spawn(engine, ['--version']);
      } catch {
        resolve(false);
        return;
      }
      child.on('error', () => resolve(false));
      child.on('close', (code) => resolve(code === 0));
    });
    if (ok) {
      cachedAvailability = true;
      return true;
    }
  }
  cachedAvailability = false;
  return false;
}

function tailLog(log: string, lines = 25): string {
  const arr = log.split('\n');
  return arr.slice(Math.max(0, arr.length - lines)).join('\n');
}
