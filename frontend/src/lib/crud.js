import api from './api';

// A rejected request with no HTTP status means the backend was unreachable
// (network error) rather than a real validation/permission failure.
export const isOffline = (e) => e == null || e.status == null;

/**
 * Build API-backed create/update/remove handlers for a list resource.
 *
 *  - On success: hits the API then refetches the canonical list.
 *  - When the backend is unreachable (no server yet): falls back to an
 *    optimistic local mutation so the UI stays usable during dev/testing.
 *  - Real HTTP errors (422/409/500…) are re-thrown so callers can surface
 *    `error.message` inline (e.g. 409 delete-protection messages).
 *
 * `normalize` aliases API fields onto the names the tables render, so both
 * fetched rows and optimistic rows display consistently.
 */
export function makeCrud(resource, setItems, refetch, normalize = (x) => x) {
  const create = async (data) => {
    try {
      const created = await api.post(resource, data);
      await refetch();
      return created;
    } catch (e) {
      if (isOffline(e)) {
        setItems((prev) => [...prev, normalize({ id: Date.now(), ...data })]);
        return null;
      }
      throw e;
    }
  };

  const update = async (id, data) => {
    try {
      const updated = await api.put(`${resource}/${id}`, data);
      await refetch();
      return updated;
    } catch (e) {
      if (isOffline(e)) {
        setItems((prev) => prev.map((it) => (it.id === id ? normalize({ ...it, ...data, id }) : it)));
        return null;
      }
      throw e;
    }
  };

  const remove = async (id) => {
    try {
      await api.del(`${resource}/${id}`);
      await refetch();
    } catch (e) {
      if (isOffline(e)) {
        setItems((prev) => prev.filter((it) => it.id !== id));
        return;
      }
      throw e;
    }
  };

  return { create, update, remove };
}
