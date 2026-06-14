import { useEffect } from 'react';
import { useUserContext } from '../contexts/UserContext';
import { useProviderContext } from '../contexts/ProviderContext';
import { useCatalogContext } from '../contexts/CatalogContext';
import { useNetworkContext } from '../contexts/NetworkContext';
import { useDatastoreContext } from '../contexts/DatastoreContext';
import { useNodeContext } from '../contexts/NodeContext';
import { useTierContext } from '../contexts/TierContext';
import { useEnvironmentContext } from '../contexts/EnvironmentContext';

// Systemic data freshness. The app-level data providers do their initial fetch at app startup —
// which happens BEFORE login (they wrap the whole app, including the Login screen), so that first
// load is unauthenticated and comes back empty/401. This component sits inside all the providers and
// re-fetches every context the moment the user becomes authenticated (`currentUser` set — on form
// login OR token-restore on reload), so every page has fresh data without per-page workarounds.
export default function DataBootstrap() {
  const { currentUser, fetchAdminLists } = useUserContext();
  const { refetch: refetchProviders } = useProviderContext();
  const { refetch: refetchCatalogs } = useCatalogContext();
  const { refetch: refetchNetworks } = useNetworkContext();
  const { refetch: refetchDatastores } = useDatastoreContext();
  const { refetch: refetchNodes } = useNodeContext();
  const { refetch: refetchTiers } = useTierContext();
  const { refetch: refetchEnvironments } = useEnvironmentContext();

  // Keyed on the user id so it fires once per login (and again if a different user logs in).
  const userId = currentUser?.id;

  useEffect(() => {
    if (!userId) return; // not authenticated yet → nothing to load
    refetchProviders();
    refetchCatalogs();
    refetchNetworks();
    refetchDatastores();
    refetchNodes();
    refetchTiers();
    refetchEnvironments();
    fetchAdminLists(); // users/roles/groups (admin-scoped; harmless 403 for non-admins)
  }, [
    userId,
    refetchProviders, refetchCatalogs, refetchNetworks, refetchDatastores,
    refetchNodes, refetchTiers, refetchEnvironments, fetchAdminLists,
  ]);

  return null;
}
