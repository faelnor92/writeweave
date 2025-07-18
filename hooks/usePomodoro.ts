


import { useState, useEffect, useCallback, useRef } from 'react';
import { POMODORO_CYCLES } from '../constants.ts';
import type { PomodoroSettings } from '../types.ts';

export const usePomodoro = (settings: PomodoroSettings) => {
    const [timer, setTimer] = useState(settings.work);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
    const [cycle, setCycle] = useState(0);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    
    // Sync timer if settings change
    useEffect(() => {
        if (!isActive) {
            switch(mode) {
                case 'work': setTimer(settings.work); break;
                case 'shortBreak': setTimer(settings.shortBreak); break;
                case 'longBreak': setTimer(settings.longBreak); break;
            }
        }
    }, [settings, mode, isActive]);


    const playSound = () => {
        try {
            const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3');
            audio.play();
        } catch(e){
            console.error("Impossible de jouer le son de notification.", e);
        }
    };

    const nextMode = useCallback(() => {
        setIsActive(false);
        playSound();
        if (mode === 'work') {
            const newCycle = cycle + 1;
            setCycle(newCycle);
            if (newCycle % POMODORO_CYCLES === 0) {
                setMode('longBreak');
                setTimer(settings.longBreak);
            } else {
                setMode('shortBreak');
                setTimer(settings.shortBreak);
            }
        } else {
            setMode('work');
            setTimer(settings.work);
        }
    }, [mode, cycle, settings]);

    useEffect(() => {
        if (isActive) {
            intervalRef.current = setInterval(() => {
                setTimer((prevTimer) => {
                    if (prevTimer <= 1) {
                        nextMode();
                        return 0;
                    }
                    return prevTimer - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, nextMode]);
    
    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setMode('work');
        setTimer(settings.work);
        setCycle(0);
    };

    const skipTimer = () => {
        nextMode();
    };

    return { timer, isActive, mode, cycle, toggleTimer, resetTimer, skipTimer };
};