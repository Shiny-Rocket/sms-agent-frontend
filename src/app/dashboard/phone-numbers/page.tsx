'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PhoneIcon } from 'lucide-react';

export default function PhoneNumbersPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Phone Numbers</h1>
        <p className="text-gray-600 mt-2">
          Manage your Telnyx and Vonage phone numbers
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PhoneIcon className="h-5 w-5" />
            Phone Numbers
          </CardTitle>
          <CardDescription>
            View and configure phone numbers for your SMS agents
          </CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <PhoneIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Coming Soon
          </h3>
          <p className="text-gray-600">
            Phone number management will be available in a future update
          </p>
        </CardContent>
      </Card>
    </div>
  );
}