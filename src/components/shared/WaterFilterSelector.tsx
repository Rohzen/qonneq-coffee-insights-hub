import React, { useState, useEffect } from 'react';
import { Droplets, Edit, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface WaterFilter {
    id: string;
    name: string;
    serial: string;
    model: string;
}

interface WaterFilterSelectorProps {
    machineId: string;
    currentFilter?: {
        id?: string;
        name?: string;
    };
    isAdmin: boolean;
    onFilterChange?: (filterId: string, filterName: string) => void;
}

export const WaterFilterSelector: React.FC<WaterFilterSelectorProps> = ({
    machineId,
    currentFilter,
    isAdmin,
    onFilterChange
}) => {
    const { apiProvider } = useAuth();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [selectedFilterId, setSelectedFilterId] = useState(currentFilter?.id || '');
    const [availableFilters, setAvailableFilters] = useState<WaterFilter[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchBritaFilters = async () => {
            try {
                const response = await (apiProvider as any).getAdminBritaMachinesList();
                if (response.success && response.data) {
                    setAvailableFilters(
                        response.data.map((m: any) => ({
                            id: m.id,
                            name: m.name,
                            serial: m.serial,
                            model: m.model
                        }))
                    );
                }
            } catch (error) {
                console.error('Error fetching BRITA filters:', error);
            }
        };
        fetchBritaFilters();
    }, []);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const filter = availableFilters.find(f => f.id === selectedFilterId);
            if (filter) {
                // In production, this would call an API to save the water filter association
                // await apiProvider.updateMachineWaterFilter(machineId, selectedFilterId);

                if (onFilterChange) {
                    onFilterChange(selectedFilterId, filter.name);
                }

                toast({
                    title: 'Filtro acqua aggiornato',
                    description: `Assegnato ${filter.name} alla macchina.`
                });
                setIsEditing(false);
            }
        } catch (error) {
            toast({
                title: 'Errore',
                description: 'Impossibile aggiornare il filtro acqua.',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setSelectedFilterId(currentFilter?.id || '');
        setIsEditing(false);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Droplets size={20} className="text-blue-500" />
                    Filtro Acqua
                </CardTitle>
                {isAdmin && !isEditing && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit size={16} className="mr-1" />
                        Modifica
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {isEditing ? (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500 block mb-2">
                                Seleziona Filtro BRITA
                            </label>
                            <Select
                                value={selectedFilterId}
                                onValueChange={setSelectedFilterId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleziona un filtro..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableFilters.map(filter => (
                                        <SelectItem key={filter.id} value={filter.id}>
                                            <div className="flex items-center gap-2">
                                                <Droplets size={14} className="text-blue-400" />
                                                {filter.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={handleCancel} disabled={isLoading}>
                                <X size={14} className="mr-1" />
                                Annulla
                            </Button>
                            <Button size="sm" onClick={handleSave} disabled={isLoading || !selectedFilterId}>
                                <Check size={14} className="mr-1" />
                                Salva
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Droplets size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">
                                    {currentFilter?.name || 'PURITY C150 iQ Quell ST'}
                                </p>
                                <p className="text-xs text-gray-500">Tipo: BRITA</p>
                            </div>
                        </div>
                        {!isAdmin && (
                            <p className="text-xs text-gray-400 italic">
                                Solo gli amministratori possono modificare il filtro acqua.
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
