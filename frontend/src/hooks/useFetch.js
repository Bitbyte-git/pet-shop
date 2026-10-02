import { useState, useEffect, useCallback } from 'react';

/**
 * Generic hook for data fetching with loading/error state.
 * @param {Function} fetchFn - Async function that returns data
 * @param {Array} deps - Dependencies to re-fetch on
 * @param {boolean} immediate - Whether to fetch immediately (default: true)
 */
export const useFetch = (fetchFn, deps = [], immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn(...args);
      setData(result.data);
      return result.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Something went wrong.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    if (immediate) execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
};
