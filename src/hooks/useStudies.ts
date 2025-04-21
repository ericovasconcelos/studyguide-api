import { useState, useCallback } from 'react';
import { Study } from '../domain/entities/Study';
import { useDataContext } from '../contexts/DataContext';

export function useStudies() {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    getStudies: contextGetStudies, 
    saveStudy: contextSaveStudy, 
    updateStudy: contextUpdateStudy, 
    deleteStudy: contextDeleteStudy 
  } = useDataContext();

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contextGetStudies();
      setStudies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estudos');
    } finally {
      setLoading(false);
    }
  }, [contextGetStudies]);

  const save = useCallback(async (study: Study) => {
    try {
      setLoading(true);
      setError(null);
      await contextSaveStudy(study);
      await refresh();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao salvar estudo';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contextSaveStudy, refresh]);

  const update = useCallback(async (study: Study) => {
    try {
      setLoading(true);
      setError(null);
      await contextUpdateStudy(study);
      await refresh();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao atualizar estudo';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contextUpdateStudy, refresh]);

  const remove = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await contextDeleteStudy(id);
      await refresh();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao deletar estudo';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contextDeleteStudy, refresh]);

  return {
    studies,
    loading,
    error,
    refresh,
    save,
    update,
    remove
  };
}