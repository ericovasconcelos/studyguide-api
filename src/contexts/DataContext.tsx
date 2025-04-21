import { createContext, useContext, useState, useEffect } from 'react';
import { Study } from '../domain/entities/Study';
import { CompositeAdapter } from '../data/adapters/CompositeAdapter';
import { LocalStorageAdapter } from '../data/adapters/LocalStorageAdapter';
import { ServerSyncAdapter } from '../data/adapters/ServerSyncAdapter';
import { Result } from '../domain/result';
import { getCurrentUserId } from '../config/auth'; // no topo, se ainda não tiver


interface DataContextType {
  studies: Study[];
  loading: boolean;
  error: string | null;
  saveStudy: (study: Study) => Promise<void>;
  updateStudy: (study: Study) => Promise<void>;
  deleteStudy: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  sync: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const localStorageAdapter = new LocalStorageAdapter();

  const userId = getCurrentUserId(); // função já existe no projeto
  const serverSyncAdapter = new ServerSyncAdapter(userId);

  const adapter = new CompositeAdapter(localStorageAdapter, serverSyncAdapter);

  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResult = <T,>(result: Result<T>) => {
    if (result.isSuccessful()) {

      return result.getValue();
    } else {
      setError(result.getError());

      return null;
    }
  };

  const handleError = (err: unknown) => {
    setError(err instanceof Error ? err.message : 'Unknown error');
  };

  const withLoading = async <T,>(operation: () => Promise<T>) => {
    try {
      setLoading(true);
      return await operation();
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    const result = await withLoading(async () => {
      const result = await adapter.getStudies();
      const studies = handleResult(result);
      if (studies) {
        setStudies(studies);
      }
      return studies;
    });
  };

  const saveStudy = async (study: Study) => {
    const result = await withLoading(async () => {
      const result = await adapter.saveStudy(study);
      if (handleResult(result)) {
        await refresh();
      }
      return result;
    });
  };

  const updateStudy = async (study: Study) => {
    const result = await withLoading(async () => {
      const result = await adapter.updateStudy(study);
      if (handleResult(result)) {
        await refresh();
      }
      return result;
    });
  };

  const deleteStudy = async (id: string) => {
    const result = await withLoading(async () => {
      const result = await adapter.deleteStudy(id);
      if (handleResult(result)) {
        await refresh();
      }
      return result;
    });
  };

  const sync = async () => {
    const result = await withLoading(async () => {
      const result = await adapter.sync();
      if (handleResult(result)) {
        await refresh();
      }
      return result;
    });
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <DataContext.Provider
      value={{
        studies,
        loading,
        error,
        saveStudy,
        updateStudy,
        deleteStudy,
        refresh,
        sync,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}; 