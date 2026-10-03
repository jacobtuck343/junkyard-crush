import {normalizeSave,SAVE_KEY} from './save.js?v=0.8.0';
const MAX_CODE=40000;
// Detect accidental paste damage. This is an offline transfer format, not anti-cheat.
function checksum(text){let hash=2166136261;for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}return (hash>>>0).toString(16).padStart(8,'0');}
export function encodeSave(state){const json=JSON.stringify(normalizeSave(state)),bytes=new TextEncoder().encode(json);return 'JC1.'+btoa(String.fromCharCode(...bytes))+'.'+checksum(json);}
export function decodeSave(code){
 if(typeof code!=='string'||code.length>MAX_CODE)throw new Error('That save code is too large.');
 const parts=code.trim().split('.');if(parts.length!==3||parts[0]!=='JC1')throw new Error('Paste a Junkyard Crush save code beginning with JC1.');
 let json;try{json=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(parts[1]),c=>c.charCodeAt(0)));}catch{throw new Error('This save code is incomplete or damaged. Copy it again.');}
 if(checksum(json)!==parts[2])throw new Error('This save code is incomplete or damaged. Copy it again.');
 try{return normalizeSave(JSON.parse(json));}catch{throw new Error('This save needs a compatible game version or contains invalid progress.');}
}
export function restoreTransferredSave(store,current,candidate){
 if(store.readOnly)throw new Error('Saving is unavailable for this game version.');
 const next=normalizeSave(candidate),backup=JSON.stringify(normalizeSave(current));
 try{store.storage.setItem(SAVE_KEY+'.before-import',backup);}catch{throw new Error('Could not back up this yard. Nothing was replaced.');}
 if(!store.save(next))throw new Error('Could not save the imported yard. Nothing was replaced.');
 return next;
}
