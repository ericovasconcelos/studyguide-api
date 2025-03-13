import { useState, useEffect } from 'react';
import { Study } from '../data/models/Study';
import { StudyService } from '../data/services/StudyService';

export function useStudies(service: StudyService) {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadStudies = async () => {
    try {
      setLoading(true);
      const data = await service.getStudies();
      setStudies(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar estudos'));
    } finally {
      setLoading(false);
    }
  };

  const addStudy = async (study: Study) => {
    try {
      await service.addStudy(study);
      await loadStudies(); // Recarrega os estudos após adicionar
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao adicionar estudo'));
      throw err;
    }
  };

  useEffect(() => {
    // Carregar estudos inicialmente
    loadStudies();

    // Escutar mudanças nos dados
    const eventEmitter = service.getAdapter().getEventEmitter();
    const handleDataChanged = () => {
      loadStudies();
    };

    eventEmitter.on('dataChanged', handleDataChanged);

    // Cleanup
    return () => {
      eventEmitter.off('dataChanged', handleDataChanged);
    };
  }, [service]);

  return { studies, loading, error, refresh: loadStudies, addStudy };
} 