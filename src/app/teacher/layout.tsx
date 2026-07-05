import React from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { protectPage } from '@/lib/auth';

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protect page at server level
  await protectPage(['TEACHER']);

  return (
    <DashboardLayout requiredRole="TEACHER">
      {children}
    </DashboardLayout>
  );
}
