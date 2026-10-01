import {normalizeSave,SAVE_KEY} from './save.js?v=0.7.0';
import {CONFIG} from './config.js?v=0.7.0';
import {encodeSave,decodeSave,restoreTransferredSave} from './save-transfer.js?v=0.7.0';
export function installSaveTransfer({save,store,settle,reload}){
 const settings=document.getElementById('settings'),button=document.createElement('button');button.className='primary';button.textContent='MOVE / BACK UP SAVE';settings.insertBefore(button,document.getElementById('resume'));
 const version=document.createElement('p');version.className='settings-note';version.textContent='BUILD '+CONFIG.gameVersion+' · Saves stay in this browser';settings.append(version);
 const dialog=document.createElement('dialog');dialog.className='save-transfer';dialog.setAttribute('aria-label','Move your save');dialog.innerHTML='<div class="dialog-title"><h2>Take your yard with you.</h2><button class="icon-button" data-action="close" aria-label="Close save transfer">×</button></div><p>Copy a save code, send it to yourself, and paste it here on your other device or game link.</p><button class="primary" data-action="export">Make my save code</button><label for="save-code">Save code</label><textarea id="save-code" rows="4" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="JC1.…"></textarea><button class="primary" data-action="copy">Copy code</button><button class="primary" data-action="review">Review imported yard</button><button class="primary" data-action="undo">Review previous yard backup</button><div class="import-review" hidden><p></p><button class="primary" data-action="restore">Replace this yard</button><button class="primary" data-action="cancel">Keep this yard</button></div><p class="transfer-status" role="status"></p>';document.body.append(dialog);
 const code=dialog.querySelector('textarea'),status=dialog.querySelector('.transfer-status'),review=dialog.querySelector('.import-review');let candidate=null;
 button.onclick=()=>{settle();status.textContent='';review.hidden=true;candidate=null;dialog.showModal();};
 code.addEventListener('input',()=>{candidate=null;review.hidden=true;});
 dialog.addEventListener('cancel',event=>{event.preventDefault();dialog.close();button.focus();});
 dialog.onclick=async event=>{const action=event.target.closest('button')?.dataset.action;if(!action)return;
  try{
   if(action==='close'){dialog.close();button.focus();}
   if(action==='export'){code.value=encodeSave(save);candidate=null;review.hidden=true;status.textContent='Your yard is ready to copy. Keep this code somewhere safe.';}
   if(action==='copy'){if(!code.value)throw new Error('Make a save code first.');try{await navigator.clipboard.writeText(code.value);status.textContent='Copied! Paste this code on your other device.';}catch{code.focus();code.select();status.textContent='Code selected. Use your device’s Copy command.';}}
   if(action==='review'){candidate=decodeSave(code.value);review.hidden=false;review.querySelector('p').textContent=`Import ${candidate.yardId==='county'?'County Yard':'Rustbucket Yard'} with $${candidate.cash.toLocaleString()}, ${candidate.crushed} crushes and ${candidate.discoveries.length} discoveries? This replaces the yard in this browser. A backup of your current yard is kept on this device.`;status.textContent='Review the yard above before replacing your progress.';}
   if(action==='undo'){const backup=store.storage?.getItem(SAVE_KEY+'.before-import');if(!backup)throw new Error('No previous imported-yard backup exists on this device.');candidate=normalizeSave(JSON.parse(backup));code.value=encodeSave(candidate);review.hidden=false;review.querySelector('p').textContent='Restore your previous '+(candidate.yardId==='county'?'County Yard':'Rustbucket Yard')+' with $'+candidate.cash.toLocaleString()+' and '+candidate.crushed+' crushes? Your current yard will become the new backup.';status.textContent='Review the backup before restoring it.';}
   if(action==='cancel'){candidate=null;review.hidden=true;status.textContent='Your current yard is unchanged.';}
   if(action==='restore'){if(!candidate)throw new Error('Review a save code first.');restoreTransferredSave(store,save,candidate);reload();}
  }catch(error){status.textContent=error.message;}
 };
}

