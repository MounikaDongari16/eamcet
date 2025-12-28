export const getUserState = () => {
    const state = localStorage.getItem('eamcet_user_state');
    return state ? JSON.parse(state) : {
        diagnostic_completed: false,
        study_plan_exists: false,
        onboarding_completed: false,
        selected_year: null,
        selected_stream: null,
        selected_board: null
    };
};

export const saveUserState = (newState) => {
    const currentState = getUserState();
    const updatedState = { ...currentState, ...newState };
    localStorage.setItem('eamcet_user_state', JSON.stringify(updatedState));
    syncUserToDb(updatedState);
};

export const syncUserToDb = (state = null, plan = null) => {
    const currentUser = localStorage.getItem('eamcet_current_user');
    if (!currentUser) return;

    const db = JSON.parse(localStorage.getItem('eamcet_users_db') || '{}');
    const user = db[currentUser] || { state: {}, plan: null };

    if (state) user.state = state;
    if (plan) user.plan = plan;

    db[currentUser] = user;
    localStorage.setItem('eamcet_users_db', JSON.stringify(db));
};

export const loginUser = (email, password) => {
    // In a real app, this would be an API call to a database
    // For now, we simulate with a 'users_db' in localStorage
    const db = JSON.parse(localStorage.getItem('eamcet_users_db') || '{}');
    const user = db[email];

    // Clear current session first
    resetUserState();
    localStorage.setItem('eamcet_current_user', email);

    if (user && user.state) {
        // Match found! Load their specific data
        localStorage.setItem('eamcet_user_state', JSON.stringify(user.state));
        if (user.plan) {
            localStorage.setItem('userPlan', JSON.stringify(user.plan));
        }
        return { success: true, isNew: false, state: user.state };
    } else {
        // No match found or new user
        return { success: true, isNew: true };
    }
};

export const saveUserPlan = (plan) => {
    localStorage.setItem('userPlan', JSON.stringify(plan));
    syncUserToDb(null, plan);
};

export const resetUserState = () => {
    localStorage.removeItem('eamcet_user_state');
    localStorage.removeItem('userPlan');
    localStorage.removeItem('planSource');
    localStorage.removeItem('quizHistory');
    localStorage.removeItem('practiceHistory');
    // Note: eamcet_current_user is NOT removed here to keep track of the session
};
