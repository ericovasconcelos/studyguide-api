import { useState, useEffect, useCallback } from 'react';
import { StudyCycle } from '../data/models/StudyCycle';
import { StudyCycleService } from '../data/services/StudyCycleService';

export function useStudyCycles(studyCycleService: StudyCycleService) {
  const [cycles, setCycles] = useState<StudyCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadCycles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Limpar erros anteriores
      const data = await studyCycleService.getCycles();
      setCycles(data);
    } catch (err) {
      console.error('Erro ao carregar ciclos:', err);
      
      // Já que não temos acesso direto ao armazenamento local através do serviço,
      // apenas reportamos o erro e mantemos a lista de ciclos vazia ou com o último valor
      setError(err instanceof Error ? err : new Error('Erro ao carregar ciclos'));
      
      // Criamos ciclos padrão apenas se não houver nenhum
      setCycles(prevCycles => {
        if (prevCycles.length === 0) {
          // Ciclos padrão caso não consigamos carregar nenhum
          return [{
            id: 1,
            name: 'Ciclo de Estudos Padrão',
            targetTime: 120, // 2 horas em minutos
            subject: 'Programação',
            progress: 0
          }];
        }
        return prevCycles; // Mantém os ciclos existentes
      });
    } finally {
      setLoading(false);
    }
  }, [studyCycleService]); // Removida a dependência de cycles para evitar loop

  const updateCycles = useCallback(async (newCycles: StudyCycle[]) => {
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
  }, [studyCycleService]);

  useEffect(() => {
    loadCycles();
    
    // Adicionando um log para debug
    console.log('[DEBUG] useStudyCycles: Executando useEffect para carregar ciclos');
    
    return () => {
      console.log('[DEBUG] useStudyCycles: Limpando effect');
    };
  }, [loadCycles]);

  return {
    cycles,
    loading,
    error,
    updateCycles,
    reloadCycles: loadCycles
  };
} 