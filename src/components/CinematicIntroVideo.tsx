import React from 'react';
import { CinematicIntroAnimation } from './CinematicIntroAnimation';

interface CinematicIntroVideoProps {
  isOpen: boolean;
  onClose: () => void;
}

// Re-export both for backward compatibility and clean nomenclature
export const CinematicIntroVideo: React.FC<CinematicIntroVideoProps> = (props) => {
  return <CinematicIntroAnimation {...props} />;
};

export { CinematicIntroAnimation };
