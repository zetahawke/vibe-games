import * as THREE from 'three';
import {
  AVATAR_COLORS,
  CHILE_GRADES,
  DEFAULT_AVATAR_COLOR,
  defaultProfile,
  isPlayableGrade,
  loadProfile,
  ownsCosmetic,
  saveProfile,
  tryBuyCosmetic,
  type AvatarSex,
  type ChileGrade,
  type HairId,
  type HatId,
  type PantsId,
  type PlayerProfile,
  type ShirtId,
} from '@/domain/profile/profile';
import { cosmeticLabel, cosmeticPrice, type CosmeticSlot } from '@/domain/cosmetics/catalog';
import { HAIR_IDS, HAT_IDS, PANTS_IDS, SHIRT_IDS } from '@/assets/boxing/manifest';
import { getStoredSessionToken } from '@/domain/online/playerService';
import { buildPlayer, type PlayerLook, type PlayerRig } from '@/game/world/player';
import { playSoftFail } from '@/shared/sfx';
import { clear, el } from '@/shared/dom';

function lookFromDraft(d: PlayerProfile): PlayerLook {
  return {
    sex: d.sex,
    color: d.color,
    hatId: d.hatId,
    shirtId: d.shirtId,
    pantsId: d.pantsId,
    hairId: d.hairId,
  };
}

export function renderProfileScreen(
  root: HTMLElement,
  username: string,
  onDone: () => void,
  opts: { required?: boolean } = {},
): void {
  clear(root);
  const existing = loadProfile(username);
  const draft: PlayerProfile = existing
    ? { ...existing }
    : { ...defaultProfile(username), displayName: username };

  const previewHost = el('div', { className: 'profile-preview' });
  const preview = mountPreview(previewHost, lookFromDraft(draft));

  const nameInput = el('input', {
    type: 'text',
    className: 'input',
    maxlength: '20',
    value: draft.displayName || username,
  }) as HTMLInputElement;

  const gradeList = el('div', { className: 'profile-grades' });
  for (const g of CHILE_GRADES) {
    const btn = el('button', {
      type: 'button',
      className: `btn ${draft.grade === g.id ? 'primary' : 'ghost'}`,
      ...(g.enabled ? {} : { disabled: 'true' }),
    }, [g.enabled ? g.label : `${g.label} — próximamente`]) as HTMLButtonElement;
    if (g.enabled) {
      btn.addEventListener('click', () => {
        draft.grade = g.id;
        for (const child of gradeList.children) {
          child.classList.toggle('primary', child === btn);
          child.classList.toggle('ghost', child !== btn);
        }
      });
    }
    gradeList.append(btn);
  }

  const sexRow = el('div', { className: 'profile-sex' });
  const setSex = (sex: AvatarSex) => {
    draft.sex = sex;
    preview.setLook(lookFromDraft(draft));
    boyBtn.classList.toggle('primary', sex === 'boy');
    girlBtn.classList.toggle('primary', sex === 'girl');
    boyBtn.classList.toggle('ghost', sex !== 'boy');
    girlBtn.classList.toggle('ghost', sex !== 'girl');
  };
  const boyBtn = el('button', {
    type: 'button',
    className: `btn ${draft.sex === 'boy' ? 'primary' : 'ghost'}`,
  }, ['Niño']) as HTMLButtonElement;
  const girlBtn = el('button', {
    type: 'button',
    className: `btn ${draft.sex === 'girl' ? 'primary' : 'ghost'}`,
  }, ['Niña']) as HTMLButtonElement;
  boyBtn.addEventListener('click', () => setSex('boy'));
  girlBtn.addEventListener('click', () => setSex('girl'));
  sexRow.append(boyBtn, girlBtn);

  const swatches = el('div', { className: 'profile-swatches' });
  for (const hex of AVATAR_COLORS) {
    const sw = el('button', {
      type: 'button',
      className: `profile-swatch${draft.color === hex ? ' selected' : ''}`,
      style: `background:${hex}`,
      'aria-label': hex,
    }) as HTMLButtonElement;
    sw.addEventListener('click', () => {
      draft.color = hex;
      preview.setLook(lookFromDraft(draft));
      for (const child of swatches.children) {
        child.classList.toggle('selected', child === sw);
      }
    });
    swatches.append(sw);
  }

  const err = el('p', { className: 'error' }, ['']);
  const saveBtn = el('button', { type: 'button', className: 'btn primary' }, ['Guardar']) as HTMLButtonElement;
  saveBtn.addEventListener('click', async () => {
    const grade = draft.grade as ChileGrade;
    if (!isPlayableGrade(grade)) {
      err.textContent = 'Por ahora solo está habilitado 2do Básico.';
      return;
    }
    const profile: PlayerProfile = {
      ...draft,
      grade,
      sex: draft.sex,
      color: /^#[0-9a-fA-F]{6}$/.test(draft.color) ? draft.color : DEFAULT_AVATAR_COLOR,
      displayName: nameInput.value.trim() || username,
      hatId: draft.hatId,
      shirtId: draft.shirtId,
      pantsId: draft.pantsId,
      hairId: draft.hairId,
      gems: draft.gems,
      ownedHats: draft.ownedHats,
      ownedShirts: draft.ownedShirts,
      ownedPants: draft.ownedPants,
      ownedHairs: draft.ownedHairs,
    };
    saveProfile(username, profile);
    const token = getStoredSessionToken();
    if (token) {
      try {
        await fetch('/api/players/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionToken: token,
            grade: profile.grade,
            sex: profile.sex,
            color: profile.color,
            displayName: profile.displayName,
            hatId: profile.hatId,
            shirtId: profile.shirtId,
            pantsId: profile.pantsId,
            hairId: profile.hairId,
            gems: profile.gems,
            ownedHats: profile.ownedHats,
            ownedShirts: profile.ownedShirts,
            ownedPants: profile.ownedPants,
            ownedHairs: profile.ownedHairs,
          }),
        });
      } catch {
        // local save is enough to play
      }
    }
    preview.dispose();
    onDone();
  });

  const actions = el('div', { className: 'btn-col' }, [saveBtn]);
  if (!opts.required) {
    const back = el('button', { type: 'button', className: 'btn ghost' }, ['← Volver']) as HTMLButtonElement;
    back.addEventListener('click', () => {
      preview.dispose();
      onDone();
    });
    actions.append(back);
  }

  const gemsEl = el('p', { className: 'profile-gems' }, [`💎 ${draft.gems}`]);

  function refreshGems(): void {
    gemsEl.textContent = `💎 ${draft.gems}`;
  }

  function overlayRow(
    title: string,
    slot: CosmeticSlot,
    ids: readonly string[],
    getCurrent: () => string,
    onEquip: (id: string) => void,
  ): HTMLElement {
    const row = el('div', { className: 'profile-sex' });
    const rebuild = () => {
      row.replaceChildren();
      const current = getCurrent();
      for (const id of ids) {
        const owned = ownsCosmetic(draft, slot, id);
        const price = cosmeticPrice(id);
        const label = id === 'none' || owned
          ? cosmeticLabel(id)
          : `${cosmeticLabel(id)} · ${price}💎`;
        const btn = el('button', {
          type: 'button',
          className: `btn ${current === id ? 'primary' : 'ghost'}`,
        }, [label]) as HTMLButtonElement;
        btn.addEventListener('click', () => {
          if (owned || id === 'none') {
            onEquip(id);
            rebuild();
            preview.setLook(lookFromDraft(draft));
            return;
          }
          const result = tryBuyCosmetic(draft, slot, id);
          if (!result.ok) {
            playSoftFail();
            err.textContent = result.reason === 'funds' ? 'No tenés suficientes gemas.' : 'No se pudo comprar.';
            return;
          }
          Object.assign(draft, result.profile);
          err.textContent = '';
          refreshGems();
          onEquip(id);
          rebuild();
          preview.setLook(lookFromDraft(draft));
        });
        row.append(btn);
      }
    };
    rebuild();
    return el('div', {}, [
      el('p', { className: 'muted' }, [title]),
      row,
    ]);
  }

  const hatRow = overlayRow('Sombrero', 'hat', HAT_IDS, () => draft.hatId, (id) => {
    draft.hatId = id as HatId;
  });
  const shirtRow = overlayRow('Camiseta', 'shirt', SHIRT_IDS, () => draft.shirtId, (id) => {
    draft.shirtId = id as ShirtId;
  });
  const pantsRow = overlayRow('Pantalón', 'pants', PANTS_IDS, () => draft.pantsId, (id) => {
    draft.pantsId = id as PantsId;
  });
  const hairRow = overlayRow('Peinado', 'hair', HAIR_IDS, () => draft.hairId, (id) => {
    draft.hairId = id as HairId;
  });

  root.append(
    el('section', { className: 'screen profile-screen' }, [
      el('h1', {}, ['Mi perfil']),
      el('p', { className: 'muted' }, [
        opts.required
          ? 'Elige tu grado y cómo te ves antes de jugar.'
          : 'Grado, color de ropa y aspecto.',
      ]),
      gemsEl,
      previewHost,
      el('label', {}, ['Nombre']),
      nameInput,
      el('p', { className: 'muted' }, ['Grado']),
      gradeList,
      el('p', { className: 'muted' }, ['Aspecto']),
      sexRow,
      el('p', { className: 'muted' }, ['Color de camiseta']),
      swatches,
      hatRow,
      shirtRow,
      pantsRow,
      hairRow,
      err,
      actions,
    ]),
  );
}

function disposeObject3D(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      (m as THREE.MeshStandardMaterial).map?.dispose();
      m.dispose();
    }
  });
}

function mountPreview(host: HTMLElement, look: PlayerLook): {
  setLook: (next: PlayerLook) => void;
  dispose: () => void;
} {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(240, 240);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xc8d8ff, 0.7));
  const sun = new THREE.DirectionalLight(0xfff0d0, 1.05);
  sun.position.set(3, 8, 5);
  scene.add(sun);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
  camera.position.set(0, 1.55, 5.4);
  camera.lookAt(0, 1.35, 0);

  const textures: THREE.Texture[] = [];
  const materials: THREE.Material[] = [];
  let rig: PlayerRig = buildPlayer((t) => textures.push(t), (m) => materials.push(m), look);
  scene.add(rig.root);

  let yaw = 0.35;
  let dragging = false;
  let lastX = 0;
  let raf = 0;
  let alive = true;

  const onDown = (e: PointerEvent) => {
    dragging = true;
    lastX = e.clientX;
    host.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    yaw += (e.clientX - lastX) * 0.012;
    lastX = e.clientX;
  };
  const onUp = () => { dragging = false; };

  host.addEventListener('pointerdown', onDown);
  host.addEventListener('pointermove', onMove);
  host.addEventListener('pointerup', onUp);
  host.addEventListener('pointerleave', onUp);

  const tick = () => {
    if (!alive) return;
    if (!dragging) yaw += 0.006;
    rig.root.rotation.y = yaw;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return {
    setLook(next) {
      scene.remove(rig.root);
      disposeObject3D(rig.root);
      rig = buildPlayer((t) => textures.push(t), (m) => materials.push(m), next);
      scene.add(rig.root);
    },
    dispose() {
      alive = false;
      cancelAnimationFrame(raf);
      host.removeEventListener('pointerdown', onDown);
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerup', onUp);
      host.removeEventListener('pointerleave', onUp);
      scene.remove(rig.root);
      disposeObject3D(rig.root);
      for (const t of textures) t.dispose();
      for (const m of materials) m.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
