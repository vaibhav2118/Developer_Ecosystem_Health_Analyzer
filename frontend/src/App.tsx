import React from 'react';
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
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar navigation */}
      <Sidebar />
      
      {/* Content layout panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        <Navbar />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/repositories" element={<Repositories />} />
            <Route path="/contributors" element={<ContributorIntelligence />} />
            <Route path="/dependencies" element={<DependencyRisk />} />
            <Route path="/security" element={<SecurityDashboard />} />
            <Route path="/alerts" element={<RiskAlerts />} />
            <Route path="/trends" element={<TrendAnalysis />} />
            <Route path="/reports" element={<ReportsCenter />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
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
