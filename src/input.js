export class GameInput {
  constructor(canvas, pressButton, joystick) {
    this.keys=new Set(); this.drag=null; this.vector={x:0,y:0}; this.pressPointers=new Set(); this.enabled=true;
    const block = e => e.target.closest?.('button,input,dialog');
    window.addEventListener('keydown',e=>{ if(block(e)||e.ctrlKey||e.altKey||e.metaKey)return; if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault(); this.keys.add(e.code); });
    window.addEventListener('keyup',e=>this.keys.delete(e.code));
    window.addEventListener('blur',()=>this.clear());
    pressButton.addEventListener('pointerdown',e=>{ if(!this.enabled||(e.button!=null&&e.button!==0))return; e.preventDefault(); canvas.focus({preventScroll:true}); pressButton.setPointerCapture(e.pointerId); this.pressPointers.add(e.pointerId); });
    for(const type of ['pointerup','pointercancel','lostpointercapture']) pressButton.addEventListener(type,e=>this.pressPointers.delete(e.pointerId));
    canvas.addEventListener('pointerdown',e=>{
      if(!this.enabled||(e.button!=null&&e.button!==0))return;
      canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);
      if(e.pointerType==='mouse' && this.canPress?.()) {this.pressPointers.add(e.pointerId);return;}
      if(this.drag)return;
      this.drag={id:e.pointerId,x:e.clientX,y:e.clientY}; joystick.style.left=e.clientX+'px';joystick.style.top=e.clientY+'px';joystick.classList.add('visible');
    });
    canvas.addEventListener('pointermove',e=>{if(this.drag?.id!==e.pointerId)return; this.vector.x=Math.max(-1,Math.min(1,(e.clientX-this.drag.x)/55)); this.vector.y=Math.max(-1,Math.min(1,(e.clientY-this.drag.y)/55)); joystick.firstElementChild.style.transform=`translate(${this.vector.x*24}px,${this.vector.y*24}px)`; });
    for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{this.pressPointers.delete(e.pointerId);if(this.drag?.id===e.pointerId){this.drag=null;this.vector={x:0,y:0};joystick.classList.remove('visible');}});
    this.joystick=joystick;
  }
  clear(){this.keys.clear();this.pressPointers.clear();this.drag=null;this.vector={x:0,y:0};this.joystick?.classList.remove('visible');}
  get held(){return this.enabled&&(this.keys.has('Space')||this.pressPointers.size>0);}
  get movement(){
    if(!this.enabled)return{x:0,y:0};
    let x=this.vector.x+(this.keys.has('KeyD')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('KeyA')||this.keys.has('ArrowLeft')?1:0);
    let y=this.vector.y+(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0)-(this.keys.has('KeyW')||this.keys.has('ArrowUp')?1:0);
    const n=Math.hypot(x,y);return n>1?{x:x/n,y:y/n}:{x,y};
  }
}
