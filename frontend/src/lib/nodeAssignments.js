// Node-derived environment assignments (etc.txt).
//
// A published resource (catalog / network / datastore) is bound to a raw
// provider_node_id. An environment allow-lists *published* nodes (`nodes.id`),
// each of which points to a provider_node_id. So a resource is "assigned" to an
// environment iff its provider_node_id matches one of that environment's allowed
// published nodes — the node is the single axis everything hangs off.

/** Set of raw provider_node_ids an environment's allowed published nodes resolve to. */
export function allowedProviderNodeIds(env, nodes = []) {
  return (env?.allowedNodeIds || [])
    .map((nid) => nodes.find((n) => n.id === nid)?.providerNodeId)
    .filter((x) => x != null);
}

/** Names of environments whose allowed nodes include the given provider_node_id. */
export function environmentsForNode(providerNodeId, environments = [], nodes = []) {
  if (providerNodeId == null) return [];
  return environments
    .filter((env) => allowedProviderNodeIds(env, nodes).includes(providerNodeId))
    .map((env) => env.name);
}
