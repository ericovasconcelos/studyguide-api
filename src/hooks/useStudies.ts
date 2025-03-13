import { useState, useEffect, useCallback, useRef } from 'react';
import { Study } from '../data/models/Study';
import { StudyService } from '../data/services/StudyService';

export function useStudies(service: StudyService) {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const loadAttemptsRef = useRef(0);
  const maxLoadAttempts = 3;

  // Usando useCallback para memorizar a função loadStudies
  const loadStudies = useCallback(async () => {
    // Limitando o número de tentativas para evitar ciclos infinitos
    if (loadAttemptsRef.current >= maxLoadAttempts) {
      console.log(`[DEBUG] Máximo de ${maxLoadAttempts} tentativas de carregamento atingido. Interrompendo.`);
      setLoading(false);
      return;
    }
    
    loadAttemptsRef.current++;
    console.log(`[DEBUG] Tentativa ${loadAttemptsRef.current} de carregar estudos`);

    try {
      setLoading(true);
      setError(null); // Limpar erros anteriores
      const data = await service.getStudies();
      setStudies(data);
    } catch (err) {
      console.error('Erro ao carregar estudos:', err);
      
      // Tentar recuperar dados locais do IndexedDB sem sincronização
      try {
        console.log('Tentando carregar dados locais após falha de sincronização...');
        const localData = await service.getAdapter().getStudies();
        if (localData && localData.length > 0) {
          console.log(`Recuperados ${localData.length} estudos do armazenamento local`);
          setStudies(localData);
          // Ainda relatamos o erro original para o usuário saber que a sincronização falhou
          const syncError = err instanceof Error ? err : new Error('Erro ao sincronizar com servidor');
          setError(new Error(`${syncError.message} (usando dados locais)`));
        } else {
          // Se não houver dados locais, relatamos o erro original
          setError(err instanceof Error ? err : new Error('Erro ao carregar estudos'));
        }
      } catch (localError) {
        // Se nem mesmo os dados locais puderem ser carregados, reportamos ambos os erros
        console.error('Erro ao carregar dados locais:', localError);
        setError(err instanceof Error ? err : new Error('Erro ao carregar estudos'));
      }
    } finally {
      setLoading(false);
    }
  }, [service]); // Removendo outras dependências para evitar loops

  const addStudy = useCallback(async (study: Study) => {
    try {
      const result = await service.addStudy(study);
      if (result.success) {
        // Resetar contador de tentativas ao adicionar novo estudo
        loadAttemptsRef.current = 0;
        await loadStudies(); // Recarrega os estudos após adicionar
      }
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao adicionar estudo');
      setError(error);
      return { success: false, error: error.message };
    }
  }, [service, loadStudies]);

  useEffect(() => {
    // Resetar contador ao montar o componente
    loadAttemptsRef.current = 0;
    
    // Carregar estudos inicialmente
    loadStudies();

    // Escutar mudanças nos dados
    const adapter = service.getAdapter();
    const eventEmitter = adapter.getEventEmitter?.() || { on: () => {}, off: () => {} };
    
    const handleDataChanged = () => {
      // Resetar contador quando os dados mudarem externamente
      loadAttemptsRef.current = 0;
      loadStudies();
    };

    if (eventEmitter.on) {
      eventEmitter.on('dataChanged', handleDataChanged);
    }

    // Cleanup
    return () => {
      if (eventEmitter.off) {
        eventEmitter.off('dataChanged', handleDataChanged);
      }
    };
  }, [service, loadStudies]);

  // Função de refresh que reseta o contador de tentativas
  const refresh = useCallback(() => {
    loadAttemptsRef.current = 0;
    return loadStudies();
  }, [loadStudies]);

  return { studies, loading, error, refresh, addStudy };
} 