import React from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { protectPage } from '@/lib/auth';

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protect page at server level
  await protectPage(['SUPER_ADMIN']);

  return (
    <DashboardLayout requiredRole="SUPER_ADMIN">
      {children}
    </DashboardLayout>
  );
}
