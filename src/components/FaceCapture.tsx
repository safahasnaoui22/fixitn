"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { NAVY_TILE, ORANGE } from "@/lib/theme";
import { FaceCorners } from "@/components/FaceCorners";

// ── Module-level singleton ─────────────────────────────────────────────
// Models are heavy (~7 MB). Load them once per page session,
// shared across all FaceCapture instances. Call preloadFaceModels() on any
// page that comes BEFORE the camera (intro screens) so they are ready (or
// nearly ready) by the time the person presses "Start".
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let faceApi: any = null;
let modelsLoaded = false;
let modelLoadPromise: Promise<void> | null = null;

async function ensureModels(): Promise<void> {
  if (modelsLoaded) return;
  if (modelLoadPromise) return modelLoadPromise;

  modelLoadPromise = (async () => {
    // Dynamic imports keep tfjs/face-api out of the server bundle entirely.
    // (Static top-level imports get evaluated during Next.js SSR, where
    // tfjs's Node platform path breaks.)
    // The three libraries and the model files are downloaded IN PARALLEL.
    const [tf, , api] = await Promise.all([
      import("@tensorflow/tfjs"),
      import("@tensorflow/tfjs-backend-webgl"),
      import("@vladmandic/face-api"),
    ]);
    faceApi = api;

    await tf.setBackend("webgl");
    await tf.ready();

    await Promise.all([
      faceApi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceApi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceApi.nets.faceRecognitionNet.loadFromUri("/models"),
    ]);

    // Warm-up: the very first inference compiles the WebGL shaders (1-2 s).
    // Do it now, while the person is still reading / the camera is starting,
    // so the first real scan is instant.
    try {
      const c = document.createElement("canvas");
      c.width = c.height = 160;
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#808080";
        ctx.fillRect(0, 0, 160, 160);
      }
      await faceApi
        .detectSingleFace(c, new faceApi.TinyFaceDetectorOptions({ inputSize: 224 }))
        .withFaceLandmarks();
      await faceApi.nets.faceRecognitionNet.computeFaceDescriptor(c);
    } catch {
      // warm-up is only an optimisation
    }

    modelsLoaded = true;
  })();

  return modelLoadPromise;
}

/** Start downloading the face models in the background (safe to call many times). */
export function preloadFaceModels(): void {
  ensureModels().catch(() => {
    modelLoadPromise = null; // allow a retry later
  });
}

// ── Types ──────────────────────────────────────────────────────────────
type Status =
  | "loading-models"
  | "waiting"
  | "no-face"
  | "scanning"
  | "success"
  | "error";

interface FaceCaptureProps {
  onCapture: (descriptor: number[]) => void;
  compareWith?: number[] | null;
  threshold?: number;
  captureLabel?: string;
  /** Capture by itself once a face has been steady in the circle (~0.5 s). Used for login. */
  autoCapture?: boolean;
}

function euclidean(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));
}

const VIEW = 260; // diameter of the round camera view (px)

// ── Component ──────────────────────────────────────────────────────────
export function FaceCapture({
  onCapture,
  compareWith,
  threshold = 0.5,
  captureLabel = "Capture Face",
  autoCapture = false,
}: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const stableRef = useRef(0);
  const captureRef = useRef<() => void>(() => {});
  const autoRef = useRef(autoCapture);
  autoRef.current = autoCapture;

  const [status, setStatus] = useState<Status>("loading-models");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [modelsReady, setModelsReady] = useState(modelsLoaded);

  const stopLoop = useCallback(() => {
    scanningRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    stopLoop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, [stopLoop]);

  // ── Live scan loop (detector only: fast) ───────────────────────────
  const startLiveScan = useCallback(() => {
    if (!faceApi || !modelsLoaded) return;
    stopLoop();
    scanningRef.current = true;

    const tick = async () => {
      if (!scanningRef.current || !mountedRef.current) return;
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        try {
          const found = await faceApi.detectAllFaces(
            video,
            new faceApi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
          );
          if (mountedRef.current && scanningRef.current) {
            setFaceDetected(found.length === 1);
            stableRef.current = found.length === 1 ? stableRef.current + 1 : 0;
            // face steady for 4 checks in a row → capture without waiting for a tap
            if (autoRef.current && stableRef.current >= 4) {
              stableRef.current = 0;
              scanningRef.current = false;
              captureRef.current();
              return;
            }
          }
        } catch {
          // ignore transient detection errors
        }
      }
      if (scanningRef.current && mountedRef.current) {
        timerRef.current = setTimeout(tick, 120);
      }
    };
    tick();
  }, [stopLoop]);

  // ── Camera start (runs in PARALLEL with the model download) ────────
  const startCamera = useCallback(async () => {
    if (!mountedRef.current) return;
    setFaceDetected(false);
    setCameraReady(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 480 },
          height: { ideal: 360 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          if (!mountedRef.current) return;
          video.play().catch(() => {});
          setCameraReady(true);
        };
      }
    } catch {
      if (mountedRef.current) {
        setStatus("error");
        setErrorMsg(
          "Camera access denied. Please allow camera permissions and refresh the page."
        );
      }
    }
  }, []);

  // ── Init on mount: camera + models at the same time ────────────────
  useEffect(() => {
    mountedRef.current = true;

    startCamera();
    ensureModels()
      .then(() => {
        if (mountedRef.current) setModelsReady(true);
      })
      .catch((err) => {
        console.error("FACE MODEL ERROR:", err);
        modelLoadPromise = null;
        modelsLoaded = false;
        if (mountedRef.current) {
          setStatus("error");
          setErrorMsg(err instanceof Error ? err.message : String(err));
        }
      });

    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // ── Both ready → start scanning ────────────────────────────────────
  useEffect(() => {
    if (cameraReady && modelsReady && status === "loading-models") {
      setStatus("waiting");
      startLiveScan();
    }
  }, [cameraReady, modelsReady, status, startLiveScan]);

  // ── Capture ───────────────────────────────────────────────────────
  async function handleCapture() {
    if (!faceApi || !modelsLoaded || !videoRef.current) return;

    setStatus("scanning");
    stopLoop();
    stableRef.current = 0;

    try {
      const detection = await faceApi
        .detectSingleFace(
          videoRef.current,
          new faceApi.TinyFaceDetectorOptions({ inputSize: 320 })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setStatus("no-face");
        setErrorMsg("No face detected. Make sure your face is clearly visible and well lit.");
        startLiveScan();
        return;
      }

      const descriptor = Array.from(detection.descriptor) as number[];

      // Verify mode
      if (compareWith) {
        const distance = euclidean(descriptor, compareWith);
        if (distance > threshold) {
          setStatus("error");
          setErrorMsg(
            `Face does not match (score: ${distance.toFixed(3)}). ` +
              "Try better lighting or contact support."
          );
          startLiveScan();
          return;
        }
      }

      setStatus("success");
      stopCamera();
      onCapture(descriptor);
    } catch {
      setStatus("error");
      setErrorMsg("Detection failed. Please retry.");
      startLiveScan();
    }
  }

  captureRef.current = handleCapture;

  // ── Retry ─────────────────────────────────────────────────────────
  async function handleRetry() {
    stopCamera();
    setErrorMsg(null);
    setFaceDetected(false);
    setCameraReady(false);
    setStatus("loading-models");

    // If models failed to load, try loading them again
    if (!modelsLoaded) {
      modelLoadPromise = null;
      setModelsReady(false);
      ensureModels()
        .then(() => mountedRef.current && setModelsReady(true))
        .catch(() => {
          if (!mountedRef.current) return;
          setStatus("error");
          setErrorMsg(
            "Models still unavailable. Check your internet connection and that " +
              "the /public/models/ folder contains all the model files."
          );
        });
    }

    await startCamera();
  }

  // ── Look & feel ────────────────────────────────────────────────────
  // Orange dashed ring (turns red on an error). It spins slowly while waiting
  // and faster while analysing; a detected face makes it fully opaque.
  const ringColor =
    status === "error" || status === "no-face"
      ? "#ef4444"
      : ORANGE;
  const ringOpacity =
    status === "waiting" && !faceDetected ? 0.45 : 1;
  const ringSpin =
    status === "scanning"
      ? "faceRingSpin 2.5s linear infinite"
      : status === "success"
        ? "none"
        : "faceRingSpin 14s linear infinite";

  const STATUS_MSG: Partial<Record<Status, string>> = {
    "loading-models": "Getting ready…",
    waiting: faceDetected ? "Face detected — ready to capture" : "Position your face in the circle",
    scanning: "Analysing your face…",
    "no-face": "No face detected — try again",
    success: "Face captured successfully!",
    error: errorMsg ?? "Something went wrong",
  };

  const bad = status === "error" || status === "no-face";

  return (
    <div className="flex w-full flex-col items-center gap-5">
      {/* Round camera view with orange corners */}
      <div className="relative" style={{ width: VIEW + 56, height: VIEW + 56 }}>
        <FaceCorners length={50} thickness={4} radius={20} />

        <div className="absolute" style={{ inset: 28 }}>
          {/* dashed orange ring */}
          <div
            className="absolute rounded-full border-[3px] border-dashed transition-colors duration-300"
            style={{
              inset: 0,
              borderColor: ringColor,
              opacity: ringOpacity,
              animation: ringSpin,
            }}
          />
          <div
            className="absolute overflow-hidden rounded-full"
            style={{ inset: 12, backgroundColor: NAVY_TILE }}
          >
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full -scale-x-100 object-cover"
            />

            {/* Getting ready (camera is already visible behind it as soon as it starts) */}
            {status === "loading-models" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 backdrop-blur-[2px]">
                <Loader2 size={30} className="animate-spin text-white" />
                <p className="px-6 text-center text-xs text-white/80">
                  {cameraReady ? "Almost ready…" : "Starting camera…"}
                </p>
              </div>
            )}

            {status === "success" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
                <CheckCircle2 size={56} className="text-emerald-400" />
              </div>
            )}
          </div>
        </div>
        <style>{`@keyframes faceRingSpin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* Status message */}
      <div className="flex min-h-6 items-center justify-center gap-2 px-2 text-center">
        {status === "scanning" && <Loader2 size={15} className="animate-spin" style={{ color: ORANGE }} />}
        {status === "success" && <CheckCircle2 size={15} className="text-emerald-400" />}
        {bad && <AlertCircle size={15} className="shrink-0 text-red-400" />}
        <p
          className={`text-sm font-medium ${
            bad
              ? "text-red-300"
              : status === "success" || (status === "waiting" && faceDetected)
                ? "text-emerald-300"
                : "text-white/70"
          }`}
        >
          {STATUS_MSG[status]}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex w-full max-w-sm gap-3">
        {status === "error" && (
          <button
            type="button"
            onClick={handleRetry}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/25 text-base font-semibold text-white active:scale-[0.98]"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        )}
        {(status === "waiting" || status === "no-face") && (
          <button
            type="button"
            onClick={handleCapture}
            disabled={!faceDetected}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ backgroundColor: ORANGE }}
          >
            <Camera size={18} />
            {captureLabel}
          </button>
        )}
      </div>

      {/* Tips */}
      {status === "waiting" && !faceDetected && (
        <ul className="space-y-1 text-center text-xs text-white/50">
          <li>• Face the camera directly in good light</li>
          <li>• Remove glasses or hat if needed</li>
          <li>• Hold your phone at eye level</li>
        </ul>
      )}
    </div>
  );
}
