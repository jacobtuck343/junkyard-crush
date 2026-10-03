import {SPECIALS,DECORATIONS} from './fun-content.js?v=0.8.0';
import { CONFIG, ALL_VEHICLES, clamp } from './config.js?v=0.8.0';
export const SAVE_KEY = 'junkyard-crush.save.v6';
export const LEGACY_SAVE_KEY = 'junkyard-crush.save';
export function freshSave() { return { version: 6, decorations:[], decorSlots:Array(8).fill(''), specialDiscoveries:[], salvagedDelivery:-1, salvagedParts:0, craneOwned:false, craneCargo:0, craneTimer:0, craneMode:'hold', carriedScrap:0, carriedBaleValue:0, balerFeed:0, readyBales:[], workerPaused:false, yardId:'rustbucket', yardSales:0, legacyBonus:0, soldYardValue:0, surplusPermit:false, countyCollectionClaimed:false, cash: 0, balerOwned:false, workerOwned:false, depotOwned:false, scrapLoads:0, balerRemaining:0, balerPayout:0, balesSold:0, jobIndex:0, jobActive:false, jobProgress:0, jobsCompleted:0, lastSeen:0, collectionCounts:{}, rareDiscoveries:[], collectionClaimed:false, rareCollectionClaimed:false, speedLevel: 0, powerLevel:0, handlingLevel:0, valueLevel:0, zoneLevel:0, magnetLevel:0, landOwned:false, discoveries:[], crushed: 0, perfects: 0, lifetimeCash: 0, settings: { master: .7, music: .2, sfx: .8, shake: .55, reduced: false }, firsts: [] }; }
export function normalizeSave(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid save');
  if (![0,1,2,3,4,5,6].includes(raw.version)) throw new Error('Unsupported save version');
  const save = freshSave();
  const decorIds=new Set(DECORATIONS.map(d=>d.id)),specialIds=new Set(SPECIALS.map(d=>d.id));
  save.decorations=Array.isArray(raw.decorations)?[...new Set(raw.decorations.filter(id=>decorIds.has(id)))]:[];
  save.specialDiscoveries=Array.isArray(raw.specialDiscoveries)?[...new Set(raw.specialDiscoveries.filter(id=>specialIds.has(id)))]:[];
  const placed=new Set();save.decorSlots=Array.from({length:8},(_,i)=>{const id=raw.decorSlots?.[i];if(!save.decorations.includes(id)||placed.has(id))return '';placed.add(id);return id;});
  save.salvagedDelivery=Number.isSafeInteger(raw.salvagedDelivery)&&raw.salvagedDelivery>=0?raw.salvagedDelivery:-1;
  save.salvagedParts=Number.isSafeInteger(raw.salvagedParts)&&raw.salvagedParts>=0?raw.salvagedParts:0;
  save.craneOwned=raw.craneOwned===true;save.craneCargo=raw.craneCargo??0;save.craneTimer=raw.craneTimer??0;save.craneMode=raw.craneMode??'hold';
  if(!Number.isInteger(save.craneCargo)||save.craneCargo<0||save.craneCargo>3||!Number.isFinite(save.craneTimer)||save.craneTimer<0||save.craneTimer>2||!['hold','pickup','drop'].includes(save.craneMode)||(!save.craneOwned&&(save.craneCargo||save.craneTimer)))throw new Error('Invalid crane cargo');
  for(const key of ['carriedScrap','carriedBaleValue','balerFeed']){const value=raw[key]??0;if(!Number.isSafeInteger(value)||value<0)throw new Error('Invalid cargo '+key);save[key]=value;}
  if(save.carriedScrap>1||save.balerFeed>3||![0,180,225].includes(save.carriedBaleValue)||(save.carriedScrap&&save.carriedBaleValue))throw new Error('Invalid carried load');
  if(raw.readyBales!==undefined&&(!Array.isArray(raw.readyBales)||raw.readyBales.length>60||raw.readyBales.some(value=>![180,225].includes(value))))throw new Error('Invalid finished bales');
  save.readyBales=[...(raw.readyBales??[])];save.workerPaused=raw.workerPaused===true;
  save.yardId=raw.yardId==='county'?'county':'rustbucket';save.yardSales=save.yardId==='county'?1:0;save.legacyBonus=save.yardSales;
  save.soldYardValue=Number.isSafeInteger(raw.soldYardValue)&&raw.soldYardValue>=0?raw.soldYardValue:0;save.surplusPermit=save.yardId==='county'&&raw.surplusPermit===true;save.countyCollectionClaimed=raw.countyCollectionClaimed===true;
  for (const key of ['cash','speedLevel','powerLevel','handlingLevel','valueLevel','zoneLevel','magnetLevel','crushed','perfects','lifetimeCash']) {
    const value = raw[key] ?? 0;
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid save field '+key);
    save[key] = value;
  }
  save.speedLevel = clamp(save.speedLevel,0,CONFIG.upgradeMax);
  for(const upgrade of Object.values(CONFIG.upgrades))save[upgrade.field]=clamp(save[upgrade.field],0,upgrade.max);
  save.landOwned=raw.landOwned===true;
  for(const key of ['balerOwned','workerOwned','depotOwned','jobActive','collectionClaimed','rareCollectionClaimed'])save[key]=raw[key]===true;
  for(const key of ['scrapLoads','balerPayout','balesSold','jobIndex','jobProgress','jobsCompleted','lastSeen']){const value=raw[key]??0;if(!Number.isSafeInteger(value)||value<0)throw new Error('Invalid save field '+key);save[key]=value;}
  save.scrapLoads=clamp(save.scrapLoads,0,save.depotOwned?60:24);save.jobProgress=clamp(save.jobProgress,0,5);save.balerRemaining=raw.balerRemaining??0;
  if(!Number.isFinite(save.balerRemaining)||save.balerRemaining<0||save.balerRemaining>10)throw new Error('Invalid baler timer');
  if(save.balerRemaining===0)save.balerPayout=0;else if(![180,225].includes(save.balerPayout))throw new Error('Invalid baler payout');
  const knownIds=new Set(ALL_VEHICLES.map(v=>v.id));
  save.discoveries=Array.isArray(raw.discoveries)?[...new Set(raw.discoveries.filter(id=>knownIds.has(id)))]:[];
  if(raw.version<2){if(save.crushed>0)save.discoveries.push('veh_rustcompact');if(save.crushed>1)save.discoveries.push('veh_sedan');save.discoveries=[...new Set(save.discoveries)];}
  save.rareDiscoveries=Array.isArray(raw.rareDiscoveries)?[...new Set(raw.rareDiscoveries.filter(id=>knownIds.has(id)))]:[];save.collectionCounts={};
  for(const id of knownIds){const n=raw.collectionCounts?.[id]??(save.discoveries.includes(id)?1:0);if(!Number.isSafeInteger(n)||n<0)throw new Error('Invalid collection count');save.collectionCounts[id]=n;}
  save.firsts = Array.isArray(raw.firsts) ? [...new Set(raw.firsts.filter(v => typeof v === 'string'))].slice(0,100) : [];
  for (const key of ['master','music','sfx','shake']) if (Number.isFinite(raw.settings?.[key])) save.settings[key] = clamp(raw.settings[key],0,1);
  save.settings.reduced = raw.settings?.reduced === true;
  return save;
}
export class SaveStore {
  constructor(storage) { this.storage = storage; this.warning = ''; this.readOnly = false; }
  load() {
    for (const key of [SAVE_KEY, SAVE_KEY+'.backup', 'junkyard-crush.save.v5', 'junkyard-crush.save.v5.backup', 'junkyard-crush.save.v4', 'junkyard-crush.save.v4.backup', 'junkyard-crush.save.v3', 'junkyard-crush.save.v3.backup', 'junkyard-crush.save.v2', 'junkyard-crush.save.v2.backup', LEGACY_SAVE_KEY, LEGACY_SAVE_KEY+'.backup']) {
      try {
        const text = this.storage?.getItem(key);
        if (text) {
          const raw = JSON.parse(text);
          if (raw.version > 6) { this.readOnly = true; this.warning = 'This save needs a newer game version. Saving is paused to protect it.'; return freshSave(); }
          const save = normalizeSave(raw);
          if (key.endsWith('backup')) this.warning = 'Recovered your backup save.';
          else if(key===LEGACY_SAVE_KEY)this.warning='Phase 1 progress restored. Welcome to your growing yard.';
          return save;
        }
      } catch { this.warning = 'Save could not be read. Checking the backup.'; }
    }
    return freshSave();
  }
  save(state) {
    if (this.readOnly) return false;
    try {
      const previous = this.storage.getItem(SAVE_KEY);
      if (previous) { try { normalizeSave(JSON.parse(previous)); this.storage.setItem(SAVE_KEY+'.backup',previous); } catch {} }
      this.storage.setItem(SAVE_KEY,JSON.stringify(normalizeSave(state)));
      return true;
    } catch { this.warning = 'Browser storage is unavailable. Progress lasts for this visit only.'; return false; }
  }
  checkpoint(state){try{if(this.readOnly)return false;this.storage.setItem(SAVE_KEY+'.before-yard-sale',JSON.stringify(normalizeSave(state)));return true;}catch{this.warning='Could not save the pre-sale backup. The sale was not completed.';return false;}}
}





