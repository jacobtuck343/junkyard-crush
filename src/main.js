import {installFunArt} from './fun-art.js?v=0.9.0';
import {installFunUI} from './fun-ui.js?v=0.9.0';
import {GATE} from './delivery-gate.js?v=0.9.0';
import {installCargoUI} from './cargo-ui.js?v=0.9.0';
import {crushEffort,pressDuration} from './config.js?v=0.9.0';
import {installWorkshopGuide} from './workshop-guide.js?v=0.9.0';
import {installSaveTransfer} from './save-transfer-ui.js?v=0.9.0';
import {platform} from './platform.js?v=0.9.0';
import {CONFIG,clamp,upgradeCost,perfectBounds,validateContent,costFor,capacityFor,rewardFor,collectionPool} from './config.js?v=0.9.0';
import {nextGoal,goalCost,nextVehicle} from './progression.js?v=0.9.0';
import {SaveStore} from './save.js?v=0.9.0';
import {Analytics} from './analytics.js?v=0.9.0';
import {GameModel} from './model.js?v=0.9.0';
import {GameInput} from './input.js?v=0.9.0';
import {AudioFeedback} from './audio.js?v=0.9.0';
import {YardScene} from './scene.js?v=0.9.0';
import {PerformanceMonitor} from './performance.js?v=0.9.0';
import {installPhase3UI,phase3Goal} from './phase3-ui.js?v=0.9.0';
import {installPropertyUI} from './property-ui.js?v=0.9.0';
import {propertyGoal} from './property.js?v=0.9.0';
import {installCandyUI} from './candy-ui.js?v=0.9.0';
const $=id=>document.getElementById(id);
try{boot();}catch(error){$('fatal').hidden=false;$('fatal-detail').textContent='A browser with WebGL 2 support is required. '+error.message;console.error(error);}
function boot(){
  validateContent();let storage=platform.storage;
  const store=new SaveStore(storage),save=store.load(),analytics=new Analytics();
  analytics.yardId=save.yardId;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)save.settings.reduced=true;
  const audio=new AudioFeedback(save.settings),yard=new YardScene($('game'),save.settings),input=new GameInput($('game'),$('press-button'),$('joystick'));
  let toastUntil=0,celebrationUntil=0,cashDeltaUntil=0,displayCash=save.cash,paused=false,upgradeDwell=0,upgradeArmed=true,moved=false,strainClock=0,musicClock=0,sessionEnded=false;
  let towDirection={x:0,z:1},previous=performance.now();const velocity={x:0,z:0};
  let replacingSave=false;const persist=()=>{if(replacingSave)return;save.lastSeen=Date.now();if(!store.save(save))toast(store.warning);};
  const model=new GameModel(save,analytics,persist,(name,data={})=>{
    if(['hook','dock','press','reward','upgrade'].includes(name))audio.cue(name);
    if(name==='hook'){yard.pop();yard.advanceGateQueue(save,model.vehicle);toast('Picked up! The line is moving. Bring this wreck to the press.');}
    if(name==='dock'){input.clear();toast('Hold Space or CRUSH. Release in the green zone.');}
    if(name==='impact'){audio.cue('impact',data.perfect);yard.burst(data.perfect);if(model.vehicle.special){funArt.burst(model.vehicle);audio.silly(model.vehicle.specialShape);toast(model.vehicle.specialLine);yard.particles.forEach((p,i)=>{p.mesh.material=yard.mat(['#FFD23F','#FF91CF','#69E6FF','#7CD35B'][i%4]);});}$('celebration-title').textContent=data.perfect?'PERFECT CRUSH!':'GOOD CRUSH.';$('celebration-value').textContent='+$'+data.payout;celebrationUntil=performance.now()+1600;}
    if(name==='reward'){yard.reward();$('cash-delta').textContent='+$'+data.amount;cashDeltaUntil=performance.now()+1400;}
    if(name==='upgrade'){toast(data.name+' upgraded!');yard.shake=.12;yard.pop();}
    if(name==='project'){toast(data.name+' — ready to work!');audio.cue('upgrade');yard.shake=.15;}
    if(name==='job-ready'){toast('Mara’s job is complete. Return to the blue board.');audio.cue('upgrade');}
    if(name==='job-paid'){toast('Mara: “Good work.” +$'+data.amount);audio.cue('reward');}
    if(name==='rare-found')toast('Rare discovery: '+data.name+' added to your salvage book.');
    if(name==='bale'){$('cash-delta').textContent='BALE +$'+data.amount;cashDeltaUntil=performance.now()+1800;audio.cue('reward');}
    if(name==='bale-ready'){toast('Bale ready! Pick it up at the baler and take it to shipping.');audio.cue('upgrade');}
    if(name==='discovery'){toast(`DISCOVERED: ${data.name} · ${data.count}/${collectionPool(save).length} wrecks`);audio.cue('upgrade');}
    if(name==='yard-changed'){yard.player.position.set(CONFIG.playerStart.x,0,CONFIG.playerStart.z);input.clear();velocity.x=velocity.z=0;displayCash=save.cash;audio.cue('upgrade');$('celebration-title').textContent='YOUR NEXT CHAPTER';$('celebration-value').textContent='COUNTY YARD';celebrationUntil=performance.now()+3500;}
    if(name==='rare'){toast('◆ RARE SALVAGE! This wreck pays 2.5×.');audio.cue('upgrade');}
    if(name==='land'){toast('EAST LOT OPEN! Your yard just got bigger.');audio.cue('upgrade');yard.shake=.2;$('celebration-title').textContent='ROOM TO GROW!';$('celebration-value').textContent='EAST LOT OPEN';celebrationUntil=performance.now()+2400;}
    if(name==='blocked')toast(data.kind==='power'?`CRUSHER POWER ${data.vehicle.resistance} REQUIRED`:`HANDLING CAPACITY ${data.vehicle.weight.toLocaleString()} kg REQUIRED`);
    if(name==='silly')toast('SPECIAL DELIVERY: '+data.name);
    if(name==='salvaged'){toast('Building part saved! +1 PART · +$'+data.amount);audio.cue('reward');yard.pop();}
    if(name==='business_income')toast('Your businesses earned +$'+data.amount+'!');
    if(name==='crane-delivered')toast('Crane delivered '+data.loads+' loads!');
    if(name==='spawn')yard.spawn(model.vehicle,save);
  });
  yard.spawn(model.vehicle,save);input.canPress=()=>['ready','pressing'].includes(model.state);
  analytics.emit('game_loaded',{loadMs:Math.round(performance.now())});
  if(store.warning)toast(store.warning);
  function toast(message){$('toast').textContent=message;toastUntil=performance.now()+3500;}
  function pause(value,report=true){if(report){platform.setPlaying(!value);if(!value)analytics.emit('gameplay_started');}paused=value;previous=performance.now();input.enabled=!value;input.clear();velocity.x=velocity.z=0;audio.muted=value;audio.apply();}
  const settings=$('settings');$('settings-open').onclick=()=>{pause(true);settings.showModal();};
  const close=()=>{settings.close();pause(document.hidden);$('game').focus({preventScroll:true});};$('settings-close').onclick=close;$('resume').onclick=close;settings.addEventListener('cancel',e=>{e.preventDefault();close();});
  for(const key of ['master','music','sfx','shake','reduced']){const control=$(key);if(key==='reduced')control.checked=save.settings[key];else control.value=save.settings[key];control.addEventListener('input',()=>{save.settings[key]=key==='reduced'?control.checked:Number(control.value);audio.apply();if(key==='reduced')yard.renderer.setPixelRatio(Math.min(devicePixelRatio,save.settings.reduced?1:1.6));});control.addEventListener('change',()=>{analytics.emit('settings_changed',{setting:key,value:save.settings[key]});persist();});}
  addEventListener('pointerdown',()=>audio.unlock());addEventListener('keydown',()=>audio.unlock());addEventListener('touchend',()=>audio.unlock(),{passive:true});
  const near=point=>Math.hypot(yard.player.position.x-point.x,yard.player.position.z-point.z)<=point.radius;
  const buy=kind=>{if(near(CONFIG.upgrade))model.buyUpgrade(kind);$('game').focus({preventScroll:true});};
  $('upgrade-buy').onclick=()=>buy(nextGoal(save).kind==='land'?'speed':nextGoal(save).kind??'speed');
  for(const [kind,upgrade] of Object.entries(CONFIG.upgrades)){const button=document.createElement('button');button.type='button';button.id='buy-'+kind;button.innerHTML=`<span>${upgrade.icon}</span><strong>${upgrade.name}</strong><small>${upgrade.detail}</small><b></b>`;button.onclick=()=>buy(kind);$('upgrade-options').append(button);}
  $('land-buy').onclick=()=>{if(near(CONFIG.land))model.buyLand();$('game').focus({preventScroll:true});};
  installSaveTransfer({save,store,settle:()=>model.settleReward(),reload:()=>{replacingSave=true;location.reload();}});
  const phase3=installPhase3UI({save,model,near,pause,toast});
  const cargo=installCargoUI({save,model,near,toast});
  const yardStatus=document.createElement('div');yardStatus.id='yard-status';document.body.append(yardStatus);yardStatus.append($('delivery-card'),$('operations-hint'));
  const property=installPropertyUI({save,model,store,pause,toast});
  const funArt=installFunArt(yard),funUI=installFunUI({model,save,near,pause,toast,yard});
  const candy=installCandyUI({save,pause});let workshopPinned=false,workshopDismissed=false;
  const upgradesButton=document.createElement('button');upgradesButton.id='upgrades-open';upgradesButton.textContent='UPGRADES';document.body.append(upgradesButton);upgradesButton.onclick=()=>{workshopPinned=true;workshopDismissed=false;};
  const workshopClose=document.createElement('button');workshopClose.textContent='×';workshopClose.setAttribute('aria-label','Close upgrades');document.querySelector('.workshop-heading').append(workshopClose);workshopClose.onclick=()=>{workshopPinned=false;workshopDismissed=true;$('game').focus();};
  const workshopGuide=installWorkshopGuide({yard,closeWorkshop:()=>{workshopPinned=false;workshopDismissed=true;}});
  let skipMenu=false;
  candy.start(skipMenu);if(skipMenu)pause(false);
  const returned=model.operations.resume();model.announce();if(returned)toast('Welcome back. Your baler earned $'+returned+' from stored scrap.');
  function endSession(){if(!sessionEnded){analytics.emit('session_end',{cash:save.cash,crushed:save.crushed,perfects:save.perfects});sessionEnded=true;model.settleReward();save.lastSeen=Date.now();persist();}}
  document.addEventListener('visibilitychange',()=>{if(document.hidden){endSession();pause(true,false);}else{sessionEnded=false;const earned=model.operations.resume();if(earned)toast('Jo kept the baler busy. +$'+earned);pause(settings.open||phase3.isOpen()||property.isOpen()||candy.isOpen()||funUI.isOpen(),false);}});addEventListener('pagehide',endSession);
  const perf=new PerformanceMonitor(performance.memory?.usedJSHeapSize??null);
  function frame(now){requestAnimationFrame(frame);const raw=(now-previous)/1000;previous=now;if(paused)return;const dt=Math.min(raw,.05);analytics.tick(dt);
    const movement=input.movement;const moving=Math.hypot(movement.x,movement.y)>.1;
    if(moving&&!moved){moved=true;model.first('movement_started');}
    // Screen-relative movement follows the fixed camera's ground-plane axes.
    const dx=movement.x*.826+movement.y*.563,dz=-movement.x*.563+movement.y*.826;
    const speed=CONFIG.speed*(model.state==='towing'?1-clamp(model.vehicle.weight/4000,0,.35):1);
    velocity.x+=(dx*speed-velocity.x)*(1-Math.exp(-CONFIG.acceleration*dt));velocity.z+=(dz*speed-velocity.z)*(1-Math.exp(-CONFIG.acceleration*dt));
    const player=yard.player.position;const nextX=clamp(player.x+velocity.x*dt,CONFIG.bounds.minX,save.landOwned?CONFIG.land.expandedMaxX:CONFIG.bounds.maxX),nextZ=clamp(player.z+velocity.z*dt,CONFIG.bounds.minZ,save.depotOwned?13.8:CONFIG.bounds.maxZ);
    // Keep the mechanic outside the bed and the office while permitting a generous delivery zone.
    const blocked=(x,z)=>(x<-9&&(z<GATE.openingMinZ||z>GATE.openingMaxZ))||(Math.abs(x)<2.1&&z<-2.2)||(x<-5.1&&z<-4)||(save.balerOwned&&Math.abs(x-13)<1.6&&Math.abs(z+2)<1.2);
    if(!blocked(nextX,player.z))player.x=nextX;
    if(!blocked(player.x,nextZ))player.z=nextZ;
    if(moving){yard.player.rotation.y=Math.atan2(dx,dz);towDirection={x:-dx,z:-dz};}
    if(model.state==='waiting'&&Math.hypot(player.x-yard.vehicle.position.x,player.z-yard.vehicle.position.z)<CONFIG.attachRadius)model.attach();
    if(model.state==='towing'){
      const follow=1-Math.exp(-CONFIG.towSpring*dt),offset=save.handlingLevel>0?-2.1:1.7,targetX=player.x+towDirection.x*offset,targetZ=player.z+towDirection.z*offset;
      yard.vehicle.position.x+=(targetX-yard.vehicle.position.x)*follow;yard.vehicle.position.z+=(targetZ-yard.vehicle.position.z)*follow;
      yard.vehicle.rotation.y=yard.player.rotation.y;
      if(Math.hypot(player.x-CONFIG.crusher.x,player.z-CONFIG.crusher.z)<CONFIG.crusher.radius+.05)model.dock();
    }
    model.tick(dt,input.held);
    const onPad=Math.hypot(player.x-CONFIG.upgrade.x,player.z-CONFIG.upgrade.z)<CONFIG.upgrade.radius;
    if(onPad&&upgradeArmed&&save.cash>=upgradeCost(save.speedLevel)&&save.speedLevel===0){upgradeDwell+=dt;if(upgradeDwell>.85&&model.buyUpgrade()){upgradeArmed=false;upgradeDwell=0;}}else if(!onPad){upgradeDwell=0;upgradeArmed=true;}
    strainClock+=dt;if(strainClock>.18){strainClock=0;if(model.state==='pressing')audio.strain(model.pressure);}
    musicClock+=dt;if(musicClock>5){musicClock=0;if(model.state!=='pressing'&&model.state!=='impact')audio.music();}
    funArt.update(model,dt);const renderStart=performance.now();yard.update(dt,model,moving);
    perf.record(raw,{cpuMs:performance.now()-renderStart,calls:yard.renderer.info.render.calls,triangles:yard.renderer.info.render.triangles,heap:performance.memory?.usedJSHeapSize??null,state:model.state});
    displayCash+=(save.cash-displayCash)*(1-Math.exp(-dt*10));$('cash').textContent='$'+Math.round(displayCash).toLocaleString();
    $('cash-delta').style.opacity=now<cashDeltaUntil?'1':'0';$('toast').classList.toggle('show',now<toastUntil);$('celebration').classList.toggle('show',now<celebrationUntil);
    $('crush-count').textContent=save.crushed;$('perfect-count').textContent=save.perfects;$('discovery-count').textContent=save.discoveries.length+'/'+collectionPool(save).length;
    document.querySelector('.brand small').textContent=save.yardId==='county'?'COUNTY YARD · YARD 02 · +25% LEGACY':'RUSTBUCKET SALVAGE · YARD 01';
    const ready=model.state==='ready'||model.state==='pressing';$('gauge').hidden=!ready;$('press-button').classList.toggle('available',ready);$('press-button').disabled=!ready;
    const zone=perfectBounds(save.speedLevel,model.vehicle.weight,save.zoneLevel),zoneElement=document.querySelector('.perfect-zone');zoneElement.style.left=zone.start*100+'%';zoneElement.style.width=(zone.end-zone.start)*100+'%';
    $('gauge-fill').style.width=model.pressure*100+'%';$('gauge-needle').style.left=Math.min(99,model.pressure*100)+'%';$('gauge-percent').textContent=Math.round(model.pressure*100)+'%';$('gauge-title').textContent=model.pressure>=zone.start&&model.pressure<=zone.end?'RELEASE NOW!':model.state==='pressing'?'BUILDING PRESSURE…':'HOLD TO PRESS';
    $('machine-status').textContent=ready?'HOLD → RELEASE → CRUNCH':model.state==='impact'?'THAT’S THE GOOD STUFF':`POWER ${save.powerLevel+1} · SPEED ${save.speedLevel+1}`;
    const goal=nextGoal(save),cost=goalCost(save,goal),onLand=near(CONFIG.land);
    $('speed-level').textContent='';$('upgrade-price').textContent=onPad?'CHOOSE YOUR UPGRADE':'WALK HERE TO UPGRADE';$('upgrade-buy').hidden=true;
    if(!onPad)workshopDismissed=false;const showWorkshop=workshopPinned||(onPad&&!workshopDismissed);$('workshop').hidden=!showWorkshop;$('touch-hint').hidden=onPad;document.body.classList.toggle('workshop-open',showWorkshop);document.querySelector('#workshop .workshop-heading>span').textContent=onPad?'You’re at the workshop. Choose an upgrade.':'Buy upgrades at the green pad. Tap below to find it.';
    yardStatus.hidden=ready||model.state==='impact';
    for(const [kind,upgrade]of Object.entries(CONFIG.upgrades)){const button=$('buy-'+kind),level=save[upgrade.field],max=level>=upgrade.max,price=costFor(kind,level);button.hidden=save.speedLevel===0&&save.crushed<2&&kind!=='speed';button.disabled=!onPad||max||save.cash<price||['pressing','impact'].includes(model.state);button.querySelector('b').textContent=max?'MAX':`$${price.toLocaleString()} · LV ${level+1}`;button.classList.toggle('recommended',goal.kind===kind);}
    $('land-label').hidden=save.landOwned||!(goal.kind==='land'||onLand);$('land-buy').hidden=!onLand;$('land-buy').disabled=save.cash<CONFIG.land.cost;$('land-buy').textContent=save.cash<CONFIG.land.cost?`$${CONFIG.land.cost-save.cash} TO GO`:'Expand the yard · $400';
    $('upgrade-label').hidden=onPad||(goal.kind==='land'&&!onPad);$('delivery-card').hidden=onPad||ready||model.state==='impact';$('delivery-name').textContent=model.vehicle.name;$('delivery-rarity').textContent=model.vehicle.rarity==='Rare'?'◆ RARE SALVAGE · 2.5×':'ON THE LOT';$('delivery-card').classList.toggle('rare',model.vehicle.rarity==='Rare');$('delivery-spec').textContent=`${model.vehicle.weight.toLocaleString()} kg · $${rewardFor(model.vehicle,false,save.valueLevel,save.legacyBonus)} base`;
    const upcoming=nextVehicle(save);$('next-vehicle').textContent=upcoming&&upcoming.id!==model.vehicle.id?`NEXT: ${upcoming.name} · Power ${upcoming.resistance}${upcoming.land?' · East lot':''}`:`${capacityFor(save).name} · ${capacityFor(save).kg.toLocaleString()} kg lift`;
    const machine=yard.project(0,4.4,CONFIG.crusher.z),pad=yard.project(CONFIG.upgrade.x,.6,CONFIG.upgrade.z);
    positionLabel('machine-label',machine);positionLabel('upgrade-label',pad);positionLabel('land-label',yard.project(CONFIG.land.x,.6,CONFIG.land.z));
    let step=1,title='Pick up a wreck at the gate.',detail='Head left to the gate. Drive close to the front car to collect it.';
    if(model.state==='towing'){step=2;title='Bring it to the press.';detail='Follow the arrows. Pull up to the glowing ring.';}
    else if(ready){step=3;title='Make some scrap.';detail='Hold. Build pressure. Release in the green zone.';}
    else if(save.crushed>0){step=4;const next=propertyGoal(save)??(save.yardId==='county'?null:phase3Goal(save));title=next?.title??goal.title;detail=next?.detail??goal.detail+(cost?(save.cash>=cost?' Ready to buy.':' $'+(cost-save.cash)+' to go.'):'');}
    if(model.state==='waiting'&&save.crushed>0)detail+=' Next wreck: west pickup gate.';
    if(workshopGuide.active&&!onPad&&!ready&&model.state!=='impact'){title='Head to the green workshop pad.';detail='Follow the blue WORKSHOP arrow. Upgrades open when you arrive.';}
    $('objective').textContent=title;$('objective-detail').textContent=detail;$('objective-step').textContent='0'+step;$('objective-fill').style.width=step*25+'%';
    if(save.carriedScrap){$('objective').textContent='Load the baler.';$('objective-detail').textContent='Carry this scrap to the baler in the east lot. Three loads make a bale.';}
    if(save.carriedBaleValue){$('objective').textContent='Ship your finished bale.';$('objective-detail').textContent='Take it to the yellow SHIPPING pad in the east lot for payment.';}
    const effort=crushEffort(model.vehicle,save.powerLevel);$('gauge-title').textContent=model.pressure>=zone.start&&model.pressure<=zone.end?'RELEASE NOW!':model.state==='pressing'?(effort>.8?'HEAVY LOAD · PRESS STRAINING':effort>.55?'TOUGH WRECK · KEEP PRESSING':'CRUSHING · KEEP PRESSING'):`HOLD TO PRESS · ${pressDuration(save.speedLevel,model.vehicle.weight).toFixed(1)}s FULL STROKE`;
    $('gauge').classList.toggle('heavy-load',effort>.8);
    funUI.update();phase3.update();cargo.update();property.update();candy.update();workshopGuide.update(onPad,showWorkshop||document.body.classList.contains('operations-open')||ready||model.state==='impact'||!!save.carriedScrap||!!save.carriedBaleValue);
  }
  function positionLabel(id,p){const el=$(id),margin=el.offsetWidth/2+8,minTop=id==='machine-label'?225:innerWidth<600?195:150;el.style.left=clamp(p.x,margin,innerWidth-margin)+'px';el.style.top=clamp(p.y,minTop,innerHeight-200)+'px';}
  requestAnimationFrame(frame);
  // Development tools are removed by the production build, including their module.
}





