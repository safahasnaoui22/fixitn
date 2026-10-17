"use client";

import { useEffect } from "react";
import { preloadFaceModels } from "@/components/FaceCapture";

/**
 * Put on the login page: while the person types the phone number and password,
 * the face engine + models (~7 MB) download and warm up in the background, so
 * the camera screen after login is ready almost instantly.
 */
export function FacePreloader() {
  useEffect(() => {
    const run = () => preloadFaceModels();
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    };
    if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 2500 });
    else setTimeout(run, 800);
  }, []);
  return null;
}
