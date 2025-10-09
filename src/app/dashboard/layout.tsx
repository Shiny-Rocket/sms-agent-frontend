'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/api/auth';
import { Sidebar } from '@/components/dashboard/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // Check authentication on mount (client-side only)
    const authenticated = isAuthenticated();
    setIsAuth(authenticated);
    setIsChecking(false);

    if (!authenticated) {
      router.push('/login');
    }
  }, [router]);

  // Show loading state while checking auth (prevents hydration mismatch)
  if (isChecking) {
    return null;
  }

  // Don't render if not authenticated
  if (!isAuth) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-white">
        {children}
      </main>
    </div>
  );
}