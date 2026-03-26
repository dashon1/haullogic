import { Component } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Landing from './pages/Landing';
import GetQuote from './pages/GetQuote';
import AdminDashboard from './pages/AdminDashboard';
import DriverView from './pages/DriverView';
import Onboarding from './pages/Onboarding';
import PublicQuote from './pages/PublicQuote';

class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error('App error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold mb-2 text-slate-800">Something went wrong</h1>
          <p className="text-slate-500 text-sm mb-6">An unexpected error occurred. Please refresh the page.</p>
          <button onClick={() => window.location.reload()} className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-orange-600">
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/Landing" element={<Landing />} />
      <Route path="/GetQuote" element={<GetQuote />} />
      <Route path="/AdminDashboard" element={<AdminDashboard />} />
      <Route path="/DriverView" element={<DriverView />} />
      <Route path="/Onboarding" element={<Onboarding />} />
      <Route path="/quote/:businessId" element={<PublicQuote />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
