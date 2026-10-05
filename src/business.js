import {ICECREAM,iceCreamPrice,serveIceCream} from './icecream.js?v=0.10.0';
import {BUSINESSES,businessById,businessRate,businessPlacementError} from './business-content.js?v=0.10.0';
export class TownBusinesses{
 constructor(model){this.model=model;this.save=model.save;}
 unlocked(id){const i=BUSINESSES.findIndex(b=>b.id===id);return i===0||(i>0&&this.save.businesses[BUSINESSES[i-1].id].open);}
 commit(name,data){this.model.event(name,data);this.model.persist();}
 buyLand(id){const d=businessById(id),s=this.save,b=s.businesses[id];if(this.model.progressionDisabled||!d||!b||b.owned||!this.unlocked(id)||s.cash<d.land)return false;s.cash-=d.land;b.owned=true;this.commit('business_land_bought',{id});return true;}
 build(id,pieceId){const d=businessById(id),p=d?.pieces.find(p=>p.id===pieceId),s=this.save,b=s.businesses[id];if(this.model.progressionDisabled||!p||!b?.owned||b.built.includes(pieceId)||s.cash<p.cash||s.buildParts<p.parts)return false;s.cash-=p.cash;s.buildParts-=p.parts;b.built.push(pieceId);this.commit('business_piece_built',{id,pieceId});return true;}
 place(id,pieceId,p){const b=this.save.businesses[id];if(this.model.progressionDisabled||!b?.built.includes(pieceId)||businessPlacementError(b,pieceId,p))return false;b.placements[pieceId]={x:p.x,z:p.z,rotation:p.rotation%(Math.PI*2)};this.commit('business_piece_placed',{id,pieceId});return true;}
 open(id){const d=businessById(id),b=this.save.businesses[id];if(this.model.progressionDisabled||!d||!b?.owned||b.open||!d.pieces.filter(p=>p.required).every(p=>b.placements[p.id]))return false;b.open=true;b.elapsed=0;this.commit('business_opened',{id});return true;}
 hire(){const b=this.save.businesses.icecream;if(this.model.progressionDisabled||!b.owned||b.staff||this.save.cash<ICECREAM.hireCost)return false;this.save.cash-=ICECREAM.hireCost;b.staff=true;this.commit('icecream_staff_hired',{});return true;}
 restock(amount){const b=this.save.businesses.icecream,cost=amount*ICECREAM.unitCost;if(this.model.progressionDisabled||!b.owned||![20,100].includes(amount)||b.stock+amount>ICECREAM.stockLimit||this.save.cash<cost)return false;this.save.cash-=cost;b.stock+=amount;this.commit('icecream_restocked',{amount,cost});return true;}
 tick(dt){if(this.model.progressionDisabled||!Number.isFinite(dt)||dt<=0)return;let payout=0;for(const d of BUSINESSES){const b=this.save.businesses[d.id];if(!b.open)continue;if(d.id==='icecream'){payout+=serveIceCream(b,dt,iceCreamPrice(d,b));continue;}b.elapsed+=dt;const minutes=Math.floor(b.elapsed/60);if(minutes){b.elapsed-=minutes*60;const amount=minutes*businessRate(d,b);b.earned+=amount;payout+=amount;}}if(payout){this.save.cash+=payout;this.save.lifetimeCash+=payout;this.commit('business_income',{amount:payout});}}
}
