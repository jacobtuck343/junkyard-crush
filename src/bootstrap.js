import {initializePlatform,setPlatform} from './platform.js?v=0.8.0';
const loading=document.getElementById('loading');
async function loadSDK(){
  if(window.CrazyGames?.SDK)return window.CrazyGames.SDK;
  await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://sdk.crazygames.com/crazygames-sdk-v3.js';script.onload=resolve;script.onerror=()=>reject(new Error('The game platform could not load. Check your connection and try again.'));document.head.append(script);});
  if(!window.CrazyGames?.SDK)throw new Error('The game platform could not initialize. Please try again.');
  return window.CrazyGames.SDK;
}
try{
  let storage;try{storage=localStorage;}catch{}
  const adapter=await initializePlatform({enabled:document.querySelector('meta[name="game-platform"]')?.content==='crazygames',loadSDK,localStorage:storage});
  setPlatform(adapter);adapter.loadingStart();
  await import('./main.js?v=0.8.0');adapter.loadingStop();
}catch(error){document.getElementById('fatal').hidden=false;document.getElementById('fatal-detail').textContent=error.message;console.error(error);}
finally{loading.hidden=true;}
