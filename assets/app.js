(function () {
  'use strict';
  var resources = window.MBRN_RESOURCES || [];
  var STORE = 'mbrn-clicks-v1';
  var categories = ['Transcription & Epigenetics','Expression & Single Cell','Proteins & Interactions','Genome Editing & Molecular Tools','Genomes & Browsers','Enrichment & Pathways','3D Genome & Imaging','Condensates & Disorder','Cancer & Screens','Data Repositories & Analysis'];
  var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  var featuredIds = ['gtex','jaspar','encode','uniprot','depmap','enrichr'];
  var state = { query:'', category:'All resources', letters:new Set(), clicks:{}, expanded:new Set(), focused:false, active:0 };
  var input = document.getElementById('mbrn-search');
  var suggestions = document.getElementById('mbrn-suggestions');
  var featured = document.querySelector('.featured');
  var content = document.getElementById('resource-content');
  var title = document.getElementById('index-title');
  var resultCount = document.getElementById('result-count');
  var chips = document.querySelector('.chips');
  var alphabet = document.getElementById('alphabet');
  var clearLetters = document.getElementById('clear-letters');
  var alphaStatus = document.getElementById('alpha-status');

  try { state.clicks = JSON.parse(localStorage.getItem(STORE) || '{}'); } catch { state.clicks = {}; }
  document.querySelectorAll('[data-resource-count]').forEach(function (node) { node.textContent = resources.length; });

  function esc(value) { return String(value).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function norm(value) { return String(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9+&-]+/g,' ').trim(); }
  function score(resource, raw) {
    var query=norm(raw); if(!query) return 1;
    var fields=[norm(resource.name),norm(resource.label),norm(resource.category),norm(resource.summary),norm(resource.details),norm(resource.tags.join(' '))];
    var all=fields.join(' '), tokens=Array.from(new Set(query.split(/\s+/).filter(Boolean))), total=0, matched=0;
    if(fields[0]===query)total+=320; if(fields[0].indexOf(query)===0)total+=220; if(fields[0].includes(query))total+=160;
    [100,85,70,60,45].forEach(function(w,i){if(fields[i+1]&&fields[i+1].includes(query))total+=w;});
    tokens.forEach(function(token){if(!all.includes(token))return;matched++;[55,34,28,22,18,12].forEach(function(w,i){if(fields[i].includes(token))total+=w;});});
    if(matched===tokens.length)total+=80; return matched?total:0;
  }
  function matchesInitial(resource) { return !state.letters.size||state.letters.has(resource.name.trim().charAt(0).toUpperCase()); }
  function ranked() {
    return resources.map(function(r){return {r:r,s:score(r,state.query)};}).filter(function(x){return (state.category==='All resources'||x.r.category===state.category)&&matchesInitial(x.r)&&x.s>0;}).sort(function(a,b){return norm(state.query)?b.s-a.s||a.r.name.localeCompare(b.r.name):a.r.name.localeCompare(b.r.name);});
  }
  function refreshCount(id) { var value=state.clicks[id]||0;document.querySelectorAll('[data-card="'+id+'"] .clicks').forEach(function(node){node.innerHTML='<i></i>'+value+' '+(value===1?'click':'clicks');}); }
  function saveClick(id) { state.clicks[id]=(state.clicks[id]||0)+1; try{localStorage.setItem(STORE,JSON.stringify(state.clicks));}catch{} refreshCount(id); }
  function arrow(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"></path></svg>';}
  function card(resource) {
    var open=state.expanded.has(resource.id), clicks=state.clicks[resource.id]||0;
    return '<article class="resource-card'+(open?' open':'')+'" data-card="'+esc(resource.id)+'"><div class="card-row"><a class="card-link" href="'+esc(resource.url)+'" target="_blank" rel="noopener noreferrer" data-visit="'+esc(resource.id)+'"><span class="label">'+esc(resource.label)+'</span><span class="name">'+esc(resource.name)+arrow()+'</span><span class="summary">'+esc(resource.summary)+'</span></a><div class="card-tools"><span class="clicks"><i></i>'+clicks+' '+(clicks===1?'click':'clicks')+'</span><button type="button" data-toggle="'+esc(resource.id)+'" aria-expanded="'+open+'" aria-label="'+(open?'Hide':'Show')+' details for '+esc(resource.name)+'"><svg class="'+(open?'up':'')+'" viewBox="0 0 24 24"><path d="m8 10 4 4 4-4"></path></svg></button></div></div><div class="detail-shell" data-open="'+open+'"><div class="detail"><p>'+esc(resource.details)+'</p><div>'+resource.tags.slice(0,6).map(function(t){return '<span>'+esc(t)+'</span>';}).join('')+'</div></div></div></article>';
  }
  function bindCards(scope) {
    scope.querySelectorAll('[data-visit]').forEach(function(link){link.addEventListener('click',function(){saveClick(link.dataset.visit);});});
    scope.querySelectorAll('[data-toggle]').forEach(function(button){button.addEventListener('click',function(){var id=button.dataset.toggle;if(state.expanded.has(id)){state.expanded.delete(id);}else{state.expanded.add(id);}render();});});
  }
  function renderAlphabet(){var selected=Array.from(state.letters).sort();alphabet.innerHTML=letters.map(function(letter){var active=state.letters.has(letter);return '<button type="button" class="'+(active?'active':'')+'" data-letter="'+letter+'" aria-pressed="'+active+'" aria-label="'+(active?'Remove':'Show')+' resources starting with '+letter+'">'+letter+'</button>';}).join('');alphaStatus.textContent=selected.length?'Selected: '+selected.join(', '):'All initials';clearLetters.disabled=!selected.length;alphabet.querySelectorAll('button').forEach(function(button){button.addEventListener('click',function(){var letter=button.dataset.letter;if(state.letters.has(letter)){state.letters.delete(letter);}else{state.letters.add(letter);}state.active=0;render();});});}
  function renderChips(){chips.innerHTML=['All resources'].concat(categories).map(function(c){return '<button type="button" class="'+(state.category===c?'active':'')+'" data-category="'+esc(c)+'">'+esc(c)+'</button>';}).join('');chips.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){state.category=b.dataset.category;state.active=0;render();document.getElementById('index').scrollIntoView({behavior:'smooth'});});});}
  function renderFeatured(){var items=featuredIds.map(function(id){return resources.find(function(r){return r.id===id;});}).filter(Boolean);document.getElementById('featured-grid').innerHTML=items.map(card).join('');bindCards(document.getElementById('featured-grid'));}
  function renderContent(){var list=ranked(),selected=Array.from(state.letters).sort(),filtered=Boolean(norm(state.query))||state.category!=='All resources'||selected.length;featured.hidden=filtered;if(norm(state.query)){title.textContent='Search results for “'+state.query.trim()+'”';}else if(state.category!=='All resources'&&selected.length){title.textContent=state.category+' · Initials '+selected.join(', ');}else if(state.category!=='All resources'){title.textContent=state.category;}else if(selected.length){title.textContent='Resources starting with '+selected.join(', ');}else{title.textContent='Browse the complete index';}resultCount.textContent=(filtered?list.length:resources.length)+' resources';
    if(filtered){content.innerHTML=list.length?'<div class="grid">'+list.map(function(x){return card(x.r);}).join('')+'</div>':'<div class="empty">No resources matched the current filters. <button type="button" id="clear-all">Clear all filters</button></div>';}
    else{content.innerHTML='<div class="groups">'+categories.map(function(c){var items=resources.filter(function(r){return r.category===c;}).sort(function(a,b){return a.name.localeCompare(b.name);});return '<section><div class="category-heading"><h3>'+esc(c)+'</h3><button type="button" data-category-jump="'+esc(c)+'">'+items.length+' resources '+arrow()+'</button></div><div class="grid">'+items.map(card).join('')+'</div></section>';}).join('')+'</div>';}
    bindCards(content);var clear=document.getElementById('clear-all');if(clear)clear.addEventListener('click',function(){state.query='';state.category='All resources';state.letters.clear();input.value='';render();});content.querySelectorAll('[data-category-jump]').forEach(function(b){b.addEventListener('click',function(){state.category=b.dataset.categoryJump;render();document.getElementById('index').scrollIntoView({behavior:'smooth'});});});
  }
  function renderSuggestions(){var list=norm(state.query)?ranked().slice(0,8):[];input.setAttribute('aria-expanded',String(state.focused&&list.length>0));if(!state.focused||!norm(state.query)){suggestions.hidden=true;return;}suggestions.hidden=false;if(!list.length){suggestions.innerHTML='<div class="none">No match. Try a method, molecule or biological system.</div>';return;}suggestions.innerHTML='<p>Best matches</p>'+list.map(function(x,i){return '<a class="suggestion '+(i===state.active?'active':'')+'" href="'+esc(x.r.url)+'" target="_blank" rel="noopener noreferrer" data-suggestion="'+esc(x.r.id)+'"><span><strong>'+esc(x.r.name)+'</strong><small>'+esc(x.r.summary)+'</small></span><em>'+esc(x.r.category)+'</em></a>';}).join('')+'<button type="button" class="all-results">Show all '+ranked().length+' matches '+arrow()+'</button>';suggestions.querySelectorAll('[data-suggestion]').forEach(function(link,i){link.addEventListener('mouseenter',function(){state.active=i;suggestions.querySelectorAll('[data-suggestion]').forEach(function(candidate,j){candidate.classList.toggle('active',j===i);});});link.addEventListener('mousedown',function(e){e.preventDefault();});link.addEventListener('click',function(){saveClick(link.dataset.suggestion);});});suggestions.querySelector('.all-results').addEventListener('mousedown',function(e){e.preventDefault();});suggestions.querySelector('.all-results').addEventListener('click',function(){document.getElementById('index').scrollIntoView({behavior:'smooth'});});}
  function render(){renderAlphabet();renderChips();renderFeatured();renderContent();renderSuggestions();document.querySelector('.clear').hidden=!state.query;document.querySelector('.search kbd').hidden=Boolean(state.query);announceHeight();}
  function announceHeight(){requestAnimationFrame(function(){parent.postMessage({type:'mbrn-height',height:document.documentElement.scrollHeight},'*');});}

  input.addEventListener('input',function(){state.query=input.value;state.active=0;render();});
  input.addEventListener('focus',function(){state.focused=true;document.querySelector('.search').classList.add('focused');renderSuggestions();});
  input.addEventListener('blur',function(){setTimeout(function(){state.focused=false;document.querySelector('.search').classList.remove('focused');renderSuggestions();},140);});
  input.addEventListener('keydown',function(e){var list=ranked().slice(0,8);if(!list.length)return;if(e.key==='ArrowDown'){e.preventDefault();state.active=Math.min(state.active+1,list.length-1);renderSuggestions();}else if(e.key==='ArrowUp'){e.preventDefault();state.active=Math.max(state.active-1,0);renderSuggestions();}else if(e.key==='Enter'){e.preventDefault();var resource=list[state.active].r;saveClick(resource.id);window.open(resource.url,'_blank','noopener,noreferrer');}else if(e.key==='Escape'){input.blur();}});
  document.querySelector('.clear').addEventListener('click',function(){state.query='';input.value='';input.focus();render();});
  clearLetters.addEventListener('click',function(){state.letters.clear();state.active=0;render();});
  document.querySelector('.search-button').addEventListener('click',function(){document.getElementById('index').scrollIntoView({behavior:'smooth'});});
  window.addEventListener('keydown',function(e){if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();input.focus();}});
  window.addEventListener('storage',function(e){if(e.key===STORE&&e.newValue)try{state.clicks=JSON.parse(e.newValue);render();}catch{}});
  if('ResizeObserver' in window)new ResizeObserver(announceHeight).observe(document.documentElement);
  render();
}());
