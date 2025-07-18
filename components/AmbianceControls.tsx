// components/AmbianceControls.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import MusicIcon from './icons/MusicIcon.tsx';
import PlayIcon from './icons/PlayIcon.tsx';
import PauseIcon from './icons/PauseIcon.tsx';
import Volume2Icon from './icons/Volume2Icon.tsx';
import Spinner from './common/Spinner.tsx';

const AMBIANCE_SOUNDS = {
  none: { name: 'Aucun', dataUrl: '' },
  cafe: { name: 'Café', dataUrl: '/assets/audio/cafe.mp3' },
  forest: { name: 'Forêt', dataUrl: '/assets/audio/forest.mp3' },
  rain: { name: 'Pluie', dataUrl: '/assets/audio/rain.mp3' },
  fireplace: { name: 'Cheminée', dataUrl: '/assets/audio/fireplace.mp3' },
};

type AmbianceSoundKey = keyof typeof AMBIANCE_SOUNDS;
type AudioStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'stalled' | 'error';


const AmbianceControls: React.FC = () => {
  const [selectedSound, setSelectedSound] = useState<AmbianceSoundKey>('none');
  const [volume, setVolume] = useState(0.5);
  const [userIntent, setUserIntent] = useState<'play' | 'pause'>('pause');
  
  const [audioStatus, setAudioStatus] = useState<AudioStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize Audio element and listeners
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audioRef.current = audio;

    const onPlaying = () => setAudioStatus('playing');
    const onPause = () => setAudioStatus('paused');
    const onWaiting = () => setAudioStatus('stalled');
    const onCanPlay = () => audioStatus === 'stalled' && setAudioStatus('paused'); // if it was stalled, it's now ready but paused
    const onLoadStart = () => setAudioStatus('loading');
    
    const onError = (e: Event) => {
        const mediaError = (e.target as HTMLAudioElement).error;
        console.error("Audio Error Event:", mediaError);
        let message = 'Une erreur audio inconnue est survenue.';
        if (mediaError) {
          switch (mediaError.code) {
            case mediaError.MEDIA_ERR_ABORTED:
              message = 'Lecture annulée par l\'utilisateur.'; break;
            case mediaError.MEDIA_ERR_NETWORK:
              message = 'Erreur réseau lors du chargement.'; break;
            case mediaError.MEDIA_ERR_DECODE:
              message = 'Erreur de décodage, fichier corrompu ?'; break;
            case mediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              message = 'Format non supporté ou fichier introuvable.'; break;
            default:
              message = mediaError.message || `Code d'erreur inconnu: ${mediaError.code}`;
          }
        }
        setErrorMessage(message);
        setAudioStatus('error');
    };

    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('loadstart', onLoadStart);
    audio.addEventListener('error', onError);

    const cleanupAudio = audio;
    return () => {
        cleanupAudio.pause();
        cleanupAudio.removeEventListener('playing', onPlaying);
        cleanupAudio.removeEventListener('pause', onPause);
        cleanupAudio.removeEventListener('waiting', onWaiting);
        cleanupAudio.removeEventListener('canplay', onCanPlay);
        cleanupAudio.removeEventListener('loadstart', onLoadStart);
        cleanupAudio.removeEventListener('error', onError);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Main effect to handle audio state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Sync volume
    if (audio.volume !== volume) {
      audio.volume = volume;
    }

    // Sync source based on selectedSound
    const soundData = AMBIANCE_SOUNDS[selectedSound];
    const newSrc = soundData?.dataUrl ? new URL(soundData.dataUrl, window.location.origin).href : '';

    if (audio.src !== newSrc) {
        audio.src = newSrc;
        if (newSrc) {
            audio.load();
        } else {
            // No source, ensure everything is reset
            if (!audio.paused) audio.pause();
            setAudioStatus('idle');
            setUserIntent('pause');
        }
    }
    
    // Sync play/pause based on userIntent
    if (userIntent === 'play' && audio.paused && newSrc) {
        setErrorMessage(null);
        // Play returns a promise that can reject if autoplay is blocked
        audio.play().catch(err => {
            console.error('Play failed:', err);
            setErrorMessage(`Lecture bloquée par le navigateur. Cliquez sur play.`);
            setAudioStatus('paused'); // It's paused because play failed
            setUserIntent('pause');
        });
    } else if (userIntent === 'pause' && !audio.paused) {
        audio.pause();
    }
  }, [selectedSound, volume, userIntent]);

  const handleSoundChange = (key: AmbianceSoundKey) => {
    setErrorMessage(null);
    setSelectedSound(key);
    // If user selected a new sound, let's keep their intent to play
    if (key === 'none') {
      setUserIntent('pause');
    }
  };

  const togglePlayPause = () => {
    if (selectedSound !== 'none') {
        setUserIntent(prev => prev === 'play' ? 'pause' : 'play');
    }
  };
  
  const showLoading = audioStatus === 'loading' || audioStatus === 'stalled';
  const showPlayButton = userIntent === 'pause' || audioStatus === 'paused' || audioStatus === 'error' || audioStatus === 'idle';

  return (
    <div className="flex items-center gap-2 relative group">
        <MusicIcon />
        <select 
            value={selectedSound} 
            onChange={e => handleSoundChange(e.target.value as AmbianceSoundKey)}
            className="bg-transparent text-sm font-medium focus:outline-none"
        >
            {Object.entries(AMBIANCE_SOUNDS).map(([key, {name}]) => (
                <option key={key} value={key} className="text-black dark:text-white dark:bg-gray-800">{name}</option>
            ))}
        </select>
        
        <button 
            onClick={togglePlayPause} 
            disabled={selectedSound === 'none' || showLoading}
            className="p-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={showPlayButton ? "Jouer" : "Mettre en pause"}
        >
            {showLoading ? (
                <Spinner className="w-4 h-4" />
            ) : showPlayButton ? (
                <PlayIcon />
            ) : (
                <PauseIcon />
            )}
        </button>
        
        <div className="flex items-center gap-1">
             <Volume2Icon />
             <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={volume} 
                onChange={e => setVolume(parseFloat(e.target.value))}
                className="w-20"
                aria-label="Volume"
            />
        </div>
        
        {errorMessage && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-red-100 text-red-700 text-xs rounded shadow-md whitespace-nowrap z-10">
                {errorMessage}
            </div>
        )}
    </div>
  );
};

export default AmbianceControls;
