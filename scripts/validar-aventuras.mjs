#!/usr/bin/env node
// Comprobación estática de aventuras: no modifica datos ni aplica reglas de combate.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const files = process.argv.slice(2);
if (!files.length) files.push('src/data/hondaroca.json');
let errors = 0;
let warnings = 0;
const warn = (file, where, message) => { console.warn(`AVISO ${file} [${where}]: ${message}`); warnings++; };
for (const file of files) {
  let data;
  try { data = JSON.parse(readFileSync(resolve(file), 'utf8')); }
  catch (error) { console.error(`ERROR ${file}: JSON inválido o inaccesible: ${error.message}`); errors++; continue; }
  const rooms = new Map(), encounters = new Map(), contentIds = new Map();
  const fail = (where, message) => { console.error(`ERROR ${file} [${where}]: ${message}`); errors++; };
  if (!Array.isArray(data.zones) || !data.zones.length) { fail('zones', 'Faltan zonas'); continue; }
  for (const zone of data.zones) {
    if (!Array.isArray(zone.rooms)) { fail(zone.id || 'zona', 'rooms no es una lista'); continue; }
    for (const room of zone.rooms) {
      if (!room.id || rooms.has(room.id)) fail(room.id || zone.id, 'ID de sala vacío o duplicado');
      rooms.set(room.id, room);
      if (!Array.isArray(room.exits) || !Array.isArray(room.contents)) {
        fail(room.id, 'exits y contents deben ser listas'); continue;
      }
      for (const item of room.contents) {
        if (item.id) {
          if (contentIds.has(item.id)) fail(item.id, `ID duplicado (también en ${contentIds.get(item.id)})`);
          contentIds.set(item.id, room.id);
        }
        if (item.type === 'encounter') {
          if (!item.id) fail(room.id, 'Encuentro sin ID');
          encounters.set(item.id, item);
          if (!Array.isArray(item.enemies) || !item.enemies.length) fail(item.id, 'Encuentro sin enemigos');
          else for (const enemy of item.enemies) {
            if (!Number.isInteger(enemy.count) || enemy.count < 1) fail(item.id, 'Cantidad de enemigos inválida');
            if (!enemy.srd_creature) fail(item.id, 'Enemigo sin criatura de referencia');
          }
          if (!Number.isFinite(item.xp_total) || item.xp_total < 0) fail(item.id, 'PX inválidos');
          if (!Array.isArray(item.can_reinforce)) fail(item.id, 'can_reinforce debe ser una lista');
        }
        if (item.type === 'scene') {
          if (!Array.isArray(item.options) || !item.options.length) fail(item.id || room.id, 'Escena sin opciones');
          for (const option of item.options || []) {
            if (!option.label || !option.ok) fail(item.id || room.id, 'Opción sin texto o resultado');
            if (option.dc !== undefined && (!Number.isFinite(option.dc) || option.dc < 0)) fail(item.id || room.id, 'CD inválida');
          }
        }
      }
    }
  }
  const zoneIds = new Set();
  for (const zone of data.zones) {
    if (!zone.id || zoneIds.has(zone.id)) fail(zone.id || 'zona', 'ID de zona vacío o duplicado');
    zoneIds.add(zone.id);
  }
  // Accesibilidad estructural. Los bloqueos condicionales se revisan por separado.
  const entrances = [...rooms.values()].filter(room => room.is_zone_entrance).map(room => room.id);
  if (!entrances.length) warn(file, 'zones', 'No hay salas de entrada declaradas');
  const visited = new Set(entrances), pending = [...entrances];
  while (pending.length) {
    const room = rooms.get(pending.pop());
    for (const exit of room?.exits || []) if (rooms.has(exit.to) && !visited.has(exit.to)) {
      visited.add(exit.to);
      pending.push(exit.to);
    }
  }
  for (const roomId of rooms.keys()) if (entrances.length && !visited.has(roomId)) {
    warn(file, roomId, 'Sala no alcanzable desde ninguna entrada (comprobar rutas y desbloqueos)');
  }
  for (const [roomId, room] of rooms) for (const exit of room.exits || []) {
    if (!rooms.has(exit.to)) fail(roomId, `Salida hacia sala inexistente: ${exit.to}`);
  }
  for (const [id, encounter] of encounters) for (const ref of encounter.can_reinforce || []) {
    if (!encounters.has(ref)) fail(id, `Refuerzo inexistente: ${ref}`);
    if (ref === id) fail(id, 'Un encuentro no puede reforzarse a sí mismo');
  }
  // Los disparadores pueden apuntar a eventos externos: advertir, no romper la carga.
  for (const [roomId, room] of rooms) for (const item of room.contents || []) {
    if (item.type !== 'scene') continue;
    if (item.after && !rooms.has(item.after) && !contentIds.has(item.after)) {
      warn(file, item.id || roomId, `Disparador after no encontrado en este archivo: ${item.after}`);
    }
  }
  // Los PX pueden incluir ajustes de progresión deliberados. Solo avisamos.
  const xpByCreature = {
    'Giant Rat': 25, 'Goblin Warrior': 50, 'Goblin Boss': 200,
    'Giant Spider': 200, 'Swarm of Bats': 50, Skeleton: 50,
    Zombie: 50, Ghoul: 200, Cultist: 25, 'Steam Mephit': 50, Orvane: 700,
  };
  for (const [id, encounter] of encounters) {
    if (!Array.isArray(encounter.enemies) || !encounter.enemies.every(enemy => Object.hasOwn(xpByCreature, enemy.srd_creature))) continue;
    const expected = encounter.enemies.reduce((sum, enemy) => sum + xpByCreature[enemy.srd_creature] * enemy.count, 0);
    if (Number.isFinite(expected) && encounter.xp_total !== expected) {
      warn(file, id, `PX declarados ${encounter.xp_total}; suma de criaturas ${expected}. Revisar si es un ajuste deliberado`);
    }
  }
  // Las referencias 'after' pueden ser salas, escenas de otras aventuras o
  // eventos del motor. No se rechazan sin conocer su espacio de nombres.
  console.log(`${file}: ${rooms.size} salas, ${encounters.size} encuentros comprobados`);
}
if (errors) { console.error(`${errors} error(es) detectado(s)`); process.exitCode = 1; }
else console.log(`Validación estructural superada (${warnings} aviso(s) no bloqueantes).`);
