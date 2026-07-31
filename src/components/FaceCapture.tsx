"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

// ── Module-level singleton ─────────────────────────────────────────────
// Models are heavy (~7 MB). Load them once per page session,
// shared across all FaceCapture instances.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let faceApi: any = null;
let modelsLoaded = false;
let modelLoadPromise: Promise<void> | null = null;

async function ensureModels(): Promise<void> {
  if (modelsLoaded) return;
  if (modelLoadPromise) return modelLoadPromise;

  modelLoadPromise = (async () => {
    // Dynamic imports keep tfjs/face-api out of the server bundle entirely.
    // Static top-level imports get evaluated during Next.js SSR, where
    // tfjs's Node platform path breaks (util.TextEncoder issue).
    const tf = await import("@tensorflow/tfjs");
    await import("@tensorflow/tfjs-backend-webgl");
    faceApi = await import("@vladmandic/face-api");

    await tf.setBackend("webgl");
    await tf.ready();

    console.log("TensorFlow backend:", tf.getBackend());

    await Promise.all([
      faceApi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceApi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceApi.nets.faceRecognitionNet.loadFromUri("/models"),
    ]);

    modelsLoaded = true;
  })();

  return modelLoadPromise;
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
}

function euclidean(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));
}

// ── Component ──────────────────────────────────────────────────────────
export function FaceCapture({
  onCapture,
  compareWith,
  threshold = 0.5,
  captureLabel = "Capture Face",
}: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const [status, setStatus] = useState<Status>("loading-models");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // ── Live scan loop ─────────────────────────────────────────────────
  const startLiveScan = useCallback(() => {
    if (!faceApi || !modelsLoaded) return;

    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || !mountedRef.current) return;
      if (videoRef.current.readyState < 2) return; // not ready yet

      try {
        const detections = await faceApi
          .detectAllFaces(
            videoRef.current,
            new faceApi.TinyFaceDetectorOptions({ inputSize: 320 })
          )
          .withFaceLandmarks();

        if (!mountedRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detections.length === 1) {
          setFaceDetected(true);
          const box = detections[0].detection.box;
          ctx.beginPath();
          ctx.ellipse(
            box.x + box.width / 2,
            box.y + box.height / 2,
            box.width / 2 + 12,
            box.height / 2 + 14,
            0, 0, 2 * Math.PI
          );
          ctx.strokeStyle = "#22c55e";
          ctx.lineWidth = 3;
          ctx.stroke();
        } else {
          setFaceDetected(false);
        }
      } catch {
        // Ignore transient detection errors
      }
    }, 250);
  }, []);

  // ── Camera start ──────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    if (!mountedRef.current) return;
    setFaceDetected(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (!mountedRef.current) return;
          videoRef.current?.play();
          setStatus("waiting");
          startLiveScan();
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
  }, [startLiveScan]);

  // ── Init on mount ─────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      try {
        await ensureModels();
        if (!mountedRef.current) return;
        await startCamera();
      } catch (err) {
        console.error("FACE MODEL ERROR:", err);

        if (mountedRef.current) {
          setStatus("error");
          setErrorMsg(
            err instanceof Error ? err.message : String(err)
          );

          modelLoadPromise = null;
          modelsLoaded = false;
        }
      }
    })();

    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // ── Capture ───────────────────────────────────────────────────────
  async function handleCapture() {
    if (!faceApi || !modelsLoaded || !videoRef.current) return;

    setStatus("scanning");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

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
    } catch (err) {
      setStatus("error");
      setErrorMsg("Detection failed. Please retry.");
      startLiveScan();
    }
  }

  // ── Retry ─────────────────────────────────────────────────────────
  async function handleRetry() {
    stopCamera();
    setErrorMsg(null);
    setFaceDetected(false);

    // If models failed to load, try loading them again
    if (!modelsLoaded) {
      modelLoadPromise = null; // reset so ensureModels() tries again
      setStatus("loading-models");
      try {
        await ensureModels();
      } catch {
        setStatus("error");
        setErrorMsg(
          "Models still unavailable. Check your internet connection and that " +
          "the /public/models/ folder contains all 7 model files."
        );
        return;
      }
    }

    setStatus("waiting");
    await startCamera();
  }

  // ── Status text ───────────────────────────────────────────────────
  const STATUS_MSG: Partial<Record<Status, string>> = {
    "loading-models": "Loading face detection models…",
    waiting: faceDetected
      ? "Face detected — ready to capture"
      : "Position your face in the frame",
    scanning: "Analysing your face…",
    "no-face": "No face detected — try again",
    success: "Face captured successfully!",
    error: errorMsg ?? "Something went wrong",
  };

  const STATUS_COLOR: Partial<Record<Status, string>> = {
    waiting: faceDetected ? "text-success" : "text-muted",
    success: "text-success",
    error: "text-danger",
    "no-face": "text-danger",
    scanning: "text-brand-orange",
    "loading-models": "text-muted",
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Viewport */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border-2 border-line bg-brand-navy"
        style={{ aspectRatio: "4/3" }}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          playsInline
          muted
          width={640}
          height={480}
          className="h-full w-full object-cover -scale-x-100"
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 h-full w-full -scale-x-100 pointer-events-none"
        />

        {/* Loading overlay */}
        {status === "loading-models" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-navy gap-3">
            <Loader2 size={36} className="text-brand-orange animate-spin" />
            <p className="text-xs text-white/60 text-center px-4">
              Loading face detection models…
            </p>
          </div>
        )}

        {/* Success overlay */}
        {status === "success" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-navy/80 gap-2">
            <CheckCircle2 size={52} className="text-success" />
            <p className="text-sm font-semibold text-white">Face captured!</p>
          </div>
        )}

        {/* Face oval guide */}
        {(status === "waiting" || status === "scanning" || status === "no-face") && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className={`rounded-full border-4 transition-colors duration-300 ${
                faceDetected ? "border-success" : "border-white/25"
              }`}
              style={{ width: 170, height: 210 }}
            />
          </div>
        )}
      </div>

      {/* Status message */}
      <div className="flex items-center gap-2 min-h-5">
        {status === "scanning" && (
          <Loader2 size={14} className="text-brand-orange animate-spin" />
        )}
        {status === "success" && (
          <CheckCircle2 size={14} className="text-success" />
        )}
        {(status === "error" || status === "no-face") && (
          <AlertCircle size={14} className="text-danger" />
        )}
        <p className={`text-sm font-medium ${STATUS_COLOR[status] ?? "text-muted"}`}>
          {STATUS_MSG[status]}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 w-full max-w-sm">
        {(status === "error") && (
          <Button variant="outline" size="md" onClick={handleRetry} className="flex-1">
            <RefreshCw size={16} />
            Retry
          </Button>
        )}
        {(status === "waiting" || status === "no-face") && (
          <Button
            size="lg"
            fullWidth
            onClick={handleCapture}
            disabled={!faceDetected}
          >
            <Camera size={18} />
            {captureLabel}
          </Button>
        )}
      </div>

      {/* Tips */}
      {status === "waiting" && !faceDetected && (
        <ul className="text-xs text-muted space-y-1 text-center">
          <li>• Face the camera directly in good light</li>
          <li>• Remove glasses or hat if needed</li>
          <li>• Hold your phone at eye level</li>
        </ul>
      )}
    </div>
  );
}