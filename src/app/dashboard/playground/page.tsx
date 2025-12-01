'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SendIcon, BotIcon, UserIcon } from 'lucide-react';
import { listAgents, type Agent } from '@/lib/api/agents';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function PlaygroundPage() {
  const [agentId, setAgentId] = useState('');
  const [userPhone, setUserPhone] = useState('+1234567890');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: () => listAgents({}),
  });

  const selectedAgent = agents?.find((a) => a.agentId === agentId || a._id === agentId);

  const pollForResponse = async (convId: string, retries = 10) => {
    for (let i = 0; i < retries; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2500)); // Wait 2.5s between polls

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/playground/conversation/${convId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (!response.ok) continue;

        const data = await response.json();
        if (data.success && data.conversation?.messages) {
          const msgs = data.conversation.messages;
          const assistantMsgs = msgs.filter((m: any) => m.role === 'assistant');

          if (assistantMsgs.length > 0) {
            // Get latest assistant message
            const latestAssistant = assistantMsgs[assistantMsgs.length - 1];
            const assistantMessage: Message = {
              role: 'assistant',
              content: latestAssistant.content,
              timestamp: new Date(latestAssistant.timestamp),
            };
            setMessages((prev) => [...prev, assistantMessage]);
            return true;
          }
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }
    return false;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !agentId) {
      setError('Please enter agent ID and message');
      return;
    }

    setError(null);
    setIsLoading(true);

    // Add user message to chat
    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/playground/message`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            agentId,
            userPhone,
            text: currentMessage,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to send message');
      }

      const data = await response.json();

      if (data.success && data.conversationId) {
        setConversationId(data.conversationId);

        // Poll for agent response (20-second batching)
        const gotResponse = await pollForResponse(data.conversationId);

        if (!gotResponse) {
          setError('No response received after 25 seconds. Agent may be processing or inactive.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Playground</h1>
        <p className="text-gray-600 mt-2">
          Test your SMS agents without using real SMS credits
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>
              Set up your test parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agentId">Agent</Label>
              <Select value={agentId} onValueChange={setAgentId}>
                <SelectTrigger id="agentId">
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents?.map((agent) => (
                    <SelectItem key={agent._id} value={agent.agentId || agent._id}>
                      {agent.name} ({agent.phoneNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAgent && (
                <p className="text-xs text-gray-600">
                  ID: {selectedAgent.agentId || selectedAgent._id}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="userPhone">Test User Phone</Label>
              <Input
                id="userPhone"
                placeholder="+1234567890"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
              />
              <p className="text-xs text-gray-600">
                Simulated user phone number (not sent via SMS)
              </p>
            </div>

            <Button
              onClick={() => {
                setMessages([]);
                setError(null);
              }}
              variant="outline"
              className="w-full"
            >
              Clear Conversation
            </Button>
          </CardContent>
        </Card>

        {/* Chat Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
            <CardDescription>
              Chat with your agent in test mode
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Messages */}
            <div className="space-y-4 mb-4 min-h-[400px] max-h-[500px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                  <BotIcon className="h-16 w-16 mb-4" />
                  <p className="text-lg font-medium">No messages yet</p>
                  <p className="text-sm">Send a message to start testing</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        message.role === 'user'
                          ? 'bg-blue-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <UserIcon className="h-4 w-4 text-blue-600" />
                      ) : (
                        <BotIcon className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div
                      className={`flex-1 space-y-2 overflow-hidden rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p
                        className={`text-xs ${
                          message.role === 'user'
                            ? 'text-blue-100'
                            : 'text-gray-500'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Type your test message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading || !agentId}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim() || !agentId}
              >
                {isLoading ? (
                  'Sending...'
                ) : (
                  <>
                    <SendIcon className="h-4 w-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}