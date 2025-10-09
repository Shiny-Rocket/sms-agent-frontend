'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UsersIcon, MessageSquareIcon, DollarSignIcon, ActivityIcon } from 'lucide-react';

interface OverviewStats {
  totalAgents: number;
  activeAgents: number;
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  totalCost: number;
}

async function getOverviewStats(): Promise<OverviewStats> {
  const { data } = await apiClient.get('/stats/overview');
  return data.stats;
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['overview-stats'],
    queryFn: getOverviewStats,
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of your SMS agents and conversations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <UsersIcon className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAgents || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats?.activeAgents || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <MessageSquareIcon className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalConversations || 0}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {stats?.activeConversations || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <ActivityIcon className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMessages || 0}</div>
            <p className="text-xs text-gray-600 mt-1">Total sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats?.totalCost || 0).toFixed(2)}
            </div>
            <p className="text-xs text-gray-600 mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Quick actions to get your SMS agents up and running
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <UsersIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Create your first agent</h3>
                <p className="text-sm text-gray-600">
                  Set up an AI-powered SMS agent with custom prompts
                </p>
              </div>
              <a
                href="/dashboard/agents"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Go to Agents →
              </a>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <PlayIcon className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Test in Playground</h3>
                <p className="text-sm text-gray-600">
                  Try out your agents without using real SMS credits
                </p>
              </div>
              <a
                href="/dashboard/playground"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Go to Playground →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}