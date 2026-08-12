/** Maps a shop WeaponId to boxing piece catalog ids for each hand. */
export function weaponPieceIds(weaponId: string): { right: string; left?: string } {
  switch (weaponId) {
    case 'sword_shield':
      return { right: 'sword', left: 'shield' };
    case 'sword_shield_upgraded':
      return { right: 'sword_upgraded', left: 'shield_upgraded' };
    case 'bow':
      return { right: 'bow' };
    case 'bow_upgraded':
      return { right: 'bow_upgraded' };
    case 'longsword':
      return { right: 'longsword' };
    case 'longsword_upgraded':
      return { right: 'longsword_upgraded' };
    default:
      return { right: weaponId };
  }
}
