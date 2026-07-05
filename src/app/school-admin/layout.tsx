import React from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { protectPage } from '@/lib/auth';

export default async function SchoolAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protect page at server level
  await protectPage(['SCHOOL_ADMIN']);

  return (
    <DashboardLayout requiredRole="SCHOOL_ADMIN">
      {children}
    </DashboardLayout>
  );
}
