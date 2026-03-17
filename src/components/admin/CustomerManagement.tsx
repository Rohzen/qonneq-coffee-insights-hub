
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Settings2, Key, Coffee, Trash2 } from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const CustomerManagement = () => {
    const { apiProvider } = useAuth();
    const { toast } = useToast();
    const [customers, setCustomers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: "" });

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const resp = await apiProvider.getCustomers();
            if (resp.success) {
                setCustomers(resp.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCustomer = async (id: number | string) => {
        try {
            const resp = await apiProvider.deleteCustomer(String(id));
            if (resp.success) {
                toast({ title: "Eliminato", description: "Cliente eliminato con successo" });
                fetchCustomers();
            } else {
                toast({ title: "Errore", description: resp.error || "Errore durante l'eliminazione", variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const resp = await apiProvider.createCustomer(newCustomer);
            if (resp.success) {
                toast({ title: "Successo", description: "Cliente creato con successo" });
                setIsCreateOpen(false);
                setNewCustomer({ name: "" });
                fetchCustomers();
            } else {
                toast({ title: "Errore", description: resp.error || "Impossibile creare il cliente", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Errore", description: "Errore di rete", variant: "destructive" });
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Cerca clienti..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                            <Plus size={18} />
                            Nuovo Cliente
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Aggiungi Nuovo Cliente</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateCustomer} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome Azienda</Label>
                                <Input
                                    id="name"
                                    value={newCustomer.name}
                                    onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full">Crea Cliente</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Macchine</TableHead>
                                <TableHead className="text-right">Azioni</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={3} className="text-center py-8 text-gray-500">Caricamento...</TableCell></TableRow>
                            ) : filteredCustomers.length === 0 ? (
                                <TableRow><TableCell colSpan={3} className="text-center py-8 text-gray-500">Nessun cliente trovato</TableCell></TableRow>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <TableRow key={customer.id}>
                                        <TableCell className="font-medium">{customer.name}</TableCell>
                                        <TableCell>{customer.machines_count || 0}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <CredentialManager customer={customer} onUpdate={fetchCustomers} />

                                            <Button variant="ghost" size="icon" title="Modifica">
                                                <Settings2 size={16} />
                                            </Button>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" title="Elimina" className="text-red-500 hover:text-red-700">
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Questa azione eliminerà il cliente "{customer.name}", tutte le sue credenziali API e scollegherà le macchine associate. L'azione non è reversibile.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteCustomer(customer.id)} className="bg-red-600 hover:bg-red-700">
                                                            Elimina
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

const CredentialManager = ({ customer, onUpdate }: { customer: any, onUpdate: () => void }) => {
    const { apiProvider } = useAuth();
    const { toast } = useToast();
    const [credentials, setCredentials] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newCred, setNewCred] = useState({
        provider: 'cimbali',
        name: '',
        baseUrl: 'https://public-api.cimbaligroup.tech/api/v1/',
        username: '',
        password: '',
        startIndex: 0,
        limit: 100,
        apiKey: '',
        tenantId: ''
    });

    const fetchCredentials = async () => {
        setIsLoading(true);
        try {
            const resp = await apiProvider.getCustomerCredentials(customer.id);
            if (resp.success) setCredentials(resp.data || []);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        const payload = {
            provider: newCred.provider,
            name: newCred.name || `${newCred.provider} Account`,
            credentials: newCred.provider === 'cimbali'
                ? {
                    baseUrl: newCred.baseUrl,
                    username: newCred.username,
                    password: newCred.password,
                    startIndex: newCred.startIndex,
                    limit: newCred.limit
                }
                : { apiKey: newCred.apiKey, tenantId: newCred.tenantId }
        };

        const resp = await apiProvider.saveCustomerCredential(customer.id, payload);
        if (resp.success) {
            toast({ title: "Salvato", description: "Credenziali salvate con successo" });
            setIsAdding(false);
            fetchCredentials();
        } else {
            toast({ title: "Errore", description: resp.error || "Errore nel salvataggio", variant: "destructive" });
        }
    };

    const handleDeleteCredential = async (id: string) => {
        try {
            const resp = await apiProvider.deleteCredential(id);
            if (resp.success) {
                toast({ title: "Eliminato", description: "Account API eliminato con successo" });
                fetchCredentials();
            } else {
                toast({ title: "Errore", description: resp.error || "Errore durante l'eliminazione", variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleTestConnection = async (credId: string) => {
        setIsSyncing(credId);
        try {
            const resp = await apiProvider.testCredentialConnection(credId);
            if (resp.success) {
                toast({ title: "Connesso", description: "Connessione al provider riuscita!" });
            } else {
                toast({ title: "Errore Connessione", description: resp.error, variant: "destructive" });
            }
        } finally {
            setIsSyncing(null);
        }
    };

    const handleSync = async (credId: string) => {
        setIsSyncing(credId);
        try {
            const resp = await apiProvider.testCredential(credId);
            if (resp.success) {
                toast({
                    title: "Sync Completato",
                    description: `Sincronizzate ${resp.data?.machines_synced || 0} macchine!`
                });
                onUpdate(); // Refresh machine count in parent
            } else {
                toast({ title: "Errore Sync", description: resp.error, variant: "destructive" });
            }
        } finally {
            setIsSyncing(null);
        }
    };

    return (
        <Dialog onOpenChange={(open) => open && fetchCredentials()}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Gestisci Credenziali">
                    <Key size={16} />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Gestione API: {customer.name}</DialogTitle>
                </DialogHeader>

                {isAdding ? (
                    <div className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Provider</Label>
                                <Select value={newCred.provider} onValueChange={(v: any) => setNewCred({ ...newCred, provider: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cimbali">La Cimbali</SelectItem>
                                        <SelectItem value="brita">Brita</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Nome Account (Es: Sede Milano)</Label>
                                <Input value={newCred.name} onChange={e => setNewCred({ ...newCred, name: e.target.value })} placeholder="Account Principale" />
                            </div>
                        </div>

                        {newCred.provider === 'cimbali' ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Base URL</Label>
                                    <Input value={newCred.baseUrl} onChange={e => setNewCred({ ...newCred, baseUrl: e.target.value })} placeholder="https://public-api.cimbaligroup.tech/api/v1/" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Username API</Label>
                                        <Input value={newCred.username} onChange={e => setNewCred({ ...newCred, username: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Password API</Label>
                                        <Input type="password" value={newCred.password} onChange={e => setNewCred({ ...newCred, password: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Start Index</Label>
                                        <Input type="number" value={newCred.startIndex} onChange={e => setNewCred({ ...newCred, startIndex: parseInt(e.target.value) || 0 })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Limit</Label>
                                        <Input type="number" value={newCred.limit} onChange={e => setNewCred({ ...newCred, limit: parseInt(e.target.value) || 100 })} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>API Key</Label>
                                    <Input value={newCred.apiKey} onChange={e => setNewCred({ ...newCred, apiKey: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tenant ID</Label>
                                    <Input value={newCred.tenantId} onChange={e => setNewCred({ ...newCred, tenantId: e.target.value })} />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setIsAdding(false)}>Annulla</Button>
                            <Button onClick={handleSave}>Salva Credenziali</Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 mt-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium">Account Collegati</h3>
                            <Button size="sm" onClick={() => setIsAdding(true)} className="gap-1">
                                <Plus size={14} /> Aggiungi Account
                            </Button>
                        </div>

                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Account</TableHead>
                                        <TableHead>Provider</TableHead>
                                        <TableHead>Ultimo Sync</TableHead>
                                        <TableHead className="text-right">Azioni</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-4">Caricamento...</TableCell></TableRow>
                                    ) : credentials.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">Nessun account API configurato</TableCell></TableRow>
                                    ) : (
                                        credentials.map(c => (
                                            <TableRow key={c.id}>
                                                <TableCell className="font-medium">{c.name || 'Account API'}</TableCell>
                                                <TableCell className="capitalize">{c.provider}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {c.updated_at ? new Date(c.updated_at).toLocaleDateString() : 'Mai'}
                                                </TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleTestConnection(c.id)}
                                                        disabled={isSyncing === c.id}
                                                    >
                                                        {isSyncing === c.id ? '...' : 'Test Connection'}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        className="gap-2"
                                                        onClick={() => handleSync(c.id)}
                                                        disabled={isSyncing === c.id}
                                                    >
                                                        {isSyncing === c.id ? 'Sync...' : 'Retrieve Machines'}
                                                    </Button>

                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button size="sm" variant="ghost" title="Elimina" className="text-red-500 hover:text-red-700">
                                                                <Trash2 size={16} />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Questa azione eliminerà definitivamente l'account API "{c.name}". Le macchine associate non verranno eliminate ma verranno scollegate da questo account.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteCredential(c.id)} className="bg-red-600 hover:bg-red-700">
                                                                    Elimina
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

// Add Select imports at the top
