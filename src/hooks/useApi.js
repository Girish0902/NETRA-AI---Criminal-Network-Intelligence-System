import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useApi(load, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadRef = useRef(load);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  const depsKey = useMemo(() => {
    try {
      return JSON.stringify(dependencies);
    } catch {
      return String(dependencies);
    }
  }, [dependencies]);

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    Promise.resolve()
      .then(() => loadRef.current())
      .then(result => {
        if (active) setData(result);
      })
      .catch(err => {
        if (active) setError(err.message || "Unable to load data");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey, depsKey]);

  return { data, loading, error, setData, reload };
}