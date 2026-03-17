import React, { useState } from 'react';
import { Calendar, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TelemetryDateRangeDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (startDate: string, endDate: string) => void;
    isLoading?: boolean;
}

export const TelemetryDateRangeDialog: React.FC<TelemetryDateRangeDialogProps> = ({
    open,
    onClose,
    onSubmit,
    isLoading = false
}) => {
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = () => {
        onSubmit(dateRange.startDate, dateRange.endDate);
    };

    // Quick date range presets
    const presets = [
        { label: 'Ultimi 7 giorni', days: 7 },
        { label: 'Ultimi 30 giorni', days: 30 },
        { label: 'Ultimi 90 giorni', days: 90 },
        { label: 'Anno corrente', days: -1 }, // Special case
    ];

    const applyPreset = (days: number) => {
        const endDate = new Date();
        let startDate: Date;

        if (days === -1) {
            // Year to date
            startDate = new Date(endDate.getFullYear(), 0, 1);
        } else {
            startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        }

        setDateRange({
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md mx-4 bg-white animate-in zoom-in-95">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database size={20} />
                        Recupera Telemetria
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Quick Presets */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">Periodo rapido</label>
                        <div className="grid grid-cols-2 gap-2">
                            {presets.map((preset) => (
                                <Button
                                    key={preset.label}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => applyPreset(preset.days)}
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <label className="text-sm font-medium text-gray-500">Oppure seleziona un intervallo</label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-1">
                                <Calendar size={14} />
                                Data Inizio
                            </label>
                            <input
                                type="date"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-1">
                                <Calendar size={14} />
                                Data Fine
                            </label>
                            <input
                                type="date"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={onClose} disabled={isLoading}>
                            Annulla
                        </Button>
                        <Button onClick={handleSubmit} disabled={isLoading}>
                            {isLoading ? 'Caricamento...' : 'Recupera'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
