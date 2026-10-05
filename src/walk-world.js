import {CONFIG} from './config.js?v=0.10.0';
import {walkAllowed,yardAllowed,nearbyBusiness,canLeaveRig,safeWalkPosition} from './world-rules.js?v=0.10.0';
import {installTownWorld} from './town-world.js?v=0.10.0';
export function installWalkWorld({yard,model,save,input,stop,toast,visit}){
 const art=installTownWorld(yard),rigButton=document.createElement('button'),action=document.createElement('button'),notice=document.createElement('button');rigButton.id='rig-action';action.id='town-action';notice.id='gate-notice';notice.setAttribute('aria-label','Show directions to waiting cars');document.body.append(rigButton,action,notice);
 let foot=save.handlingLevel===0||save.mobility?.onFoot===true,hadRig=save.handlingLevel>0,reminder=0,arrived=-1,route='town';
 const parked=()=>yard.forklift.position;
 function detach(x,z,rotation){yard.scene.attach(yard.forklift);yard.forklift.position.set(x,0,z);yard.forklift.rotation.y=rotation;}
 if(save.mobility){const m=save.mobility;if(foot&&walkAllowed(save,m.x,m.z))yard.player.position.set(m.x,0,m.z);else if(!foot&&yardAllowed(save,m.x,m.z))yard.player.position.set(m.x,0,m.z);yard.player.rotation.y=m.rotation;if(foot&&hadRig){const valid=yardAllowed(save,m.rigX,m.rigZ);detach(valid?m.rigX:CONFIG.playerStart.x,valid?m.rigZ:CONFIG.playerStart.z,m.rigRotation);}}
 else if(foot&&hadRig)detach(CONFIG.playerStart.x,CONFIG.playerStart.z,0);
 function snapshot(){const p=yard.player.position,r=!hadRig?CONFIG.playerStart:foot?parked():p;save.mobility={onFoot:foot,x:p.x,z:p.z,rotation:yard.player.rotation.y,rigX:r.x,rigZ:r.z,rigRotation:foot&&hadRig?yard.forklift.rotation.y:yard.player.rotation.y};}
 function toggle(){if(!hadRig)return;if(!foot){if(!canLeaveRig(model)){toast('Finish this delivery and unload cargo before parking.');return;}const p=yard.player.position,candidates=[[1.8,0],[-1.8,0],[0,1.8],[0,-1.8]],offset=candidates.find(([x,z])=>walkAllowed(save,p.x+x,p.z+z));if(!offset){toast('Move to an open spot before getting out.');return;}detach(p.x,p.z,yard.player.rotation.y);p.x+=offset[0];p.z+=offset[1];foot=true;toast('On foot! Follow MAIN STREET at the south exit.');}else{if(Math.hypot(yard.player.position.x-parked().x,yard.player.position.z-parked().z)>2.8){route='rig';toast('Walk back to your parked forklift to get in.');return;}yard.player.position.copy(parked());yard.player.rotation.y=yard.forklift.rotation.y;yard.player.add(yard.forklift);yard.forklift.position.set(0,0,0);yard.forklift.rotation.set(0,0,0);foot=false;toast('Back in the forklift. Cars are waiting at the west gate.');}stop();input.clear();snapshot();model.persist();document.getElementById('game').focus();}
 function interact(){const p=yard.player.position,site=foot&&nearbyBusiness(save,p.x,p.z);if(site&&model.state==='waiting'&&!save.carriedScrap&&!save.carriedBaleValue){route='town';stop();visit(site.id);}else toggle();}
 rigButton.onclick=toggle;action.onclick=interact;notice.onclick=()=>{route='gate';toast('Cars are waiting at the west pickup gate. Follow Main Street back to the south yard entrance.');document.getElementById('game').focus();};
 addEventListener('keydown',e=>{if(e.code!=='KeyE'||e.repeat||!input.enabled||e.target.closest?.('button,input,select,dialog'))return;e.preventDefault();interact();});
 function describe(){const p=yard.player.position,site=foot&&nearbyBusiness(save,p.x,p.z),distance=foot&&hadRig?Math.hypot(p.x-parked().x,p.z-parked().z):0; if(yard.exploring){document.getElementById('objective').textContent=site?site.name:'Main Street · ON FOOT';document.getElementById('objective-detail').textContent=route==='gate'?'Follow the street west, then north to the yard. Pickup gate is on the yard’s west side.':route==='rig'?'Your forklift is '+Math.ceil(distance)+'m away, back in the yard.':site?'Walk around your business. Press MANAGE or E to build, hire or restock.':'Walk through a signed entrance to visit a business. The white paths stay clear for visitors.';}}
 return{snapshot,toggle,describe,isFoot:()=>foot,canTow:()=>!hadRig||!foot,allowed(x,z){if(!foot)return yardAllowed(save,x,z);if(model.state!=='waiting'||save.carriedScrap||save.carriedBaleValue)return yardAllowed(save,x,z);return walkAllowed(save,x,z);},reset(){foot=save.handlingLevel===0;hadRig=save.handlingLevel>0;yard.player.add(yard.forklift);yard.forklift.position.set(0,0,0);yard.forklift.rotation.set(0,0,0);save.mobility=null;},update(dt){
 if(!hadRig&&save.handlingLevel>0){hadRig=true;foot=false;}
 if(foot&&canLeaveRig(model)){const p=yard.player.position,q=safeWalkPosition(save,p.x,p.z);if(q.x!==p.x||q.z!==p.z){p.set(q.x,0,q.z);stop();snapshot();toast('Moved onto the path to make room for your building.');}}
 yard.onFoot=foot;yard.exploring=foot&&yard.player.position.z>7.1;
 const p=yard.player.position,site=foot&&nearbyBusiness(save,p.x,p.z),distance=foot&&hadRig?Math.hypot(p.x-parked().x,p.z-parked().z):0;
 rigButton.hidden=!hadRig;rigButton.textContent=!foot?'EXIT RIG · E':distance<=2.8?'ENTER RIG · E':'RIG · '+Math.ceil(distance)+'m';rigButton.disabled=!foot&&!canLeaveRig(model);
 action.hidden=!site||model.state!=='waiting'||!!save.carriedScrap||!!save.carriedBaleValue;action.textContent=site?'MANAGE '+site.kind+' · E':'';
 const waiting=yard.gateQueue.length+(model.state==='waiting'?1:0);notice.textContent=waiting+' CARS WAITING';notice.hidden=save.crushed<1;notice.classList.toggle('gate-alert',reminder>40);
 reminder+=dt;if(yard.exploring&&waiting&&reminder>45){reminder=0;toast(waiting+' cars waiting at the west gate. No rush—your line stays ready.');}
 if(arrived!==save.crushed){if(arrived>=0)notice.classList.add('new-car');arrived=save.crushed;setTimeout(()=>notice.classList.remove('new-car'),1500);}
 document.body.classList.toggle('in-town',yard.exploring);
 describe();
 art.update(model,dt);
 }};
}
