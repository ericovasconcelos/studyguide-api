import * as React from 'react';
// Remove unused named imports
// import { createContext, useContext, ReactNode, useMemo, FC, useCallback } from 'react'; 
import { Study } from '../domain/entities/Study';
// import { Result } from '../domain/result'; // Removed unused import
import { 
  // studyService, // Removed unused import
  studyRepository, 
  // Import other necessary services/repositories from dependencies if needed
} from '../data/config/dependencies'; // Assuming dependencies are configured here
import { logger } from '../utils/logger';

// Define the shape of the context value
interface IDataContext {
  getStudies: () => Promise<Study[]>; // Assuming we want the hook to handle the Result
  saveStudy: (study: Study) => Promise<void>; 
  updateStudy: (study: Study) => Promise<void>;
  deleteStudy: (id: string) => Promise<void>;
  sync: () => Promise<void>; // Added sync function
  // Add other data functions if needed (e.g., for StudyCycles)
}

// Create the context with a default undefined value initially
const defaultContextValue: IDataContext = {
    getStudies: () => { throw new Error('DataProvider not found'); },
    saveStudy: () => { throw new Error('DataProvider not found'); },
    updateStudy: () => { throw new Error('DataProvider not found'); },
    deleteStudy: () => { throw new Error('DataProvider not found'); },
    sync: async () => { logger.warn('sync function not implemented'); }, // Added default sync
};
const DataContext = React.createContext<IDataContext>(defaultContextValue);

// Define the props for the provider
interface DataProviderProps {
  children: React.ReactNode;
}

// Create the DataProvider component
export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {

  // Implement the data functions using services/repositories
  const getStudies = React.useCallback(async (): Promise<Study[]> => {
    try {
      // Use the repository or service instance from dependencies
      // StudyRepository.findAll returns Study[] directly
      const studies = await studyRepository.findAll(); 
      logger.info('DataContext: Fetched studies', { count: studies.length });
      return studies;
    } catch (error) {
      logger.error('DataContext: Error fetching studies', { error });
      throw new Error('Failed to fetch studies'); // Re-throw for the hook to catch
    }
  }, []);

  const saveStudy = React.useCallback(async (study: Study): Promise<void> => {
    try {
      // StudyRepository.save returns the saved Study
      await studyRepository.save(study); 
      logger.info('DataContext: Saved study', { id: study.getId() });
    } catch (error) {
      logger.error('DataContext: Error saving study', { id: study.getId(), error });
      throw new Error('Failed to save study'); 
    }
  }, []);

  const updateStudy = React.useCallback(async (study: Study): Promise<void> => {
    try {
      // Assuming update is similar to save (upsert) or add a specific update method
      await studyRepository.save(study); // Using save for update (upsert)
      logger.info('DataContext: Updated study', { id: study.getId() });
    } catch (error) {
      logger.error('DataContext: Error updating study', { id: study.getId(), error });
      throw new Error('Failed to update study');
    }
  }, []);

  const deleteStudy = React.useCallback(async (id: string): Promise<void> => {
    try {
      await studyRepository.delete(id);
      logger.info('DataContext: Deleted study', { id });
    } catch (error) {
      logger.error('DataContext: Error deleting study', { id, error });
      throw new Error('Failed to delete study');
    }
  }, []);

  // Add placeholder sync implementation
  const sync = React.useCallback(async (): Promise<void> => {
    // Placeholder implementation - does nothing for now
    // Replace with actual sync logic using adapters/repositories later
    logger.info('DataContext: sync called (placeholder)');
    // Example: await studyRepository.sync(); // If repository had a sync method
    await Promise.resolve(); // Simulate async operation
  }, []);

  // Memoize the context value
  const value = React.useMemo(() => ({
    getStudies,
    saveStudy,
    updateStudy,
    deleteStudy,
    sync, // Added sync to context value
  }), [getStudies, saveStudy, updateStudy, deleteStudy, sync]); // Added sync dependency

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

// Custom hook to use the DataContext
export const useDataContext = () => {
  // No need to check for undefined here because we provided a default value
  return React.useContext(DataContext);
}; 