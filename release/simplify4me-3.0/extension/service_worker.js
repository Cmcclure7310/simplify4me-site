'use strict';
const DEFAULTS={schemaVersion:3,strength:'clear',readerTheme:'midnight',readerFontScale:1,readerLineHeight:1.75,readerWidth:760,focusEnabled:false,lensEnabled:false,selectionBubble:true,alwaysHelpSites:[],alwaysHelpBehavior:'lens',customRules:[],ttsRate:1,ttsPitch:1,showReadingStats:true};
async function migrateAndSeed(){
  const old=await chrome.storage.local.get(null),patch={};
  for(const[k,v]of Object.entries(DEFAULTS))if(old[k]===undefined)patch[k]=v;
  if(old.strength===undefined){const x=old.simplificationLevel??old.level??old.mode;if(['light','clear','simple'].includes(x))patch.strength=x;else if(x==='basic')patch.strength='light';else if(['medium','normal'].includes(x))patch.strength='clear';else if(['strong','easy'].includes(x))patch.strength='simple';}
  if(old.customRules===undefined){const r=old.customReplacements??old.rules??old.replacements;if(Array.isArray(r))patch.customRules=r.map(x=>x&&typeof x==='object'?{from:String(x.from??x.original??x.word??''),to:String(x.to??x.replacement??x.simple??'')}:null).filter(x=>x?.from&&x?.to);else if(r&&typeof r==='object')patch.customRules=Object.entries(r).map(([from,to])=>({from,to:String(to)}));}
  if(old.alwaysHelpSites===undefined){const s=old.autoSites??old.trustedDomains??old.autoDomains??old.enabledSites??old.autoSimplifySites;if(Array.isArray(s))patch.alwaysHelpSites=s.filter(v=>typeof v==='string').map(v=>v.replace(/^https?:\/\//,'').split('/')[0]);}
  patch.schemaVersion=3;await chrome.storage.local.set(patch);
}
async function rebuildMenus(){await chrome.contextMenus.removeAll();chrome.contextMenus.create({id:'s4m-simplify',title:'Simplify selected text',contexts:['selection']});chrome.contextMenus.create({id:'s4m-quickread',title:'Open Quick Read',contexts:['page']});}
chrome.runtime.onInstalled.addListener(async details=>{try{await migrateAndSeed();await rebuildMenus();if(details.reason==='install')await chrome.tabs.create({url:chrome.runtime.getURL('onboarding/onboarding.html')});}catch(e){console.error('Simplify 4 Me install setup failed:',e);}});
chrome.runtime.onStartup.addListener(()=>rebuildMenus().catch(console.error));
chrome.contextMenus.onClicked.addListener((info,tab)=>{if(!tab?.id)return;if(info.menuItemId==='s4m-simplify')chrome.tabs.sendMessage(tab.id,{type:'S4M_SIMPLIFY_CONTEXT_SELECTION',text:info.selectionText||''}).catch(()=>{});if(info.menuItemId==='s4m-quickread')chrome.tabs.sendMessage(tab.id,{type:'S4M_QUICK_READ'}).catch(()=>{});});
chrome.commands.onCommand.addListener(async command=>{const[tab]=await chrome.tabs.query({active:true,currentWindow:true});if(!tab?.id)return;const map={'simplify-selection':'S4M_SIMPLIFY','quick-read':'S4M_QUICK_READ','focus-mode':'S4M_TOGGLE_FOCUS'};if(map[command])chrome.tabs.sendMessage(tab.id,{type:map[command]}).catch(()=>{});});
