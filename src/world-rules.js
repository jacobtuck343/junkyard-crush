import {CONFIG} from './config.js?v=0.10.0';
import {BUSINESSES} from './business-content.js?v=0.10.0';
export const TOWN_PLOTS=BUSINESSES.map((d,i)=>({...d,x:(i%3)*22,z:i<3?28:50}));
export function yardAllowed(s,x,z){return x>=CONFIG.bounds.minX&&x<=(s.landOwned?17.5:8)&&z>=-6&&z<=(s.depotOwned?13.8:7)&&!(x<-9&&(z<1||z>6))&&!(Math.abs(x)<2.1&&z<-2.2)&&!(x<-5.1&&z<-4)&&!(s.balerOwned&&Math.abs(x-13)<1.6&&Math.abs(z+2)<1.2);}
export function walkAllowed(s,x,z){
 if(yardAllowed(s,x,z))return true;
 if(x>=-6&&x<=-2&&z>=6&&z<=19)return true;
 if(x>=-12&&x<=55&&((z>=15&&z<=19)||(z>=37&&z<=41)))return true;
 if(x>=-12&&x<=-9&&z>=15&&z<=41)return true;
 for(const p of TOWN_PLOTS){const dx=x-p.x,dz=z-p.z,b=s.businesses[p.id];if(Math.abs(dx)<1.3&&dz>=-11&&dz<=-7.4)return true;if(!b.owned)continue;const inside=Math.abs(dx)<8.1&&Math.abs(dz)<7.1,gate=Math.abs(dx)<1.3&&dz>=-8&&dz<=-6.5;if(!inside&&!gate)continue;let blocked=false;for(const q of Object.values(b.placements)){const a=dx-q.x,c=dz-q.z,lx=Math.cos(q.rotation)*a-Math.sin(q.rotation)*c,lz=Math.sin(q.rotation)*a+Math.cos(q.rotation)*c;if(Math.abs(lx)<1.7&&Math.abs(lz)<1.7){blocked=true;break;}}if(!blocked)return true;}
 return false;
}
export function nearbyBusiness(s,x,z){return TOWN_PLOTS.find(p=>Math.hypot(x-p.x,z-(p.z-9))<3||(s.businesses[p.id].owned&&Math.abs(x-p.x)<8.2&&Math.abs(z-p.z)<7.5));}
// Construction can occupy the visitor's current spot. The reserved center path
// provides a safe landing without moving the parked rig or changing any cargo.
export function safeWalkPosition(s,x,z){
 if(walkAllowed(s,x,z))return {x,z};
 const plot=TOWN_PLOTS.find(p=>Math.abs(x-p.x)<9&&Math.abs(z-p.z)<8);
 if(plot){const point={x:plot.x,z:Math.max(plot.z-7,Math.min(plot.z+6,z))};if(walkAllowed(s,point.x,point.z))return point;return{x:plot.x,z:plot.z-9};}
 return{x:CONFIG.playerStart.x,z:CONFIG.playerStart.z};
}
export function canLeaveRig(model){return model.state==='waiting'&&!model.save.carriedScrap&&!model.save.carriedBaleValue;}
export function parkVisitorPose(time,index){const t=(time+index*5)%36,z=t<18?-11+t*.85:4.3-(t-18)*.85;return{x:index%2?.4:-.4,z,heading:t<18?0:Math.PI};}
export function normalizeMobility(raw){if(!raw||typeof raw!=='object')return null;const keys=['x','z','rotation','rigX','rigZ','rigRotation'];if(!keys.every(k=>Number.isFinite(raw[k])))return null;if(raw.x< -13||raw.x>55||raw.z< -6||raw.z>58||raw.rigX< -12.7||raw.rigX>17.5||raw.rigZ< -6||raw.rigZ>13.8)return null;return Object.fromEntries([['onFoot',raw.onFoot===true],...keys.map(k=>[k,raw[k]])]);}
