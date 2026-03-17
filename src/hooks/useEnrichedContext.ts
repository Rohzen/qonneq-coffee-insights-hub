import { useState, useEffect } from 'react';
import { EnrichedMachineContext } from '@/types/dashboard';
import { useAuth } from '@/context/AuthContext';

export const useEnrichedContext = (serial: string | undefined, enabled: boolean = true) => {
    const { apiProvider } = useAuth();
    const [data, setData] = useState<EnrichedMachineContext | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!serial || !enabled) {
            setData(null);
            return;
        }

        const fetchContext = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await apiProvider.getEnrichedContext(serial);
                if (response.success && response.data) {
                    setData(response.data);
                } else {
                    setError(response.error || 'Errore nel caricamento del contesto');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Errore di rete');
            } finally {
                setIsLoading(false);
            }
        };

        fetchContext();
    }, [serial, enabled]);

    return { data, isLoading, error };
};
