import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Cloud, Ticket, Users, Save, Loader2 } from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/components/ui/use-toast";

interface ApiConfig {
    provider: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    fieldLabel: string;
    fieldKey: string;
}

const API_CONFIGS: ApiConfig[] = [
    {
        provider: 'openweathermap',
        label: 'OpenWeatherMap',
        description: 'Dati meteo orari storici (One Call 3.0)',
        icon: <Cloud className="w-5 h-5 text-blue-500" />,
        fieldLabel: 'API Key',
        fieldKey: 'api_key',
    },
    {
        provider: 'ticketmaster',
        label: 'Ticketmaster',
        description: 'Eventi nelle vicinanze (Discovery API v2)',
        icon: <Ticket className="w-5 h-5 text-purple-500" />,
        fieldLabel: 'API Key',
        fieldKey: 'api_key',
    },
    {
        provider: 'besttime',
        label: 'BestTime.app',
        description: 'Affluenza locale e previsioni settimanali',
        icon: <Users className="w-5 h-5 text-green-500" />,
        fieldLabel: 'Private API Key',
        fieldKey: 'api_key',
    },
];

export const ApiConfigurationManager = () => {
    const { apiProvider } = useAuth();
    const { toast } = useToast();
    const [values, setValues] = useState<Record<string, string>>({});
    const [configured, setConfigured] = useState<Record<string, boolean>>({});
    const [saving, setSaving] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        // Check which providers are configured by trying to load credentials
        // We use the save endpoint pattern - credentials are stored per company_id + provider
        for (const config of API_CONFIGS) {
            try {
                const resp = await apiProvider.getCustomerCredentials('self');
                // This is a simplified check - the actual status comes from saved state
            } catch {
                // Ignore errors during status check
            }
        }
    };

    const handleSave = async (config: ApiConfig) => {
        const value = values[config.provider];
        if (!value || !value.trim()) {
            toast({ title: 'Errore', description: 'Inserisci una API key valida', variant: 'destructive' });
            return;
        }

        setSaving((prev) => ({ ...prev, [config.provider]: true }));
        try {
            const response = await fetch('/api/settings/credentials/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('qonneq_portal_auth_token')}`,
                },
                body: JSON.stringify({
                    provider: config.provider,
                    credentials: { [config.fieldKey]: value.trim() },
                }),
            });

            const data = await response.json();
            if (data.success) {
                setConfigured((prev) => ({ ...prev, [config.provider]: true }));
                toast({ title: 'Salvato', description: `Credenziali ${config.label} salvate con successo` });
            } else {
                toast({ title: 'Errore', description: data.error || 'Errore nel salvataggio', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Errore', description: 'Errore di rete', variant: 'destructive' });
        } finally {
            setSaving((prev) => ({ ...prev, [config.provider]: false }));
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold mb-1">Configurazioni API Esterne</h2>
                <p className="text-sm text-gray-500">
                    Configura le API key per arricchire i dati delle macchine con informazioni meteo, eventi e affluenza.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {API_CONFIGS.map((config) => (
                    <Card key={config.provider}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {config.icon}
                                    <CardTitle className="text-lg">{config.label}</CardTitle>
                                </div>
                                <Badge variant={configured[config.provider] ? 'default' : 'secondary'}>
                                    {configured[config.provider] ? 'Configurato' : 'Non configurato'}
                                </Badge>
                            </div>
                            <CardDescription>{config.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor={`key-${config.provider}`}>{config.fieldLabel}</Label>
                                    <Input
                                        id={`key-${config.provider}`}
                                        type="password"
                                        placeholder={`Inserisci ${config.fieldLabel}`}
                                        value={values[config.provider] || ''}
                                        onChange={(e) => setValues((prev) => ({ ...prev, [config.provider]: e.target.value }))}
                                    />
                                </div>
                                <Button
                                    onClick={() => handleSave(config)}
                                    disabled={saving[config.provider] || !values[config.provider]?.trim()}
                                    className="w-full"
                                >
                                    {saving[config.provider] ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    Salva
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
