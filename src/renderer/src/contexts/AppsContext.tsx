/* eslint-disable @typescript-eslint/no-empty-function */
import { createContext, useEffect, useState } from 'react';

export const AppsContext = createContext({
  category: '',
  setCategory: (_cat: string) => {},
  showAddModal: true,
  setShowAddModal: (_show: boolean) => {},
  pendingUpdate: false,
  setPendingUpdate: (_pending: boolean) => {},
  syncing: false,
  setSyncing: (_pending: boolean) => {}
});

export function AppsProvider({ children }: { children: JSX.Element }): JSX.Element {
  const [category, setCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = window.api.listenUpdate((_, pending) => {
      setPendingUpdate(pending);
    });
    return (): void => {
      unsubscribe();
    };
  }, []);

  return (
    <AppsContext.Provider
      value={{
        category,
        setCategory,
        showAddModal,
        setShowAddModal,
        pendingUpdate,
        setPendingUpdate,
        syncing,
        setSyncing
      }}
    >
      {children}
    </AppsContext.Provider>
  );
}
