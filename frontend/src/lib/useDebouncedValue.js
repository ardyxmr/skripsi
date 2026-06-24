import { useState, useEffect } from 'react';

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms have
 * passed without `value` changing. Keep the raw value on the <input> (so typing
 * stays responsive) and feed the debounced value into your filter/derived state.
 *
 *   const [search, setSearch] = useState('');
 *   const debouncedSearch = useDebouncedValue(search, 250);
 *   // filter rows with debouncedSearch
 */
export function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

export default useDebouncedValue;
