"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  MessageSquare,
  AlertTriangle,
  Clock,
  FileText,
  Lightbulb
} from 'lucide-react';
import { ApprovalRequest } from '@/types';

interface ApprovalButtonProps {
  approval: ApprovalRequest;
  onApprove: (approvalId: string, notes?: string) => void;
  onReject: (approvalId: string, reason: string) => void;
  onViewDetails: (approvalId: string) => void;
}

export default function ApprovalButton({ 
  approval, 
  onApprove, 
  onReject, 
  onViewDetails 
}: ApprovalButtonProps) {
  const [expanded, setExpanded] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'copy': return <FileText className="h-4 w-4" />;
      case 'creative': return <Lightbulb className="h-4 w-4" />;
      case 'budget': return <Clock className="h-4 w-4" />;
      case 'strategy': return <AlertTriangle className="h-4 w-4" />;
      case 'distribution': return <MessageSquare className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'copy': return 'bg-blue-100 text-blue-800';
      case 'creative': return 'bg-purple-100 text-purple-800';
      case 'budget': return 'bg-green-100 text-green-800';
      case 'strategy': return 'bg-orange-100 text-orange-800';
      case 'distribution': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'approved': return 'secondary';
      case 'rejected': return 'destructive';
      case 'reviewed': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="w-full">
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${getTypeColor(approval.type)}`}>
                {getTypeIcon(approval.type)}
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Aprovação {approval.type}
                </CardTitle>
                <CardDescription className="text-sm">
                  {approval.agent_id} · {approval.squad_id}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={getStatusVariant(approval.status)}>
                {approval.status}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <Eye size={20} /> : <Eye size={20} />}
              </Button>
            </div>
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="space-y-4">
            {/* Preview Content */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Conteúdo para aprovação:</div>
              <div className="text-sm whitespace-pre-wrap">{approval.content}</div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600">Cliente</div>
                <div className="font-medium text-sm">{approval.client_id}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600">Tipo</div>
                <div className="font-medium text-sm">{approval.type}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600">Criado</div>
                <div className="font-medium text-sm">
                  {new Date(approval.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600">Agente</div>
                <div className="font-medium text-sm">{approval.agent_id}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {approval.status === 'pending' && (
                <>
                  <Button
                    onClick={() => onApprove(approval.id)}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectDialog(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => onViewDetails(approval.id)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalhes
              </Button>
            </div>

            {/* Notes */}
            {approval.notes && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Notas:</strong> {approval.notes}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Rejeitar Aprovação</CardTitle>
              <CardDescription>
                Informe o motivo para rejeitar esta aprovação
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
                    onReject(approval.id, rejectReason);
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
    </div>
  );
}