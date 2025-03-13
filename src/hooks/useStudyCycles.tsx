import { useState, useEffect } from 'react';
import { StudyCycle } from '../data/models/StudyCycle';
import { StudyCycleService } from '../data/services/StudyCycleService';

export function useStudyCycles(studyCycleService: StudyCycleService) {
  const [cycles, setCycles] = useState<StudyCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadCycles();
  }, []);

  const loadCycles = async () => {
    try {
      setLoading(true);
      const data = await studyCycleService.getCycles();
      setCycles(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar ciclos'));
    } finally {
      setLoading(false);
    }
  };

  const updateCycles = async (newCycles: StudyCycle[]) => {
    try {
      await studyCycleService.updateCycles(newCycles);
      setCycles(newCycles);
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao atualizar ciclos' 
      };
    }
  };

  return {
    cycles,
    loading,
    error,
    updateCycles,
    reloadCycles: loadCycles
  };
} 