'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpenIcon } from 'lucide-react';

export default function KnowledgeBasePage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Knowledge Base</h1>
        <p className="text-gray-600 mt-2">
          Upload and manage documents for RAG (Retrieval Augmented Generation)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpenIcon className="h-5 w-5" />
            Knowledge Base
          </CardTitle>
          <CardDescription>
            Upload documents to enhance your agent's knowledge
          </CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Coming Soon
          </h3>
          <p className="text-gray-600">
            Knowledge base management will be available in a future update
          </p>
        </CardContent>
      </Card>
    </div>
  );
}