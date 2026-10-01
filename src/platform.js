// Platform calls stay outside the economy and input layers. Basic Launch has no ad code.
export class Platform {
  constructor({sdk=null,storage=null}={}){this.sdk=sdk;this.storage=storage;this.playing=false;this.loaded=false;this.errors=[];}
  call(name){try{const result=this.sdk?.game?.[name]?.();result?.catch?.(error=>this.errors.push(String(error?.message??error)));}catch(error){this.errors.push(String(error?.message??error));}if(this.errors.length>20)this.errors.shift();}
  loadingStart(){this.call('loadingStart');}
  loadingStop(){if(this.loaded)return;this.loaded=true;this.call('loadingStop');}
  setPlaying(value){value=!!value;if(value===this.playing)return;this.playing=value;this.call(value?'gameplayStart':'gameplayStop');}
}
export async function initializePlatform({enabled=false,loadSDK,localStorage=null,timeoutMs=12000}={}){
  if(!enabled)return new Platform({storage:localStorage});
  let timer;
  try{
    const sdk=await Promise.race([(async()=>{const sdk=await loadSDK();await sdk.init();return sdk;})(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Could not connect to the game platform. Check your connection and try again.')),timeoutMs);})]);
    // Disabled SDK environments are ordinary offline/local builds.
    if(sdk.environment==='disabled')return new Platform({storage:localStorage});
    if(!sdk.data?.getItem||!sdk.data?.setItem)throw new Error('Platform saving is unavailable. Please enable Progress Save in the platform configuration.');
    // A read failure must not silently create a new local save over existing platform progress.
    sdk.data.getItem('junkyard-crush.save.v4');
    return new Platform({sdk,storage:{getItem:key=>sdk.data.getItem(key),setItem:(key,value)=>sdk.data.setItem(key,value)}});
  }finally{clearTimeout(timer);}
}
export let platform=new Platform();
export function setPlatform(value){platform=value;}
