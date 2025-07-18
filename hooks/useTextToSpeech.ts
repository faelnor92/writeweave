// hooks/useTextToSpeech.ts
import { useState, useEffect, useCallback, useRef } from 'react';

type TTSState = 'idle' | 'playing' | 'paused';

export const useTextToSpeech = (getTextToSpeak: () => string) => {
    const [ttsState, setTtsState] = useState<TTSState>('idle');
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const utteranceQueueRef = useRef<SpeechSynthesisUtterance[]>([]);
    const isStoppedManuallyRef = useRef<boolean>(false);
    const keepAliveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

    const stopKeepAlive = useCallback(() => {
        if (keepAliveIntervalRef.current) {
            clearInterval(keepAliveIntervalRef.current);
            keepAliveIntervalRef.current = null;
        }
    }, []);

    const startKeepAlive = useCallback(() => {
        stopKeepAlive();
        keepAliveIntervalRef.current = setInterval(() => {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.pause();
                window.speechSynthesis.resume();
            } else {
                stopKeepAlive();
            }
        }, 10000); // Relaunch every 10s to prevent timeout
    }, [stopKeepAlive]);

    useEffect(() => {
        if (!isSupported) return;

        const handleVoicesChanged = () => {
            setVoices(window.speechSynthesis.getVoices());
        };

        window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
        handleVoicesChanged();

        return () => {
            window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            stopKeepAlive();
        };
    }, [isSupported, stopKeepAlive]);
    
    const speakNext = useCallback(() => {
        if (!isSupported || utteranceQueueRef.current.length === 0 || isStoppedManuallyRef.current) {
            setTtsState('idle');
            stopKeepAlive();
            return;
        }
        window.speechSynthesis.speak(utteranceQueueRef.current.shift()!);
    }, [isSupported, stopKeepAlive]);

    const play = useCallback(() => {
        if (!isSupported) return;

        if (ttsState === 'paused') {
            window.speechSynthesis.resume();
            return;
        }

        if (ttsState === 'playing') return;

        window.speechSynthesis.cancel();
        isStoppedManuallyRef.current = false;

        const text = getTextToSpeak();
        if (!text.trim()) {
            setTtsState('idle');
            return;
        }
        
        const chunks: string[] = [];
        let remainingText = text;
        const MAX_CHUNK_LENGTH = 200;

        while (remainingText.length > 0) {
            if (remainingText.length <= MAX_CHUNK_LENGTH) {
                chunks.push(remainingText);
                break;
            }

            let splitPos = -1;
            const sentenceBreak = remainingText.substring(0, MAX_CHUNK_LENGTH).lastIndexOf('. ') || remainingText.substring(0, MAX_CHUNK_LENGTH).lastIndexOf('! ') || remainingText.substring(0, MAX_CHUNK_LENGTH).lastIndexOf('? ');
            
            if (sentenceBreak > -1) {
                splitPos = sentenceBreak + 1;
            } else {
                splitPos = remainingText.lastIndexOf(' ', MAX_CHUNK_LENGTH);
            }

            if (splitPos === -1) splitPos = MAX_CHUNK_LENGTH;
            
            chunks.push(remainingText.substring(0, splitPos));
            remainingText = remainingText.substring(splitPos).trim();
        }

        const frVoices = voices.filter(v => v.lang.startsWith('fr-FR'));
        const selectedVoice = frVoices.find(v => v.name.toLowerCase().includes('google')) || 
                            frVoices.find(v => v.name.toLowerCase().includes('natural')) || 
                            frVoices[0];

        utteranceQueueRef.current = chunks.map(chunk => {
            const utterance = new SpeechSynthesisUtterance(chunk);
            if (selectedVoice) utterance.voice = selectedVoice;
            utterance.lang = 'fr-FR';
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.onstart = () => { setTtsState('playing'); startKeepAlive(); };
            utterance.onpause = () => { setTtsState('paused'); stopKeepAlive(); };
            utterance.onresume = () => { setTtsState('playing'); startKeepAlive(); };
            utterance.onend = () => { if (!isStoppedManuallyRef.current) speakNext(); };
            utterance.onerror = (e) => { console.error('SpeechSynthesisUtterance error:', e); setTtsState('idle'); stopKeepAlive(); };
            return utterance;
        });
        
        speakNext();
        
    }, [isSupported, ttsState, voices, getTextToSpeak, speakNext, startKeepAlive, stopKeepAlive]);

    const pause = useCallback(() => {
        if (isSupported && ttsState === 'playing') {
            window.speechSynthesis.pause();
            // onpause will handle state and keep-alive
        }
    }, [isSupported, ttsState]);

    const stop = useCallback(() => {
        if (isSupported) {
            isStoppedManuallyRef.current = true;
            utteranceQueueRef.current = [];
            window.speechSynthesis.cancel();
            setTtsState('idle');
            stopKeepAlive();
        }
    }, [isSupported, stopKeepAlive]);

    return { ttsState, play, pause, stop, isSupported };
};
