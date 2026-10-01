import { CONFIG, clamp, pressDuration, perfectBounds, rewardFor, costFor, capacityFor, canHandle, canCrush, chooseVehicle } from './config.js?v=0.7.0';
import {YardOperations} from './operations.js?v=0.7.0';
export class GameModel {
  constructor(save, analytics, persist = () => {}, emit = () => {}) {
    this.save = save; this.analytics = analytics; this.persist = persist; this.emit = emit;
    this.state = 'waiting'; this.pressure = 0; this.timer = 0; this.vehicle = chooseVehicle(save);this.seenGates=new Set();
    this.pendingReward = 0; this.progressionDisabled = false;
    this.operations=new YardOperations(save,analytics,persist,emit);
  }
  event(name, data={}) { this.analytics.emit(name,{ speedLevel:this.save.speedLevel, cash:this.save.cash, vehicleId:this.vehicle.id,...data }); this.emit(name,data); }
  first(name) { if (!this.save.firsts.includes(name)) { this.save.firsts.push(name); this.event(name); } }
  blocked(kind){const key=kind+this.vehicle.id;if(!this.seenGates.has(key)){this.seenGates.add(key);this.event(kind+'_required_seen',{required:kind==='power'?this.vehicle.resistance:this.vehicle.weight});this.emit('blocked',{kind,vehicle:this.vehicle});}return false;}
  attach() { if (this.state !== 'waiting'||this.save.carriedScrap||this.save.carriedBaleValue) return false; if(!canHandle(this.save,this.vehicle))return this.blocked('capacity');this.state='towing'; this.first('first_vehicle_grabbed'); this.emit('hook'); return true; }
  dock() { if(this.state !== 'towing') return false;if(!canCrush(this.save,this.vehicle))return this.blocked('power');this.state='ready'; this.pressure=0; this.emit('dock'); return true; }
  announce(){if(this.vehicle.rarity==='Rare'){this.first('first_rare_vehicle');this.event('rare_delivery');this.emit('rare');this.persist();}}
  refreshDelivery(){if(this.state!=='waiting')return;const next=chooseVehicle(this.save);if(next.id!==this.vehicle.id||next.rarity!==this.vehicle.rarity){this.vehicle=next;this.emit('spawn');this.announce();}}
  tick(dt, held) {
    if(!this.progressionDisabled)this.operations.tick(dt);
    if (this.state === 'ready' && held) { this.state='pressing'; this.emit('press'); }
    if (this.state === 'pressing') {
      if (!held) this.finish();
      else { this.pressure=clamp(this.pressure+dt/pressDuration(this.save.speedLevel,this.vehicle.weight),0,1); if(this.pressure>=1) this.finish(); }
    }
    if(this.state==='impact' || this.state==='collecting') {
      this.timer-=dt;
      if(this.timer<=0 && this.state==='impact') this.collect();
      else if(this.timer<=0 && this.state==='collecting') { this.state='waiting'; this.pressure=0; this.vehicle=chooseVehicle(this.save); this.emit('spawn');this.announce(); }
    }
  }
  finish() {
    if(this.state!=='pressing') return;
    const zone=perfectBounds(this.save.speedLevel,this.vehicle.weight,this.save.zoneLevel);
    const perfect=this.pressure>=zone.start && this.pressure<=zone.end;
    this.pendingReward=rewardFor(this.vehicle,perfect,this.save.valueLevel,this.save.legacyBonus); this.state='impact'; this.timer=CONFIG.rewardDelay/(1+.5*this.save.magnetLevel);
    this.lastPerfect=perfect; this.event(perfect?'crush_perfect':'crush_normal',{pressure:this.pressure,payout:this.pendingReward});
    this.first('first_crush'); this.emit('impact',{perfect,payout:this.pendingReward});
  }
  collect() {
    if(this.state!=='impact')return;
    const amount=this.pendingReward; this.pendingReward=0;
    this.save.crushed++; if(this.lastPerfect)this.save.perfects++;
    if(!this.save.discoveries.includes(this.vehicle.id)){this.save.discoveries.push(this.vehicle.id);this.event('vehicle_discovered',{count:this.save.discoveries.length});this.emit('discovery',{name:this.vehicle.name,count:this.save.discoveries.length});}
    if(!this.progressionDisabled) { this.save.cash+=amount; this.save.lifetimeCash+=amount;this.operations.onCrush(this.vehicle,this.lastPerfect); }
    this.first('first_cash_collected'); if(this.save.crushed===2)this.first('second_vehicle_crushed');
    this.state='collecting'; this.timer=CONFIG.respawnDelay; this.persist(); this.emit('reward',{amount});
  }
  buyUpgrade(kind='speed') {
    if(['pressing','impact'].includes(this.state))return false;
    const upgrade=CONFIG.upgrades[kind];if(!upgrade)return false;
    const level=this.save[upgrade.field],cost=costFor(kind,level);
    if(this.progressionDisabled || level>=upgrade.max || this.save.cash<cost)return false;
    this.save.cash-=cost; this.save[upgrade.field]++; this.first('first_upgrade'); this.event('upgrade_purchased',{id:kind,level:level+1,cost}); this.persist(); this.emit('upgrade',{kind,name:kind==='handling'?capacityFor(this.save).name:upgrade.name});this.refreshDelivery(); return true;
  }
  buyLand(){if(this.progressionDisabled||this.save.landOwned||this.save.cash<CONFIG.land.cost)return false;this.save.cash-=CONFIG.land.cost;this.save.landOwned=true;this.first('first_land_purchase');this.persist();this.emit('land');this.refreshDelivery();return true;}
  settleReward() { if(this.state==='impact')this.collect(); }
}

