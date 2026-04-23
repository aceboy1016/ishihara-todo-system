import React from 'react';
import './InkFlowBackground.css';

export const InkFlowBackground: React.FC = () => {
  return (
    <div className="ink-flow-container">
      {/* SVG Filters for organic ink-like distortion */}
      <svg className="ink-flow-filters">
        <defs>
          {/* Turbulence filter for organic flow */}
          <filter id="ink-turbulence">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.015"
              numOctaves="3"
              seed="2"
            >
              <animate
                attributeName="baseFrequency"
                values="0.012 0.015; 0.015 0.018; 0.012 0.015"
                dur="25s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="80">
              <animate
                attributeName="scale"
                values="80; 120; 80"
                dur="20s"
                repeatCount="indefinite"
              />
            </feDisplacementMap>
          </filter>

          {/* Second turbulence for layered effect */}
          <filter id="ink-turbulence-2">
            <feTurbulence
              type="turbulence"
              baseFrequency="0.008 0.01"
              numOctaves="4"
              seed="5"
            >
              <animate
                attributeName="baseFrequency"
                values="0.008 0.01; 0.01 0.012; 0.008 0.01"
                dur="30s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="100">
              <animate
                attributeName="scale"
                values="100; 150; 100"
                dur="25s"
                repeatCount="indefinite"
              />
            </feDisplacementMap>
          </filter>

          {/* Smooth blur for softer edges */}
          <filter id="ink-blur">
            <feGaussianBlur stdDeviation="40" />
          </filter>
        </defs>
      </svg>

      {/* Ink flow layers */}
      <div className="ink-layer ink-layer-1" />
      <div className="ink-layer ink-layer-2" />
      <div className="ink-layer ink-layer-3" />
      <div className="ink-layer ink-layer-4" />
    </div>
  );
};
