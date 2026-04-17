"use client";
import React from 'react';
import { cn } from '@/lib/utils';

export interface ViewportOverlayProps {
  patientName?: string;
  patientId?: string;
  birthDate?: string;
  studyDate?: string;
  studyTime?: string;
  institution?: string;
  windowWidth?: number;
  windowCenter?: number;
  zoom?: number;
  sliceIndex: number;
  totalSlices: number;
  zPos?: number;
  modality?: string;
  orientation?: 'axial' | 'sagittal' | 'coronal' | 'unknown';
}

export default function ViewportOverlay({
  patientName = 'ANONYMOUS',
  patientId = 'N/A',
  birthDate = 'N/A',
  studyDate = 'N/A',
  studyTime = '',
  institution = 'ANDROMEDA CLINIC',
  windowWidth,
  windowCenter,
  zoom = 1.0,
  sliceIndex,
  totalSlices,
  zPos,
  modality = 'CT',
  orientation = 'axial'
}: ViewportOverlayProps) {
  
  // Orientation Labels based on plane
  const labels = {
    top: orientation === 'axial' ? 'A' : orientation === 'sagittal' ? 'S' : 'S',
    bottom: orientation === 'axial' ? 'P' : orientation === 'sagittal' ? 'I' : 'I',
    left: orientation === 'axial' ? 'R' : orientation === 'sagittal' ? 'P' : 'R',
    right: orientation === 'axial' ? 'L' : orientation === 'sagittal' ? 'A' : 'L'
  };

  return (
    <div className="absolute inset-4 pointer-events-none z-[100] select-none font-mono uppercase">
      
      {/* ── Top Left: Patient Info ── */}
      <div className="absolute top-0 left-0 flex flex-col gap-0.5 text-[11px] text-gray-200 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
        <span className="font-bold text-white tracking-wider">{patientName}</span>
        <span className="text-[10px] text-gray-400">ID: {patientId}</span>
        <span className="text-[10px] text-gray-400">DOB: {birthDate}</span>
      </div>

      {/* ── Top Right: Study Info ── */}
      <div className="absolute top-0 right-0 flex flex-col items-end gap-0.5 text-[10px] text-gray-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
        <span className="text-primary-400/80 font-bold">{institution}</span>
        <span>{studyDate}</span>
        <span>{studyTime}</span>
      </div>

      {/* ── Bottom Left: Rendering Info ── */}
      <div className="absolute bottom-0 left-0 flex flex-col gap-0.5 text-[10px] text-gray-400 bg-black/60 px-2 py-1.5 rounded-lg backdrop-blur-md border border-white/10 shadow-lg">
        <div className="flex gap-2">
          <span>W: <span className="text-white font-bold">{windowWidth?.toFixed(0)}</span></span>
          <span>L: <span className="text-white font-bold">{windowCenter?.toFixed(0)}</span></span>
        </div>
        <div>ZOOM: <span className="text-white font-bold">{(zoom * 100).toFixed(0)}%</span></div>
        <div className="text-[9px] text-primary-500 font-black tracking-widest mt-0.5 border-t border-white/5 pt-0.5">{modality} SCAN</div>
      </div>

      {/* ── Bottom Right: Positional Info ── */}
      <div className="absolute bottom-0 right-0 flex flex-col items-end gap-0.5 text-[10px] text-gray-400 bg-black/60 px-2 py-1.5 rounded-lg backdrop-blur-md border border-white/10 shadow-lg">
        <span>LOC: <span className="text-white font-bold">{zPos?.toFixed(1) ?? '0.0'} mm</span></span>
        <span>IMA: <span className="text-white font-bold">{sliceIndex + 1} / {totalSlices}</span></span>
      </div>

      {/* ── Orientation Labels (Anatomical Alignment) ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        
        {/* Top/Bottom */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 text-primary-500 font-black text-xs drop-shadow-[0_0_10px_rgba(0,212,190,0.4)]">
          {labels.top}
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-primary-500 font-black text-xs drop-shadow-[0_0_10px_rgba(0,212,190,0.4)]">
          {labels.bottom}
        </div>

        {/* Left/Right */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 text-primary-500 font-black text-xs drop-shadow-[0_0_10px_rgba(0,212,190,0.4)]">
          {labels.left}
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-primary-500 font-black text-xs drop-shadow-[0_0_10px_rgba(0,212,190,0.4)]">
          {labels.right}
        </div>

      </div>

    </div>
  );
}
