import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Brain, TrendingUp } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="bg-pastel-bg min-h-screen flex flex-col">
            {/* Header */}
            <header className="px-6 py-4 flex justify-between items-center bg-white shadow-sm">
                <div className="text-2xl font-bold text-pastel-primary">
                    ExamPilot<span className="text-pastel-secondary">AI</span>
                </div>
                <div className="space-x-4">
                    <Link to="/login" className="px-4 py-2 text-pastel-text hover:text-pastel-primary transition">Log In</Link>
                    <Link to="/login" className="px-4 py-2 bg-pastel-primary text-white rounded-lg hover:bg-violet-600 transition shadow-md">
                        Get Started
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-grow container mx-auto px-6 py-12 flex flex-col items-center justify-center text-center">
                <div className="max-w-3xl space-y-6">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-pastel-text leading-tight">
                        ExamPilot AI – <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pastel-primary to-pastel-secondary">
                            Real-Time Learning Navigator
                        </span>
                    </h1>
                    <p className="text-gray-600 text-lg md:text-xl">
                        Empowering your EAMCET preparation with advanced AI guidance.
                        Master complex concepts, solve doubts instantly, and navigate your path to success with our real-time learning pilot.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link to="/login" className="px-8 py-3 bg-pastel-primary text-white font-semibold rounded-xl shadow-lg hover:bg-violet-600 transition flex items-center gap-2">
                            Start Learning <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LandingPage;
