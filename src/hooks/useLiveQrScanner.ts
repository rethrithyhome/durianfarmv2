import { useEffect, useRef, useState } from "react";
import { loadJsQR } from "@/lib/qr";

interface Options {
  active: boolean;
  onDecoded: (text: string) => void;
}

/** Opens the device camera and continuously scans the live feed for a QR
 * code, calling onDecoded the moment one is recognized. Far faster and
 * more forgiving than "take a photo, then decode" — the person can just
 * hold the camera up and adjust angle/distance in real time. */
export function useLiveQrScanner({ active, onDecoded }: Options) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!active) { setReady(false); return; }
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    async function start() {
      try {
        const jsQR = await loadJsQR();
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setReady(true);

        const tick = () => {
          if (stopped) return;
          if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
            const w = 480;
            const h = Math.round((video.videoHeight / video.videoWidth) * w) || 480;
            canvas.width = w; canvas.height = h;
            ctx.drawImage(video, 0, 0, w, h);
            const imageData = ctx.getImageData(0, 0, w, h);
            const result = jsQR(imageData.data, w, h);
            if (result?.data) { onDecoded(result.data); return; }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    }
    start();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return { videoRef, error, ready };
}
