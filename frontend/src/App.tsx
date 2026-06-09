import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Page imports
import Dashboard from './pages/Dashboard';
import Repositories from './pages/Repositories';
import ContributorIntelligence from './pages/ContributorIntelligence';
import DependencyRisk from './pages/DependencyRisk';
import SecurityDashboard from './pages/SecurityDashboard';
import RiskAlerts from './pages/RiskAlerts';
import TrendAnalysis from './pages/TrendAnalysis';
import ReportsCenter from './pages/ReportsCenter';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import LandingPage from './landing/LandingPage';
import { OnboardingTour } from './onboarding/OnboardingTour';
import { OnboardingWizard } from './onboarding/OnboardingWizard';

// Authentication Guard Wrapper
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Workspace Shell Layout
const LayoutShell = () => {
  const [showWizard, setShowWizard] = useState<boolean>(() => {
    return localStorage.getItem('onboarding_completed') !== 'true';
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar navigation */}
      <Sidebar />
      
      {/* Content layout panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        <Navbar />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/repositories" element={<Repositories />} />
            <Route path="/contributors" element={<ContributorIntelligence />} />
            <Route path="/dependencies" element={<DependencyRisk />} />
            <Route path="/security" element={<SecurityDashboard />} />
            <Route path="/alerts" element={<RiskAlerts />} />
            <Route path="/trends" element={<TrendAnalysis />} />
            <Route path="/reports" element={<ReportsCenter />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>

      {/* Guided landmark tour tooltips */}
      <OnboardingTour />

      {/* Initial repo registration wizard modal */}
      {showWizard && (
        <OnboardingWizard 
          onClose={() => setShowWizard(false)} 
          onComplete={() => setShowWizard(false)} 
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public marketing portal */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Public login portal */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected workspace console */}
        <Route 
          path="/*" 
          element={
            <AuthGuard>
              <LayoutShell />
            </AuthGuard>
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;
