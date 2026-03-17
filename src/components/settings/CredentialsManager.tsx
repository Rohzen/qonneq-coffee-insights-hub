import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export const CredentialsManager = () => {
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [credentials, setCredentials] = useState<any[]>([]);

    const [cimbaliUsername, setCimbaliUsername] = useState("");
    const [cimbaliPassword, setCimbaliPassword] = useState("");
    const [britaApiKey, setBritaApiKey] = useState("");
    const [britaTenantId, setBritaTenantId] = useState("");

    const fetchCredentials = async () => {
        try {
            const response = await fetch("/api/settings/credentials", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (data.success) {
                setCredentials(data.data);
                // Pre-fill fields if they exist
                const cimbali = data.data.find((c: any) => c.provider === "cimbali");
                if (cimbali) {
                    setCimbaliUsername(cimbali.credentials.username || "");
                    setCimbaliPassword(cimbali.credentials.password || "");
                }
                const brita = data.data.find((c: any) => c.provider === "brita");
                if (brita) {
                    setBritaApiKey(brita.credentials.apiKey || "");
                    setBritaTenantId(brita.credentials.tenantId || "");
                }
            }
        } catch (error) {
            console.error("Error fetching credentials:", error);
        }
    };

    useEffect(() => {
        if (token) fetchCredentials();
    }, [token]);

    const handleSave = async (provider: string, creds: any) => {
        setLoading(true);
        try {
            const response = await fetch("/api/settings/credentials/save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ provider, credentials: creds }),
            });
            const data = await response.json();
            if (data.success) {
                toast.success(`${provider} credentials saved successfully`);
                fetchCredentials();
            } else {
                toast.error(data.error || "Failed to save credentials");
            }
        } catch (error) {
            toast.error("An error occurred while saving");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>La Cimbali</CardTitle>
                    <CardDescription>Configure Telemetry API credentials (ART:IN:COFFEE EVO)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="cimbali-user">Username</Label>
                        <Input
                            id="cimbali-user"
                            value={cimbaliUsername}
                            onChange={(e) => setCimbaliUsername(e.target.value)}
                            placeholder="user@example.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cimbali-pass">Password</Label>
                        <Input
                            id="cimbali-pass"
                            type="password"
                            value={cimbaliPassword}
                            onChange={(e) => setCimbaliPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                    <Button
                        onClick={() => handleSave("cimbali", { username: cimbaliUsername, password: cimbaliPassword })}
                        disabled={loading}
                    >
                        Save Cimbali
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>BRITA iQ</CardTitle>
                    <CardDescription>Configure BRITA iQ Public API credentials</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="brita-key">API Key (X-API-KEY)</Label>
                        <Input
                            id="brita-key"
                            value={britaApiKey}
                            onChange={(e) => setBritaApiKey(e.target.value)}
                            placeholder="uuid-api-key"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="brita-tenant">Tenant ID</Label>
                        <Input
                            id="brita-tenant"
                            value={britaTenantId}
                            onChange={(e) => setBritaTenantId(e.target.value)}
                            placeholder="organization-uuid"
                        />
                    </div>
                    <Button
                        onClick={() => handleSave("brita", { apiKey: britaApiKey, tenantId: britaTenantId })}
                        disabled={loading}
                    >
                        Save BRITA
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};
