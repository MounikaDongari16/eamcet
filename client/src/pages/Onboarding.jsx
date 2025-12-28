import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, Brain, CheckCircle } from 'lucide-react';
import { saveUserState, saveUserPlan } from '../utils/userState';
import { fetchApi } from '../services/api';

const Onboarding = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        year: '',
        stream: 'MPC',
        board: '', // New: TS or AP
        hasKnowledge: ''
    });

    const [loading, setLoading] = useState(false);

    const handleNext = async () => {
        if (step < 3) setStep(step + 1);
        else {
            // Save initial flags
            saveUserState({
                onboarding_completed: true,
                selected_year: formData.year,
                selected_stream: formData.stream,
                selected_board: formData.board
            });

            if (formData.hasKnowledge === 'yes') {
                navigate('/diagnostic-quiz', { state: { ...formData } });
            } else {
                // "No Idea" Path -> Generate Syllabus-Aligned Foundational Plan
                setLoading(true);
                try {
                    const data = await fetchApi('/api/plan/generate', {
                        method: 'POST',
                        body: JSON.stringify({
                            userProfile: {
                                ...formData,
                                startType: 'foundation'
                            }
                        })
                    });

                    if (data.plan) {
                        saveUserState({
                            study_plan_exists: true,
                            diagnostic_completed: true // Mark as done since they skipped it for foundational
                        });
                        saveUserPlan(data.plan);
                        localStorage.setItem('planSource', 'Official Intermediate Syllabus');
                        navigate('/dashboard/plans', { state: { plan: data.plan } });
                    } else {
                        throw new Error("No plan returned");
                    }
                } catch (error) {
                    console.error("Plan Generation Error:", error);
                    // Even if error, mark state so they don't get stuck in onboarding
                    saveUserState({ study_plan_exists: true, diagnostic_completed: true });
                    navigate('/dashboard', { state: { demoMode: true, planType: 'official', ...formData } });
                } finally {
                    setLoading(false);
                }
            }
        }
    };

    const SelectionCard = ({ icon: Icon, title, selected, onClick }) => (
        <div
            onClick={onClick}
            className={`cursor-pointer p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-4 relative ${selected
                ? 'border-pastel-primary bg-pastel-lavender/50 shadow-md transform scale-105'
                : 'border-gray-100 bg-white hover:border-pastel-primary/30 hover:shadow-sm'
                }`}
        >
            <div className={`p-4 rounded-full ${selected ? 'bg-pastel-primary text-white' : 'bg-gray-50 text-gray-400'}`}>
                {Icon && <Icon size={32} />}
            </div>
            <h3 className={`font-semibold text-lg text-center ${selected ? 'text-pastel-primary' : 'text-gray-600'}`}>{title}</h3>
            {selected && <div className="absolute top-3 right-3 text-pastel-primary"><CheckCircle size={20} /></div>}
        </div>
    );

    return (
        <div className="min-h-screen bg-pastel-bg flex items-center justify-center p-6">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12 relative">
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">Let's personalize your path</h2>
                        <span className="text-pastel-primary font-medium">Step {step} of 3</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                            className="bg-pastel-primary h-full transition-all duration-500 ease-out"
                            style={{ width: `${(step / 3) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {loading && (
                    <div className="absolute inset-0 bg-white/90 z-50 flex flex-col items-center justify-center rounded-2xl">
                        <div className="w-16 h-16 border-4 border-pastel-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-600 font-medium animate-pulse text-center">
                            Analyzing official {formData.board} MPC syllabus...<br />
                            Crafting your {formData.year} aligned plan.
                        </p>
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-6 animate-fadeIn">
                        <h3 className="text-xl text-center text-gray-600 mb-6">Which year are you currently in?</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {['1st Year', '2nd Year', 'Dropper'].map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => setFormData({ ...formData, year: opt })}
                                    className={`p-4 rounded-lg border-2 font-medium transition ${formData.year === opt
                                        ? 'border-pastel-primary bg-pastel-lavender text-pastel-primary'
                                        : 'border-gray-200 hover:border-pastel-primary/50'
                                        }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-8 animate-fadeIn">
                        <div>
                            <h3 className="text-lg font-medium text-gray-700 mb-4 text-center">Select your board</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setFormData({ ...formData, board: 'TS (Telangana)' })}
                                    className={`p-4 rounded-lg border-2 font-medium transition ${formData.board === 'TS (Telangana)'
                                        ? 'border-pastel-primary bg-pastel-lavender text-pastel-primary'
                                        : 'border-gray-200 hover:border-pastel-primary/50'
                                        }`}
                                >
                                    TS Intermediate
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, board: 'AP (Andhra Pradesh)' })}
                                    className={`p-4 rounded-lg border-2 font-medium transition ${formData.board === 'AP (Andhra Pradesh)'
                                        ? 'border-pastel-primary bg-pastel-lavender text-pastel-primary'
                                        : 'border-gray-200 hover:border-pastel-primary/50'
                                        }`}
                                >
                                    AP Intermediate
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-700 mb-4 text-center">Confirm your stream</h3>
                            <div className="flex justify-center">
                                <SelectionCard
                                    icon={GraduationCap}
                                    title="MPC (Engineering)"
                                    selected={formData.stream === 'MPC'}
                                    onClick={() => setFormData({ ...formData, stream: 'MPC' })}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-fadeIn">
                        <h3 className="text-xl text-center text-gray-600 mb-6">How comfortable are you with the subjects?</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <SelectionCard
                                icon={BookOpen}
                                title="I know basics (Diagnostic Quiz)"
                                selected={formData.hasKnowledge === 'yes'}
                                onClick={() => setFormData({ ...formData, hasKnowledge: 'yes' })}
                            />
                            <SelectionCard
                                icon={Brain}
                                title="Starting fresh (Auto-Plan)"
                                selected={formData.hasKnowledge === 'no'}
                                onClick={() => setFormData({ ...formData, hasKnowledge: 'no' })}
                            />
                        </div>
                    </div>
                )}

                <div className="mt-10 flex justify-end">
                    <button
                        onClick={handleNext}
                        disabled={
                            (step === 1 && !formData.year) ||
                            (step === 2 && !formData.stream) ||
                            (step === 3 && !formData.hasKnowledge)
                        }
                        className="px-8 py-3 bg-pastel-primary text-white rounded-xl font-semibold shadow-lg hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95"
                    >
                        {step === 3 ? (formData.hasKnowledge === 'yes' ? 'Take Quiz' : 'Create Plan') : 'Next Step'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
