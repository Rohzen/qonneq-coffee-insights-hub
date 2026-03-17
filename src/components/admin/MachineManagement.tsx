
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Coffee, Trash2, Edit, Cloud, CloudOff, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UnifiedMachineDetail } from '../shared/UnifiedMachineDetail';
import { BritaMachineDetail } from '../shared/BritaMachineDetail';

export const MachineManagement = () => {
    const { apiProvider } = useAuth();
    const { toast } = useToast();
    const [machines, setMachines] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newMachine, setNewMachine] = useState({ serialNumber: "", provider: "cimbali", companyId: "", externalId: "", model: "" });
    const [selectedMachine, setSelectedMachine] = useState<any | null>(null);


    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [machResp, compResp] = await Promise.all([
                apiProvider.getAdminMachines(),
                apiProvider.getCustomers()
            ]);

            if (machResp.success) setMachines(machResp.data || []);
            if (compResp.success) setCompanies(compResp.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateMachine = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const resp = await apiProvider.createMachine(newMachine);
            if (resp.success) {
                toast({ title: "Successo", description: "Macchina creata con successo" });
                setIsCreateOpen(false);
                setNewMachine({ serialNumber: "", provider: "cimbali", companyId: "", externalId: "", model: "" });
                fetchData();
            } else {
                toast({ title: "Errore", description: resp.error || "Impossibile creare la macchina", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Errore", description: "Errore di rete", variant: "destructive" });
        }
    };

    const filteredMachines = machines.filter(m =>
        m.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.model?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // If a machine is selected, show detail view
    if (selectedMachine) {
        const metadata = selectedMachine.metadata || {};
        const provider = selectedMachine.provider || metadata.provider || 'cimbali';

        if (provider === 'brita') {
            return (
                <BritaMachineDetail
                    machine={{
                        ...selectedMachine,
                        serial: selectedMachine.serial_number,
                        companyName: selectedMachine.customer_name,
                        latitude: selectedMachine.latitude ?? metadata.latitude ?? null,
                        longitude: selectedMachine.longitude ?? metadata.longitude ?? null,
                        location: selectedMachine.location ?? metadata.location ?? null,
                    }}
                    onBack={() => setSelectedMachine(null)}
                    isAdmin={true}
                />
            );
        }

        return (
            <UnifiedMachineDetail
                machine={{
                    ...selectedMachine,
                    serial: selectedMachine.serial_number,
                    companyName: selectedMachine.customer_name,
                    latitude: selectedMachine.latitude ?? metadata.latitude ?? null,
                    longitude: selectedMachine.longitude ?? metadata.longitude ?? null,
                    location: selectedMachine.location ?? metadata.location ?? null,
                    waterFilterName: selectedMachine.water_filter_name ?? metadata.water_filter_name,
                }}
                onBack={() => setSelectedMachine(null)}
                isAdmin={true}
            />
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Cerca macchine..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500">
                        {filteredMachines.length} macchine sincronizzate
                    </div>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead>Modello</TableHead>
                                <TableHead>Brand</TableHead>
                                <TableHead>Famiglia</TableHead>
                                <TableHead>Seriale</TableHead>
                                <TableHead>Azienda</TableHead>
                                <TableHead>Filtro Acqua</TableHead>
                                <TableHead>Ultima Sincronizzazione</TableHead>
                                <TableHead>Stato</TableHead>
                                <TableHead>Allarme</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-500">Caricamento...</TableCell></TableRow>
                            ) : filteredMachines.length === 0 ? (
                                <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-500">Nessuna macchina trovata</TableCell></TableRow>
                            ) : (
                                filteredMachines.map((machine) => (
                                    <TableRow
                                        key={machine.id}
                                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => setSelectedMachine(machine)}
                                    >
                                        <TableCell className="font-medium text-blue-600 hover:underline">
                                            {machine.name || machine.metadata?.name || `${machine.model} (${machine.serial_number})`}
                                        </TableCell>
                                        <TableCell>{machine.metadata?.brand || machine.provider?.toUpperCase() || 'N/D'}</TableCell>
                                        <TableCell>{machine.model || 'N/D'}</TableCell>
                                        <TableCell>{machine.serial_number}</TableCell>
                                        <TableCell>{machine.customer_name || 'Non assegnata'}</TableCell>
                                        <TableCell className="font-medium text-blue-600">
                                            {machine.metadata?.water_filter_name || 'PURITY C150 iQ Quell ST'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {machine.updated_at ? new Date(machine.updated_at).toLocaleString('it-IT') : 'Mai'}
                                        </TableCell>
                                        <TableCell>
                                            {machine.status === 'online' ? (
                                                <Cloud className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <CloudOff className="w-5 h-5 text-gray-400" />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {machine.status === 'alarm' || machine.status === 'warning' ? (
                                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                            ) : (
                                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            )}
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

