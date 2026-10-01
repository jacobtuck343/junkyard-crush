export function installCandyUI({save,pause}){
 const $=id=>document.getElementById(id);let lastCash=save.cash,lastLevel=save.speedLevel,menuOpen=true;
 const pill=document.createElement('div');pill.className='level-pill';pill.innerHTML='<span>PRESS LV</span><strong id="hud-level"></strong>';document.querySelector('header').append(pill);
 const banner=document.createElement('div');banner.id='level-banner';banner.setAttribute('role','status');document.body.append(banner);
 const menu=document.createElement('dialog');menu.id='start-menu';menu.innerHTML='<span class="menu-tag">BIG WRECKS. BIG CRUNCH.</span><h1>JUNKYARD<br><span>CRUSH</span></h1><p>Turn rusty rides into shiny rewards!</p><button id="play-game" class="primary">PLAY ▶</button><p class="menu-help">Move: WASD, arrows or drag<br>Crush: hold, then release in the green zone</p>';document.body.append(menu);
 $('play-game').onclick=()=>{menuOpen=false;menu.close();pause(false);$('game').focus();};
 menu.addEventListener('cancel',event=>{event.preventDefault();$('play-game').click();});
 const timers=new WeakMap();
 const animate=element=>{clearTimeout(timers.get(element));element.classList.remove('pulse');void element.offsetWidth;element.classList.add('pulse');timers.set(element,setTimeout(()=>element.classList.remove('pulse'),1800));};
 return{isOpen:()=>menuOpen,start(skip=false){menuOpen=!skip;if(!skip){pause(true);menu.showModal();}},update(){
   $('hud-level').textContent=save.speedLevel+1;
   if(save.cash>lastCash)animate(document.querySelector('.cash'));lastCash=save.cash;
   if(save.speedLevel>lastLevel){banner.textContent='PRESS LEVEL '+(save.speedLevel+1)+'!';animate(banner);}lastLevel=save.speedLevel;
 }};
}
