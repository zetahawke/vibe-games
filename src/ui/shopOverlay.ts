import { buyWeapon } from '../economy/economy';
import { GameSave } from '../save/save';
import { getWeapon, WEAPONS, WeaponId } from '../weapons/weapons';
import { el } from './dom';

export function renderShopOverlay(
  parent: HTMLElement,
  save: GameSave,
  onChange: (save: GameSave) => void,
  onEarn: () => void,
  onClose: () => void,
): HTMLElement {
  const overlay = el('div', { className: 'overlay' });
  const card = el('div', { className: 'overlay-card shop-card' });
  overlay.append(card);

  const render = () => {
    card.replaceChildren();
    card.append(
      el('h2', {}, ['Tienda']),
      el('p', {}, [`Monedas: ${save.coins}`]),
    );

    const list = el('div', { className: 'shop-list' });
    for (const id of Object.keys(WEAPONS) as WeaponId[]) {
      const def = getWeapon(id);
      const owned = save.ownedWeapons.includes(id);
      const equipped = save.equippedWeapon === id;
      const row = el('div', { className: 'shop-row' }, [
        el('div', {}, [
          el('strong', {}, [def.name]),
          el('div', { className: 'muted' }, [
            `Daño ${def.damage} · ${def.price === 0 ? 'Gratis' : `${def.price} monedas`}`,
          ]),
        ]),
      ]);
      const actions = el('div', { className: 'btn-row' });
      if (!owned) {
        const buy = el('button', { type: 'button', className: 'btn primary' }, ['Comprar']);
        buy.addEventListener('click', () => {
          const result = buyWeapon(save.coins, save.ownedWeapons, id);
          if (!result.ok) {
            alert(result.error);
            return;
          }
          save.coins = result.coins;
          save.ownedWeapons = result.owned;
          onChange(save);
          render();
        });
        actions.append(buy);
      } else if (!equipped) {
        const equip = el('button', { type: 'button', className: 'btn primary' }, ['Equipar']);
        equip.addEventListener('click', () => {
          save.equippedWeapon = id;
          onChange(save);
          render();
        });
        actions.append(equip);
      } else {
        actions.append(el('span', { className: 'muted' }, ['Equipada']));
      }
      row.append(actions);
      list.append(row);
    }
    card.append(list);

    const earn = el('button', { type: 'button', className: 'btn primary earn-btn' }, [
      'Ganar más monedas',
    ]);
    const close = el('button', { type: 'button', className: 'btn' }, ['Cerrar']);
    earn.addEventListener('click', onEarn);
    close.addEventListener('click', onClose);
    card.append(el('div', { className: 'btn-col' }, [earn, close]));
  };

  render();
  parent.append(overlay);
  return overlay;
}
