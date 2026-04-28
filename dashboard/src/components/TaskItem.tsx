"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Play,
  Pause,
  User,
  Calendar,
  MessageSquare,
  Zap,
  Workflow,
  FileText,
  Target
} from 'lucide-react';
import { Task } from '@/types';

interface TaskItemProps {
  task: Task;
  onExecute?: (taskId: string) => void;
  onPause?: (taskId: string) => void;
  onApprove?: (taskId: string) => void;
  onReject?: (taskId: string, reason: string) => void;
  onViewDetails?: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
}

export default function TaskItem({ 
  task, 
  onExecute, 
  onPause, 
  onApprove, 
  onReject,
  onViewDetails,
  onEdit
}: TaskItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'running': return <Zap className="h-4 w-4" />;
      case 'awaiting_approval': return <CheckCircle className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <AlertTriangle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'awaiting_approval': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'pending': return 0;
      case 'running': return 50;
      case 'awaiting_approval': return 75;
      case 'approved': return 90;
      case 'completed': return 100;
      case 'rejected': return 0;
      default: return 0;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'running': return 'default';
      case 'awaiting_approval': return 'default';
      case 'approved': return 'secondary';
      case 'rejected': return 'destructive';
      case 'completed': return 'secondary';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className={`p-2 rounded-lg ${getStatusColor(task.status)}`}>
              {getStatusIcon(task.status)}
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-semibold">
                {task.title}
              </CardTitle>
              <CardDescription className="text-sm">
                {task.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={getStatusVariant(task.status)}>
              {task.status}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso da Tarefa</span>
              <span>{getProgressValue(task.status)}%</span>
            </div>
            <Progress value={getProgressValue(task.status)} className="h-2" />
          </div>

          {/* Task Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600">Squad</div>
              <div className="font-medium text-sm">{task.squad_id}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600">Agente</div>
              <div className="font-medium text-sm">{task.agent_id}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600">Cliente</div>
              <div className="font-medium text-sm">{task.client_id}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600">Criado</div>
              <div className="font-medium text-sm">{formatDate(task.created_at)}</div>
            </div>
          </div>

          {/* Workflow File */}
          {task.workflow_file && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Workflow className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-sm font-medium">Workflow Associado</div>
                  <div className="text-xs text-blue-600">{task.workflow_file}</div>
                </div>
              </div>
            </div>
          )}

          {/* Mem0 Context Status */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <div>
                  <div className="text-sm font-medium">Contexto Mem0</div>
                  <div className="text-xs text-gray-600">
                    {task.mem0_context_loaded ? 'Carregado' : 'Não carregado'}
                  </div>
                </div>
              </div>
              {!task.mem0_context_loaded && (
                <Button size="sm" variant="outline">
                  Carregar Contexto
                </Button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {task.status === 'pending' && (
              <Button
                onClick={() => onExecute?.(task.id)}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                Executar
              </Button>
            )}
            
            {task.status === 'running' && (
              <Button
                onClick={() => onPause?.(task.id)}
                variant="outline"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pausar
              </Button>
            )}
            
            {task.status === 'awaiting_approval' && (
              <>
                <Button
                  onClick={() => onApprove?.(task.id)}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectDialog(true)}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
              </>
            )}
            
            <Button
              variant="outline"
              onClick={() => onViewDetails?.(task.id)}
            >
              <Target className="h-4 w-4 mr-2" />
              Detalhes
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onEdit?.(task.id)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-gray-500">
            Atualizado em {formatDate(task.updated_at)}
          </div>
        </CardContent>
      )}

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Rejeitar Tarefa</CardTitle>
              <CardDescription>
                Informe o motivo para rejeitar esta tarefa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explique o motivo da rejeição..."
                className="w-full p-3 border rounded-lg resize-none h-24"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectDialog(false);
                    setRejectReason('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    onReject?.(task.id, rejectReason);
                    setShowRejectDialog(false);
                    setRejectReason('');
                  }}
                  disabled={!rejectReason.trim()}
                >
                  Rejeitar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
}

function ChevronUp({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
  );
}

function ChevronDown({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
}