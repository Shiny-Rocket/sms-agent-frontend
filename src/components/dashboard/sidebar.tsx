'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  HomeIcon,
  UsersIcon,
  MessageSquareIcon,
  PlayIcon,
  PhoneIcon,
  WrenchIcon,
  BookIcon,
  SettingsIcon,
  LogOutIcon,
  PlugIcon,
} from 'lucide-react';
import { logout, getStoredUser } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon },
  { name: 'Agents', href: '/dashboard/agents', icon: UsersIcon },
  { name: 'Conversations', href: '/dashboard/conversations', icon: MessageSquareIcon },
  { name: 'Playground', href: '/dashboard/playground', icon: PlayIcon },
  { name: 'Phone Numbers', href: '/dashboard/phone-numbers', icon: PhoneIcon },
  { name: 'Integrations', href: '/dashboard/integrations', icon: PlugIcon },
  { name: 'Tools', href: '/dashboard/tools', icon: WrenchIcon },
  { name: 'Knowledge Base', href: '/dashboard/knowledge', icon: BookIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = getStoredUser();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-gray-50">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">SMS Agent</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-200 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{user?.name || 'User'}</p>
            <p className="truncate text-xs text-gray-500">{user?.email || ''}</p>
          </div>
        </div>
        <Button
          onClick={logout}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <LogOutIcon className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}