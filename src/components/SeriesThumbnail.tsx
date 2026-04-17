"use client";
import { useEffect, useRef, useState } from 'react';
import { initCornerstone, getCornerstone } from '@/lib/cornerstone-init';

interface SeriesThumbnailProps {
  instanceId: string;
  className?: string;
}

export default function SeriesThumbnail({ instanceId, className }: SeriesThumbnailProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadThumb() {
      const cs = await initCornerstone();
      if (!active || !canvasRef.current || !cs || !instanceId) return;

      try {
        const imageId = `wadouri:/api/images/${instanceId}`;
        const image = await cs.loadImage(imageId);
        
        if (active && canvasRef.current) {
          cs.enable(canvasRef.current);
          cs.displayImage(canvasRef.current, image);
          cs.resize(canvasRef.current);
          cs.fitToWindow(canvasRef.current);
          setLoading(false);
        }
      } catch (err) {
        console.error('Thumbnail load error:', err);
        setError(true);
        setLoading(false);
      }
    }

    loadThumb();

    return () => {
      active = false;
      const cs = getCornerstone();
      if (cs && canvasRef.current) {
        try { cs.disable(canvasRef.current); } catch(e) {}
      }
    };
  }, [instanceId]);

  return (
    <div className={`relative overflow-hidden bg-black flex items-center justify-center ${className}`}>
      <div ref={canvasRef} className="w-full h-full pointer-events-none" />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
           <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
           <svg className="w-4 h-4 text-gray-700 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
           </svg>
        </div>
      )}
    </div>
  );
}
