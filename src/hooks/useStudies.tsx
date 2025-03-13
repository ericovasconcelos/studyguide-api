import { useState, useEffect } from 'react';
import { Study } from '../data/models/Study';
import { StudyService } from '../data/services/StudyService';

export function useStudies(studyService: StudyService) {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadStudies();
  }, []);

  const loadStudies = async () => {
    try {
      setLoading(true);
      const data = await studyService.getAll();
      setStudies(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar estudos'));
    } finally {
      setLoading(false);
    }
  };

  const addStudy = async (study: Study) => {
    try {
      const savedStudy = await studyService.addStudyRecord(study);
      setStudies(prev => [...prev, savedStudy]);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro ao salvar estudo' };
    }
  };

  return {
    studies,
    loading,
    error,
    addStudy
  };
} 