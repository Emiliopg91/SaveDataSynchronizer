/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppsContext } from '@renderer/contexts/AppsContext';
import { useContext, useEffect, useState } from 'react';

export function useApp(): [any[], (type: string) => void, (type: string) => void] {
  const ctx = useContext(AppsContext);
  const [apps, setApps] = useState<Array<any>>([]);
  const [filtered, setFiltered] = useState<Array<any>>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    window.api.getAllGames().then((res) => {
      setApps(res);
    });
  }, []);

  useEffect(() => {
    setFiltered(
      apps
        .filter((g) => {
          return (
            g.category == ctx.category &&
            (filter == '' || g.name.toLowerCase().includes(filter.toLowerCase()))
          );
        })
        .map((e) => {
          return { ...e, running: ctx.running.includes(e.name) };
        })
    );
  }, [apps, ctx.category, filter, ctx.running]);

  useEffect(() => {
    ctx.setCategory(ctx.category);
  }, [ctx.category]);

  return [filtered, ctx.setCategory, setFilter];
}
