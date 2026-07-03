import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { store } from './store/store.js';
import { loadMe } from './store/authSlice.js';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegistrationPage from './pages/RegistrationPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import GenealogyTreePage from './pages/GenealogyTreePage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import UserManagementPage from './pages/UserManagementPage.jsx';
import IncomeReportsPage from './pages/IncomeReportsPage.jsx';
import FundReportsPage from './pages/FundReportsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import WithdrawalsPage from './pages/WithdrawalsPage.jsx';
import ShopPage from './pages/ShopPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import './styles.css';

function Bootstrap() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  React.useEffect(() => {
    if (token) {
      dispatch(loadMe());
    }
  }, [dispatch, token]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegistrationPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to={localStorage.getItem('zix_panther_token') ? '/dashboard' : '/login'} replace />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tree" element={<GenealogyTreePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/withdrawals" element={<WithdrawalsPage />} />
          <Route path="/income-reports" element={<IncomeReportsPage />} />
          <Route path="/fund-reports" element={<FundReportsPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/users" element={<UserManagementPage />} />
            <Route path="/orders" element={<OrdersPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={localStorage.getItem('zix_panther_token') ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

function AppRoutes() {
  return <Bootstrap />;
}