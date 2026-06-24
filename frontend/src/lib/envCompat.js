// Compatibility of an environment's allow-list with a user's pre-selected catalog + tier.
//
// Environments already carry their allow-list ids from GET /environments
// (EnvironmentController::transform → allowed_provider_ids / allowed_tier_ids / allowed_node_ids),
// so this is a pure client-side check — no per-environment fetch is needed.
//
// A published catalog row is bound to one discovered node (providerId + providerNodeId), so an
// environment can host the catalog only if it allows that provider AND an Active node that hosts it.
// Tier is env-scoped (not node-bound), so it just needs to be in the env's allowed tiers.
//
// Returns { supportsCatalog, supportsTier, ok, reasons } where reasons is a subset of
// ['catalog','tier'] naming what is NOT supported (drives the warning badge/tooltip).
export function checkEnvCompat(env, { desiredCatalog, desiredTierId }, allNodes = []) {
  const providerIds = (env?.allowedProviderIds || []).map(String);
  const tierIds = (env?.allowedTierIds || []).map(String);
  const nodeIds = (env?.allowedNodeIds || []).map(String);

  let supportsCatalog = true;
  if (desiredCatalog) {
    const providerOk = providerIds.includes(String(desiredCatalog.providerId));
    const hostNodeOk = (allNodes || []).some(
      (n) =>
        String(n.providerId) === String(desiredCatalog.providerId) &&
        String(n.providerNodeId) === String(desiredCatalog.providerNodeId) &&
        n.status === 'Active' &&
        nodeIds.includes(String(n.id))
    );
    supportsCatalog = providerOk && hostNodeOk;
  }

  const supportsTier = desiredTierId ? tierIds.includes(String(desiredTierId)) : true;

  const reasons = [];
  if (!supportsCatalog) reasons.push('catalog');
  if (!supportsTier) reasons.push('tier');

  return { supportsCatalog, supportsTier, ok: supportsCatalog && supportsTier, reasons };
}
