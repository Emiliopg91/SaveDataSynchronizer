/* eslint-disable @typescript-eslint/no-empty-function */
import { createContext, useEffect, useState } from 'react';

interface ContextType {
  category: string;
  setCategory: (value: string) => void;
  categories: Array<string>;
  showAddModal: boolean;
  setShowAddModal: (value: boolean) => void;
  showCfgModal: boolean;
  setShowCfgModal: (value: boolean) => void;
  pendingUpdate: boolean;
  syncing: boolean;
  connected: boolean;
  running: Array<string>;
  launchers: Array<string>;
  iconPath: string;
}

const defaultValue: ContextType = {
  category: '',
  setCategory: () => {},
  categories: [],
  showAddModal: true,
  setShowAddModal: () => {},
  showCfgModal: true,
  setShowCfgModal: () => {},
  pendingUpdate: false,
  syncing: false,
  connected: false,
  running: [],
  launchers: [],
  iconPath: ''
};

const defaultCategories = ['game', 'emulator'];

export const AppsContext = createContext(defaultValue);

export function AppsProvider({ children }: { children: JSX.Element }): JSX.Element {
  const [categories /*, setCategories*/] = useState<Array<string>>(defaultCategories);
  const [iconPath, setIconPath] = useState<string>('');
  const [launchers, setLaunchers] = useState<Array<string>>(defaultCategories);
  const [category, setCategory] = useState(defaultCategories[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCfgModal, setShowCfgModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(false);
  const [syncing /*setSyncing*/] = useState(false);
  const [connected, setConnected] = useState(false);
  const [running, setRunning] = useState<Array<string>>([]);

  const handleNetworkChange = (): void => {
    const connected =
      typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
        ? navigator.onLine
        : true;

    setConnected(connected);
    window.api.networkStatus(connected);
  };

  useEffect(() => {
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);
    handleNetworkChange();

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
    window.api.getLaunchers().then((resp) => {
      const launchers: Array<string> = [];
      Object.keys(resp).forEach((id) => {
        if (resp[id]) {
          launchers.push(id);
        }
      });
      setLaunchers(launchers);
    });

    window.api.getIconPath().then((resp) => {
      setIconPath(resp);
    });

    return (): void => {
      unsubscribe1();
      unsubscribe2();
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }, []);

  return (
    <AppsContext.Provider
      value={{
        categories,
        category,
        setCategory,
        showAddModal,
        setShowAddModal,
        pendingUpdate,
        syncing,
        running,
        showCfgModal,
        setShowCfgModal,
        launchers,
        iconPath,
        connected
      }}
    >
      {children}
    </AppsContext.Provider>
  );
}
