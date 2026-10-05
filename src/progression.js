import {CONFIG,costFor,capacityFor,collectionPool} from './config.js?v=0.10.0';
export function nextGoal(save) {
  if(save.speedLevel===0)return{kind:'speed',title:'Give your press a boost.',detail:'Walk onto the green workshop pad.',target:CONFIG.upgrade};
  if(save.handlingLevel===0)return{kind:'handling',title:'Your first forklift.',detail:'A proper rig for the heavier jobs.',target:CONFIG.upgrade};
  if(save.powerLevel===0)return{kind:'power',title:'Bring on the pickups.',detail:'Power 2 opens up Farm Pickups.',target:CONFIG.upgrade};
  if(!save.discoveries.includes('veh_pickup'))return{title:'Meet the Farm Pickup.',detail:'Lift it, crush it, discover it.',target:CONFIG.spawn};
  if(!save.landOwned)return{kind:'land',title:'Room to grow.',detail:'Buy the east lot for $400. Make it yours.',target:CONFIG.land};
  if(save.handlingLevel<2)return{kind:'handling',title:'A stronger set of forks.',detail:'Shop Forklift lifts Delivery Vans.',target:CONFIG.upgrade};
  if(save.powerLevel<2)return{kind:'power',title:'Put vans on the menu.',detail:'Upgrade to Power 3 for $130 wrecks.',target:CONFIG.upgrade};
  if(!save.discoveries.includes('veh_van'))return{title:'A bigger delivery.',detail:'Discover your first Delivery Van.',target:CONFIG.spawn};
  if(save.valueLevel===0)return{kind:'value',title:'Make every wreck worth more.',detail:'Scrap value adds 20% to every payout.',target:CONFIG.upgrade};
  if(save.handlingLevel<3)return{kind:'handling',title:'Think heavy.',detail:'A Heavy Forklift can lift Box Trucks.',target:CONFIG.upgrade};
  if(save.powerLevel<4)return{kind:'power',title:'Build a heavy-duty press.',detail:'Reach Power 5 for Box Trucks.',target:CONFIG.upgrade};
  if(!save.discoveries.includes('veh_boxtruck'))return{title:'Time for the big jobs.',detail:'Discover your first Box Truck.',target:CONFIG.spawn};
  if(save.handlingLevel<4||save.powerLevel<7)return{kind:save.handlingLevel<4?'handling':'power',title:'Six wrecks. One growing yard.',detail:'Capacity 8 + Power 8 opens the Retired Bus.',target:CONFIG.upgrade};
  if(save.discoveries.length<6)return{title:'The biggest job yet.',detail:'Crush the Retired Bus to complete your discoveries.',target:CONFIG.spawn};
  return{title:'That’s a proper salvage yard.',detail:'All six discovered. Chase a rare Perfect Crush.',target:CONFIG.spawn};
}
export function goalCost(save,goal=nextGoal(save)){return goal.kind==='land'?CONFIG.land.cost:goal.kind?costFor(goal.kind,save[CONFIG.upgrades[goal.kind].field]):null;}
export function nextVehicle(save){return collectionPool(save).find(v=>!save.discoveries.includes(v.id))??null;}
