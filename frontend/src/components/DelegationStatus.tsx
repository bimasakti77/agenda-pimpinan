"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, User, ArrowRight, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { apiService } from "@/services/apiService";
import toast from "react-hot-toast";

interface DelegationChainItem {
  id: number;
  username: string;
  email: string;
  delegation_level: number;
  status: string;
  delegated_to_nama?: string;
  notes?: string;
  responded_at?: string;
}

interface DelegationStatusProps {
  undanganId: number;
  showDetails?: boolean;
}

export default function DelegationStatus({ undanganId, showDetails = false }: DelegationStatusProps) {
  const [delegationChain, setDelegationChain] = useState<DelegationChainItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [canDelegate, setCanDelegate] = useState(false);
  const [delegationInfo, setDelegationInfo] = useState<any>(null);

  useEffect(() => {
    if (undanganId) {
      loadDelegationChain();
      checkDelegationEligibility();
    }
  }, [undanganId]);

  const loadDelegationChain = async () => {
    setLoading(true);
    try {
      const response = await apiService.get(`/undangan/${undanganId}/delegation-chain`);
      setDelegationChain(response.delegationChain || []);
    } catch (error) {
      console.error('Error loading delegation chain:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkDelegationEligibility = async () => {
    try {
      const response = await apiService.get(`/undangan/${undanganId}/can-delegate`);
      setCanDelegate(response.canDelegate);
      setDelegationInfo(response);
    } catch (error) {
      console.error('Error checking delegation eligibility:', error);
      setCanDelegate(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'opened':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'responded':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="secondary">Belum Dibaca</Badge>;
      case 'opened':
        return <Badge variant="default">Sudah Dibaca</Badge>;
      case 'responded':
        return <Badge variant="default" className="bg-green-100 text-green-800">Sudah Merespons</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDelegationLevelBadge = (level: number) => {
    const colors = ['bg-blue-100 text-blue-800', 'bg-orange-100 text-orange-800', 'bg-red-100 text-red-800'];
    return (
      <Badge className={colors[level] || 'bg-gray-100 text-gray-800'}>
        Level {level}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Memuat status delegasi...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (delegationChain.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Status Delegasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            Belum ada delegasi untuk undangan ini
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          Status Delegasi
        </CardTitle>
        <CardDescription>
          Rantai delegasi undangan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Delegation Info */}
        {delegationInfo && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  Delegasi Level: {delegationInfo.delegationLevel || 0}/2
                </span>
                {delegationInfo.canDelegate ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Dapat Delegasi
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    Tidak Dapat Delegasi
                  </Badge>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Delegation Chain */}
        <div className="space-y-3">
          {delegationChain.map((item, index) => (
            <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex-shrink-0">
                {getDelegationLevelBadge(item.delegation_level)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-sm">{item.username}</span>
                  <span className="text-xs text-gray-500">({item.email})</span>
                </div>
                
                {item.delegated_to_nama && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ArrowRight className="h-3 w-3" />
                    <span>Delegasi ke: {item.delegated_to_nama}</span>
                  </div>
                )}
                
                {item.notes && showDetails && (
                  <div className="text-xs text-gray-500 mt-1">
                    Catatan: {item.notes}
                  </div>
                )}
                
                {item.responded_at && (
                  <div className="text-xs text-gray-500 mt-1">
                    Respons: {new Date(item.responded_at).toLocaleString('id-ID')}
                  </div>
                )}
              </div>
              
              <div className="flex-shrink-0 flex items-center gap-2">
                {getStatusIcon(item.status)}
                {getStatusBadge(item.status)}
              </div>
            </div>
          ))}
        </div>

        {/* Warning for max delegation */}
        {delegationInfo && !delegationInfo.canDelegate && delegationInfo.reason && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <div className="text-sm">
                {delegationInfo.reason}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

