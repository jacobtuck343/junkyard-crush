import {CONFIG,COUNTY_VEHICLES,costFor,chooseVehicle} from './config.js?v=0.9.0';

export const SALE_TARGET=100000;
export function valuation(save){
  let equipment=0;for(const [kind,u]of Object.entries(CONFIG.upgrades))for(let level=0;level<save[u.field];level++)equipment+=costFor(kind,level);
  return {cash:save.cash,equipment:Math.round(equipment*.65),property:(save.landOwned?400:0)+(save.balerOwned?6000:0)+(save.workerOwned?1800:0)+(save.depotOwned?7500:0),reputation:Math.min(save.jobsCompleted,30)*250+Math.min(save.crushed,100)*100+CONFIG.vehicles.filter(v=>save.discoveries.includes(v.id)).length*2000};
}
export const yardValue=save=>Object.values(valuation(save)).reduce((a,b)=>a+b,0);
export function saleRequirements(save){return[
  {label:'Build the baler, hire Jo and open the south depot',done:save.balerOwned&&save.workerOwned&&save.depotOwned},
  {label:'Discover all six starter wrecks',done:CONFIG.vehicles.every(v=>save.discoveries.includes(v.id))},
  {label:'Complete five contracts',done:save.jobsCompleted>=5},
  {label:'Reach a $100,000 yard valuation',done:yardValue(save)>=SALE_TARGET}
];}
export const canSell=save=>save.yardId!=='county'&&saleRequirements(save).every(r=>r.done);
export const countyStartingCash=save=>2500+Math.floor(yardValue(save)*.1);
export function sellYard(model,commit=()=>true){
  const s=model.save;if(!canSell(s)||model.state!=='waiting'||model.progressionDisabled)return false;
  const value=yardValue(s),cash=countyStartingCash(s);
  const next={...s,yardId:'county',yardSales:1,legacyBonus:1,soldYardValue:value,cash,speedLevel:2,powerLevel:2,handlingLevel:2,valueLevel:1,zoneLevel:0,magnetLevel:0,landOwned:true,balerOwned:true,workerOwned:true,depotOwned:false,craneOwned:false,craneCargo:0,craneTimer:0,craneMode:'hold',carriedScrap:0,carriedBaleValue:0,balerFeed:0,readyBales:[],workerPaused:false,scrapLoads:0,balerRemaining:0,balerPayout:0,jobActive:false,jobProgress:0,jobIndex:0,lastSeen:Date.now()};
  if(commit(next)===false)return false;Object.assign(s,next);
  model.vehicle=chooseVehicle(s);model.pressure=0;model.pendingReward=0;model.operations.analytics.yardId='county';model.event('yard_sold',{valuation:value,startingCash:cash});model.persist();model.emit('yard-changed');model.emit('spawn');model.announce();return true;
}
export function buySurplusPermit(model){const s=model.save;if(s.yardId!=='county'||s.surplusPermit||s.cash<25000||model.progressionDisabled)return false;s.cash-=25000;s.surplusPermit=true;model.event('surplus_access_unlocked');model.persist();model.refreshDelivery();return true;}
export function claimCountyCollection(model){const s=model.save;if(s.countyCollectionClaimed||!COUNTY_VEHICLES.every(v=>s.discoveries.includes(v.id)))return false;s.countyCollectionClaimed=true;s.cash+=7500;s.lifetimeCash+=7500;model.event('county_collection_completed');model.persist();return true;}
export function propertyGoal(save){
  if(save.yardId==='county'){
    if(!save.discoveries.includes('veh_servicevan'))return{title:'Welcome to County Yard.',detail:'A new service-vehicle delivery is waiting. All crushes earn 25% more.'};
    if(save.handlingLevel<3||save.powerLevel<4)return null;
    if(!save.discoveries.includes('veh_flatbed'))return{title:'The county has bigger jobs.',detail:'Bring the Works Flatbed to your press.'};
    if(!save.surplusPermit)return{title:'Open the surplus route.',detail:'County property office: $25,000 unlocks surplus deliveries.'};
    if(save.handlingLevel<4||save.powerLevel<7)return null;
    if(!save.discoveries.includes('veh_surplus'))return{title:'A special delivery.',detail:'Crush the fictional surplus utility carrier. No special controls needed.'};
    return{title:'A county-wide operation.',detail:save.countyCollectionClaimed?'Keep building your rare collection and county reputation.':'Your county collection is complete. Claim $7,500 at the property office.'};
  }
  if(canSell(save))return{title:'Your yard has an offer.',detail:'Open Yard value to review the move to County Yard. Selling is optional.'};
  if(save.depotOwned&&CONFIG.vehicles.every(v=>save.discoveries.includes(v.id)))return{title:'Build a business worth buying.',detail:`Yard value $${yardValue(save).toLocaleString()} / $100,000 · ${Math.min(save.jobsCompleted,5)}/5 contracts.`};
  return null;
}

