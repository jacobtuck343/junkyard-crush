import {CONFIG,collectionPool} from './config.js?v=0.6.2';
import {PROJECTS,OPERATIONS,jobFor,jobReward,storageCapacity} from './operations.js?v=0.6.2';

export function phase3Goal(save){
  if(!save.discoveries.includes('veh_van'))return null;
  if(!save.jobsCompleted)return{title:'Meet Mara at the job board.',detail:save.jobActive?'Finish the job, then return for your bonus.':'Walk to the blue board near the office.',target:OPERATIONS.board};
  if(!save.balerOwned)return{title:'Give that scrap a second life.',detail:'Build a baler at the east-lot project pad. $6,000.',target:CONFIG.land};
  if(!save.workerOwned)return{title:'A helping hand.',detail:'Hire Jo at the project pad for $1,800.',target:CONFIG.land};
  if(!save.depotOwned)return{title:'A bigger operation.',detail:'Open the south depot for $7,500: more storage, better bales.',target:CONFIG.land};
  if(save.discoveries.length===6&&!save.collectionClaimed)return{title:'Six wrecks. One full book.',detail:'Open your salvage book to collect the $1,200 bonus.',target:CONFIG.spawn};
  if(save.discoveries.length===6&&!save.rareCollectionClaimed)return{title:'Find the rare six.',detail:save.rareDiscoveries.length===6?'Your rare set is complete. Claim $5,000 in the salvage book.':`${save.rareDiscoveries.length}/6 rare types found. Watch for blue diamonds.`,target:CONFIG.spawn};
  return null;
}

export function installPhase3UI({save,model,near,pause,toast}){
  const ops=model.operations,$=id=>document.getElementById(id);
  const panel=document.createElement('section');panel.id='operations-panel';panel.className='workshop operations-panel';panel.hidden=true;panel.setAttribute('aria-label','Yard operations');document.body.append(panel);
  const hint=document.createElement('div');hint.id='operations-hint';hint.className='operations-hint';document.body.append(hint);
  const button=document.createElement('button');button.id='collection-open';button.textContent='Salvage book';document.body.append(button);
  const book=document.createElement('dialog');book.className='collection-book';book.innerHTML='<span class="eyebrow">EVERY WRECK HAS A STORY</span><h2>Your salvage book.</h2><p>Discover the original six for a $1,200 bonus. Blue diamonds mark rare finds.</p><div class="collection-grid"></div><button id="collection-claim" class="primary">Claim collection bonus · $1,200</button><button id="rare-claim" class="primary">Rare set bonus · $5,000</button><button id="collection-close" class="primary">Back to the yard</button>';document.body.append(book);
  const dismiss=document.createElement('button');dismiss.className='icon-button';dismiss.textContent='×';dismiss.setAttribute('aria-label','Close salvage book');dismiss.style.float='right';book.prepend(dismiss);
  const close=()=>{book.close();pause(document.hidden);$('game').focus();};dismiss.onclick=close;$('collection-close').onclick=close;book.addEventListener('cancel',e=>{e.preventDefault();close();});
  button.onclick=()=>{renderBook();pause(true);book.showModal();dismiss.focus({preventScroll:true});book.scrollTop=0;};$('collection-claim').onclick=()=>{if(ops.claimCollection()){renderBook();toast('Six wrecks collected! +$1,200');}};
  $('rare-claim').onclick=()=>{if(ops.claimRareCollection()){renderBook();toast('Rare set complete! +$5,000');}};
  function renderBook(){book.querySelector('.collection-grid').innerHTML=collectionPool(save).map(v=>{const found=save.discoveries.includes(v.id);return `<article class="${found?'found':''}"><span>${save.rareDiscoveries.includes(v.id)?'◆ RARE FOUND':found?'DISCOVERED':'UNDISCOVERED'}</span><strong>${v.name}</strong><small>${found?'Recycled '+(save.collectionCounts[v.id]??1):'Lift '+v.weight.toLocaleString()+' kg · Power '+v.resistance}</small><small>${v.tags.slice(0,2).join(' · ')}</small></article>`;}).join('');$('collection-claim').disabled=save.collectionClaimed||!CONFIG.vehicles.every(v=>save.discoveries.includes(v.id));$('collection-claim').textContent=save.collectionClaimed?'Collection bonus claimed':'Claim collection bonus · $1,200';$('rare-claim').disabled=save.rareCollectionClaimed||!CONFIG.vehicles.every(v=>save.rareDiscoveries.includes(v.id));$('rare-claim').textContent=save.rareCollectionClaimed?'Rare set bonus claimed':`Rare set ${CONFIG.vehicles.filter(v=>save.rareDiscoveries.includes(v.id)).length}/6 · $5,000 bonus`;}
  let mode='',dismissed='';panel.onclick=e=>{const action=e.target.closest('button')?.dataset.action;if(!action)return;if(action==='close'){dismissed=panel.dataset.location;panel.hidden=true;$('game').focus();return;}
    if(action==='accept'&&near(OPERATIONS.board)){if(!ops.acceptJob())toast('This job needs matching deliveries. Upgrade handling/power and unlock its route, or choose another job.');}else if(action==='skip'&&near(OPERATIONS.board))ops.skipJob();else if(action==='claim'&&near(OPERATIONS.board))ops.claimJob();else if(action==='bale'&&near(OPERATIONS.baler))ops.startBaler();else if(PROJECTS[action]&&near(CONFIG.land))ops.purchase(action);mode='';$('game').focus();};
  return {isOpen:()=>book.open,update(){
    button.hidden=save.crushed===0;const location=!save.landOwned?'':near(OPERATIONS.board)?'board':near(CONFIG.land)?'projects':save.balerOwned&&near(OPERATIONS.baler)?'baler':'';if(location!==dismissed)dismissed='';const where=location===dismissed?'':location;panel.dataset.location=location;
    panel.hidden=!where;document.body.classList.toggle('operations-open',!!where);
    const job=jobFor(save),key=[where,save.cash,save.jobActive,save.jobProgress,save.jobIndex,save.balerOwned,save.workerOwned,save.depotOwned,save.scrapLoads,Math.ceil(save.balerRemaining)].join('|');
    if(key!==mode){mode=key;let html='';
      if(where==='board')html=`<h2>Mara’s job board</h2><p>${job.line}</p><strong>${job.name} · $${jobReward(save)}</strong><p>${save.jobActive?save.jobProgress+' / '+job.count+' completed':'No timer. Crush qualifying wrecks and return for your bonus.'}</p><button class="primary" data-action="${save.jobActive?'claim':'accept'}" ${save.jobActive&&save.jobProgress<job.count?'disabled':''}>${save.jobActive?'Collect payment':'Accept job'}</button><button class="skip-job" data-action="skip">Choose another job · no penalty</button>`;
      if(where==='projects')html='<div class="workshop-heading"><strong>GROW YOUR OPERATION</strong><span>Walk away to close</span></div><div class="upgrade-options">'+Object.entries(PROJECTS).map(([id,p])=>`<button data-action="${id}" ${save[id+'Owned']||!save[p.requires]||save.cash<p.cost?'disabled':''}><strong>${p.name}</strong><small>${p.detail}</small><b>${save[id+'Owned']?'BUILT':!save[p.requires]?'Build the baler first':'$'+p.cost.toLocaleString()}</b></button>`).join('')+'</div>';
      if(where==='baler')html=`<h2>The baler</h2><p>${save.scrapLoads} / ${storageCapacity(save)} scrap loads · ${save.balesSold} bales sold</p><p>${save.balerRemaining>0?'Compacting… '+Math.ceil(save.balerRemaining)+'s':save.workerOwned?'Jo loads automatically whenever 3 loads are ready.':'Crushing supplies scrap. Load 3 to make a bale.'}</p><button class="primary" data-action="bale" ${save.balerRemaining>0||save.scrapLoads<3?'disabled':''}>Load baler · +$${save.depotOwned?225:180}</button>`;
      panel.innerHTML=html?'<button class="operations-close" data-action="close" aria-label="Close yard operations">×</button>'+html:'';
    }
    hint.hidden=!save.landOwned||!!where||['ready','pressing','impact'].includes(model.state);
    hint.textContent=save.jobActive?`MARA’S JOB · ${save.jobProgress}/${job.count}${save.jobProgress>=job.count?' · Return to the blue board':''}`:save.workerOwned?`JO · ${save.scrapLoads} scrap loads · ${save.balesSold} bales sold`:'MARA’S JOB BOARD · beside the office';
  }};
}



