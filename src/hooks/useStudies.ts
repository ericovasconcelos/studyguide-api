import { useState, useEffect } from 'react';
import { Study } from '../data/models/Study';
import { studyService } from '../data/config/dependencies';

export function useStudies() {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadStudies = async () => {
    try {
      setLoading(true);
      const data = await studyService.getStudies();
      setStudies(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar estudos'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Carregar estudos inicialmente
    loadStudies();

    // Escutar mudanças nos dados
    const eventEmitter = studyService.getAdapter().getEventEmitter();
    const handleDataChanged = () => {
      loadStudies();
    };

    eventEmitter.on('dataChanged', handleDataChanged);

    // Cleanup
    return () => {
      eventEmitter.off('dataChanged', handleDataChanged);
    };
  }, []);

  return { studies, loading, error, refresh: loadStudies };
} 