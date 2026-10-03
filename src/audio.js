export class AudioFeedback {
  constructor(settings){this.settings=settings;this.ctx=null;this.previous=0;this.muted=false;}
  unlock(){
    if(!this.ctx){try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);this.musicBus=this.ctx.createGain();this.musicBus.connect(this.master);this.noise=this.ctx.createBuffer(1,this.ctx.sampleRate,this.ctx.sampleRate);const d=this.noise.getChannelData(0);let seed=17;for(let i=0;i<d.length;i++){seed=(seed*16807)%2147483647;d[i]=seed/1073741824-1;}}catch{return;}}
    this.ctx.resume().catch(()=>{});this.apply();
  }
  apply(){if(this.master)this.master.gain.setTargetAtTime(this.muted?0:this.settings.master,this.ctx.currentTime,.03);}
  tone(frequency,duration,volume=.3,delay=0,type='sine',end=frequency,bus='sfx'){
    if(!this.ctx||this.muted||this.settings[bus]<=0||this.settings.master<=0)return;const t=this.ctx.currentTime+delay,osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,t);osc.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(Math.max(.001,volume*this.settings[bus]),t+.012);gain.gain.exponentialRampToValueAtTime(.001,t+duration);osc.connect(gain);gain.connect(bus==='music'?this.musicBus:this.master);osc.start(t);osc.stop(t+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  burst(duration=.4,volume=.5,frequency=900,delay=0){
    if(!this.ctx||this.muted||this.settings.sfx<=0||this.settings.master<=0)return;const t=this.ctx.currentTime+delay,src=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain();src.buffer=this.noise;filter.type='lowpass';filter.frequency.setValueAtTime(frequency,t);filter.frequency.exponentialRampToValueAtTime(80,t+duration);gain.gain.setValueAtTime(Math.max(.001,volume*this.settings.sfx),t);gain.gain.exponentialRampToValueAtTime(.001,t+duration);src.connect(filter);filter.connect(gain);gain.connect(this.master);src.start(t);src.stop(t+duration);src.onended=()=>{src.disconnect();filter.disconnect();gain.disconnect();};
  }
  cue(name,perfect=false){
    if(this.musicBus)this.musicBus.gain.setTargetAtTime(name==='press'||name==='impact'?.15:1,this.ctx.currentTime,.08);
    let v=1+Math.random()*.08;if(Math.abs(v-this.previous)<.02)v+=.04;this.previous=v;
    if(name==='hook'||name==='dock'){this.tone(220*v,.12,.25,0,'triangle',75);this.burst(.1,.2,1300);}
    if(name==='press'){this.tone(65,.8,.14,0,'sawtooth',110);this.burst(.5,.08,450);}
    if(name==='impact'){this.tone(90*v,.55,.7,0,'sine',26);this.burst(.65,.8,1800);this.burst(.32,.3,4200,.08);this.tone(210,.3,.12,.13,'triangle',65);if(perfect)[392,523,784].forEach((f,i)=>this.tone(f,.32,.2,.08+i*.07));}
    if(name==='reward')[440,554,659,880].forEach((f,i)=>this.tone(f*v,.18,.17,i*.065));
    if(name==='upgrade'){this.burst(.2,.25,900);[262,330,392,523].forEach((f,i)=>this.tone(f,.35,.23,i*.08,'triangle'));}
  }
  silly(shape){const seed=[...shape].reduce((n,c)=>n+c.charCodeAt(0),0);[0,1,2].forEach(i=>this.tone(180+seed%260+i*120,.16,.16,.15+i*.12,'triangle',i%2?120:700));}
  strain(pressure){if(!this.ctx||pressure<.1)return;this.tone(60+pressure*110,.1,.045,0,'sawtooth');}
  music(){if(!this.ctx||this.muted||this.settings.music===0)return;[130.81,196,261.63].forEach((f,i)=>this.tone(f,2.8,.036,i*.2,'sine',f,'music'));}
}
