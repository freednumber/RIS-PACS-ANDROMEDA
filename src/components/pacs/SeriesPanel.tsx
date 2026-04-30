"use client";
import React from 'react';
import SeriesThumbnail from '@/components/SeriesThumbnail';
import type { SeriesData } from '@/components/Viewport';

interface SeriesPanelProps {
  series: SeriesData[];
  /** Which viewport is currently active */
  activeViewportId: string;
  /** Map of viewportId → assigned seriesIdx */
  viewportAssignments: Record<string, number>;
  /** Which series index is assigned to the active viewport */
  activeViewportSeriesIdx: number;
  /** Called when user clicks a thumbnail */
  onSeriesClick: (seriesIdx: number) => void;
  /** viewport IDs and their "state" color for the indicator dots */
  viewportStates: Array<{ id: string; color: string; label: string }>;
}

export default function SeriesPanel({
  series,
  activeViewportId,
  viewportAssignments,
  activeViewportSeriesIdx,
  onSeriesClick,
  viewportStates,
}: SeriesPanelProps) {
  return (
    <div
      role="complementary"
      aria-label="Series panel"
      style={{
        width: 120,
        flexShrink: 0,
        background: '#080808',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 8px 8px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 7,
            fontWeight: 900,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.25)',
            fontFamily: 'monospace',
          }}
        >
          SERIES
        </span>
      </div>

      {/* Scrollable list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '6px 6px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
        className="pacs-series-scroll"
      >
        {series.map((s, idx) => {
          const isActiveViewportSeries = idx === activeViewportSeriesIdx;

          // Which viewports display this series?
          const viewportsShowingThis = viewportStates.filter(
            vp => viewportAssignments[vp.id] === idx
          );

          return (
            <SeriesThumbnailCard
              key={s.id}
              series={s}
              seriesIdx={idx}
              isActive={isActiveViewportSeries}
              viewportsShowingThis={viewportsShowingThis}
              onClick={() => onSeriesClick(idx)}
            />
          );
        })}
      </div>
    </div>
  );
}

interface CardProps {
  series: SeriesData;
  seriesIdx: number;
  isActive: boolean;
  viewportsShowingThis: Array<{ id: string; color: string; label: string }>;
  onClick: () => void;
}

function SeriesThumbnailCard({ series, seriesIdx, isActive, viewportsShowingThis, onClick }: CardProps) {
  const [hovered, setHovered] = React.useState(false);
  const middleInstance = series.instances[Math.floor(series.instances.length / 2)];

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`Series ${seriesIdx + 1}: ${series.descrizione || series.modalita || 'Unknown'}`}
      aria-pressed={isActive}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: 4,
        borderRadius: 6,
        border: isActive
          ? '1px solid rgba(255,204,0,0.5)'
          : hovered
          ? '1px solid rgba(255,255,255,0.15)'
          : '1px solid rgba(255,255,255,0.06)',
        background: isActive
          ? 'rgba(255,204,0,0.06)'
          : hovered
          ? 'rgba(255,255,255,0.05)'
          : 'transparent',
        cursor: 'pointer',
        transition: 'all 150ms ease',
        position: 'relative',
        width: '100%',
        textAlign: 'left',
        outline: 'none',
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: '100%',
          aspectRatio: '1',
          borderRadius: 4,
          overflow: 'hidden',
          background: '#000',
          position: 'relative',
        }}
      >
        {middleInstance ? (
          <SeriesThumbnail instanceId={middleInstance.id} className="w-full h-full" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>NO IMG</span>
          </div>
        )}

        {/* Modality badge */}
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: 2,
            padding: '1px 4px',
            borderRadius: 3,
            background: 'rgba(0,0,0,0.7)',
            fontSize: 7,
            fontWeight: 900,
            color: isActive ? '#FFCC00' : 'rgba(255,255,255,0.5)',
            fontFamily: 'monospace',
            letterSpacing: '0.05em',
          }}
        >
          {series.modalita ?? 'MR'}
        </div>
      </div>

      {/* Name */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            color: isActive ? '#FFCC00' : 'rgba(255,255,255,0.7)',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
            fontFamily: 'sans-serif',
          }}
        >
          {series.descrizione || `Serie ${seriesIdx + 1}`}
        </span>
        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
          {series.instances.length} img
        </span>
      </div>

      {/* Viewport indicator dots */}
      {viewportsShowingThis.length > 0 && (
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {viewportsShowingThis.map(vp => (
            <div
              key={vp.id}
              title={`Displayed in ${vp.label}`}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: vp.color,
                boxShadow: `0 0 4px ${vp.color}`,
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}
    </button>
  );
}
