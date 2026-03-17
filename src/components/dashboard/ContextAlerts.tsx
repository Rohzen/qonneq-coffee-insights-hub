import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Info } from 'lucide-react';
import { ContextAlert } from '@/types/dashboard';

interface ContextAlertsProps {
    alerts: ContextAlert[];
    isLoading?: boolean;
}

export const ContextAlerts: React.FC<ContextAlertsProps> = ({ alerts, isLoading }) => {
    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-4">
                    <p className="text-sm text-gray-500 animate-pulse">Caricamento contesto...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" />
                    Contesto Ambientale
                </CardTitle>
            </CardHeader>
            <CardContent>
                {alerts.length === 0 ? (
                    <p className="text-sm text-gray-500">Nessun evento nelle vicinanze</p>
                ) : (
                    <div className="space-y-2">
                        {alerts.map((alert, index) => (
                            <div
                                key={index}
                                className={`flex items-start gap-2 text-sm p-2 rounded-lg ${
                                    alert.severity === 'warning'
                                        ? 'bg-amber-50 text-amber-800'
                                        : 'bg-blue-50 text-blue-800'
                                }`}
                            >
                                {alert.severity === 'warning' ? (
                                    <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-amber-500" />
                                ) : (
                                    <Info size={14} className="mt-0.5 flex-shrink-0 text-blue-500" />
                                )}
                                <span>{alert.message}</span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
