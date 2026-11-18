import type { JSX } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { AppShell } from '@/components/layout/app-shell';
import LoginPage from '@/pages/login-page';
import SignupPage from '@/pages/signup-page';
import ForgotPasswordPage from '@/pages/forgot-password-page';
import ResetPasswordPage from '@/pages/reset-password-page';
import DashboardPage from '@/pages/dashboard-page';
import WorkstreamsPage from '@/pages/workstreams-page';
import InitiativesListPage from '@/pages/initiatives-list-page';
import InitiativeDetailPage from '@/pages/initiative-detail-page';
import ExportsPage from '@/pages/exports-page';
import ImpactViewPage from '@/pages/impact-view-page';
import UsersPage from '@/pages/users-page';

export default function App(): JSX.Element {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors closeButton />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/impact" element={<ImpactViewPage />} />
            <Route path="/workstreams" element={<WorkstreamsPage />} />
            <Route path="/initiatives" element={<InitiativesListPage />} />
            <Route path="/initiatives/:id" element={<InitiativeDetailPage />} />
            <Route path="/exports" element={<ExportsPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
