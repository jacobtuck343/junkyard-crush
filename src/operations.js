import {CONFIG,vehiclePool} from './config.js?v=0.10.0';

export const PROJECTS={
  baler:{name:'Build the baler',cost:6000,detail:'Haul 3 loads, make a bale, ship it for $180.',requires:'landOwned'},
  worker:{name:'Hire Jo',cost:1800,detail:'Automate scrap hauling, baling and shipping.',requires:'balerOwned'},
  depot:{name:'Open the south depot',cost:7500,detail:'60-load storage · bales worth 25% more.',requires:'balerOwned'}
};
export const JOBS=[
  {id:'cleanup',name:'Clear the backlog',line:'Mara: “Three wrecks. A little breathing room.”',count:3,reward:180,tag:null},
  {id:'precision',name:'Clean work',line:'Mara: “Two Perfect Crushes. Make them count.”',count:2,reward:240,perfect:true},
  {id:'commercial',name:'Fleet clearance',line:'Mara: “Three commercial wrecks, off the road.”',count:3,reward:360,tag:'Commercial'}
];
export const COUNTY_JOBS=[
 {id:'county_fleet',name:'County fleet renewal',line:'Mara: “Four county vehicles. Keep the works moving.”',count:4,reward:800,tag:'County'},
 {id:'county_precision',name:'Workshop standard',line:'Mara: “Three Perfect Crushes. You’ve earned bigger jobs.”',count:3,reward:900,perfect:true},
 {id:'county_surplus',name:'Surplus clearance',line:'Mara: “Two utility carriers. Retired equipment, fresh steel.”',count:2,reward:2000,tag:'Surplus'}
];
export const jobFor=save=>(save.yardId==='county'?COUNTY_JOBS:JOBS)[save.jobIndex%3];
export const jobReward=save=>Math.round(jobFor(save).reward*(1+Math.min(3,Math.floor(save.jobsCompleted/3))*.25));
export const storageCapacity=save=>save.depotOwned?60:24;
export const OPERATIONS={board:{x:-5.6,z:-1.4,radius:1.7},baler:{x:13,z:-2,radius:2.2},scrap:{x:3,z:1,radius:1.8},shipping:{x:14,z:5.5,radius:2},cycleSeconds:10,offlineSeconds:120};

export class YardOperations{
  constructor(save,analytics,persist=()=>{},emit=()=>{}){this.save=save;this.analytics=analytics;this.persist=persist;this.emit=emit;}
  event(name,data={}){this.analytics.emit(name,data);}
  purchase(kind){const p=PROJECTS[kind],s=this.save,field=kind+'Owned';if(!p||!s[p.requires]||s[field]||s.cash<p.cost)return false;s.cash-=p.cost;s[field]=true;this.event(kind==='worker'?'first_worker':kind==='baler'?'first_machine_unlock':'south_depot_unlocked',{cost:p.cost});this.persist();this.emit('project',{name:p.name});return true;}
  acceptJob(){const s=this.save;if(!s.landOwned||s.jobActive)return false;const job=jobFor(s);if(job.tag&&!vehiclePool(s).some(v=>v.tags.includes(job.tag)&&v.weight<=CONFIG.handling[s.handlingLevel].kg&&v.resistance<=s.powerLevel+1))return false;s.jobActive=true;s.jobProgress=0;this.event('contract_started',{id:job.id});if(!s.jobsCompleted)this.event('first_contract_started');this.persist();return true;}
  skipJob(){const s=this.save;if(!s.landOwned)return false;s.jobIndex++;s.jobActive=false;s.jobProgress=0;this.event('contract_declined');this.persist();return true;}
  onCrush(vehicle,perfect){const s=this.save;s.collectionCounts[vehicle.id]=(s.collectionCounts[vehicle.id]??0)+1;if(vehicle.rarity==='Rare'&&!s.rareDiscoveries.includes(vehicle.id)){s.rareDiscoveries.push(vehicle.id);this.emit('rare-found',{name:vehicle.name});}if(s.landOwned)s.scrapLoads=Math.min(storageCapacity(s),s.scrapLoads+1);
    const job=jobFor(s);if(s.jobActive&&s.jobProgress<job.count&&(!job.perfect||perfect)&&(!job.tag||vehicle.tags.includes(job.tag))){s.jobProgress++;if(s.jobProgress===job.count)this.emit('job-ready');}}
  claimJob(){const s=this.save,job=jobFor(s);if(!s.jobActive||s.jobProgress<job.count)return false;const amount=jobReward(s);s.cash+=amount;s.lifetimeCash+=amount;s.jobsCompleted++;s.jobIndex++;s.jobActive=false;s.jobProgress=0;this.event('contract_completed',{id:job.id,amount});if(s.jobsCompleted===1)this.event('first_contract_completed');this.persist();this.emit('job-paid',{amount});return true;}
  claimCollection(){const s=this.save;if(s.collectionClaimed||!CONFIG.vehicles.every(v=>s.discoveries.includes(v.id)))return false;s.collectionClaimed=true;s.cash+=1200;s.lifetimeCash+=1200;this.event('collection_completed',{amount:1200});this.persist();return true;}
  claimRareCollection(){const s=this.save;if(s.rareCollectionClaimed||!CONFIG.vehicles.every(v=>s.rareDiscoveries.includes(v.id)))return false;s.rareCollectionClaimed=true;s.cash+=5000;s.lifetimeCash+=5000;this.event('rare_collection_completed',{amount:5000});this.persist();return true;}
  get automated(){return this.save.workerOwned&&!this.save.workerPaused;}
  toggleWorker(){if(!this.save.workerOwned)return false;this.save.workerPaused=!this.save.workerPaused;this.persist();return true;}
  pickScrap(){const s=this.save;if(!s.balerOwned||s.carriedScrap||s.carriedBaleValue||s.scrapLoads<1)return false;s.scrapLoads--;s.carriedScrap=1;this.persist();return true;}
  returnScrap(){const s=this.save;if(!s.carriedScrap||s.scrapLoads>=storageCapacity(s))return false;s.carriedScrap=0;s.scrapLoads++;this.persist();return true;}
  loadScrap(){const s=this.save;if(!s.balerOwned||!s.carriedScrap||s.balerRemaining>0||s.balerFeed>=3||s.readyBales.length>=60)return false;s.carriedScrap=0;s.balerFeed++;if(s.balerFeed===3)this.startBaler();else this.persist();return true;}
  pickBale(){const s=this.save;if(s.carriedScrap||s.carriedBaleValue||!s.readyBales.length)return false;s.carriedBaleValue=s.readyBales.shift();this.persist();return true;}
  sellBale(){const s=this.save;if(!s.carriedBaleValue)return false;const amount=s.carriedBaleValue;s.carriedBaleValue=0;this.payBale(amount);return true;}
  payBale(amount){const s=this.save;s.cash+=amount;s.lifetimeCash+=amount;s.balesSold++;this.event('bale_sold',{amount});this.persist();this.emit('bale',{amount});}
  startBaler(){const s=this.save;if(!s.balerOwned||s.balerRemaining>0||s.readyBales.length>=60)return false;const needed=3-s.balerFeed;if(needed>0){if(!this.automated||s.scrapLoads<needed)return false;s.scrapLoads-=needed;}s.balerFeed=0;s.balerRemaining=OPERATIONS.cycleSeconds;s.balerPayout=s.depotOwned?225:180;this.event('baler_started');this.persist();return true;}
  tick(seconds){if(!Number.isFinite(seconds)||seconds<0)return 0;const s=this.save;let left=Math.min(seconds,OPERATIONS.offlineSeconds),earned=0;
    if(this.automated)while(s.readyBales.length){const amount=s.readyBales.shift();this.payBale(amount);earned+=amount;}
    do{if(s.balerRemaining<=0&&this.automated)this.startBaler();if(s.balerRemaining<=0)break;const step=Math.min(left,s.balerRemaining);s.balerRemaining=Math.max(0,s.balerRemaining-step);left-=step;if(s.balerRemaining===0){const amount=s.balerPayout;s.balerPayout=0;if(this.automated){this.payBale(amount);earned+=amount;}else{s.readyBales.push(amount);this.persist();this.emit('bale-ready');}}}while(left>0);return earned;}
  resume(now=Date.now()){const s=this.save,elapsed=s.lastSeen>0?Math.max(0,(now-s.lastSeen)/1000):0;s.lastSeen=now;const earned=this.tick(Math.min(elapsed,OPERATIONS.offlineSeconds));this.persist();if(earned>0)this.event('return_reward',{amount:earned});return earned;}
}


