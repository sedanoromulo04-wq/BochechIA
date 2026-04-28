"use client";

import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Brain,
  Settings,
  MessageSquare,
  TrendingUp,
  Activity,
  Calendar
} from 'lucide-react';
import { Client } from '@/types';

interface ClientBadgeProps {
  client: Client;
  onConfigure?: (clientId: string) => void;
  onCommunication?: (clientId: string) => void;
  onViewDetails?: (clientId: string) => void;
  showMemory?: boolean;
  showStats?: boolean;
}

export default function ClientBadge({ 
  client, 
  onConfigure, 
  onCommunication,
  onViewDetails,
  showMemory = false,
  showStats = false
}: ClientBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-yellow-500';
      case 'onboarding': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'onboarding': return 'Onboarding';
      default: return 'Desconhecido';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{client.name}</CardTitle>
              <CardDescription className="text-sm">
                ID: {client.id} · Criado em {formatDate(client.created_at)}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(client.status)}`} />
              <Badge variant="outline">{getStatusText(client.status)}</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Mem0 Context */}
          {showMemory && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Brain className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Contexto Mem0</h4>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-blue-800">
                  <strong>User ID:</strong> {client.mem0_user_id}
                </div>
                <div className="text-sm text-blue-800">
                  <strong>Status:</strong> Contexto disponível para agentes
                </div>
                <Button size="sm" variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Memórias
                </Button>
              </div>
            </div>
          )}

          {/* Stats */}
          {showStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">24</div>
                <div className="text-xs text-gray-600">Workflows</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">18</div>
                <div className="text-xs text-gray-600">Concluídos</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">3</div>
                <div className="text-xs text-gray-600">Pendentes</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">92%</div>
                <div className="text-xs text-gray-600">Sucesso</div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="space-y-2">
            <h4 className="font-medium">Atividade Recente</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <div className="text-sm">
                    <div className="font-medium">Lançamento de campanha</div>
                    <div className="text-xs text-gray-600">há 2 horas</div>
                  </div>
                </div>
                <Badge variant="secondary">Concluído</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <div className="text-sm">
                    <div className="font-medium">Reunião estratégica</div>
                    <div className="text-xs text-gray-600">ontem</div>
                  </div>
                </div>
                <Badge variant="secondary">Completado</Badge>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => onViewDetails?.(client.id)}
              className="flex-1"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Ver Dashboard
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCommunication?.(client.id)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Comunicar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onConfigure?.(client.id)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          </div>
        </CardContent>
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