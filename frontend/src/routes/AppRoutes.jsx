import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { Dashboard } from '../pages/Dashboard';
import { Expenses } from '../pages/Expenses';
import { AddExpense } from '../pages/AddExpense';
import { ReceiptScanner } from '../pages/ReceiptScanner';
import { Budgets } from '../pages/Budgets';
import { Insights } from '../pages/Insights';
import { Reports } from '../pages/Reports';
import { Profile } from '../pages/Profile';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected Application Routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/expenses/add" element={<AddExpense />} />
        <Route path="/expenses/scan" element={<ReceiptScanner />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
