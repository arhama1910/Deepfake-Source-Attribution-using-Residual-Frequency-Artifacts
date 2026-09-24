import React, { useEffect, useRef, useState } from 'react';

interface ForensicFingerprintVisualProps {
  className?: string;
}

export const ForensicFingerprintVisual: React.FC<ForensicFingerprintVisualProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeStage, setActiveStage] = useState<number>(2); // 0: Media, 1: Residual, 2: FFT/DCT, 3: Fingerprint

  useEffect(() => {
    // Subtle cycle through stages to illustrate the research pipeline
    const interval = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    // Cache pre-computed static noise grid for residual map simulation
    const noiseWidth = 100;
    const noiseHeight = 100;
    const noiseData = new Float32Array(noiseWidth * noiseHeight);
    for (let i = 0; i < noiseData.length; i++) {
      const r = Math.random();
      noiseData[i] = r < 0.82 ? (Math.random() - 0.5) * 0.35 : (Math.random() - 0.5) * 0.95;
    }

    const render = () => {
      t += 0.016;

      // Handle responsive high-DPI canvas sizing
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);

      if (w === 0 || h === 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Base dark forest background
      ctx.fillStyle = '#052923';
      ctx.fillRect(0, 0, w, h);

      const midX = Math.floor(w / 2);
      const midY = Math.floor(h / 2);

      // ==========================================
      // QUADRANT 1 (Top-Left): Residual Noise Map (SRM)
      // ==========================================
      const q1X = 0;
      const q1Y = 0;
      const q1W = midX;
      const q1H = midY;

      ctx.save();
      ctx.beginPath();
      ctx.rect(q1X, q1Y, q1W, q1H);
      ctx.clip();

      // Procedural Laplacian high-pass residual noise pixels
      const step = 4;
      for (let nx = 0; nx < q1W; nx += step) {
        for (let ny = 0; ny < q1H; ny += step) {
          const sampleIdx = (Math.floor(nx / step) + Math.floor(ny / step) * 20) % noiseData.length;
          const val = noiseData[sampleIdx] + Math.sin(t * 1.2 + nx * 0.08 + ny * 0.08) * 0.12;
          const intensity = Math.min(1, Math.max(0, 0.3 + val * 0.7));
          
          ctx.fillStyle = `rgba(217, 222, 212, ${intensity * 0.3})`;
          ctx.fillRect(q1X + nx, q1Y + ny, step - 0.5, step - 0.5);
        }
      }

      // Facial contour edge residual in noise
      const cxProfile = q1X + q1W * 0.5;
      const cyProfile = q1Y + q1H * 0.58;
      const scaleP = Math.min(q1W, q1H) / 180;
      ctx.strokeStyle = 'rgba(247, 246, 240, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cxProfile - 18 * scaleP, cyProfile - 28 * scaleP);
      ctx.quadraticCurveTo(cxProfile + 4 * scaleP, cyProfile - 24 * scaleP, cxProfile + 6 * scaleP, cyProfile - 10 * scaleP);
      ctx.lineTo(cxProfile + 16 * scaleP, cyProfile - 2 * scaleP);
      ctx.lineTo(cxProfile + 6 * scaleP, cyProfile + 6 * scaleP);
      ctx.quadraticCurveTo(cxProfile + 12 * scaleP, cyProfile + 12 * scaleP, cxProfile + 4 * scaleP, cyProfile + 16 * scaleP);
      ctx.quadraticCurveTo(cxProfile + 8 * scaleP, cyProfile + 26 * scaleP, cxProfile - 14 * scaleP, cyProfile + 28 * scaleP);
      ctx.stroke();

      // High-pass filter scan line
      const scanY1 = q1Y + ((Math.sin(t * 0.8) * 0.5 + 0.5) * q1H);
      ctx.strokeStyle = 'rgba(247, 246, 240, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(q1X, scanY1);
      ctx.lineTo(q1X + q1W, scanY1);
      ctx.stroke();

      ctx.restore();

      // ==========================================
      // QUADRANT 2 (Top-Right): 2D FFT Magnitude Spectrum
      // ==========================================
      const q2X = midX;
      const q2Y = 0;
      const q2W = w - midX;
      const q2H = midY;
      const fftCenterX = q2X + q2W / 2;
      const fftCenterY = q2Y + q2H / 2;

      ctx.save();
      ctx.beginPath();
      ctx.rect(q2X, q2Y, q2W, q2H);
      ctx.clip();

      // Spectral axes
      ctx.strokeStyle = 'rgba(217, 222, 212, 0.16)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(fftCenterX, q2Y);
      ctx.lineTo(fftCenterX, q2Y + q2H);
      ctx.moveTo(q2X, fftCenterY);
      ctx.lineTo(q2X + q2W, fftCenterY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Concentric harmonic frequency rings
      const ringScale = Math.min(q2W, q2H) / 190;
      const numRings = 4;
      for (let r = 1; r <= numRings; r++) {
        const radius = (r * 18 + Math.sin(t * 1.5 + r) * 1.2) * ringScale;
        ctx.beginPath();
        ctx.arc(fftCenterX, fftCenterY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = r === 2 ? 'rgba(247, 246, 240, 0.35)' : 'rgba(217, 222, 212, 0.14)';
        ctx.stroke();
      }

      // Central DC power glow
      const dcGrad = ctx.createRadialGradient(fftCenterX, fftCenterY, 0, fftCenterX, fftCenterY, 24 * ringScale);
      dcGrad.addColorStop(0, 'rgba(247, 246, 240, 0.9)');
      dcGrad.addColorStop(0.3, 'rgba(18, 91, 77, 0.6)');
      dcGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = dcGrad;
      ctx.beginPath();
      ctx.arc(fftCenterX, fftCenterY, 24 * ringScale, 0, Math.PI * 2);
      ctx.fill();

      // Generative upsampling frequency spikes
      const spikeAngles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];
      for (let i = 0; i < spikeAngles.length; i++) {
        const ang = spikeAngles[i];
        const dist = (36 + Math.sin(t * 2 + i) * 3) * ringScale;
        const sx = fftCenterX + Math.cos(ang) * dist;
        const sy = fftCenterY + Math.sin(ang) * dist;

        ctx.fillStyle = '#F7F6F0';
        ctx.beginPath();
        ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(247, 246, 240, 0.22)';
        ctx.beginPath();
        ctx.moveTo(fftCenterX, fftCenterY);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }

      // Sweeping azimuth frequency beam
      const beamAngle = t * 1.1;
      ctx.strokeStyle = 'rgba(247, 246, 240, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(fftCenterX, fftCenterY);
      ctx.lineTo(fftCenterX + Math.cos(beamAngle) * 55 * ringScale, fftCenterY + Math.sin(beamAngle) * 55 * ringScale);
      ctx.stroke();

      ctx.restore();

      // ==========================================
      // QUADRANT 3 (Bottom-Left): 2D DCT Coefficient Matrix
      // ==========================================
      const q3X = 0;
      const q3Y = midY;
      const q3W = midX;
      const q3H = h - midY;

      ctx.save();
      ctx.beginPath();
      ctx.rect(q3X, q3Y, q3W, q3H);
      ctx.clip();

      // 8x8 DCT sub-band coefficient matrix
      const matrixSize = 8;
      const cellSize = Math.floor(Math.min((q3W - 24) / matrixSize, (q3H - 42) / matrixSize));
      const startMX = q3X + Math.floor((q3W - (matrixSize * cellSize)) / 2);
      const startMY = q3Y + 34;

      for (let row = 0; row < matrixSize; row++) {
        for (let col = 0; col < matrixSize; col++) {
          const diagDist = (row + col) / (2 * matrixSize);
          const baseEnergy = Math.exp(-diagDist * 3.2);
          
          const isArtifactBand = (row === 3 && col === 4) || (row === 5 && col === 2);
          const artifactBoost = isArtifactBand ? Math.sin(t * 3 + row) * 0.4 + 0.5 : 0;
          const energy = Math.min(1, Math.max(0.04, baseEnergy + artifactBoost));

          const cx = startMX + col * cellSize;
          const cy = startMY + row * cellSize;

          let fill = 'rgba(18, 91, 77, 0.4)';
          if (energy > 0.75) {
            fill = 'rgba(247, 246, 240, 0.9)';
          } else if (energy > 0.45) {
            fill = 'rgba(118, 160, 138, 0.85)';
          } else if (energy > 0.2) {
            fill = 'rgba(18, 91, 77, 0.75)';
          } else {
            fill = 'rgba(13, 79, 67, 0.35)';
          }

          ctx.fillStyle = fill;
          ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);
        }
      }

      ctx.restore();

      // ==========================================
      // QUADRANT 4 (Bottom-Right): Source Fingerprint Feature Vector (DEMO)
      // ==========================================
      const q4X = midX;
      const q4Y = midY;
      const q4W = w - midX;
      const q4H = h - midY;

      ctx.save();
      ctx.beginPath();
      ctx.rect(q4X, q4Y, q4W, q4H);
      ctx.clip();

      const chartX = q4X + 16;
      const chartY = q4Y + 34;
      const chartW = q4W - 32;
      const chartH = q4H - 46;

      // Chart axes
      ctx.strokeStyle = 'rgba(217, 222, 212, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartX, chartY);
      ctx.lineTo(chartX, chartY + chartH);
      ctx.lineTo(chartX + chartW, chartY + chartH);
      ctx.stroke();

      // Natural Baseline Curve (Dashed)
      ctx.strokeStyle = 'rgba(217, 222, 212, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      for (let px = 0; px <= chartW; px += 2) {
        const frac = px / chartW;
        const py = chartY + chartH - (Math.exp(-frac * 2.8) * (chartH - 6));
        if (px === 0) ctx.moveTo(chartX + px, py);
        else ctx.lineTo(chartX + px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Extracted Fingerprint Curve with Generative Upsampling Spike
      ctx.strokeStyle = '#F7F6F0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let px = 0; px <= chartW; px += 2) {
        const frac = px / chartW;
        let power = Math.exp(-frac * 2.5);
        const peak = Math.exp(-Math.pow((frac - 0.58) / 0.08, 2)) * (0.42 + Math.sin(t * 2.5) * 0.08);
        power += peak;

        const py = chartY + chartH - (Math.min(0.95, power) * (chartH - 6));
        if (px === 0) ctx.moveTo(chartX + px, py);
        else ctx.lineTo(chartX + px, py);
      }
      ctx.stroke();

      // Peak artifact callout indicator
      const peakX = chartX + chartW * 0.58;
      const peakY = chartY + chartH - (0.75 * (chartH - 6));
      ctx.fillStyle = '#F7F6F0';
      ctx.beginPath();
      ctx.arc(peakX, peakY, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(247, 246, 240, 0.85)';
      ctx.font = '7px "JetBrains Mono", monospace';
      ctx.fillText('UPSAMPLE PEAK', peakX - 24, peakY - 5);

      ctx.restore();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const pipelineSteps = [
    { label: 'Original Media', short: 'MEDIA' },
    { label: 'Residual Extraction', short: 'RESIDUAL' },
    { label: 'FFT/DCT Transform', short: 'FFT / DCT' },
    { label: 'Source Fingerprint', short: 'FINGERPRINT' },
  ];

  return (
    <div className={`w-full max-w-[560px] aspect-square mx-auto flex flex-col rounded-[28px] sm:rounded-[32px] bg-[#EBF0E6] border border-[#D9DED4] p-2.5 sm:p-3 shadow-sm min-w-0 ${className}`}>
      
      {/* Dark Forest-Green Analysis Panel */}
      <div 
        ref={containerRef}
        className="w-full h-full flex flex-col rounded-[20px] sm:rounded-[24px] bg-[#083C33] border border-[#166355] overflow-hidden min-h-0"
      >
        
        {/* Card Header (flex-none) */}
        <div className="shrink-0 flex items-center justify-between px-3.5 py-2 border-b border-[#166355] bg-[#052923]/95">
          <div className="flex items-center space-x-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#76A08A] animate-pulse shrink-0"></span>
            <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-[#F7F6F0] truncate">
              RESIDUAL_FINGERPRINT_ENGINE
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-[#083C33] border border-[#166355] text-[9px] font-mono text-[#D9DED4] shrink-0">
            DEMO LAB MODE
          </span>
        </div>

        {/* Research Pipeline Stepper Bar: Original Media → Residual Extraction → FFT/DCT → Source Fingerprint */}
        <div className="shrink-0 px-3 py-1.5 bg-[#083C33] border-b border-[#166355] text-[9.5px] font-mono">
          <div className="flex items-center justify-between text-[#D9DED4]/80 overflow-x-auto no-scrollbar">
            {pipelineSteps.map((step, idx) => {
              const isCurrent = idx === activeStage;
              return (
                <React.Fragment key={step.short}>
                  <div
                    className={`flex items-center space-x-1 px-1.5 py-0.5 rounded transition-all whitespace-nowrap ${
                      isCurrent
                        ? 'bg-[#125B4D] text-[#F7F6F0] font-bold shadow-xs border border-[#166355]'
                        : 'text-[#D9DED4]/60'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-[#F7F6F0] animate-ping' : 'bg-[#166355]'}`} />
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{step.short}</span>
                  </div>
                  {idx < pipelineSteps.length - 1 && (
                    <span className="text-[#166355] font-bold px-0.5 select-none">→</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Central 2x2 Forensic Telemetry Grid (flex-1 min-h-0) with Canvas Underlay */}
        <div className="relative flex-1 min-h-0 min-w-0 w-full overflow-hidden bg-[#052923]">
          {/* Real-time procedural simulation canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full block pointer-events-none"
          />

          {/* Strict 2x2 grid HUD overlays */}
          <div className="relative z-10 w-full h-full grid grid-cols-[repeat(2,minmax(0,1fr))] grid-rows-[repeat(2,minmax(0,1fr))] pointer-events-none">
            
            {/* Panel 1: Original / Residual */}
            <div className="min-w-0 min-h-0 overflow-hidden p-2 sm:p-2.5 flex flex-col justify-between border-r border-b border-[#166355]/80">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[8.5px] sm:text-[9.5px] font-mono font-bold text-[#D9DED4] tracking-wide truncate">
                  ORIGINAL / RESIDUAL
                </span>
                <span className="text-[7px] sm:text-[7.5px] font-mono text-[#76A08A] bg-[#083C33]/90 px-1 py-0.5 rounded border border-[#166355]/60 shrink-0">
                  SRM 3×3
                </span>
              </div>
              <div className="text-[7px] sm:text-[7.5px] font-mono text-[#D9DED4]/60">
                HP-RESIDUAL (LAPLACIAN)
              </div>
            </div>

            {/* Panel 2: 2D FFT Spectrum */}
            <div className="min-w-0 min-h-0 overflow-hidden p-2 sm:p-2.5 flex flex-col justify-between border-b border-[#166355]/80">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[8.5px] sm:text-[9.5px] font-mono font-bold text-[#D9DED4] tracking-wide truncate">
                  2D FFT SPECTRUM
                </span>
                <span className="text-[7px] sm:text-[7.5px] font-mono text-[#76A08A] bg-[#083C33]/90 px-1 py-0.5 rounded border border-[#166355]/60 shrink-0">
                  NYQUIST
                </span>
              </div>
              <div className="text-[7px] sm:text-[7.5px] font-mono text-[#D9DED4]/60">
                LOG-MAGNITUDE (0,0)
              </div>
            </div>

            {/* Panel 3: 2D DCT Coefficients */}
            <div className="min-w-0 min-h-0 overflow-hidden p-2 sm:p-2.5 flex flex-col justify-between border-r border-[#166355]/80">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[8.5px] sm:text-[9.5px] font-mono font-bold text-[#D9DED4] tracking-wide truncate">
                  2D DCT COEFFICIENTS
                </span>
                <span className="text-[7px] sm:text-[7.5px] font-mono text-[#76A08A] bg-[#083C33]/90 px-1 py-0.5 rounded border border-[#166355]/60 shrink-0">
                  8×8 BLOCK
                </span>
              </div>
              <div className="text-[7px] sm:text-[7.5px] font-mono text-[#D9DED4]/60">
                ENERGY FREQ MATRIX
              </div>
            </div>

            {/* Panel 4: Source Fingerprint */}
            <div className="min-w-0 min-h-0 overflow-hidden p-2 sm:p-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[8.5px] sm:text-[9.5px] font-mono font-bold text-[#D9DED4] tracking-wide truncate">
                  SOURCE FINGERPRINT
                </span>
                <span className="text-[7px] sm:text-[7.5px] font-mono text-[#76A08A] bg-[#083C33]/90 px-1 py-0.5 rounded border border-[#166355]/60 shrink-0">
                  DEMO
                </span>
              </div>
              <div className="text-[7px] sm:text-[7.5px] font-mono text-[#D9DED4]/60">
                RADIAL FFT ATTRIBUTION
              </div>
            </div>

          </div>
        </div>

        {/* Card Footer Bar (flex-none, fully contained inside the card) */}
        <div className="shrink-0 flex items-center justify-between px-3 py-2 bg-[#052923] border-t border-[#166355] gap-2">
          
          {/* Bottom-Left Badge: [RES] [FFT] [DCT] FREQUENCY FORENSICS */}
          <div className="flex items-center space-x-2 min-w-0">
            <div className="flex -space-x-1 font-mono text-[8px] shrink-0">
              <span className="w-4 h-4 rounded-full bg-[#0D5145] text-white flex items-center justify-center font-bold">
                RES
              </span>
              <span className="w-4 h-4 rounded-full bg-[#125B4D] text-white flex items-center justify-center font-bold">
                FFT
              </span>
              <span className="w-4 h-4 rounded-full bg-[#2A6E5F] text-white flex items-center justify-center font-bold">
                DCT
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-mono tracking-wider font-bold text-[#D9DED4] uppercase truncate">
              FREQUENCY FORENSICS
            </span>
          </div>

          {/* Bottom-Right Badge: SOURCE ATTRIBUTION / Residual + Frequency */}
          <div className="flex items-center space-x-1.5 text-right shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0D5145] animate-pulse"></span>
            <div className="text-right">
              <div className="text-[9px] sm:text-[10px] font-bold text-[#F7F6F0] leading-none">
                SOURCE ATTRIBUTION
              </div>
              <div className="text-[8px] text-[#76A08A] font-mono leading-none mt-0.5">
                Residual + Frequency
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
