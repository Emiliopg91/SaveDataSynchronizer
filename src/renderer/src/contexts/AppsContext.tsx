/* eslint-disable @typescript-eslint/no-empty-function */
import { createContext, useEffect, useState } from 'react';

interface ContextType {
  category: string;
  setCategory: (value: string) => void;
  categories: Array<string>;
  setCategories: (value: Array<string>) => void;
  showAddModal: boolean;
  setShowAddModal: (value: boolean) => void;
  showCfgModal: boolean;
  setShowCfgModal: (value: boolean) => void;
  pendingUpdate: boolean;
  setPendingUpdate: (value: boolean) => void;
  syncing: boolean;
  setSyncing: (value: boolean) => void;
  running: Array<string>;
  setRunning: (value: Array<string>) => void;
}

const defaultValue: ContextType = {
  category: '',
  setCategory: () => {},
  categories: [],
  setCategories: () => {},
  showAddModal: true,
  setShowAddModal: () => {},
  showCfgModal: true,
  setShowCfgModal: () => {},
  pendingUpdate: false,
  setPendingUpdate: () => {},
  syncing: false,
  setSyncing: () => {},
  running: [],
  setRunning: () => {}
};

const defaultCategories = ['game', 'emulator', 'launcher'];

export const AppsContext = createContext(defaultValue);

export function AppsProvider({ children }: { children: JSX.Element }): JSX.Element {
  const [categories, setCategories] = useState<Array<string>>(defaultCategories);
  const [category, setCategory] = useState('game');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCfgModal, setShowCfgModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [running, setRunning] = useState<Array<string>>([]);

  useEffect(() => {
    const unsubscribe1 = window.api.listenUpdate((_, pending) => {
      setPendingUpdate(pending);
    });
    const unsubscribe2 = window.api.listenRunning((_, app: string, isRunning: boolean): void => {
      const newRunning = [...running];
      if (isRunning) {
        newRunning.push(app);
      }
      setRunning(newRunning);
    });

    return (): void => {
      unsubscribe1();
      unsubscribe2();
    };
  }, []);

  return (
    <AppsContext.Provider
      value={{
        categories,
        setCategories,
        category,
        setCategory,
        showAddModal,
        setShowAddModal,
        pendingUpdate,
        setPendingUpdate,
        syncing,
        setSyncing,
        running,
        setRunning,
        showCfgModal,
        setShowCfgModal
      }}
    >
      {children}
    </AppsContext.Provider>
  );
}
