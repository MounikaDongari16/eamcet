import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import DiagnosticQuiz from './pages/DiagnosticQuiz';
import QuizResults from './pages/QuizResults';
import MyPlan from './pages/MyPlan';
import PracticeTests from './pages/MockTests';
import PracticeQuiz from './pages/PracticeQuiz';
import Performance from './pages/Performance';
import Settings from './pages/Settings';
import RedirectHandler from './components/RedirectHandler';

function App() {
  return (
    <Router>
      <RedirectHandler />
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/diagnostic-quiz" element={<DiagnosticQuiz />} />
          <Route path="/quiz-results" element={<QuizResults />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-plan" element={<MyPlan />} />
          <Route path="/mock-tests" element={<PracticeTests />} />
          <Route path="/practice-quiz" element={<PracticeQuiz />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/plan" element={<MyPlan />} />
          <Route path="/dashboard/plans" element={<MyPlan />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
