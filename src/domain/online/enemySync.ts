/** Snapshot entry we care about for tombstone reconciliation. */
export interface SnapshotId {
  id: number;
}

export interface ReconcileResult<T extends SnapshotId> {
  /** Snapshot rows that should be applied (not locally confirmed dead). */
  apply: T[];
  /** Updated tombstone set after this snapshot. */
  tombs: Set<number>;
}

/**
 * Prevents a lagging host snapshot from resurrecting an enemy the local
 * client already killed. Tombstones stay until the host also omits that id.
 */
export function reconcileEnemySnapshot<T extends SnapshotId>(
  snapshot: T[],
  tombstones: Set<number>,
): ReconcileResult<T> {
  const snapIds = new Set(snapshot.map((e) => e.id));
  const tombs = new Set<number>();
  for (const id of tombstones) {
    if (snapIds.has(id)) tombs.add(id);
  }
  return {
    apply: snapshot.filter((e) => !tombs.has(e.id)),
    tombs,
  };
}
