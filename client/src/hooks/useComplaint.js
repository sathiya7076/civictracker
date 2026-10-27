import { useEffect, useState } from 'react';
import { getComplaintRequest, getComplaintUpdatesRequest } from '../api/complaints.js';
import { getErrorMessage } from '../utils/getErrorMessage.js';

// Loads one complaint plus its timeline. Call reload() after an action to refresh both.
export function useComplaint(id) {
  const [complaint, setComplaint] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([getComplaintRequest(id), getComplaintUpdatesRequest(id)])
      .then(([c, u]) => {
        if (!active) return;
        setComplaint(c.data.data.complaint);
        setUpdates(u.data.data.updates);
      })
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, reloadKey]);

  return { complaint, updates, loading, error, reload: () => setReloadKey((k) => k + 1) };
}
