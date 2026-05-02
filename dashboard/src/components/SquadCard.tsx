"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Play,
  Settings,
  MessageSquare,
  Brain
} from 'lucide-react';
import { Squad } from '@/types';

interface SquadCardProps {
  squad: Squad;
  onConfigure?: (squadId: string) => void;
  onCommunication?: (squadId: string) => void;
  onStartWorkflow?: (squadId: string) => void;
}

export default function SquadCard({ 
  squad, 
  onConfigure, 
  onCommunication, 
  onStartWorkflow 
}: SquadCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-yellow-500';
      case 'blocked': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-gray-100 text-gray-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'blocked': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activeAgents = squad.agents.filter(agent => agent.status === 'running').length;
  const totalAgents = squad.agents.length;
  const completionRate = totalAgents > 0 ? (activeAgents / totalAgents) * 100 : 0;

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{squad.name}</CardTitle>
              <CardDescription className="text-sm">{squad.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(squad.status)}`} />
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

      <CardContent className="space-y-4">
        {/* Status Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalAgents}</div>
            <div className="text-xs text-gray-600">Agentes</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{activeAgents}</div>
            <div className="text-xs text-gray-600">Ativos</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {completionRate.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-600">Progresso</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {squad.mem0_scopes.length}
            </div>
            <div className="text-xs text-gray-600">Mem0 Scopes</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Utilização da Squad</span>
            <span>{completionRate.toFixed(0)}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>

        {/* Model Information */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Brain className="h-4 w-4 text-blue-500" />
            <div>
              <div className="text-sm font-medium">Modelos</div>
              <div className="text-xs text-gray-600">
                Tier 0: {squad.tier_0_model.split('-')[0]} | Tier 1: {squad.tier_1_model.split('-')[0]}
              </div>
            </div>
          </div>
          <Badge variant="outline">{squad.agents.length} agentes</Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => onStartWorkflow?.(squad.id)}
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-2" />
            Iniciar Workflow
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCommunication?.(squad.id)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Comunicar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onConfigure?.(squad.id)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>

        {/* Expanded View - Agents */}
        {expanded && (
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Agentes da Squad</h4>
              <span className="text-sm text-gray-600">{totalAgents} agentes</span>
            </div>
            <div className="space-y-2">
              {squad.agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${getAgentStatusColor(agent.status).split(' ')[0]}`} />
                    <div>
                      <div className="font-medium text-sm">{agent.name}</div>
                      <div className="text-xs text-gray-600">{agent.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="outline" 
                      className={getAgentStatusColor(agent.status)}
                    >
                      {agent.tier === 0 ? 'Orquestrador' : 
                       agent.tier === 1 ? 'Principal' : 'Suporte'}
                    </Badge>
                    {agent.current_task && (
                      <Badge variant="secondary" className="text-xs">
                        {agent.current_task}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
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
