import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../utils/userState';

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        setLoading(true);

        // Simulate login delay
        setTimeout(() => {
            const result = loginUser(email, password);

            if (result.isNew) {
                // CASE: Different/New login details -> Show user selector for year/stream
                navigate('/onboarding');
            } else if (result.state.study_plan_exists && result.state.diagnostic_completed) {
                // CASE: Match in database -> Directly show dashboard
                navigate('/dashboard');
            } else if (result.state.onboarding_completed) {
                if (!result.state.diagnostic_completed) {
                    navigate('/diagnostic-quiz', {
                        state: {
                            year: result.state.selected_year,
                            stream: result.state.selected_stream,
                            board: result.state.selected_board
                        }
                    });
                } else {
                    navigate('/dashboard');
                }
            } else {
                navigate('/onboarding');
            }
            setLoading(false);
        }, 800);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-pastel-bg p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="text-3xl font-bold text-pastel-primary mb-2">ExamPilot<span className="text-pastel-secondary">AI</span></div>
                    <p className="text-gray-500">Welcome back, future engineer!</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 mt-1 border border-gray-100 bg-gray-50 rounded-xl focus:ring-2 focus:ring-pastel-primary focus:border-transparent outline-none transition-all"
                            placeholder="student@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            required
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 mt-1 border border-gray-100 bg-gray-50 rounded-xl focus:ring-2 focus:ring-pastel-primary focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-pastel-primary text-white font-bold rounded-xl hover:bg-violet-600 transition shadow-lg shadow-pastel-primary/20 flex items-center justify-center"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : "Sign In"}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-500">
                    Don't have an account? <span className="text-pastel-primary font-bold cursor-pointer hover:underline">Sign up</span>
                </div>
            </div>
        </div>
    );
};

export default Login;
