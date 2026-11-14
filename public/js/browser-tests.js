const frame=document.querySelector('#app'),output=document.querySelector('#results');
const wait=()=>new Promise(r=>setTimeout(r,100));
async function until(fn){for(let i=0;i<80;i++){const v=fn();if(v)return v;await wait();}throw Error('Timed out waiting for UI');}
async function test(name,fn){try{await fn();output.textContent+=`PASS · ${name}\n`;}catch(e){output.textContent+=`FAIL · ${name}: ${e.message}\n`;}}
const doc=()=>frame.contentDocument;
async function nav(hash){frame.contentWindow.location.hash=hash;await until(()=>doc().querySelector(`nav a[href="#${hash}"].active`));}
document.querySelector('#run').onclick=async()=>{
 output.textContent='';const btn=document.querySelector('#run');btn.disabled=true;
 await test('IndexedDB boot and three seed creators',async()=>{await until(()=>doc().querySelector('nav a'));await nav('creators');if(doc().querySelectorAll('.watchlist-card').length!==3)throw Error('Expected three seeds in clean test database');});
 await test('Demo loads synthetic rankings and exhaustive tags',async()=>{await nav('settings');doc().querySelector('[data-action="demo"]').click();await until(()=>doc().querySelector('#source').textContent==='Demo mode');await nav('overview');if(doc().querySelectorAll('tbody tr').length!==10)throw Error('Expected 10 ranked Reels');await nav('hashtags');if(!doc().querySelector('[data-action="export-tags"]').textContent.includes('34'))throw Error('Expected all 34 unique demo hashtags');});
 await test('Saved notes persist after reload',async()=>{await nav('overview');doc().querySelector('[data-detail]').click();await until(()=>doc().querySelector('[data-save]'));doc().querySelector('[data-save]').click();await until(()=>doc().querySelector('#idea-form'));doc().querySelector('[name="note"]').value='Browser QA note';doc().querySelector('#idea-form').requestSubmit();await until(()=>!doc().querySelector('dialog').open);await nav('ideas');await until(()=>doc().body.textContent.includes('Browser QA note'));frame.contentWindow.location.reload();await until(()=>doc().querySelector('nav a'));await until(()=>doc().body.textContent.includes('Browser QA note'));});
 for(const width of [1440,768,390])await test(`Responsive containment at ${width}px`,async()=>{frame.style.width=width+'px';await nav('overview');await wait();if(doc().documentElement.scrollWidth>width+2)throw Error('Page overflows horizontally');await nav('hashtags');if(doc().documentElement.scrollWidth>width+2)throw Error('Hashtag page overflows; tables must scroll inside their container');});
 await test('All seven navigation sections render',async()=>{for(const name of ['overview','reels','hashtags','creators','ideas','history','settings']){await nav(name);if(!doc().querySelector('h1'))throw Error(`Missing heading on ${name}`);}});
 output.textContent+='\nManual checks still required: visual layout, keyboard focus, downloads, and live provider flow.\n';btn.disabled=false;
};
