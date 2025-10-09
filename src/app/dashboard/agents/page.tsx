'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listAgents, deleteAgent, updateAgentStatus, type Agent } from '@/lib/api/agents';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PlusIcon, MoreVerticalIcon, PlayIcon, PauseIcon, TrashIcon } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function AgentsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents', statusFilter],
    queryFn: () =>
      listAgents(statusFilter !== 'all' ? { status: statusFilter } : {}),
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

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleStatusChange = async (id: string, status: Agent['status']) => {
    await statusMutation.mutateAsync({ id, status });
  };

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
        <Link href="/dashboard/agents/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            New Agent
          </Button>
        </Link>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('active')}
          >
            Active
          </Button>
          <Button
            variant={statusFilter === 'draft' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('draft')}
          >
            Draft
          </Button>
          <Button
            variant={statusFilter === 'paused' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('paused')}
          >
            Paused
          </Button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-gray-500">Loading agents...</div>
        ) : agents && agents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Conversations</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent._id}>
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
                  <TableCell>
                    <Badge variant="outline">{agent.provider}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(agent.status)}</TableCell>
                  <TableCell>{agent.metadata.totalConversations}</TableCell>
                  <TableCell>
                    {format(new Date(agent.createdAt), 'MMM d, yyyy')}
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
            <p className="text-gray-500 mb-4">No agents found</p>
            <Link href="/dashboard/agents/new">
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create your first agent
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}