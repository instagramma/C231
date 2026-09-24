/* Chair substituent editor · 2026-09-24.
 * Carbon identity and face are chemical state; screen positions are only a view.
 * Accepts legacy substituent IDs and @label values, preserving old saved attempts.
 * No cloud calls: the host owns persistence and first-attempt evidence.
 */
const CHAIR_GROUP_BANK = [
  ['CH3','Me','methyl'],['CH2CH3','Et','ethyl'],['CH2CH2CH3','n-Pr','n-propyl'],
  ['CH(CH3)2','i-Pr','isopropyl'],['C(CH3)3','t-Bu','tert-butyl'],['Ph','Ph','phenyl'],
  ['R','R','unspecified group'],['CO2R','CO₂R','ester'],['CO2H','CO₂H','carboxyl'],
  ['CH2OH','CH₂OH','hydroxymethyl'],['OH','OH','hydroxyl'],['Cl','Cl','chlorine'],
  ['Br','Br','bromine'],['H','H','hydrogen / remove group']
];
function chairCanonical(label){
  const s=String(label||'').replace(/[₀-₉]/g,d=>String('₀₁₂₃₄₅₆₇₈₉'.indexOf(d)));
  return ({Me:'CH3',Et:'CH2CH3','n-Pr':'CH2CH2CH3','i-Pr':'CH(CH3)2','t-Bu':'C(CH3)3'})[s]||s;
}
function chairValue(q,value){
  if(!value)return 'H';
  const sub=(q.production.substituents||[]).find(s=>s.id===value);
  return chairCanonical(sub?sub.label:String(value).replace(/^@/,''));
}
function chairLabel(label){
  const canonical=chairCanonical(label),entry=CHAIR_GROUP_BANK.find(g=>g[0]===canonical);
  return entry?entry[1]:ch4DisplayGroup(canonical);
}
function chairUp(board,carbon,site){
  const axialUp=(carbon%2===1)!==(board==='B');
  return site==='a'?axialUp:!axialUp;
}
function chairGeometry(board){
  // Ordered ring vertices C1..C6. Reflection in y flips the chair without
  // renumbering, reordering the cycle, or attaching a group to the other neighbor.
  const base=[[80,200],[135,80],[270,115],[395,80],[340,200],[205,165]];
  const eq=[[-67.5,-17.5],[-62.5,17.5],[27.5,-60],[67.5,17.5],[62.5,-17.5],[-27.5,60]];
  return base.map(([x,y],i)=>{
    y=board==='A'?270-y:y;
    const carbon=i+1;
    return {carbon,x,y,sites:['a','e'].map(site=>{
      const up=chairUp(board,carbon,site),dx=site==='a'?0:eq[i][0];
      const dy=site==='a'?(up?-68:68):eq[i][1]*(board==='A'?-1:1);
      return {key:carbon+site,site,up,x:x+dx,y:y+dy};
    })};
  });
}
function chairFlipPlacements(placements){
  const flipped={};
  Object.entries(placements||{}).forEach(([key,value])=>{
    if(/^[1-6][ae]$/.test(key))flipped[key[0]+(key[1]==='a'?'e':'a')]=value;
  });
  return flipped;
}
function gradeCh4ChairEditor(q,draft){
  const p=q.production,subs=p.substituents||[],checks=[];
  (p.requireFlip===false?['A']:['A','B']).forEach(board=>{
    const slots=(draft.placements||{})[board]||{};
    const occupied=Object.entries(slots).filter(([,v])=>chairValue(q,v)!=='H');
    const expected=subs.map(s=>chairCanonical(s.label)).filter(v=>v!=='H').sort();
    checks.push({key:board+'-complete',ok:occupied.every(([key])=>/^[1-6][ae]$/.test(key))&&
      JSON.stringify(occupied.map(([,v])=>chairValue(q,v)).sort())===JSON.stringify(expected),
      text:'Chair '+board+': use exactly the groups in the given molecule; restore any extra substituents to H.'});
    subs.forEach(sub=>{
      const site=chairUp(board,sub.carbon,'a')===sub.up?'a':'e';
      checks.push({key:board+'-'+sub.id,ok:chairValue(q,slots[sub.carbon+site])===chairCanonical(sub.label),
        text:'Chair '+board+': '+chairLabel(sub.label)+' belongs on C'+sub.carbon+' and must stay '+(sub.up?'up':'down')+'. Track the carbon number before checking axial/equatorial.'});
    });
  });
  if(p.preferredChair)checks.push({key:'stability',ok:draft.preferred===p.preferredChair,text:'Compare the axial substituents to choose the lower-energy chair.'});
  return {ok:checks.every(c=>c.ok),checks};
}
function chairEditorStyle(){
  if(document.getElementById('chair-editor-style'))return;
  const style=document.createElement('style');style.id='chair-editor-style';style.textContent=`
    .chair-editor{--ce-ink:#233e48;--ce-teal:#126a70;--ce-line:#ccdcdf;color:var(--ce-ink);background:#f8fbfb;border:1px solid var(--ce-line);border-radius:18px;padding:18px;margin:16px 0;font:16px/1.5 system-ui,sans-serif}
    .chair-editor *{box-sizing:border-box}.chair-editor h3{font-size:22px;margin:0 0 8px}.chair-editor h4{font-size:18px;margin:0}.chair-editor p{margin:8px 0}.chair-editor .ce-muted{color:#526b73;font-size:14px}
    .ce-toolbar,.ce-bank{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.chair-editor button{font:inherit;cursor:pointer;min-height:44px;padding:9px 14px;background:white;color:var(--ce-ink);border:1px solid #a9bfc4;border-radius:10px;line-height:1.2}
    .chair-editor button:hover{border-color:var(--ce-teal)}.chair-editor button:focus-visible{outline:3px solid #c58a2c;outline-offset:3px}.chair-editor button[aria-pressed="true"],.chair-editor button.ce-primary{background:var(--ce-teal);color:white;border-color:var(--ce-teal)}
    .chair-editor button:disabled{opacity:.45;cursor:default}.ce-bank button{min-width:48px;touch-action:none;user-select:none;-webkit-user-select:none;font-weight:650}.ce-board{border-top:1px solid var(--ce-line);padding-top:16px;margin-top:16px}
    .ce-canvas{background:white;border:1px solid #d6e1e3;border-radius:14px;overflow-x:auto;max-width:100%}.ce-canvas svg{display:block;width:100%;min-width:530px;max-width:760px;height:auto;margin:auto}.ce-enlarged .ce-canvas svg{min-width:700px}
    .ce-carbon,.ce-bond-slot{cursor:pointer;outline:none;touch-action:manipulation}.ce-carbon .ce-carbon-hit{fill:transparent}.ce-carbon .ce-number{fill:white;stroke:#a9bfc4;stroke-width:1.5}.ce-carbon[aria-expanded="true"] .ce-number{fill:#e0f2f0;stroke:#126a70;stroke-width:2}
    .ce-carbon:focus-visible .ce-carbon-hit{stroke:#c58a2c;stroke-width:3}.ce-bond-slot .ce-slot-hit{fill:#f0f4f5;stroke:#bdcdd0;stroke-width:1.4}.ce-bond-slot.ce-occupied .ce-slot-hit{fill:#e0f2f0;stroke:#126a70;stroke-width:2}
    .ce-bond-slot.ce-target .ce-slot-hit,.ce-bond-slot.ce-drop .ce-slot-hit,.ce-bond-slot:focus-visible .ce-slot-hit{fill:#fff3d7;stroke:#af7619;stroke-width:3}.ce-bond-slot[aria-disabled="true"]{cursor:default}.ce-bond-slot text,.ce-carbon text{pointer-events:none;user-select:none}
    .ce-readonly .ce-carbon{cursor:default}.ce-note{background:#e9f4f3;border-left:3px solid var(--ce-teal);padding:10px 14px;border-radius:4px}.ce-feedback{background:#fff3db;padding:12px 16px;border-radius:10px}.ce-feedback ul{padding-left:20px}.ce-feedback li{margin:8px 0}
    .ce-status{min-height:24px;font-size:14px;color:#3e6069}.ce-caption{margin:8px 4px;font-size:13px;color:#526b73}.chair-editor summary{cursor:pointer;padding:12px 0}.ce-drag{opacity:.65}
    @media(max-width:500px){.chair-editor{padding:12px}.ce-bank{gap:6px}.ce-bank button{padding:8px 10px}.chair-editor h3{font-size:20px}}
  `;document.head.appendChild(style);
}
function chairEditorSvg(q,draft,board){
  const carbons=chairGeometry(board),slots=(draft.placements||{})[board]||{},expanded=(draft.expanded||{})[board]||[];
  const escText=s=>esc(String(s));let bonds='',controls='',numbers='';
  carbons.forEach(c=>{
    const open=expanded.includes(c.carbon);
    c.sites.forEach(s=>{
      const value=chairValue(q,slots[s.key]),occupied=value!=='H';
      // Placed groups remain visible even when unused H bonds are collapsed.
      if(!occupied&&!open)return;
      const key=board+':'+s.key,label=chairLabel(value),target=draft.target===key;
      bonds+='<line x1="'+c.x+'" y1="'+c.y+'" x2="'+s.x+'" y2="'+s.y+'" stroke="'+(occupied?'#233e48':'#83969c')+'" stroke-width="3"/>';
      controls+='<g class="ce-bond-slot '+(occupied?'ce-occupied ':'')+(target?'ce-target':'')+'" data-chair-slot="'+key+'" data-ch4-slot="'+key+'" role="button" tabindex="'+(draft.locked?-1:0)+'" aria-disabled="'+!!draft.locked+'" aria-label="Chair '+board+', C'+c.carbon+', '+(s.site==='a'?'axial':'equatorial')+' '+(s.up?'up':'down')+': '+escText(label)+'"><rect class="ce-slot-hit" x="'+(s.x-29)+'" y="'+(s.y-22)+'" width="58" height="44" rx="9"/><text x="'+s.x+'" y="'+(s.y+6)+'" text-anchor="middle" font-size="'+(label.length>5?13:17)+'" font-family="system-ui,sans-serif" font-weight="600" fill="#233e48">'+escText(label)+'</text></g>';
    });
    numbers+='<g class="ce-carbon" data-chair-carbon="'+board+':'+c.carbon+'" role="button" tabindex="'+(draft.locked?-1:0)+'" aria-disabled="'+!!draft.locked+'" aria-expanded="'+open+'" aria-label="Chair '+board+', carbon '+c.carbon+', '+(open?'hide':'show')+' attached hydrogen bonds"><circle class="ce-carbon-hit" cx="'+c.x+'" cy="'+c.y+'" r="23"/><circle class="ce-number" cx="'+c.x+'" cy="'+c.y+'" r="12"/><text x="'+c.x+'" y="'+(c.y+5)+'" text-anchor="middle" font-size="14" font-family="system-ui,sans-serif" font-weight="700" fill="#233e48">'+c.carbon+'</text></g>';
  });
  return '<svg viewBox="-24 -26 530 336" role="group" aria-label="Chair '+board+', six numbered carbons. Tap a carbon to reveal its two substituent bonds."><path d="'+carbons.map((c,i)=>(i?'L':'M')+c.x+' '+c.y).join(' ')+' Z" fill="none" stroke="#233e48" stroke-width="4" stroke-linejoin="round"/>'+bonds+controls+numbers+'</svg>';
}
function renderCh4ChairEditor(host,q,D,finish,reviewOnly=false){
  chairEditorStyle();D.ch4Drafts=D.ch4Drafts||{};D.ch4Evidence=D.ch4Evidence||{};
  const p=q.production,boards=p.requireFlip===false?['A']:['A','B'];
  const draft=D.ch4Drafts[q.id]||(D.ch4Drafts[q.id]={placements:{A:{},B:{}},preferred:'',checks:0,locked:false});
  draft.placements=draft.placements||{A:{},B:{}};boards.forEach(b=>draft.placements[b]=draft.placements[b]||{});
  draft.expanded=draft.expanded||{A:[],B:[]};draft.history=draft.history||[];draft.future=draft.future||[];
  if(draft.chairEditorVersion!==1){draft.selected=null;draft.target=null;draft.chairEditorVersion=1;}
  if(reviewOnly)draft.locked=true;
  let message='',suppressClick=false;
  const persist=()=>{
    if(typeof snapshotDrill==='function'&&typeof S!=='undefined'&&S.drill===D){snapshotDrill(D.i);if(typeof save==='function')save();}
    if(typeof D.onChairDraft==='function')D.onChairDraft(ch4Clone(draft));
  };
  const snapshot=()=>({placements:ch4Clone(draft.placements),preferred:draft.preferred||''});
  const edit=fn=>{
    if(draft.locked||D.answered)return false;
    const before=snapshot();fn();
    if(JSON.stringify(before)!==JSON.stringify(snapshot())){draft.history.push(before);draft.history=draft.history.slice(-40);draft.future=[];}
    return true;
  };
  const button=(text,fn,attrs={})=>el('button',Object.assign({type:'button',onclick:fn},attrs),esc(text));
  const redraw=focus=>{persist();draw();if(focus){const node=host.querySelector(focus);if(node)node.focus({preventScroll:true});}};
  function place(key,label){
    const [board,where]=key.split(':');if(!boards.includes(board)||!/^[1-6][ae]$/.test(where))return;
    if(!edit(()=>{if(chairCanonical(label)==='H')delete draft.placements[board][where];else draft.placements[board][where]='@'+chairCanonical(label);}))return;
    draft.target=null;message=chairLabel(label)+' placed on chair '+board+', C'+where[0]+' '+(where[1]==='a'?'axial':'equatorial')+'.';
    redraw('[data-chair-slot="'+key+'"]');
  }
  function choose(board,label){
    if(draft.locked)return;
    if(draft.target&&draft.target.startsWith(board+':')){place(draft.target,label);return;}
    draft.selected=draft.selected?.board===board&&draft.selected.label===label?null:{board,label};
    message=draft.selected?'Tap a bond on chair '+board+' to place '+chairLabel(label)+'.':'Group selection cleared.';
    redraw('[data-chair-bank="'+board+':'+label+'"]');
  }
  function bindDrawing(container){
    const activate=(node,fn)=>{node.addEventListener('click',fn);node.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();fn();}});};
    container.querySelectorAll('[data-chair-carbon]').forEach(node=>activate(node,()=>{
      if(draft.locked)return;const [board,n]=node.dataset.chairCarbon.split(':'),carbon=Number(n),list=draft.expanded[board]||[];
      draft.expanded[board]=list.includes(carbon)?list.filter(x=>x!==carbon):list.concat(carbon);
      if(draft.target?.startsWith(board+':'+carbon))draft.target=null;
      redraw('[data-chair-carbon="'+board+':'+carbon+'"]');
    }));
    container.querySelectorAll('[data-chair-slot]').forEach(node=>activate(node,()=>{
      if(draft.locked)return;const key=node.dataset.chairSlot,board=key.split(':')[0];
      if(draft.selected?.board===board){place(key,draft.selected.label);return;}
      draft.target=draft.target===key?null:key;
      message=draft.target?'Choose a group from chair '+board+'’s bank. H restores hydrogen.':'Bond selection cleared.';
      redraw('[data-chair-slot="'+key+'"]');
    }));
  }
  function bindDrag(tile,board,label){
    tile.addEventListener('pointerdown',event=>{
      if(draft.locked||event.button!==0)return;
      const start={x:event.clientX,y:event.clientY,id:event.pointerId};let moved=false,over=null;
      tile.setPointerCapture(event.pointerId);
      const clear=()=>{host.querySelectorAll('.ce-drop').forEach(n=>n.classList.remove('ce-drop'));tile.classList.remove('ce-drag');};
      const move=e=>{
        if(e.pointerId!==start.id)return;
        moved=moved||Math.hypot(e.clientX-start.x,e.clientY-start.y)>7;if(!moved)return;
        clear();tile.classList.add('ce-drag');const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-chair-slot]');
        over=hit&&host.contains(hit)&&hit.dataset.chairSlot.startsWith(board+':')?hit:null;
        if(over)over.classList.add('ce-drop');
      };
      const end=e=>{
        if(e.pointerId!==start.id)return;
        tile.removeEventListener('pointermove',move);tile.removeEventListener('pointerup',end);tile.removeEventListener('pointercancel',end);
        const key=over?.dataset.chairSlot;clear();
        if(tile.hasPointerCapture(start.id))tile.releasePointerCapture(start.id);
        if(moved){suppressClick=true;setTimeout(()=>{suppressClick=false;},0);if(e.type==='pointerup'&&key)place(key,label);}
      };
      tile.addEventListener('pointermove',move);tile.addEventListener('pointerup',end);tile.addEventListener('pointercancel',end);
    });
  }
  function addBoard(container,state,board,interactive){
    const section=el('section',{class:'ce-board','aria-label':'Chair '+board+' editor'});
    section.appendChild(el('h4',{},'Chair '+board+(board==='B'?' · after the flip':'')));
    if(interactive){
      const bank=el('div',{class:'ce-bank','aria-label':'Chair '+board+' substituents'});
      const groups=CHAIR_GROUP_BANK.concat((p.substituents||[]).map(s=>chairCanonical(s.label)).filter((v,i,a)=>a.indexOf(v)===i&&!CHAIR_GROUP_BANK.some(g=>g[0]===v)).map(v=>[v,ch4DisplayGroup(v),v]));
      groups.forEach(([label,display,name])=>{
        const tile=button(display,()=>{if(!suppressClick)choose(board,label);},{'data-chair-bank':board+':'+label,'aria-label':display+' — '+name,'aria-pressed':draft.selected?.board===board&&draft.selected.label===label,title:display+' = '+name});
        bindDrag(tile,board,label);bank.appendChild(tile);
      });section.appendChild(bank);
    }
    const visual=el('div',{class:'ce-canvas'+(state.locked?' ce-readonly':'')});visual.innerHTML=chairEditorSvg(q,state,board);section.appendChild(visual);
    section.appendChild(el('p',{class:'ce-caption'},interactive?'Tap a numbered carbon to show/hide H bonds. Choose a group, then tap a bond—or drag onto it. On a narrow screen, swipe inside the drawing to reach all six carbons.':'Carbon numbers identify the same atoms in both chairs. On a narrow screen, swipe inside the drawing to see the entire chair.'));
    container.appendChild(section);if(interactive)bindDrawing(visual);
  }
  function draw(){
    host.innerHTML='';host.classList.add('chair-editor');host.classList.toggle('ce-enlarged',!!draft.zoom);host.dataset.ch4Production='chair';
    host.appendChild(el('h3',{},draft.locked?'Your submitted chairs':boards.length===1?'Build the chair':'Build both chair conformations'));
    host.appendChild(el('p',{class:'ce-muted'},'Keep each group on the same numbered carbon. A ring flip exchanges axial and equatorial; up/down stays the same.'));
    const toolbar=el('div',{class:'ce-toolbar'});
    toolbar.appendChild(button(draft.zoom?'Standard size':'Enlarge drawing',()=>{draft.zoom=!draft.zoom;redraw();}));
    if(!draft.locked){
      const travel=(from,to)=>{if(!draft[from].length)return;draft[to].push(snapshot());Object.assign(draft,draft[from].pop());draft.selected=null;draft.target=null;message='Construction '+(from==='history'?'restored.':'redone.');redraw();};
      toolbar.appendChild(button('Undo',()=>travel('history','future'),{disabled:!draft.history.length}));
      toolbar.appendChild(button('Redo',()=>travel('future','history'),{disabled:!draft.future.length}));
      toolbar.appendChild(button('Clear selection',()=>{draft.selected=null;draft.target=null;message='Selection cleared.';redraw();}));
    }
    host.appendChild(toolbar);
    if(!draft.locked)host.appendChild(el('p',{class:'ce-status','aria-live':'polite'},esc(message||'Start by tapping a carbon. Every carbon has one axial and one equatorial bond.')));
    boards.forEach(board=>addBoard(host,draft,board,!draft.locked));
    if(p.preferredChair){
      host.appendChild(el('p',{},'Which chair is lower in energy?'));
      const choices=el('div',{class:'ce-toolbar','aria-label':'Lower-energy chair'});
      [['A','Chair A'],['B','Chair B'],['equal','Equal energy']].forEach(([value,label])=>choices.appendChild(button(label,()=>{edit(()=>draft.preferred=value);redraw();},{disabled:!!draft.locked,'aria-pressed':draft.preferred===value})));host.appendChild(choices);
    }
    if(draft.locked){
      host.appendChild(el('p',{class:'ce-note'},'Your construction is saved with this question. It is read-only after submission.'));
      if(draft.result&&(!D.cold||reviewOnly)){
        const misses=draft.result.checks.filter(c=>!c.ok),feedback=el('div',{class:'ce-feedback'});
        feedback.innerHTML=draft.result.ok?'<b>Construction checked.</b> Each group has the correct carbon and face in both chairs.':'<b>Review your construction</b><ul>'+misses.map(c=>'<li>'+esc(c.text)+'</li>').join('')+'</ul>';host.appendChild(feedback);
        if(!draft.result.ok){const comparison=el('details',{});comparison.appendChild(el('summary',{},'Compare with one correct construction'));const model=ch4ProductionModel(q);boards.forEach(board=>addBoard(comparison,model,board,false));host.appendChild(comparison);}
      }return;
    }
    const actions=el('div',{class:'ce-toolbar'});
    actions.appendChild(button('Check my construction',()=>{
      if(draft.locked||D.answered)return;
      if(p.preferredChair&&!draft.preferred){message='Choose the lower-energy chair before checking.';redraw();return;}
      if(boards.some(b=>!Object.keys(draft.placements[b]).length)&&(p.substituents||[]).some(s=>chairCanonical(s.label)!=='H')){message='Add the substituents to each chair before checking.';redraw();return;}
      draft.result=gradeCh4ChairEditor(q,draft);draft.checks=(draft.checks||0)+1;draft.locked=true;draft.selected=null;draft.target=null;
      const evidence={kind:'chair',editorVersion:1,placements:ch4Clone(draft.placements),mode:null,preferred:draft.preferred||null,ok:draft.result.ok,checks:draft.checks,firstTry:draft.checks===1,checkedAt:Date.now(),grading:'checked-spatial-construction',criteria:ch4Clone(draft.result.checks)};
      D.ch4Evidence[q.id]=evidence;redraw();
      finish(evidence.ok,'See the construction check below.','',JSON.stringify({kind:'chair',placements:evidence.placements,preferred:evidence.preferred}));
    },{class:'ce-primary'}));
    actions.appendChild(button('Clear construction',()=>{edit(()=>{draft.placements={A:{},B:{}};draft.preferred='';});draft.selected=null;draft.target=null;message='Construction cleared. Undo will restore it.';redraw();}));host.appendChild(actions);
  }
  draw();return draft;
}
