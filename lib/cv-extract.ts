'use client';

/* "Fill from CV" — pull contact details out of a dropped PDF.
 *
 * This was deliberately out of scope in the original product analysis
 * ("STORE the PDF file only") and was added on request on 7 Aug 2026.
 *
 * Everything happens in the browser: the file is read locally, and nothing is
 * uploaded or sent anywhere to do the extraction. pdf.js is loaded on demand
 * the first time someone uses the feature, so it stays out of the main bundle.
 *
 * These are heuristics, not magic. Email, phone and LinkedIn are near enough
 * exact — they have shapes worth matching. Name and location are guesses from
 * how CVs are usually laid out, and will sometimes be wrong or empty. That is
 * expected: the form is prefilled, never submitted, and every field stays
 * editable. DOCX is not supported — only PDFs carry extractable text here.
 */

export interface ExtractedFields {
  name: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  location: string;
}

export interface ExtractionResult extends ExtractedFields {
  /* Which fields we actually found, so the UI can say so honestly. */
  found: (keyof ExtractedFields)[];
  missing: (keyof ExtractedFields)[];
  textLength: number;
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/(?:in|pub)\/[A-Za-z0-9_%-]+\/?/i;

/* Deliberately conservative: at least 9 digits, so it does not match years,
 * postcodes or "0 to 1 year of experience". */
const PHONE_RE = /(?:\+?\d[\d\s().-]{8,}\d)/;

/* Words that appear next to a location on a CV, and country/city hints for
 * the region this tool is used in. Kept short on purpose — a huge gazetteer
 * would produce confident wrong answers. */
const LOCATION_HINTS = [
  'egypt', 'cairo', 'giza', 'alexandria', 'sheikh zayed', 'new cairo', 'maadi',
  'nasr city', 'heliopolis', '6th of october', 'zamalek', 'dokki', 'mohandessin',
  'uae', 'dubai', 'abu dhabi', 'saudi', 'riyadh', 'jeddah', 'qatar', 'doha',
  'kuwait', 'bahrain', 'jordan', 'amman', 'lebanon', 'beirut', 'morocco',
  'tunisia', 'united kingdom', 'london', 'manchester', 'germany', 'berlin',
  'netherlands', 'amsterdam', 'france', 'paris', 'spain', 'madrid', 'remote',
];

const NAME_STOPWORDS = [
  'curriculum', 'vitae', 'resume', 'résumé', 'cv', 'profile', 'contact',
  'personal', 'details', 'summary', 'objective', 'about', 'experience',
  'education', 'skills', 'portfolio', 'linkedin', 'email', 'phone', 'mobile',
  'address', 'career',
];

/* Read the text layer out of a PDF. Returns '' for a scanned/image-only PDF —
 * there is no OCR here, and pretending otherwise would be worse than saying
 * nothing was found. */
async function pdfToText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  /* The worker ships with the package; point at the copy in /public so it is
   * served from our own origin (a CDN would break the CSP-free setup and add
   * a third-party dependency at runtime). */
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: buffer });
  const doc = await loadingTask.promise;

  /* Contact details are essentially always on page 1; read a few pages in
   * case of a cover page, but do not grind through a 20-page portfolio. */
  const pageCount = Math.min(doc.numPages, 3);
  const parts: string[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    /* Group items into lines by their vertical position — pdf.js returns
     * loose text runs, and a CV's layout matters for finding the name. */
    const lines = new Map<number, string[]>();
    for (const item of content.items) {
      const it = item as { str?: string; transform?: number[] };
      if (!it.str || !it.str.trim() || !it.transform) continue;
      const y = Math.round(it.transform[5]);
      const bucket = lines.get(y) ?? [];
      bucket.push(it.str);
      lines.set(y, bucket);
    }
    const ordered = [...lines.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, runs]) => runs.join(' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    parts.push(ordered.join('\n'));
  }

  await loadingTask.destroy();
  return parts.join('\n');
}

function looksLikeName(line: string): boolean {
  const t = line.trim();
  if (t.length < 3 || t.length > 60) return false;
  if (/[@\d]/.test(t)) return false;
  if (t.includes('://') || t.includes('www.')) return false;
  const lower = t.toLowerCase();
  if (NAME_STOPWORDS.some((w) => lower.includes(w))) return false;
  const words = t.split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  /* Mostly letters, allowing accents, apostrophes and hyphens. */
  if (!/^[\p{L}][\p{L}'’.-]*(\s+[\p{L}][\p{L}'’.-]*)+$/u.test(t)) return false;
  /* Reject SHOUTED section headers that happen to be two words. */
  const capitalised = words.filter((w) => /^[\p{Lu}]/u.test(w)).length;
  return capitalised >= words.length - 1;
}

function findName(text: string): string {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  /* A CV almost always leads with the person's name. */
  for (const line of lines.slice(0, 12)) {
    if (looksLikeName(line)) return line.replace(/\s+/g, ' ');
  }
  return '';
}

function findLocation(text: string): string {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 30)) {
    const lower = line.toLowerCase();
    if (!LOCATION_HINTS.some((h) => lower.includes(h))) continue;
    /* Strip anything that is clearly not part of a place name. */
    const cleaned = line
      .replace(EMAIL_RE, '')
      .replace(LINKEDIN_RE, '')
      .replace(PHONE_RE, '')
      .replace(/[|•·]/g, ',')
      .replace(/\s*,\s*/g, ', ')
      .replace(/^[\s,–-]+|[\s,–-]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned.length >= 3 && cleaned.length <= 80) return cleaned;
  }
  return '';
}

function normaliseLinkedin(raw: string): string {
  let v = raw.trim().replace(/[.,;)]+$/, '');
  if (!/^https?:\/\//i.test(v)) v = 'https://' + v.replace(/^\/+/, '');
  return v;
}

function normalisePhone(raw: string): string {
  return raw.trim().replace(/[().]/g, '').replace(/\s+/g, ' ').replace(/-+/g, '-');
}

export async function extractFromCv(file: File): Promise<ExtractionResult> {
  const name = file.name.toLowerCase();
  if (!name.endsWith('.pdf')) {
    throw new Error(
      'Only PDFs can be read automatically. Attach a DOCX and fill the fields in yourself.'
    );
  }

  let text = '';
  try {
    text = await pdfToText(file);
  } catch {
    throw new Error('That PDF could not be read. Fill the fields in yourself and it will still upload.');
  }

  if (text.trim().length < 20) {
    throw new Error(
      'No readable text in that PDF — it is probably a scan or an image. Fill the fields in yourself; the file still uploads fine.'
    );
  }

  const fields: ExtractedFields = {
    name: findName(text),
    email: (text.match(EMAIL_RE) ?? [''])[0].trim(),
    phone: normalisePhone((text.match(PHONE_RE) ?? [''])[0]),
    linkedinUrl: (() => {
      const m = text.match(LINKEDIN_RE);
      return m ? normaliseLinkedin(m[0]) : '';
    })(),
    location: findLocation(text),
  };

  const keys = Object.keys(fields) as (keyof ExtractedFields)[];
  return {
    ...fields,
    found: keys.filter((k) => fields[k] !== ''),
    missing: keys.filter((k) => fields[k] === ''),
    textLength: text.length,
  };
}
