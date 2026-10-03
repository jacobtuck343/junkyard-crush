import {DISPLAY_SPOTS} from './fun-content.js?v=0.8.1';
export function decorLayout(save){return {...Object.fromEntries(save.decorSlots.map((id,i)=>[id,{...DISPLAY_SPOTS[i],rotation:0}]).filter(([id])=>id)),...save.decorPlacements};}
// Reserve the gate, machinery, workshop and a cross-yard hauling corridor.
export function placementError(save,id,p){
 if(!p||![p.x,p.z,p.rotation].every(Number.isFinite))return 'Choose a spot inside your yard.';
 if(p.x < -7.8 || p.x > (save.landOwned?16:7.5) || p.z < -7.5 || p.z > 8)return 'Keep it inside your unlocked land.';
 if((p.x < -4.2 && p.z < -2.5)||(Math.abs(p.x)<3&&p.z<-1.5)||Math.abs(p.z)<2.3||(p.x>8&&p.z>-5.5))return 'Keep gates, machines and hauling lanes clear.';
 for(const [other,q] of Object.entries(decorLayout(save)))if(other!==id&&Math.hypot(p.x-q.x,p.z-q.z)<2)return 'Leave a little space between decorations.';
 return '';
}
