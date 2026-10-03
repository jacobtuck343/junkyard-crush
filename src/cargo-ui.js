import {OPERATIONS} from './operations.js?v=0.8.0';
export function installCargoUI({save,model,near,toast}){
 const panel=document.createElement('section');panel.id='cargo-panel';panel.hidden=true;panel.innerHTML='<strong></strong><button></button>';document.body.append(panel);
 const title=panel.querySelector('strong'),button=panel.querySelector('button');let action='';
 button.onclick=()=>{if(model.progressionDisabled||model.state!=='waiting')return;let done=false;
  if(action==='pickup'&&near(OPERATIONS.scrap))done=model.operations.pickScrap();
  if(action==='return'&&near(OPERATIONS.scrap))done=model.operations.returnScrap();
  if(action==='sell'&&near(OPERATIONS.shipping))done=model.operations.sellBale();
  if(done)toast(action==='pickup'?'Scrap loaded. Carry it to the baler.':action==='return'?'Scrap returned to the pickup pile.':'Bale delivered!');
 };
 return{update(){
  action='';const carrying=save.carriedScrap||save.carriedBaleValue;
  const visible=save.balerOwned&&model.state==='waiting'&&(carrying||near(OPERATIONS.scrap));
  panel.hidden=!visible;document.body.classList.toggle('cargo-context',!!visible);
  if(!visible)return;
  if(save.carriedBaleValue){title.textContent='BALE ON BOARD · $'+save.carriedBaleValue;button.textContent=near(OPERATIONS.shipping)?'SELL BALE':'TAKE TO YELLOW SHIPPING PAD';if(near(OPERATIONS.shipping))action='sell';}
  else if(save.carriedScrap){title.textContent='SCRAP ON BOARD · TAKE TO BALER';button.textContent=near(OPERATIONS.scrap)?'PUT SCRAP BACK':'TAKE TO THE BALER · EAST LOT';if(near(OPERATIONS.scrap))action='return';}
  else{title.textContent=save.scrapLoads+' SCRAP LOADS AT THE CRUSHER';button.textContent=save.scrapLoads?'PICK UP SCRAP':'CRUSH A VEHICLE FOR SCRAP';if(save.scrapLoads)action='pickup';}
  button.disabled=!action||model.progressionDisabled;
 }};
}
