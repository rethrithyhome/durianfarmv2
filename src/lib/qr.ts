export type JsQRFn = (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null;

let jsQRPromise: Promise<JsQRFn> | null = null;

/** Lazily loads the jsQR decoder from a CDN so it's not in the main bundle
 * (most sessions never open the scanner) and stays cached across scans. */
export function loadJsQR(): Promise<JsQRFn> {
  if (!jsQRPromise) {
    jsQRPromise = new Promise((resolve, reject) => {
      const w = window as unknown as { jsQR?: JsQRFn };
      if (w.jsQR) { resolve(w.jsQR); return; }
      const existing = document.querySelector('script[data-jsqr]');
      if (existing) {
        existing.addEventListener("load", () => resolve((window as unknown as { jsQR: JsQRFn }).jsQR));
        existing.addEventListener("error", reject);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jsqr/1.4.0/jsQR.js";
      script.dataset.jsqr = "1";
      script.onload = () => resolve((window as unknown as { jsQR: JsQRFn }).jsQR);
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }
  return jsQRPromise;
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

function fileToImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Phone camera photos are often 8-12MP, which makes QR decoding slow.
// A QR code stays readable at far smaller sizes, so shrinking it first
// makes scanning near-instant.
function drawDownscaled(img: HTMLImageElement, maxDim = 1000): ImageData {
  let { width, height } = img;
  if (width > height && width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; }
  else if (height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim; }
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

export interface DecodeResult { text: string }

/** Decodes a QR code from an image file. Retries once at higher
 * resolution if the code wasn't readable at the smaller size. */
export async function decodeQrFromFile(file: File, onStatus?: (msg: string) => void): Promise<DecodeResult> {
  onStatus?.("កំពុងរៀបចំកម្មវិធីស្កេន...");
  const jsQR = await withTimeout(loadJsQR(), 15000, "ការភ្ជាប់បណ្តាញយឺតពេក សូមព្យាយាមម្តងទៀត");
  onStatus?.("កំពុងវិភាគរូបភាព...");
  const img = await withTimeout(fileToImage(file), 10000, "ផ្ទុករូបភាពមិនបានទេ សូមព្យាយាមម្តងទៀត");
  const small = drawDownscaled(img, 1000);
  let result = jsQR(small.data, small.width, small.height);
  if (!result) {
    const bigger = drawDownscaled(img, 1600);
    result = jsQR(bigger.data, bigger.width, bigger.height);
  }
  if (!result) throw new Error("រកមិនឃើញកូដ QR ក្នុងរូបភាពនេះទេ — សូមថតឲ្យកូដ QR ពេញស៊ុមរូបភាព និងមានពន្លឺគ្រប់គ្រាន់ រួចសាកម្តងទៀត");
  return { text: result.data };
}

export function qrImageUrl(value: string, size = 220): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&qzone=1&data=${encodeURIComponent(value)}`;
}
