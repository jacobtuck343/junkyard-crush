export const CONFIG = Object.freeze({
  gameVersion: '0.6.2', economyVersion: '1.2-phase4.1', onboardingVersion: '2',
  speed: 5.5, acceleration: 15, towSpring: 10, attachRadius: 1.8,
  pressSeconds: 3, perfectStart: .70, perfectEnd: .85, perfectMultiplier: 1.5,
  upgradeBaseCost: 60, upgradeGrowth: 1.8, upgradeMax: 5, speedFactor: .85,
  rewardDelay: .85, respawnDelay: 1.4, vacuumRadius: 4, particleBudget: 90,
  crusher: { x: 0, z: -3.7, radius: 2.4 }, upgrade: { x: 5.5, z: -1, radius: 1.6 },
  playerStart: { x: -7.4, z: 3.5 }, spawn: { x: -11.4, z: 3.5 },
  bounds: { minX: -12.7, maxX: 8, minZ: -6, maxZ: 7 },
  land: { x: 8.4, z: 2.2, radius: 1.65, cost: 400, expandedMaxX: 17.5 },
  upgrades: {
    speed: { name: 'Press speed', field: 'speedLevel', max: 5, base: 60, growth: 1.8, detail: '15% faster press', icon: '↯' },
    power: { name: 'Crusher power', field: 'powerLevel', max: 7, base: 150, growth: 2.1, detail: '+1 crushing power', icon: '▼' },
    handling: { name: 'Handling rig', field: 'handlingLevel', max: 4, costs: [125,300,850,1800], detail: 'Lift heavier wrecks', icon: '↥' },
    value: { name: 'Scrap value', field: 'valueLevel', max: 5, base: 120, growth: 1.9, detail: '+20% base payout', icon: '$' },
    zone: { name: 'Perfect zone', field: 'zoneLevel', max: 3, base: 200, growth: 2.5, detail: '15% wider timing zone', icon: '◎' },
    magnet: { name: 'Yard magnet', field: 'magnetLevel', max: 3, base: 250, growth: 2.2, detail: '50% faster scrap return', icon: '∩' }
  },
  handling: [
    { name: 'Tow hook', capacity: 1, kg: 1500 },
    { name: 'Rusty Forklift', capacity: 2, kg: 2200 },
    { name: 'Shop Forklift', capacity: 3, kg: 3000 },
    { name: 'Heavy Forklift', capacity: 5, kg: 3600 },
    { name: 'Industrial Loader', capacity: 8, kg: 4600 }
  ],
  vehicles: [
    { id: 'veh_rustcompact', name: 'Rust Compact', weight: 900, resistance: 1, value: 30, color: '#e28f45', length: 2.4, tags: ['Civilian','Small','BaseGame'], rarity: 'Common', destruction: 'three-stage', audio: 'light-metal' },
    { id: 'veh_sedan', name: 'Tired Sedan', weight: 1300, resistance: 1, value: 45, color: '#6eaaaa', length: 2.9, tags: ['Civilian','Steel','BaseGame'], rarity: 'Common', destruction: 'three-stage', audio: 'heavy-metal' },
    { id: 'veh_pickup', name: 'Farm Pickup', kind: 'pickup', weight: 1900, resistance: 2, value: 80, color: '#a67456', length: 3.1, tags: ['Civilian','Steel','BaseGame'], rarity: 'Common', destruction: 'three-stage', audio: 'heavy-metal' },
    { id: 'veh_van', name: 'Delivery Van', kind: 'van', weight: 2400, resistance: 3, value: 130, color: '#cfdbc6', length: 3.3, tags: ['Commercial','Steel','BaseGame'], rarity: 'Common', destruction: 'three-stage', audio: 'heavy-metal' },
    { id: 'veh_boxtruck', name: 'Box Truck', kind: 'truck', weight: 3300, resistance: 5, value: 260, color: '#668aa0', length: 3.8, land: true, tags: ['Commercial','Heavy','BaseGame'], rarity: 'Common', destruction: 'three-stage', audio: 'heavy-metal' },
    { id: 'veh_schoolbus', name: 'Retired Bus', kind: 'bus', weight: 4000, resistance: 8, value: 600, color: '#d5a943', length: 4.7, land: true, tags: ['City','Heavy','BaseGame'], rarity: 'Common', destruction: 'three-stage', audio: 'heavy-metal' }
  ]
});
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const upgradeCost = level => Math.round(CONFIG.upgradeBaseCost * CONFIG.upgradeGrowth ** level);
export const pressDuration = (level, weight) => CONFIG.pressSeconds * CONFIG.speedFactor ** level * (1 + (weight-900)/4000);
export const perfectBounds = (level, weight, zoneLevel=0) => ({start:CONFIG.perfectStart,end:Math.min(.97,Math.max(CONFIG.perfectStart+(CONFIG.perfectEnd-CONFIG.perfectStart)*(1+.15*zoneLevel),CONFIG.perfectStart+.25/pressDuration(level,weight)))});
export const COUNTY_VEHICLES=[
  {id:'veh_servicevan',name:'County Service Van',kind:'van',weight:2300,resistance:3,value:190,color:'#e0dcc4',length:3.4,tags:['County','Commercial','Steel'],rarity:'Common',destruction:'three-stage',audio:'heavy-metal',county:true},
  {id:'veh_flatbed',name:'Works Flatbed',kind:'pickup',weight:3200,resistance:5,value:360,color:'#648da8',length:4.2,tags:['County','Commercial','Heavy'],rarity:'Common',destruction:'three-stage',audio:'heavy-metal',county:true},
  {id:'veh_surplus',name:'Surplus Utility Carrier',kind:'surplus',weight:4500,resistance:8,value:850,color:'#7b8965',length:4.1,tags:['County','Surplus','Heavy'],rarity:'Common',destruction:'three-stage',audio:'heavy-metal',county:true,permit:true}
];
export const ALL_VEHICLES=[...CONFIG.vehicles,...COUNTY_VEHICLES];
export const collectionPool=save=>save.yardId==='county'?ALL_VEHICLES:CONFIG.vehicles;
export const vehiclePool=save=>collectionPool(save).filter(v=>!v.permit||save.surplusPermit);
export const rewardFor = (vehicle, perfect, valueLevel=0,legacy=0) => Math.round(vehicle.value * (vehicle.rarity==='Rare'?2.5:1) * (perfect ? CONFIG.perfectMultiplier : 1)*(1+.2*valueLevel)*(1+.25*legacy));
export const costFor = (kind, level) => { const u=CONFIG.upgrades[kind]; return u.costs?u.costs[level]:Math.round(u.base*u.growth**level); };
export const capacityFor = save => CONFIG.handling[save.handlingLevel??0];
export const canHandle = (save,vehicle) => vehicle.weight<=capacityFor(save).kg;
export const canCrush = (save,vehicle) => vehicle.resistance<=1+(save.powerLevel??0);
export function chooseVehicle(save) {
  const available=vehiclePool(save).filter(v=>canHandle(save,v)&&canCrush(save,v)&&(!v.land||save.landOwned));
  const unseen=available.find(v=>!(save.discoveries??[]).includes(v.id));
  const best=available.length-1;
  const rare=save.landOwned&&save.crushed>=6&&save.crushed%8===6;
  const choice=unseen??available[rare?Math.floor(save.crushed/8)%available.length:save.crushed%4===3?Math.max(0,best-1):best];
  return {...choice,rarity:rare?'Rare':'Common'};
}
export function validateContent(config = CONFIG) {
  if(!Array.isArray(config.vehicles)||config.vehicles.length===0)throw new Error('At least one vehicle is required');
  const ids = new Set();
  for (const v of config===CONFIG?ALL_VEHICLES:config.vehicles) {
    if (!v.id || ids.has(v.id) || !Number.isSafeInteger(v.value) || !(v.value > 0) || !Number.isFinite(v.weight) || !(v.weight > 0) || !v.name || !v.tags?.length || !v.audio || !v.destruction || !v.color || !Number.isFinite(v.length) || !(v.length > 0)) throw new Error('Invalid vehicle: '+v.id);
    ids.add(v.id);
  }
  if (!(config.perfectStart >= 0 && config.perfectEnd > config.perfectStart && config.perfectEnd < 1)) throw new Error('Invalid Perfect Zone');
  return true;
}






