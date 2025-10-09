'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WrenchIcon } from 'lucide-react';

export default function ToolsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Tools</h1>
        <p className="text-gray-600 mt-2">
          External tools and integrations for your agents
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WrenchIcon className="h-5 w-5" />
            Agent Tools
          </CardTitle>
          <CardDescription>
            Configure webhooks and external tool integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <WrenchIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Coming Soon
          </h3>
          <p className="text-gray-600">
            Tool management will be available in a future update
          </p>
        </CardContent>
      </Card>
    </div>
  );
}