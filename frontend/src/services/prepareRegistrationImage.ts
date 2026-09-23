/** Enlarge small document text before recognition; preserve the original for review. */
export async function prepareRegistrationImage(uri: string): Promise<HTMLCanvasElement> {
  const image = new Image();
  image.src = uri;
  await image.decode();
  const scale = Math.min(3, 2700 / image.naturalWidth, 4800 / image.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to prepare document photo.');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}
