import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from '@/Layout';
import Dashboard from '@/pages/Dashboard';
import Customers from '@/pages/Customers';
import CustomerDetail from '@/pages/CustomerDetail';
import Contracts from '@/pages/Contracts';
import ContractDetail from '@/pages/ContractDetail';
import VvlDashboard from '@/pages/VvlDashboard';
import Providers from '@/pages/Providers';
import Tasks from '@/pages/Tasks';
import Backup from '@/pages/Backup';
import Branches from '@/pages/Branches';
import Users from '@/pages/Users';
import UserDetail from '@/pages/UserDetail';
import BranchDetail from '@/pages/BranchDetail';
import Settings from '@/pages/Settings';
import Hardware from '@/pages/Hardware';
import Calendar from '@/pages/Calendar';
import Reminders from '@/pages/Reminders';
import LoginPage from '@/pages/LoginPage';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import { Toaster } from '@/components/ui/sonner';

// Private Route Wrapper
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0F1115] text-[#FFD24D]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFD24D]"></div>
          <p className="font-medium">System wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const App = () => {
  console.log('[App.jsx] Rendering App Component');
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/detail" element={<CustomerDetail />} />
              <Route path="customers/:id" element={<CustomerDetail />} />
              <Route path="contracts" element={<Contracts />} />
              <Route path="contracts/detail" element={<ContractDetail />} />
              <Route path="contracts/:id" element={<ContractDetail />} />
              <Route path="vvl" element={<VvlDashboard />} />
              <Route path="providers" element={<Providers />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="backup" element={<Backup />} />
              <Route path="branches" element={<Branches />} />
              <Route path="branches/detail" element={<BranchDetail />} />
              <Route path="users" element={<Users />} />
              <Route path="users/detail" element={<UserDetail />} />
              <Route path="settings" element={<Settings />} />
              <Route path="hardware" element={<Hardware />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="reminders" element={<Reminders />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Route>
          </Routes>
          <Toaster />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
