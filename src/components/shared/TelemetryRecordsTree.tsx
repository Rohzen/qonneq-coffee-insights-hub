import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Coffee, Clock, Database, Calendar, Cloud, CloudRain, CloudSnow, Sun, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface TelemetryRecord {
    timestamp: string;
    coffee_count?: number;
    espresso_count?: number;
    temperature?: number;
    weather_icon?: string | null;
    weather_description?: string | null;
    weather_temperature?: number | null;
    [key: string]: any;
}

interface TelemetryRecordsTreeProps {
    telemetry: TelemetryRecord[];
    dataSizeKb?: number;
}

export const TelemetryRecordsTree: React.FC<TelemetryRecordsTreeProps> = ({
    telemetry,
    dataSizeKb
}) => {
    const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
    const [showZeroRows, setShowZeroRows] = useState(true);

    const displayTelemetry = showZeroRows
        ? telemetry
        : telemetry.filter(record => (record.espresso_count || 0) > 0);

    // Group telemetry by date
    const groupedByDate: Record<string, TelemetryRecord[]> = {};
    displayTelemetry.forEach(record => {
        const date = new Date(record.timestamp).toLocaleDateString('it-IT');
        if (!groupedByDate[date]) {
            groupedByDate[date] = [];
        }
        groupedByDate[date].push(record);
    });

    const toggleDate = (date: string) => {
        const newExpanded = new Set(expandedDates);
        if (newExpanded.has(date)) {
            newExpanded.delete(date);
        } else {
            newExpanded.add(date);
        }
        setExpandedDates(newExpanded);
    };

    const expandAll = () => {
        setExpandedDates(new Set(Object.keys(groupedByDate)));
    };

    const collapseAll = () => {
        setExpandedDates(new Set());
    };

    const getWeatherIcon = (key?: string | null) => {
        switch (key) {
            case 'sun':
                return <Sun size={14} className="text-yellow-500" />;
            case 'snow':
                return <CloudSnow size={14} className="text-blue-400" />;
            case 'rain':
            case 'drizzle':
                return <CloudRain size={14} className="text-blue-500" />;
            case 'thunder':
                return <Zap size={14} className="text-amber-500" />;
            case 'fog':
            case 'cloud':
            default:
                return <Cloud size={14} className="text-gray-500" />;
        }
    };

    if (!displayTelemetry || displayTelemetry.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-gray-500">
                    <Database size={48} className="mx-auto mb-3 text-gray-300" />
                    <p>Nessun record di telemetria disponibile.</p>
                    <p className="text-sm mt-1">Utilizza "Recupera Telemetria" per scaricare i dati.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Database size={20} />
                    Record Telemetria ({displayTelemetry.length} record)
                    {dataSizeKb && (
                        <span className="text-sm font-normal text-gray-500 ml-2">
                            ({dataSizeKb.toFixed(2)} KB)
                        </span>
                    )}
                </CardTitle>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={expandAll}>Espandi tutto</Button>
                    <Button variant="outline" size="sm" onClick={collapseAll}>Comprimi</Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowZeroRows(prev => !prev)}
                    >
                        {showZeroRows ? 'Nascondi righe a zero' : 'Mostra tutte'}
                    </Button>
                    <Button
                        variant={viewMode === 'tree' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('tree')}
                    >
                        Albero
                    </Button>
                    <Button
                        variant={viewMode === 'table' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('table')}
                    >
                        Tabella
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {viewMode === 'tree' ? (
                    <div className="space-y-2">
                        {Object.entries(groupedByDate).map(([date, records]) => (
                            <div key={date} className="border rounded-lg overflow-hidden">
                                <div
                                    className="flex items-center gap-2 p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                                    onClick={() => toggleDate(date)}
                                >
                                    {expandedDates.has(date) ? (
                                        <ChevronDown size={16} className="text-gray-500" />
                                    ) : (
                                        <ChevronRight size={16} className="text-gray-500" />
                                    )}
                                    <Calendar size={16} className="text-blue-500" />
                                    <span className="font-medium">{date}</span>
                                    <span className="text-gray-500 text-sm">({records.length} record)</span>
                                    <span className="ml-auto text-sm text-gray-600">
                                        Espresso: {records.reduce((sum, r) => sum + (r.espresso_count || 0), 0)}
                                    </span>
                                </div>
                                {expandedDates.has(date) && (
                                    <div className="border-t">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="text-xs">
                                                    <TableHead>Ora</TableHead>
                                                    <TableHead>Caffe</TableHead>
                                                    <TableHead>Espresso</TableHead>
                                                    <TableHead>Meteo</TableHead>
                                                    <TableHead>Weather °C</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {records.map((record, idx) => (
                                                    <TableRow key={idx} className="text-sm">
                                                        <TableCell className="flex items-center gap-1">
                                                            <Clock size={12} className="text-gray-400" />
                                                            {new Date(record.timestamp).toLocaleTimeString('it-IT')}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1">
                                                                <Coffee size={12} className="text-amber-600" />
                                                                {record.coffee_count || 0}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1">
                                                                <Coffee size={12} className="text-brown-600" />
                                                                {record.espresso_count || 0}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                {getWeatherIcon(record.weather_icon)}
                                                                <span className="text-xs text-gray-600">
                                                                    {record.weather_description || 'N/D'}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {record.weather_temperature !== null && record.weather_temperature !== undefined
                                                                ? `${record.weather_temperature.toFixed(1)} °C`
                                                                : 'N/A'}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="border rounded-lg overflow-auto max-h-96">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead>Data/Ora</TableHead>
                                    <TableHead>Caffe</TableHead>
                                    <TableHead>Espresso</TableHead>
                                    <TableHead>Meteo</TableHead>
                                    <TableHead>Weather °C</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayTelemetry.map((record, idx) => (
                                    <TableRow key={idx} className="text-sm">
                                        <TableCell>
                                            {new Date(record.timestamp).toLocaleString('it-IT')}
                                        </TableCell>
                                        <TableCell>{record.coffee_count || 0}</TableCell>
                                        <TableCell>{record.espresso_count || 0}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getWeatherIcon(record.weather_icon)}
                                                <span className="text-xs text-gray-600">
                                                    {record.weather_description || 'N/D'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {record.weather_temperature !== null && record.weather_temperature !== undefined
                                                ? `${record.weather_temperature.toFixed(1)} °C`
                                                : 'N/A'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
