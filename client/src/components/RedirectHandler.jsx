import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserState } from '../utils/userState';

const RedirectHandler = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const state = getUserState();
        const currentPath = window.location.pathname;

        // Skip redirection if already on these pages to avoid loops or interrupts
        // Added '/' because user wants to see login details first
        if (['/', '/login', '/quiz-results', '/practice-quiz'].includes(currentPath)) return;

        if (state.study_plan_exists && state.diagnostic_completed) {
            // CASE 2: ACTIVE USER
            if (currentPath === '/' || currentPath === '/diagnostic-quiz' || currentPath === '/onboarding') {
                navigate('/dashboard');
            }
        } else if (!state.onboarding_completed) {
            // NEW USER must do onboarding first to get Year/Stream
            if (currentPath === '/dashboard' || currentPath === '/diagnostic-quiz') {
                navigate('/onboarding');
            }
        } else if (!state.diagnostic_completed) {
            // CASE 1: NEW USER (who finished onboarding but not quiz)
            if (currentPath === '/' || currentPath === '/dashboard' || currentPath === '/onboarding') {
                navigate('/diagnostic-quiz', {
                    state: {
                        year: state.selected_year,
                        stream: state.selected_stream,
                        board: state.selected_board
                    }
                });
            }
        } else if (!state.study_plan_exists) {
            // Finished quiz but no plan? Go to results to generate it.
            if (currentPath === '/' || currentPath === '/dashboard' || currentPath === '/diagnostic-quiz') {
                navigate('/onboarding'); // Fallback to start fresh or try to find quiz
            }
        }
    }, [navigate]);

    return null;
};

export default RedirectHandler;
