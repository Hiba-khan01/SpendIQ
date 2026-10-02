import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Navbar } from '../components/common/Navbar';

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (path) => {
    if (path.startsWith('/expenses/add')) return 'Add New Expense';
    if (path.startsWith('/expenses/scan')) return 'AI Receipt Scanner';
    if (path.startsWith('/expenses')) return 'Expense History';
    if (path.startsWith('/budgets')) return 'Monthly Budgets';
    if (path.startsWith('/insights')) return 'AI Financial Insights';
    if (path.startsWith('/reports')) return 'Monthly Financial Reports';
    if (path.startsWith('/profile')) return 'Profile & Settings';
    return 'Financial Dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar
          onOpenSidebar={() => setSidebarOpen(true)}
          pageTitle={getPageTitle(location.pathname)}
        />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
