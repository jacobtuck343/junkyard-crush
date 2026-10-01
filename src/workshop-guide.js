import {CONFIG,clamp} from './config.js?v=0.6.2';

export function installWorkshopGuide({yard,closeWorkshop}){
 const button=document.createElement('button');button.id='show-workshop';button.className='primary';button.textContent='SHOW ME THE WORKSHOP';
 document.querySelector('.workshop-heading').after(button);
 const marker=document.createElement('div');marker.id='workshop-guide';marker.hidden=true;marker.innerHTML='<span aria-hidden="true">➜</span><strong>WORKSHOP</strong>';document.body.append(marker);
 let active=false;
 button.onclick=()=>{active=true;closeWorkshop();document.getElementById('game').focus();};
 return{get active(){return active;},update(onPad,obscured){
  button.hidden=onPad;if(onPad)active=false;
  marker.hidden=!active||obscured;
  if(marker.hidden)return;
  const point=yard.project(CONFIG.upgrade.x,.2,CONFIG.upgrade.z),w=innerWidth,h=innerHeight;
  const x=clamp(point.x,85,w-85),y=clamp(point.y-55,Math.min(230,h*.43),h-210);
  marker.style.left=x+'px';marker.style.top=y+'px';
  marker.querySelector('span').style.transform=`rotate(${Math.atan2(point.y-y,point.x-x)}rad)`;
 }};
}
