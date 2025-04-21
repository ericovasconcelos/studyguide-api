import { useState, useCallback } from 'react';
import { Study } from '../domain/entities/Study';
import { useData } from './useData';

export function useStudies() {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getStudies, saveStudy, updateStudy, deleteStudy } = useData();

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStudies();
      setStudies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estudos');
    } finally {
      setLoading(false);
    }
  }, [getStudies]);

  const save = useCallback(async (study: Study) => {
    try {
      setLoading(true);
      setError(null);
      await saveStudy(study);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar estudo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [saveStudy, refresh]);

  const update = useCallback(async (study: Study) => {
    try {
      setLoading(true);
      setError(null);
      await updateStudy(study);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar estudo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateStudy, refresh]);

  const remove = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteStudy(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar estudo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [deleteStudy, refresh]);

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