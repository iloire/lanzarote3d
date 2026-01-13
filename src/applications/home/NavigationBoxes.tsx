import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { NAVIGATION_LINKS, NavigationLink } from './config';
import './navigation-boxes.css';

const MUSIC_ENABLED_KEY = 'lanzarote3d-music-enabled';
const MUSIC_URL = '/assets/Looking-for-a-new-beginning.ogg';

interface NavigationBoxProps {
  link: NavigationLink;
  variant?: 'default' | 'featured';
}

const NavigationBox: React.FC<NavigationBoxProps> = ({ link, variant = 'default' }) => {
  const handleClick = () => {
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      className={`nav-box ${variant === 'featured' ? 'nav-box-featured' : ''}`}
      onClick={handleClick}
      title={link.description}
      aria-label={`Open ${link.description}`}
    >
      <div className="nav-box-icon">{link.icon}</div>
      <div className="nav-box-label">{link.label}</div>
      <div className="nav-box-description">{link.description}</div>
      {variant === 'featured' && <div className="nav-box-subtext">No experience needed</div>}
    </button>
  );
};

const VoxelTitle: React.FC = () => {
  return (
    <div className="voxel-title-container">
      <h1 className="voxel-title">
        <span className="voxel-title-main">Lanzarote</span>
        <span className="voxel-title-sub">Paragliding</span>
      </h1>
    </div>
  );
};

const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || window.innerWidth < 768;
};

const MusicToggle: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pendingAutoplay, setPendingAutoplay] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check for mobile on mount
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  useEffect(() => {
    // Don't initialize audio on mobile
    if (isMobile) return;

    const audio = new Audio();
    audio.loop = true;
    audio.volume = 0.2;
    audio.preload = 'auto';
    audioRef.current = audio;

    const tryAutoplay = () => {
      // Check localStorage for saved preference (default to enabled)
      const savedPreference = localStorage.getItem(MUSIC_ENABLED_KEY);
      if (savedPreference !== 'false') {
        audio.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          // Autoplay blocked - wait for user interaction
          setPendingAutoplay(true);
        });
      }
    };

    const handleCanPlay = () => {
      setIsLoaded(true);
      tryAutoplay();
    };

    audio.addEventListener('canplaythrough', handleCanPlay);

    audio.addEventListener('error', () => {
      console.error('Failed to load background music');
    });

    // Set src after adding listeners to ensure we catch the event
    audio.src = MUSIC_URL;

    // If audio is already ready (cached), trigger manually
    if (audio.readyState >= 3) {
      setIsLoaded(true);
      tryAutoplay();
    }

    return () => {
      audio.removeEventListener('canplaythrough', handleCanPlay);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [isMobile]);

  // Handle autoplay after user interaction with the page
  useEffect(() => {
    if (!pendingAutoplay || !audioRef.current) return undefined;

    const handleInteraction = () => {
      const audio = audioRef.current;
      if (audio && pendingAutoplay) {
        audio.play().then(() => {
          setIsPlaying(true);
          setPendingAutoplay(false);
        }).catch(() => {
          // Still blocked, keep waiting
        });
      }
    };

    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('keydown', handleInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [pendingAutoplay]);

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      localStorage.setItem(MUSIC_ENABLED_KEY, 'false');
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
        localStorage.setItem(MUSIC_ENABLED_KEY, 'true');
      }).catch((err) => {
        console.error('Failed to play music:', err);
      });
    }
  }, [isPlaying]);

  const className = ['music-toggle', isLoaded && 'music-loaded', isPlaying && 'music-playing']
    .filter(Boolean)
    .join(' ');

  // Don't render on mobile
  if (isMobile) {
    return null;
  }

  const musicTitle = isPlaying ? 'Disable Music' : 'Enable Music';
  const creditTitle = `${musicTitle} | Music by patrickdearteaga.com`;

  return (
    <button
      className={className}
      onClick={toggleMusic}
      title={creditTitle}
      aria-label={isPlaying ? 'Disable background music' : 'Enable background music'}
      disabled={!isLoaded}
    >
      <span className="music-toggle-icon">{isPlaying ? '🔊' : '🔇'}</span>
    </button>
  );
};

const NavigationBoxes: React.FC = () => {
  const pilotLinks = NAVIGATION_LINKS.filter((link) => link.category === 'pilot');
  const generalLinks = NAVIGATION_LINKS.filter((link) => link.category === 'general');

  return (
    <>
      <VoxelTitle />
      <MusicToggle />
      <div className="navigation-boxes-container">
        <p className="voxel-tagline">Are you ready to play?</p>

        {/* Featured section for general audience */}
        <div className="navigation-featured">
          {generalLinks.map((link) => (
            <NavigationBox key={link.id} link={link} variant="featured" />
          ))}
        </div>

        {/* Pilot tools section */}
        <div className="navigation-pilot-section">
          <span className="navigation-pilot-label">Pilot Tools</span>
          <div className="navigation-pilot-boxes">
            {pilotLinks.map((link) => (
              <NavigationBox key={link.id} link={link} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

let root: Root | null = null;

/**
 * Creates and mounts the navigation boxes UI
 */
export const createNavigationBoxes = (container: HTMLElement): (() => void) => {
  root = createRoot(container);
  root.render(<NavigationBoxes />);

  return () => {
    if (root) {
      root.unmount();
      root = null;
    }
  };
};

export default NavigationBoxes;
