'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listAgents, deleteAgent, updateAgentStatus, getAgent, createAgent, type Agent } from '@/lib/api/agents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PlusIcon, MoreVerticalIcon, SearchIcon, PlayIcon, PauseIcon, TrashIcon, CopyIcon, CheckIcon } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function AgentsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => listAgents({}),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Agent['status'] }) =>
      updateAgentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const agent = await getAgent(id);

      // Create a duplicate with modified name and phone number
      const duplicateData = {
        name: `${agent.name} (Copy)`,
        phoneNumber: agent.phoneNumber,
        provider: agent.provider,
        systemPrompt: agent.systemPrompt,
        actions: agent.actions || [],
        dataFields: agent.dataFields || [],
        promptVariables: agent.promptVariables || {},
        status: 'draft' as const,
      };

      return await createAgent(duplicateData);
    },
    onSuccess: (newAgent) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      router.push(`/dashboard/agents/${newAgent._id}`);
    },
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleStatusChange = async (id: string, status: Agent['status']) => {
    await statusMutation.mutateAsync({ id, status });
  };

  const handleCopyId = async (id: string) => {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDuplicate = async (id: string) => {
    await duplicateMutation.mutateAsync(id);
  };

  // Filter agents based on search query
  const filteredAgents = useMemo(() => {
    if (!agents) return [];
    if (!searchQuery.trim()) return agents;

    const query = searchQuery.toLowerCase();
    return agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(query) ||
        agent.phoneNumber.includes(query) ||
        agent.provider.toLowerCase().includes(query)
    );
  }, [agents, searchQuery]);

  const getStatusBadge = (status: Agent['status']) => {
    const variants: Record<Agent['status'], 'default' | 'secondary' | 'destructive'> = {
      draft: 'secondary',
      active: 'default',
      paused: 'secondary',
      archived: 'destructive',
    };

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agents</h1>
          <p className="text-gray-600 mt-2">
            Manage your SMS agents and their configurations
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/playground">
            <Button variant="outline">
              Playground
            </Button>
          </Link>
          <Link href="/dashboard/agents/new">
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              New agent
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-gray-500">Loading agents...</div>
        ) : filteredAgents && filteredAgents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Chats</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent) => (
                <TableRow key={agent._id}>
                  <TableCell className="font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 truncate max-w-[120px]" title={agent.agentId || agent._id}>
                        {(agent.agentId || agent._id).slice(0, 8)}...
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleCopyId(agent.agentId || agent._id)}
                        title="Copy full Agent ID"
                      >
                        {copiedId === (agent.agentId || agent._id) ? (
                          <CheckIcon className="h-3 w-3 text-green-600" />
                        ) : (
                          <CopyIcon className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/agents/${agent._id}`}
                      className="hover:underline"
                    >
                      {agent.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {agent.phoneNumber}
                  </TableCell>
                  <TableCell>{getStatusBadge(agent.status)}</TableCell>
                  <TableCell>{agent.metadata.totalConversations}</TableCell>
                  <TableCell>
                    {format(new Date(agent.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {format(new Date(agent.updatedAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVerticalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/agents/${agent._id}`}>
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDuplicate(agent._id)}
                        >
                          <CopyIcon className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        {agent.status === 'active' ? (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(agent._id, 'paused')
                            }
                          >
                            <PauseIcon className="mr-2 h-4 w-4" />
                            Pause
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(agent._id, 'active')
                            }
                          >
                            <PlayIcon className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(agent._id)}
                          className="text-red-600"
                        >
                          <TrashIcon className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-12 text-center">
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'No agents match your search' : 'No agents found'}
            </p>
            {!searchQuery && (
              <Link href="/dashboard/agents/new">
                <Button>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create your first agent
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}