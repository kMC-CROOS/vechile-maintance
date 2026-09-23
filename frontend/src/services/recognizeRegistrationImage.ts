import type { Worker, ImageLike } from 'tesseract.js';
import { locateRCRegions, rcRegionToLines } from './rcBookLayout';
import { extractSriLankaRegistrationData } from './sriLankaRegistrationExtractionService';

export async function recognizeRegistrationImage(worker: Worker, image: ImageLike, width: number, height: number,
  onProgress?: (message: string) => void) {
  const { data } = await worker.recognize(image, {}, { text: true, blocks: true });
  const lines = data.blocks?.flatMap((b) => b.paragraphs.flatMap((p) => p.lines)) ?? [];
  const regions = locateRCRegions(lines, width, height);
  if (!regions.length) {
    return extractSriLankaRegistrationData(data.text, lines.map((line) => ({ text: line.text, confidence: line.confidence })));
  }
  const extractedLines = [];
  await worker.setParameters({ tessedit_pageseg_mode: '6' as import('tesseract.js').PSM });
  for (const [index, region] of regions.entries()) {
    onProgress?.(`Reading document box ${index + 1} of ${regions.length}...`);
    const { data: cell } = await worker.recognize(image, { rectangle: {
      left: region.left, top: region.top, width: region.width, height: region.height,
    } }, { text: true });
    extractedLines.push(...rcRegionToLines(region.key, cell.text, cell.confidence));
  }
  const result = extractSriLankaRegistrationData(extractedLines.map((line) => line.text).join('\n'), extractedLines);
  // Keep the full OCR transcript available; only bounded cell values enter the form.
  return { ...result, rawOcrText: data.text };
}
