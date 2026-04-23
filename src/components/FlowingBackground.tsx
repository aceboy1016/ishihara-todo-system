import React from 'react';
import './FlowingBackground.css';

export const FlowingBackground: React.FC = () => {
  return (
    <>
      {/* Wave layer 1 */}
      <div className="wave-layer wave-layer-1" />
      {/* Wave layer 2 */}
      <div className="wave-layer wave-layer-2" />
      {/* Wave layer 3 */}
      <div className="wave-layer wave-layer-3" />
    </>
  );
};
