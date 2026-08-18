"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, X, RefreshCw, AlertCircle, Volume2, CheckCircle2, Flashlight, FlashlightOff, ZoomIn } from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

// Only barcode formats - excluding QR speeds up detection & avoids false focus on wrong code type
const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.ITF,
];

export function CameraScannerModal({ isOpen, onClose, onScanSuccess }: CameraScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [zoomSupported, setZoomSupported] = useState(false);
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number; step: number }>({ min: 1, max: 1, step: 1 });
  const [zoomValue, setZoomValue] = useState(1);
  const [isWarmingUp, setIsWarmingUp] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionIdRef = useRef(0);
  const readyToScanRef = useRef(false);
  const warmupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Play scanner confirmation beep
  const playScanBeep = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1760, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio not permitted or supported
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    // Fresh start every time modal opens - clear previous scan result / error
    // so the "Barcode Scanned!" tick overlay doesn't block the next scan
    setLastScanned(null);
    setError(null);

    let isMounted = true;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMounted) return;
        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCamera = devices.find(d =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("environment")
          );
          setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
        } else {
          setError("No video input devices (cameras) found on your device.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Camera permission error:", err);
        setError("Camera permission denied or camera not accessible. Please check browser permissions.");
      });

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && selectedCameraId) {
      startScanner(selectedCameraId);
    }
    return () => {
      stopScanner();
    };
  }, [isOpen, selectedCameraId]);

  const startScanner = async (cameraId: string) => {
    setError(null);
    setTorchOn(false);
    setTorchSupported(false);
    setZoomSupported(false);

    // Make sure the previous camera instance is fully stopped (this also invalidates
    // its session) before starting and claiming a new session for this scan attempt
    if (scannerRef.current) {
      await stopScanner();
    }
    const session = ++sessionIdRef.current;

    try {
      const html5QrCode = new Html5Qrcode("reader", {
        formatsToSupport: BARCODE_FORMATS,
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      });
      scannerRef.current = html5QrCode;

      // Large near-full-frame scan zone: big enough that no precise alignment is
      // needed, but capped so the decoder isn't processing the entire raw frame
      // every tick (which was making detection sluggish)
      const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
        const boxWidth = Math.floor(viewfinderWidth * 0.92);
        const boxHeight = Math.floor(viewfinderHeight * 0.75);
        return { width: boxWidth, height: boxHeight };
      };

      const config = {
        fps: 15,
        qrbox: qrboxFunction,
        aspectRatio: 1.777,
        disableFlip: true,
        videoConstraints: {
          width: { min: 1280, ideal: 1280, max: 1920 },
          height: { min: 720, ideal: 720, max: 1080 },
        } as MediaTrackConstraints,
      };

      await html5QrCode.start(
        cameraId,
        config,
        (decodedText) => {
          // Ignore decode events from a stale/already-replaced session, or during warm-up
          if (session !== sessionIdRef.current) return;
          if (!readyToScanRef.current) return;
          // Lock immediately so no further frames can trigger a second scan,
          // then turn the camera off right away - we only need exactly one scan
          readyToScanRef.current = false;
          playScanBeep();
          setLastScanned(decodedText);
          onScanSuccess(decodedText);
          stopScanner();
          setTimeout(() => {
            onClose();
          }, 600);
        },
        () => {
          // Frame error (no code found in current frame, normal continuous scan)
        }
      );

      if (session !== sessionIdRef.current) {
        // A newer session was requested while start() was resolving - tear this one down instead of showing it
        await stopScanner();
        return;
      }

      setIsScanning(true);
      readyToScanRef.current = false;
      setIsWarmingUp(true);
      if (warmupTimeoutRef.current) clearTimeout(warmupTimeoutRef.current);
      warmupTimeoutRef.current = setTimeout(() => {
        if (session !== sessionIdRef.current) return; // this session was replaced/closed already
        readyToScanRef.current = true;
        setIsWarmingUp(false);
      }, 1000);

      // Check torch & zoom capabilities, and apply continuous autofocus, after camera is already running
      try {
        const capabilities = html5QrCode.getRunningTrackCapabilities() as MediaTrackCapabilities & {
          torch?: boolean;
          zoom?: { min: number; max: number; step: number };
          focusMode?: string[];
        };
        if (capabilities?.torch) {
          setTorchSupported(true);
        }
        if (capabilities?.zoom) {
          setZoomSupported(true);
          const z = capabilities.zoom;
          setZoomRange({ min: z.min, max: z.max, step: z.step || 0.1 });
          setZoomValue(z.min);
        }
        if (capabilities?.focusMode?.includes("continuous")) {
          try {
            await html5QrCode.applyVideoConstraints({
              advanced: [{ focusMode: "continuous" } as unknown as MediaTrackConstraintSet],
            });
          } catch {
            // Some browsers report continuous focus support but reject applying it manually - safe to ignore
          }
        }
      } catch {
        // Capabilities API not supported on this device/browser
      }
    } catch (err) {
      console.error("Failed to start camera scanner:", err);
      setError(err instanceof Error ? err.message : "Failed to start camera feed.");
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    sessionIdRef.current++; // invalidate any pending/in-flight scan session
    readyToScanRef.current = false;
    if (warmupTimeoutRef.current) {
      clearTimeout(warmupTimeoutRef.current);
      warmupTimeoutRef.current = null;
    }
    setIsWarmingUp(false);
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn("Scanner stop cleanup error:", err);
      }
      scannerRef.current = null;
      setIsScanning(false);
      setTorchOn(false);
    }
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !torchSupported) return;
    try {
      const next = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: next } as unknown as MediaTrackConstraintSet],
      });
      setTorchOn(next);
    } catch (err) {
      console.warn("Torch toggle failed:", err);
    }
  };

  const handleZoomChange = async (value: number) => {
    if (!scannerRef.current || !zoomSupported) return;
    setZoomValue(value);
    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ zoom: value } as unknown as MediaTrackConstraintSet],
      });
    } catch (err) {
      console.warn("Zoom change failed:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Camera Barcode Scanner</h3>
              <p className="text-xs text-slate-500">Bring the barcode close - scans anywhere on screen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Selector (if multiple) */}
        {cameras.length > 1 && (
          <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Select Camera:</span>
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="bg-white border border-slate-300 rounded-md px-2.5 py-1 text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500"
            >
              {cameras.map((cam) => (
                <option key={cam.id} value={cam.id}>
                  {cam.label || `Camera ${cam.id.slice(0, 5)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Scanner Viewport - bigger now */}
        <div className="relative bg-black flex flex-col items-center justify-center min-h-[420px] sm:min-h-[520px] overflow-hidden">
          <div id="reader" className="w-full h-full max-w-full [&_video]:!object-cover" />

          {/* Full-frame scanning indicator - entire camera view is now the scan area */}
          {isScanning && !error && !lastScanned && !isWarmingUp && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner markers around the full frame to show the whole view is active */}
              <span className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-md" />
              <span className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-md" />
              <span className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-md" />
              <span className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-md" />
              {/* Laser scanning line sweeping the full frame */}
              <div className="absolute left-6 right-6 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse top-1/2 -translate-y-1/2" />
              <span className="text-[11px] font-semibold text-white bg-black/60 px-3 py-1 rounded-full absolute bottom-16 left-1/2 -translate-x-1/2">
                Bring barcode close to scan
              </span>
            </div>
          )}

          {/* Warm-up indicator - brief pause after opening so the previous item can be moved out of frame */}
          {isScanning && !error && isWarmingUp && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
              <div className="flex flex-col items-center space-y-2 bg-black/50 px-5 py-3 rounded-xl">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-xs font-semibold text-white">Get ready to scan...</span>
              </div>
            </div>
          )}

          {/* Torch button */}
          {isScanning && torchSupported && !error && !lastScanned && !isWarmingUp && (
            <button
              onClick={toggleTorch}
              className={`absolute top-3 right-3 p-2.5 rounded-full shadow-lg transition-colors ${
                torchOn ? "bg-amber-400 text-slate-900" : "bg-black/50 text-white hover:bg-black/70"
              }`}
              title="Toggle flashlight"
            >
              {torchOn ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
            </button>
          )}

          {/* Zoom slider */}
          {isScanning && zoomSupported && !error && !lastScanned && !isWarmingUp && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-48 flex items-center space-x-2 bg-black/50 px-3 py-1.5 rounded-full">
              <ZoomIn className="w-3.5 h-3.5 text-white shrink-0" />
              <input
                type="range"
                min={zoomRange.min}
                max={zoomRange.max}
                step={zoomRange.step}
                value={zoomValue}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="w-full accent-emerald-400"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center text-white">
              <AlertCircle className="w-12 h-12 text-rose-400 mb-3" />
              <h4 className="font-semibold text-base mb-1">Camera Unavailable</h4>
              <p className="text-xs text-slate-300 max-w-xs mb-4">{error}</p>
              <button
                onClick={() => selectedCameraId && startScanner(selectedCameraId)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Camera</span>
              </button>
            </div>
          )}

          {/* Success Scan Flash */}
          {lastScanned && (
            <div className="absolute inset-0 bg-emerald-600/85 backdrop-blur-xs flex flex-col items-center justify-center text-white animate-in zoom-in-95 duration-150">
              <CheckCircle2 className="w-12 h-12 mb-2 text-white" />
              <p className="text-sm font-semibold">Barcode Scanned!</p>
              <p className="text-xs font-mono bg-black/30 px-3 py-1 rounded-full mt-1">{lastScanned}</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1.5">
            <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Audio beep enabled</span>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}