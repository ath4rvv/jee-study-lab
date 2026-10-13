/* ===== script (1 of 3) ===== */
(function(){try{if(!localStorage.getItem('pf-subj'))localStorage.setItem('pf-subj',JSON.stringify([{id:'phy',n:'Physics',c:'#ff375f'},{id:'chem',n:'Chemistry',c:'#ff9f0a'},{id:'math',n:'Maths',c:'#0a84ff'},{id:'c1',n:'Question Practice',c:'#30d158'},{id:'c2',n:'IOC',c:'#bf5af2'},{id:'c3',n:'OC',c:'#ffd60a'}]));}catch(e){}})();

/* ===== script (2 of 3) ===== */
(function(){
var tgTab='week',DAY=864e5,TARGET=Date.UTC(2027,0,22);
var NOW=null;
/* ===== Day Rollover: ONE central logical-day calculation (everything routes through these) ===== */
var RKEY='pf-rollover',ROLL=0;
try{var _rv=parseInt(localStorage.getItem(RKEY),10);if(_rv>=0&&_rv<=6)ROLL=_rv;}catch(e){}
function dkey(d){return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate());}
function lnow(ms){return new Date((ms==null?Date.now():ms)-ROLL*36e5);}
function logicalKey(ms){return dkey(lnow(ms));}
function dayStart(k){var p=k.split('-');return new Date(+p[0],+p[1]-1,+p[2],ROLL,0,0,0).getTime();}
function dayEnd(k){var p=k.split('-');return new Date(+p[0],+p[1]-1,+p[2]+1,ROLL,0,0,0).getTime();}
function today(){if(NOW!=null)return NOW;return parse(logicalKey());}
window.__pfDay={key:logicalKey,start:dayStart,end:dayEnd,roll:function(){return ROLL;}};
function parse(s){var p=s.split('-');return Date.UTC(+p[0],+p[1]-1,+p[2]);}
function core(t,cps){
 var i=0,state='in',last=cps.length-1;
 if(t<cps[0].s){state='before';}
 else if(t>cps[last].e){i=last;state='after';}
 else{var fd=-1;for(var k=0;k<=last;k++){if(t>=cps[k].s&&t<=cps[k].e){i=k;fd=k;break;}}if(fd<0){for(k=0;k<=last;k++){if(cps[k].s>t){i=k;state='before';break;}}}}
 var c=cps[i],total=Math.round((c.e-c.s)/DAY)+1;
 return{i:i,state:state,total:total,left:Math.max(0,Math.round((TARGET-t)/DAY)),
  day:Math.min(Math.max(Math.round((t-c.s)/DAY)+1,0),total),gap:Math.round((c.s-t)/DAY)};
}
function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}
var root=document.documentElement;
var reduce=function(){return matchMedia('(prefers-reduced-motion: reduce)').matches;};
/* ===== one-time clean-up (v2): demo data hatao ===== */
try{if(!localStorage.getItem('pf-v2')){
 var _ss=JSON.parse(localStorage.getItem('pf-sess')||'[]');
 if(Array.isArray(_ss))localStorage.setItem('pf-sess',JSON.stringify(_ss.filter(function(q){return !(q&&q.m==='flow'&&!Array.isArray(q.sg)&&!q.task&&(+q.ms)%6e4===0);})));
 var _tt=JSON.parse(localStorage.getItem('pf-tasks')||'[]'),_dm={a:'IUPAC naming',b:'Electrostatics DPP',c:'Plan next week'};
 if(Array.isArray(_tt))localStorage.setItem('pf-tasks',JSON.stringify(_tt.filter(function(t){return !(t&&_dm[t.id]===t.text&&!t.done&&!t.doneAt);})));
 localStorage.setItem('pf-reset-v1','1');localStorage.setItem('pf-v2','1');}}catch(e){}
var MNAME=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function refresh(){}

/* ===== Pomodoro (25:00) ===== */
var actx=null,baseTitle=document.title;
function unlockAudio(){try{var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;if(!actx)actx=new AC();if(actx.state==='suspended')actx.resume();}catch(e){}}
document.addEventListener('pointerdown',unlockAudio,{once:true});
function chime(){
 unlockAudio();if(!actx)return;
 try{
  var t0=actx.currentTime+.03;
  [[659.25,0],[880,.22],[1318.51,.46]].forEach(function(n){
   var o=actx.createOscillator(),g=actx.createGain(),t=t0+n[1];
   o.type='sine';o.frequency.value=n[0];
   g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.11,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+1.1);
   o.connect(g);g.connect(actx.destination);o.start(t);o.stop(t+1.2);
  });
 }catch(e){}
}
/* ===== Tasks hub (Today / Inbox / Timer) — markup+styles in <template id="tk-tpl"> (shadow DOM) ===== */
var hub=document.getElementById('hub'),S=hub.attachShadow({mode:'open'}),
 $=function(i){return S.getElementById(i);};
S.appendChild(document.getElementById('tk-tpl').content.cloneNode(true));
var RT=S.querySelector('.root'),TK='pf-tasks',UK='pf-subj',FK='pf-flow',SS='pf-sess',THK='pf-theme',SEEN='pf-seen',
 LEG={phy:['Physics','#ff375f'],chem:['Chemistry','#ff9f0a'],math:['Maths','#0a84ff']},
 PAL=['#30d158','#bf5af2','#ffd60a','#64d2ff','#ff453a','#5e5ce6','#ac8e68','#66d4cf'],
 subs=[],tasks=[],sess=[],view='today',fT='open',fI='open',addDue='today',addSb='',hbFocus=null,pcy=0,pcm=0,mOff=0,wOff=0,rng='all',crg='30d',hid={},tmo=0,tickT=0,dnKey='',barKey='',theme='ember',animAll=true,freshId='',RCO={};
function p2(n){return(n<10?'0':'')+n;}
function L(d){return dkey(d||lnow());}
function addD(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x;}
function mon(d){d=new Date(d);d.setHours(0,0,0,0);return addD(d,-((d.getDay()+6)%7));}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function nid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function H(ms){var m=Math.round(ms/6e4);return m<60?m+'m':Math.floor(m/60)+'h '+p2(m%60)+'m';}
function toast(m){var t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(tmo);tmo=setTimeout(function(){t.classList.remove('on');},2200);}
function lsGet(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v;}catch(e){return d;}}
var _imp=false;
var wkTg=lsGet('pf-wkt',0)?true:false;
function lsSet(k,v){if(_imp)return;try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
/* subjects */
subs=(lsGet(UK,[])||[]).filter(function(s){return s&&s.id&&s.n;});if(!Array.isArray(subs))subs=[];
Object.keys(LEG).forEach(function(k,i){var s=subs.filter(function(x){return x.id===k;})[0];if(s){s.n=LEG[k][0];s.c=LEG[k][1];}else subs.splice(i,0,{id:k,n:LEG[k][0],c:LEG[k][1]});});
function subSave(){lsSet(UK,subs);}subSave();
function sub(id){return subs.filter(function(s){return s.id===id;})[0];}
var TCK='pf-tagcolors',TC=lsGet(TCK,{});if(!TC||typeof TC!=='object'||Array.isArray(TC))TC={};
function okCol(c){return typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c);}
/* tag colours: display-only overlay (pf-tagcolors); pf-subj itself is never rewritten by appearance changes */
function SC(id){var o=TC[id];return okCol(o)?o:(sub(id)||{c:'#8e8e93'}).c;}function SN(id){return esc((sub(id)||{n:'General'}).n);}
/* tasks */
tasks=(lsGet(TK,[])||[]);if(!Array.isArray(tasks))tasks=[];
tasks=tasks.filter(function(t){return t&&typeof t.text==='string'&&t.text;}).map(function(t,i){return{id:String(t.id||'t'+i+Date.now()),text:t.text.slice(0,200),done:!!t.done,due:typeof t.due==='string'?t.due:(t.list==='today'?L():''),ds:typeof t.ds==='string'?t.ds:'',subj:sub(t.subj)?t.subj:'',at:+t.at||0,doneAt:+t.doneAt||0,src:t.src==='inbox'?'inbox':'',st:t.st==='prog'&&!t.done?'prog':'',bd:!!t.bd||!!t.kb||t.st==='prog',tn:(+t.tn>0?(+t.tn|0):0),ch:typeof t.ch==='string'?t.ch:'',lk:(typeof t.lk==='string'&&/^[ldr]+$/.test(t.lk))?t.lk:'l',cn:t.cn?1:0,ws:(+t.ws>0&&+t.we>+t.ws)?+t.ws:0,we:(+t.ws>0&&+t.we>+t.ws)?+t.we:0,cm:typeof t.cm==='string'?t.cm:null,sub:(Array.isArray(t.sub)?t.sub:[]).filter(function(x){return x&&x.text;}).map(function(x){return{id:String(x.id||nid()),text:String(x.text).slice(0,120),done:!!x.done};})};});
var addSubs=[],etSub=[];
function mkOf(t){try{return window.MKAPI&&window.MKAPI.of?window.MKAPI.of(t):null}catch(e){return null}}
function mkChip(t){var m=mkOf(t);return'<span class="sbp mkcat">'+esc(m&&m.cat||'Uncategorized')+'</span>';}
function mkRows(t){return sbRows(t).replace('class="sbl"','class="sbl mkl"');}
function sbChip(t){var a=Array.isArray(t.sub)?t.sub:[];if(!a.length)return'';var d=a.filter(function(x){return x.done;}).length;return'<span class="sbp'+(d===a.length?' ok':'')+'">'+d+'/'+a.length+'</span>';}
/* reusable subtask editor: box = container, get() = current array, chg = callback */
var GRIP='<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><circle cx="7" cy="5" r="1.6"/><circle cx="13" cy="5" r="1.6"/><circle cx="7" cy="10" r="1.6"/><circle cx="13" cy="10" r="1.6"/><circle cx="7" cy="15" r="1.6"/><circle cx="13" cy="15" r="1.6"/></svg>';
function sbPaint(box,get,focus){var a=get(),h='',ed=box.id==='etSb';a.forEach(function(x,i){h+='<div class="sbr'+(x.done?' done':'')+'" data-i="'+i+'">'+(ed?'<button type="button" class="sbg" data-g="1" aria-label="Drag to reorder subtask (or use Up/Down arrow keys)">'+GRIP+'</button>':'<button type="button" class="sbc" data-k="c" aria-label="Toggle subtask">'+(x.done?TICK:'')+'</button>')+'<input class="sbe" value="'+esc(x.text)+'" maxlength="120" aria-label="Subtask"><button type="button" class="sbx" data-k="x" aria-label="Delete subtask">&times;</button></div>';});
 h+='<div class="sbr sbn"><span class="sbpl">+</span><input class="sbi" maxlength="120" placeholder="Add subtask" aria-label="New subtask"></div>';box.innerHTML=h;if(focus){var i=box.querySelector('.sbi');if(i)i.focus({preventScroll:true});}}
function sbFlush(box,get){var i=box.querySelector('.sbi'),v=i&&i.value.replace(/\s+/g,' ').trim().slice(0,120);if(v){get().push({id:nid(),text:v,done:false});i.value='';}}
function sbBind(box,get,chg){
 box.addEventListener('click',function(e){var b=e.target.closest('[data-k]');if(!b)return;var r=b.closest('.sbr'),a=get(),i=+r.dataset.i;if(b.dataset.k==='c')a[i].done=!a[i].done;else a.splice(i,1);sbPaint(box,get,false);chg();});
 box.addEventListener('input',function(e){if(!e.target.classList.contains('sbe'))return;var a=get(),i=+e.target.closest('.sbr').dataset.i;if(a[i])a[i].text=e.target.value.slice(0,120);});
 box.addEventListener('keydown',function(e){var t=e.target;if(!t.classList||(!t.classList.contains('sbi')&&!t.classList.contains('sbe')))return;e.stopPropagation();if(e.key!=='Enter'||e.isComposing)return;e.preventDefault();
  if(t.classList.contains('sbe')){var n=box.querySelector('.sbi');if(n)n.focus();return;}
  sbFlush(box,get);sbPaint(box,get,true);chg();},true);}
function sbMove(box,get,from,to,refocus){var a=get();if(to<0||to>=a.length||from===to)return;var x=a.splice(from,1)[0];a.splice(to,0,x);sbPaint(box,get,false);if(refocus){var g=box.querySelectorAll('.sbg')[to];if(g)g.focus({preventScroll:true});}}
function sbGrip(box,get){var D=null;
 box.addEventListener('pointerdown',function(e){var g=e.target.closest&&e.target.closest('.sbg');if(!g||(e.pointerType==='mouse'&&e.button!==0))return;e.preventDefault();
  var r=g.closest('.sbr'),rows=[].slice.call(box.querySelectorAll('.sbr:not(.sbn)')),i=rows.indexOf(r);if(rows.length<2||i<0)return;
  var rc=rows.map(function(n){var b=n.getBoundingClientRect();return{t:b.top,h:b.height};}),step=rows.length>1?rc[1].t-rc[0].t:rc[0].h;
  D={r:r,rows:rows,i:i,j:i,y:e.clientY,rc:rc,step:step,id:e.pointerId,g:g,sy:box.scrollTop};try{g.setPointerCapture(e.pointerId);}catch(_){}
  r.classList.add('sbdrag');box.classList.add('sbmv');rows.forEach(function(n){if(n!==r)n.style.transition='transform .18s cubic-bezier(.2,.8,.2,1)';});});
 box.addEventListener('pointermove',function(e){var d=D;if(!d||e.pointerId!==d.id)return;var dy=e.clientY-d.y+(box.scrollTop-d.sy),lo=-d.i*d.step,hi=(d.rows.length-1-d.i)*d.step;dy=Math.max(lo,Math.min(hi,dy));
  d.r.style.transform='translateY('+dy+'px) scale(1.02)';var j=Math.max(0,Math.min(d.rows.length-1,Math.round(d.i+dy/d.step)));d.j=j;
  d.rows.forEach(function(n,q){if(n===d.r)return;var sh=0;if(d.j>d.i&&q>d.i&&q<=d.j)sh=-d.step;else if(d.j<d.i&&q>=d.j&&q<d.i)sh=d.step;n.style.transform=sh?'translateY('+sh+'px)':'';});});
 function end(e){var d=D;if(!d||(e&&e.pointerId!==d.id))return;D=null;try{d.g.releasePointerCapture(d.id);}catch(_){}
  box.classList.remove('sbmv');d.rows.forEach(function(n){n.style.transition='';n.style.transform='';n.classList.remove('sbdrag');});
  if(d.j!==d.i)sbMove(box,get,d.i,d.j,false);}
 box.addEventListener('pointerup',end);box.addEventListener('pointercancel',end);
 box.addEventListener('keydown',function(e){var g=e.target.closest&&e.target.closest('.sbg');if(!g||(e.key!=='ArrowUp'&&e.key!=='ArrowDown'))return;e.preventDefault();e.stopPropagation();var i=+g.closest('.sbr').dataset.i;sbMove(box,get,i,i+(e.key==='ArrowUp'?-1:1),true);},true);
 box.addEventListener('touchmove',function(e){if(D)e.preventDefault();},{passive:false});}
function sbLbl(){var n=addSubs.length,c=$('cSb');if(c)c.innerHTML=SBI+(n?'Subtasks · '+n:'Subtask');}
var SBI='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>';
function sbTake(){sbFlush($('sbPanel'),function(){return addSubs;});var r=addSubs.filter(function(x){return x.text;}).map(function(x){return{id:nid(),text:x.text,done:!!x.done};});addSubs=[];$('sbPanel').hidden=true;$('cSb').classList.remove('on');return r;}
var SYAPI={ch:null};function tSave(){try{if(SYAPI.sync)SYAPI.sync();}catch(e){}lsSet(TK,tasks);}
function kbd(t){return!!t.bd;}/* kbd = task lives on the Targets board (created from the board only) */
function inProg(t){return!t.done&&t.st==='prog';}
function onBoard(t,tl){return!t.done||(t.doneAt>0&&L(lnow(t.doneAt))===(tl||L()));}
function isToday(t){return!t.done&&!inInbox(t)&&t.due<=L();}
function inInbox(t){return t.src==='inbox'||!t.due;}
function dueLbl(d){if(!d)return'No date';if(d===L())return'Today';if(d===L(addD(lnow(),1)))return'Tomorrow';var x=new Date(d+'T00:00');return x.getDate()+' '+MNAME[x.getMonth()];}
var DL={today:'Today',tomorrow:'Tomorrow',week:'Next week',none:'No date'};
function dv(k){return k==='today'?L():k==='tomorrow'?L(addD(lnow(),1)):k==='week'?L(addD(lnow(),7)):k==='none'?'':k;}
function dlab(k){return DL[k]||dueLbl(k);}
var ICAL='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15.5" rx="4"/><path d="M8 3.5v3M16 3.5v3M3.5 10h17"/></svg>',
 TRASH='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
 TICK='<svg class="tkk" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#1a0e04" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.6l3 3L12.5 5"/></svg>',
 CHK='<svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="margin-left:auto"><path d="M2.5 6.5l2.2 2.2L9.5 3.5"/></svg>';
function tMeta(){try{if($('pfm').classList.contains('on'))pfPrev();}catch(e){}var n=tasks.filter(isToday).length,i=tasks.filter(function(t){return!t.done&&inInbox(t)&&!kbd(t);}).length,g=tasks.filter(function(t){return!t.done&&inInbox(t)&&kbd(t);}).length;
 $('nT').textContent=n;$('nT').hidden=!n;$('nI').textContent=i;$('nI').hidden=!i;$('nG').textContent=g;$('nG').hidden=!g;
 }

/* ===== v7: Today overall progress ===== */
var dpSt={d:0,pc:0,n:-1,raf:0,win:false,mood:''},dpRM=false;try{dpRM=window.matchMedia('(prefers-reduced-motion:reduce)').matches;}catch(e){}
function dayProg(){var tl=L(),d0=new Date();d0.setHours(0,0,0,0);var a=+d0,b=a+864e5;
 var arr=tasks.filter(function(t){if(inInbox(t))return false;if(t.done)return t.due===tl||(t.doneAt>=a&&t.doneAt<b);return t.due<=tl;});
 return{n:arr.length,d:arr.filter(function(t){return t.done;}).length,od:arr.filter(function(t){return!t.done&&t.due<tl;}).length};}
function dpPaint(){var g=$('wkPg');
 if(view!=='today'){dpSt.off=true;return;}
 var p=dayProg(),n=p.n,d=p.d,left=n-d,pc=n?Math.round(d/n*100):0,win=n>0&&d===n,first=dpSt.n<0||dpSt.off,F=$('pgF');dpSt.off=false;
 var from=first?{d:0}:{d:dpSt.d};
 /* ring (animates from empty on first show) */
 if(first&&!dpRM){F.style.transition='none';F.style.strokeDashoffset='100';void F.getBoundingClientRect();F.style.transition='';}
 F.style.strokeDashoffset=String(100-pc);g.classList.toggle('z',pc===0);
 /* count tween */
 cancelAnimationFrame(dpSt.raf);
 var apply=function(v){$('pgN').textContent=Math.round(from.d+(d-from.d)*v)+'/'+n;};
 if(dpRM||from.d===d){apply(1);}
 else{var t0=0,dur=first?900:650;var step=function(ts){if(!t0)t0=ts;var k=Math.min(1,(ts-t0)/dur);apply(1-Math.pow(1-k,3));if(k<1)dpSt.raf=requestAnimationFrame(step);};apply(0);dpSt.raf=requestAnimationFrame(step);}
 $('pgL').textContent=!n?'NO TASKS':win?'ALL DONE':left+' LEFT';
 g.title=n?(d+' of '+n+' tasks completed today'):'No tasks planned today';
 if(win&&!dpSt.win&&!first&&!dpRM){g.classList.remove('pp');void g.offsetWidth;g.classList.add('pp');setTimeout(function(){g.classList.remove('pp');},700);}
 g.classList.toggle('win',win);
 dpSt.d=d;dpSt.n=n;dpSt.win=win;}


var vDay='',addStart='',popFor='due',gcol={},WD=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
 TAGI='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor"/></svg>',
 GCH='<svg class="gch" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
function vD(){return vDay||L();}
var kbPv=0,kbTw=0,RM=function(){return matchMedia('(prefers-reduced-motion:reduce)').matches;};
function kbPost(){var b=$('list').querySelector('.kbh b'),i=$('list').querySelector('.kbra');if(!b||!i)return;var to=+b.dataset.pc,from=kbPv;kbPv=to;if(from===to)return;
 if(RM()){i.style.strokeDashoffset=(100-to);b.textContent=to+'%';return;}
 requestAnimationFrame(function(){requestAnimationFrame(function(){i.style.strokeDashoffset=(100-to);if(to>from){i.classList.add('bump');setTimeout(function(){i.classList.remove('bump');},700);}});});
 cancelAnimationFrame(kbTw);var t0=0;(function f(ts){if(!t0)t0=ts;var k=Math.min(1,(ts-t0)/650),e=1-Math.pow(1-k,3);b.textContent=Math.round(from+(to-from)*e)+'%';if(k<1)kbTw=requestAnimationFrame(f);})(performance.now());}
function kbFlip(fn){var o={};[].forEach.call($('list').querySelectorAll('.kc'),function(c){o[c.dataset.id]=c.getBoundingClientRect();});fn();
 if(RM())return;[].forEach.call($('list').querySelectorAll('.kc'),function(c){var r=o[c.dataset.id];if(!r)return;var n=c.getBoundingClientRect(),dx=r.left-n.left,dy=r.top-n.top;if(Math.abs(dx)<1&&Math.abs(dy)<1)return;
  c.animate([{transform:'translate('+dx+'px,'+dy+'px)'},{transform:'none'}],{duration:360,easing:'cubic-bezier(.32,.72,0,1)'});});}
var FXP=[],FXS=[],FXR=[],fxRaf=0,fxG=null,fxW=0,fxH=0,FXC=['#ff9f0a','#ffd60a','#30d158','#0a84ff','#bf5af2','#ff375f','#64d2ff','#ffffff'];
function fxInit(){var r=RT.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2),cv=$('cf');if(cv.width!==Math.round(r.width*d)||cv.height!==Math.round(r.height*d)){cv.width=r.width*d;cv.height=r.height*d;}fxG=cv.getContext('2d');fxG.setTransform(d,0,0,d,0,0);fxW=r.width;fxH=r.height;}
function fxSpawn(x,y,n,ang,spread,sp,life){for(var i=0;i<n&&FXP.length<700;i++){var a=ang+(Math.random()-.5)*spread,v=sp*(.35+Math.random()*.8),k=Math.random();
 FXP.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,sh:k<.46?0:k<.7?1:k<.86?2:3,w:6+Math.random()*6,r:Math.random()*6.28,vr:(Math.random()-.5)*.28,ph:Math.random()*6.28,fq:.08+Math.random()*.12,tl:Math.random()*6.28,tv:.12+Math.random()*.22,c:FXC[(Math.random()*FXC.length)|0],age:0,life:(life||2600)*(.7+Math.random()*.5),dr:.962+Math.random()*.022,g:.16+Math.random()*.1});}}
function fxSpark(x,y,n,rad){for(var i=0;i<n;i++){var a=Math.random()*6.28,d=rad*(.5+Math.random()*.7);FXS.push({x:x+Math.cos(a)*d*.35,y:y+Math.sin(a)*d*.35,vx:Math.cos(a)*d/42,vy:Math.sin(a)*d/42,s:5+Math.random()*8,age:0,life:520+Math.random()*420,c:Math.random()<.5?'#ffd60a':'#ffffff'});}}
function fxRing(x,y,r1,c,delay){setTimeout(function(){FXR.push({x:x,y:y,r1:r1,c:c,age:0,life:560});fxRun();},delay||0);}
function fxStar(g,r,p){g.beginPath();for(var i=0;i<p*2;i++){var a=i*Math.PI/p-Math.PI/2,q=i%2?r*.45:r;g[i?'lineTo':'moveTo'](Math.cos(a)*q,Math.sin(a)*q);}g.closePath();g.fill();}
function fxRun(){if(fxRaf)return;fxInit();var last=performance.now();
 fxRaf=requestAnimationFrame(function f(t){var dt=Math.min(2.2,(t-last)/16.667),ms=t-last;last=t;var g=fxG;g.clearRect(0,0,fxW,fxH);
  FXP=FXP.filter(function(p){p.age+=ms;if(p.age>p.life||p.y>fxH+40)return false;
   p.vx*=Math.pow(p.dr,dt);p.vy=Math.min(p.vy+p.g*dt,6.5)*Math.pow(.992,dt);p.x+=(p.vx+Math.sin(p.ph+p.age*p.fq*.06)*.7)*dt;p.y+=p.vy*dt;p.r+=p.vr*dt;p.tl+=p.tv*dt;
   var al=p.age>p.life*.72?1-(p.age-p.life*.72)/(p.life*.28):1;g.save();g.globalAlpha=Math.max(0,al);g.translate(p.x,p.y);g.rotate(p.r);g.fillStyle=g.strokeStyle=p.c;
   var fl=Math.cos(p.tl);if(p.sh===0){g.scale(1,fl);g.fillRect(-p.w/2,-p.w/4,p.w,p.w/2);}
   else if(p.sh===1){g.scale(Math.abs(fl)*.6+.4,1);g.beginPath();g.arc(0,0,p.w/3,0,6.283);g.fill();}
   else if(p.sh===2){g.lineWidth=2.2;g.lineCap='round';g.beginPath();g.moveTo(-p.w,0);g.quadraticCurveTo(0,Math.sin(p.tl)*p.w*.9,p.w,0);g.stroke();}
   else{g.scale(Math.abs(fl)*.5+.5,Math.abs(fl)*.5+.5);fxStar(g,p.w/1.6,5);}
   g.restore();return true;});
  FXS=FXS.filter(function(s){s.age+=ms;if(s.age>s.life)return false;s.x+=s.vx*dt;s.y+=s.vy*dt;var k=s.age/s.life,sc=Math.sin(Math.PI*k)*s.s;g.save();g.translate(s.x,s.y);g.rotate(k*1.2);g.fillStyle=s.c;g.globalAlpha=1-k*.4;g.shadowColor=s.c;g.shadowBlur=8;
   g.beginPath();g.moveTo(0,-sc);g.quadraticCurveTo(0,0,sc,0);g.quadraticCurveTo(0,0,0,sc);g.quadraticCurveTo(0,0,-sc,0);g.quadraticCurveTo(0,0,0,-sc);g.fill();g.restore();return true;});
  FXR=FXR.filter(function(q){q.age+=ms;if(q.age>q.life)return false;var k=q.age/q.life,e=1-Math.pow(1-k,3);g.save();g.globalAlpha=(1-k)*.9;g.strokeStyle=q.c;g.lineWidth=4*(1-k)+.6;g.beginPath();g.arc(q.x,q.y,6+q.r1*e,0,6.283);g.stroke();g.restore();return true;});
  if(FXP.length||FXS.length||FXR.length)fxRaf=requestAnimationFrame(f);else{fxRaf=0;g.clearRect(0,0,fxW,fxH);}});}
function kbParty(x,y,grand){if(RM())return;cancelAnimationFrame(cfRaf);fxInit();var W=fxW,H=fxH,at=function(ms,fn){setTimeout(function(){fn();fxRun();},ms);};
 fxRing(x,y,64,'#3ddc84');fxRing(x,y,100,'#ffd60a',110);fxSpark(x,y,12,110);
 at(0,function(){fxSpawn(x,y,64,-Math.PI/2,2.3,12.5,2300);});at(120,function(){fxSpawn(x,y,34,-Math.PI/2,2.9,9,2200);});
 if(grand){var cx=W/2,cy=H*.4;fxRing(cx,cy,190,'#30d158',150);fxRing(cx,cy,260,'#ff9f0a',300);at(60,function(){fxSpark(cx,cy,22,260);});
  [0,150,300].forEach(function(d){at(d,function(){fxSpawn(W*.02,H*.99,46,-1.12,.5,22,3200);fxSpawn(W*.98,H*.99,46,-Math.PI+1.12,.5,22,3200);});});
  at(100,function(){fxSpawn(cx,cy,110,-Math.PI/2,Math.PI*1.7,15,3000);});
  for(var i=0;i<12;i++)at(260+i*95,function(){for(var j=0;j<7;j++)fxSpawn(Math.random()*W,-14,1,Math.PI/2,.5,2.2,3600);});}
 fxRun();}
function kbBadge(){var d=document.createElement('div');d.className='kbn';d.innerHTML='<span class="kbk"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#06220f" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.8l4.6 4.6L19 7.8"/></svg></span><b>All targets done</b>';RT.appendChild(d);setTimeout(function(){d.remove();},2400);}
function kbCelebrate(t,rc){var r=RT.getBoundingClientRect(),tl=L(),it=tasks.filter(function(x){return inInbox(x)&&kbd(x)&&onBoard(x,tl);}),all=it.length>0&&it.every(function(x){return x.done;}),
 c=[].filter.call($('list').querySelectorAll('.kc'),function(e){return e.dataset.id===t.id;})[0];
 if(c){c.classList.add('kcpop');setTimeout(function(){c.classList.remove('kcpop');},800);}
 var x=rc?rc.left+rc.width/2-r.left:r.width/2,y=rc?rc.top+rc.height/2-r.top:r.height/2;
 kbParty(x,y,all);if(all)kbBadge();else toast('Target completed ✅');}
function tgStart(){var d=dv(addDue);if(view!=='targets'||!d)return'';var a=addStart||L();return a>d?d:a;}
function kbFm(k){var q=k.split('-');return+q[2]+' '+MNAME[+q[1]-1];}
function kbRng(t,late){if(!t.due)return'';var r=t.ds&&t.ds!==t.due?kbFm(t.ds)+' \u2192 '+kbFm(t.due):kbFm(t.due);return'<span class="kcd'+(late?' late':'')+'">'+ICAL+r+'</span>';}
function kbRem(t){if(!t.due||t.done)return'';var tl=L(),left=Math.round((parse(t.due)-parse(tl))/DAY),tot=t.ds?Math.round((parse(t.due)-parse(t.ds))/DAY):0,
 pre=t.ds&&tl<t.ds?Math.round((parse(t.ds)-parse(tl))/DAY):0,pc=tot>0?Math.max(0,Math.min(100,Math.round((parse(tl)-parse(t.ds))/DAY/tot*100))):0,
 m=left<0?(-left)+(left===-1?' day':' days')+' overdue':left===0?'Due today':left+(left===1?' day':' days')+' left';
 return'<div class="kcr'+(left<0?' late':'')+'"><b>'+m+'</b>'+(pre||tot>0?'<span>'+[pre?'starts in '+pre+(pre===1?' day':' days'):'',tot>0?tot+(tot===1?' day':' days')+' total':''].filter(Boolean).join(' \u00b7 ')+'</span>':'')+'</div>'+(tot>0?'<div class="kcp"><i style="width:'+pc+'%"></i></div>':'');}
function dayHead(){var vd=vD(),q=vd.split('-'),d=new Date(+q[0],+q[1]-1,+q[2]),t=vd===L();
 $('ttl').textContent=t?'Today':WD[d.getDay()];$('dCal').classList.toggle('on',!t);try{wkBar();}catch(e){}}
function daySet(k){vDay=(!k||k===L())?'':k;addDue=vDay||'today';animAll=true;tRender();}
function dayGo(n){var q=vD().split('-');daySet(dkey(new Date(+q[0],+q[1]-1,+q[2]+n)));}
function tRender(){
 var tgv=view==='targets',inb=view==='inbox'||tgv,f=tgv?'prog':inb?fI:fT,tl=L(),vd=vD();if(view==='today')dayHead();
 var items=tasks.filter(function(t){if(inb){if(!inInbox(t))return false;return f==='prog'?(kbd(t)&&onBoard(t,tl)):(kbd(t)?false:(f==='done'?t.done:!t.done));}if(f==='done')return t.done&&!inInbox(t)&&(t.due===vd||(t.doneAt>0&&L(lnow(t.doneAt))===vd));return vd===tl?isToday(t):(!t.done&&!inInbox(t)&&t.due===vd);});
 if(tgv)items=items.filter(function(t){return tgOf(t,tl)===tgTab;});
 if(f==='done')items.sort(function(a,b){return b.doneAt-a.doneAt;});$('in').placeholder=inb&&f==='prog'?'New target':(SYAPI.ch?SYAPI.sugg():'New task');if(f==='up')items.sort(function(a,b){return a.due<b.due?-1:a.due>b.due?1:0;});
 var _tg=inb&&f==='prog';if(_tg&&addSubs.length)addSubs=[];if(_tg){$('sbPanel').hidden=true;$('cSb').classList.remove('on');$('cSb').setAttribute('aria-expanded','false');}$('cSb').style.display=_tg?'none':'';$('in').closest('.card').style.display=f==='done'?'none':'';
 $('cDue').innerHTML=ICAL+esc(_tg?(addDue==='none'||!addDue?'Deadline':'Deadline \u00b7 '+dlab(addDue)):dlab(addDue));$('cSt').style.display=_tg?'':'none';$('cSt').innerHTML=ICAL+(addStart?'Start \u00b7 '+dueLbl(addStart):'Start \u00b7 Today');sbLbl();if(SYAPI.chip)SYAPI.chip();$('cSub').style.color='';$('cSub').innerHTML='<span class="dot" style="background:'+(addSb?SC(addSb):'#555')+'"></span>'+(addSb?SN(addSb):'Subject');
 var _od=tasks.filter(function(t){return!t.done&&!inInbox(t)&&t.due<tl;}).length,_tn=tasks.filter(function(t){return!t.done&&!inInbox(t)&&t.due===tl;}).length;var _ic=tasks.filter(function(t){return!t.done&&inInbox(t)&&!kbd(t);}).length,_idn=tasks.filter(function(t){return t.done&&inInbox(t)&&!kbd(t);}).length;$('sb').textContent=tgv?'Set a deadline, then move each target across the board.':inb?(_ic?_ic+(_ic===1?' item':' items')+' to sort \u00b7 capture now, schedule later.':'Capture now, schedule later.'):(_od?_od+' overdue · '+_tn+' today':_tn+' open · stay on top of it');
 $('gUp').style.display='none';$('wkSw').hidden=!(inb&&f==='prog');$('wkSw').setAttribute('aria-checked',wkTg?'true':'false');$('gPr').style.display='none';$('seg').style.display=tgv?'none':'';if(!tgv){$('seg').children[0].innerHTML=inb?'Open<b class="pcn">'+_ic+'</b>':'Open';$('seg').children[1].innerHTML=inb?'Completed<b class="pcn">'+_idn+'</b>':'Completed';}
 [].forEach.call($('seg').children,function(b){b.classList.toggle('on',b.dataset.g===f);});
 $('clr').hidden=!(f==='done'&&items.length);
 var h='',showH=false,late=function(t){return!t.done&&t.due&&t.due<tl;},
 row=function(t,i){var s=t.subj&&sub(t.subj),ls=late(t),dl=ls?ICAL+(function(n){return n===1?'Yesterday':n+' days ago';})(Math.round((parse(tl)-parse(t.due))/DAY)):(inb||t.due!==vd?dueLbl(t.due):'');var ip=t.done?'':(t.st==='prog'?'<span class="ip">In Progress</span>':(kbd(t)?'<span class="ip td">To Do</span>':''));return '<div class="task'+(Array.isArray(t.sub)&&t.sub.length?' hs':'')+(t.done?' done':'')+(inProg(t)?' inprog':'')+(t.id===freshId?' fresh':'')+'" data-id="'+t.id+'" title="Circle = done · Double-click = edit · Hold = rearrange" style="--i:'+i+'"><button class="chk" data-c="1" aria-label="Toggle '+esc(t.text)+'">'+(t.done?TICK:'')+'</button><div><div class="tt">'+esc(t.text)+(s?'<span class="tag" style="color:'+SC(s.id)+';background:'+SC(s.id)+'22;border:1px solid '+SC(s.id)+'55">'+esc(s.n)+'</span>':'')+ip+(SYAPI.tag?SYAPI.tag(t):'')+'</div><div class="due'+(ls?' late':'')+'">'+dl+(mkOf(t)?mkChip(t):sbChip(t))+'</div>'+(mkOf(t)?mkRows(t):sbRows(t))+'</div><button class="del" data-d="1" aria-label="Delete"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>';},
 grp=function(nm,arr,od,from){var cl=showH&&!!gcol[nm];return'<div class="grp'+(cl?' shut':'')+'"><div class="gh'+(od?' od':'')+(showH?'':' nohd')+'" data-gh="'+nm+'" role="button" tabindex="0" aria-expanded="'+(!cl)+'">'+GCH+'<span>'+nm+'</span><i>'+arr.length+'</i></div>'+(cl?'':arr.map(function(t,i){return row(t,from+i);}).join(''))+'</div>';};
 if(inb&&f==='prog')h=kbHtml(items);
 else if(!items.length)h=inb?'<div class="empty ibz"><span class="ibzi"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 13.5l2.4-7a2 2 0 0 1 1.9-1.4h8.4a2 2 0 0 1 1.9 1.4l2.4 7v4a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><path d="M3.5 13.5H8l1 2h6l1-2h4.5"/></svg></span><b>'+(f==='done'?'Nothing completed yet':'Inbox zero')+'</b><span>'+(f==='done'?'Finished inbox items show up here.':'Type a thought above. Give it a date whenever you are ready.')+'</span></div>':'<div class="empty">Nothing here — enjoy the calm ✨</div>';
 else if(!inb&&f==='open'){var od=vd===tl?items.filter(late):[],tn=items.filter(function(t){return od.indexOf(t)<0;});showH=od.length>0;h=(od.length?grp('Overdue',od,true,0):'')+(tn.length?grp('Today',tn,false,od.length):'');}
 else h=grp(f==='done'?'Completed':'Inbox',items,false,0);
 dpPaint();$('list').innerHTML=h;if(inb&&f==='prog')kbPost();else kbPv=0;$('list').classList.toggle('na',!animAll);animAll=false;freshId='';if(jig&&f!=='open')jigOff();tMeta();fillLink();wkSync();
}
var kbFil='';
function tgOf(t,tl){return t.due&&parse(t.due)-parse(tl)>7*DAY?'long':'week';}
var KBI={todo:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/></svg>',
 prog:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none"/></svg>',
 done:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M8.3 12.4l2.5 2.5 4.9-5.2"/></svg>'};
function kbNum(){var m=0,ch=false;tasks.forEach(function(t){if(kbd(t)&&t.tn>m)m=t.tn;});
 tasks.filter(function(t){return kbd(t)&&!t.tn;}).sort(function(a,b){return(a.at||0)-(b.at||0);}).forEach(function(t){t.tn=++m;ch=true;});
 if(ch)lsSet(TK,tasks);}
function kbId(t){var n=t.tn||0;return'T-'+(n<10?'0':'')+n;}
function kbUrg(t,tl){
 if(t.done){var lt=t.due&&t.doneAt&&L(lnow(t.doneAt))>t.due;return{c:lt?'warn':'ok',x:lt?'Done late':(t.due?'Done on time':'Done')};}
 if(!t.due)return{c:'nd',x:'No deadline'};
 var left=Math.round((parse(t.due)-parse(tl))/DAY);
 if(left<0)return{c:'bad',x:(-left)+(left===-1?' day':' days')+' overdue',l:left};
 if(left===0)return{c:'bad',x:'Due today',l:0};
 return{c:left<=2?'bad':left<=7?'warn':'ok',x:left+(left===1?' day':' days')+' left',l:left};}
function kbTl(t,tl,u){
 if(!t.due)return'';
 if(t.done)return'<div class="kcT"><div class="kcl"><span><em>COMPLETED</em>'+(t.doneAt?kbFm(L(lnow(t.doneAt))):'')+'</span><span class="r"><em>DEADLINE</em>'+kbFm(t.due)+'</span></div></div>';
 var tot=t.ds?Math.round((parse(t.due)-parse(t.ds))/DAY):0;
 if(!(tot>0))return'<div class="kcT"><div class="kcl"><span class="r" style="margin-left:0"><em>DEADLINE</em>'+kbFm(t.due)+'</span></div></div>';
 var pc=Math.max(0,Math.min(100,Math.round((parse(tl)-parse(t.ds))/DAY/tot*100))),pre=tl<t.ds?Math.round((parse(t.ds)-parse(tl))/DAY):0;
 return'<div class="kcT u-'+u.c+'"><div class="kcl"><span><em>START</em>'+kbFm(t.ds)+'</span><span class="mid">'+(pre?'starts in '+pre+(pre===1?' day':' days'):tot+(tot===1?' day':' days')+' plan')+'</span><span class="r"><em>DEADLINE</em>'+kbFm(t.due)+'</span></div><div class="kcp"><i style="width:'+pc+'%"></i><u style="left:'+pc+'%"></u></div></div>';}
function kbHtml(items){
 kbNum();
 var tl=L(),n=items.length,col={todo:[],prog:[],done:[]},keyOf=function(t){return t.subj&&sub(t.subj)?t.subj:'gen';};
 items.forEach(function(t){col[t.done?'done':t.st==='prog'?'prog':'todo'].push(t);});
 var d=col.done.length,pc=n?Math.round(d/n*100):0,
  od=items.filter(function(t){return!t.done&&t.due&&t.due<tl;}).length,
  NM={todo:'To Do',prog:'In Progress',done:'Done'},
  EM={todo:'Nothing planned',prog:'Drag a card here or press Start',done:'Nothing done yet'};
 /* subject filter chips */
 var sj={},order=[];items.forEach(function(t){var k=keyOf(t);if(!sj[k]){sj[k]=0;order.push(k);}sj[k]++;});
 if(kbFil&&!sj[kbFil])kbFil='';
 var chipC=function(k){return k==='gen'?'#8e8e93':SC(k);},chipN=function(k){return k==='gen'?'General':SN(k);};
 var chips=order.length>1||kbFil?'<div class="kbf" role="group" aria-label="Filter targets by subject"><button type="button" class="kbfc'+(kbFil?'':' on')+'" data-kf="">All<b>'+n+'</b></button>'+order.map(function(k){return'<button type="button" class="kbfc'+(kbFil===k?' on':'')+'" data-kf="'+k+'" style="--sc:'+chipC(k)+'"><i></i>'+chipN(k)+'<b>'+sj[k]+'</b></button>';}).join('')+'</div>':'';
 /* next deadline */
 var nx=items.filter(function(t){return!t.done&&t.due;}).sort(function(a,b){return a.due<b.due?-1:a.due>b.due?1:((b.st==='prog')-(a.st==='prog'));})[0],nxh='';
 if(nx){var nu=kbUrg(nx,tl),ns=nx.subj&&sub(nx.subj);nxh='<div class="kbnx u-'+nu.c+'"><span class="kbnl">NEXT DEADLINE</span><span class="kcn">'+kbId(nx)+'</span><span class="kbnt">'+esc(nx.text)+'</span><span class="kbns" style="--sc:'+(ns?SC(ns.id):'#8e8e93')+'"><i></i>'+(ns?esc(ns.n):'General')+'</span><span class="kcu u-'+nu.c+'">'+nu.x+'</span></div>';}
 var st=[['Total',n,''],['To Do',col.todo.length,'todo'],['In Progress',col.prog.length,'prog'],['Done',d,'done'],['Overdue',od,od?'bad':'zero']].map(function(a){return'<div class="kbs '+a[2]+'"><strong>'+a[1]+'</strong><span>'+a[0]+'</span></div>';}).join('');
 var vis=function(t){return!kbFil||keyOf(t)===kbFil;};
 var card=function(t,k){var s=t.subj&&sub(t.subj),c=s?SC(s.id):'#8e8e93',u=kbUrg(t,tl);
  return'<div class="kc k-'+k+(t.id===freshId?' fresh':'')+'" draggable="true" data-id="'+t.id+'" style="--sc:'+c+'"><div class="kc1"><span class="kci">'+KBI[k]+'</span><span class="kch"><i></i>'+(s?esc(s.n):'General')+'</span><span class="kcu u-'+u.c+'">'+u.x+'</span></div><div class="kct">'+esc(t.text)+'</div>'+kbTl(t,tl,u)+'<div class="kca"><button type="button" class="kcb" data-ka="'+(k==='todo'?'prog':k==='prog'?'done':'todo')+'">'+(k==='todo'?'Start':k==='prog'?'Mark done':'Reopen')+'</button><button type="button" class="kcx" data-kd="1" aria-label="Delete">'+TRASH+'</button></div></div>';};
 return'<div class="kb"><div class="kbp'+(pc===100&&n?' full':'')+(pc?'':' zero')+'"><div class="kbh"><span class="kbcap">Completion progress</span><b data-pc="'+pc+'">'+Math.round(kbPv)+'%</b><em>'+d+'/'+n+' Completed</em></div><svg class="kbr" viewBox="0 0 100 100" aria-hidden="true"><circle class="kbrt" cx="50" cy="50" r="42"/><circle class="kbra" cx="50" cy="50" r="42" pathLength="100" style="stroke-dashoffset:'+(100-kbPv)+'"/></svg></div>'+chips+
  '<div class="kbg">'+['todo','prog','done'].map(function(k){var a=col[k].filter(vis);return'<div class="kbc" data-k="'+k+'"><h4><span class="kbi">'+KBI[k]+'</span>'+NM[k]+'<em>'+a.length+'</em></h4><div class="kbl">'+(a.length?a.map(function(t){return card(t,k);}).join(''):'<div class="kbe">'+(kbFil&&col[k].length?'No '+chipN(kbFil)+' targets here':EM[k])+'</div>')+'</div></div>';}).join('')+'</div></div>';}
$('list').addEventListener('click',function(e){var b=e.target.closest('[data-kf]');if(!b)return;kbFil=b.dataset.kf;tRender();});
function kbSet(t,k){if(!t)return;var was=t.done,el=[].filter.call($('list').querySelectorAll('.kc'),function(e){return e.dataset.id===t.id;})[0],rc=el&&el.getBoundingClientRect();
 if(k==='done'){t.done=true;t.doneAt=Date.now();t.st='';}else{t.done=false;t.doneAt=0;t.st=k==='prog'?'prog':'';}t.bd=true;tSave();
 kbFlip(function(){tRender();});if(k==='done'&&!was)kbCelebrate(t,rc);}
var kbDrag='';
$('list').addEventListener('click',function(e){var b=e.target.closest('[data-ka],[data-kd]');if(!b)return;var c=b.closest('.kc'),t=c&&tasks.filter(function(x){return x.id===c.dataset.id;})[0];if(!t)return;
 if(b.dataset.kd){c.classList.add('kout');setTimeout(function(){tasks=tasks.filter(function(x){return x!==t;});tSave();kbFlip(function(){tRender();});},200);}else kbSet(t,b.dataset.ka);});
$('list').addEventListener('dragstart',function(e){var c=e.target.closest&&e.target.closest('.kc');if(!c)return;kbDrag=c.dataset.id;e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain',kbDrag);}catch(x){}setTimeout(function(){c.classList.add('drag');},0);});
$('list').addEventListener('dragend',function(){kbDrag='';[].forEach.call(this.querySelectorAll('.over,.drag'),function(n){n.classList.remove('over','drag');});});
$('list').addEventListener('dragover',function(e){var c=e.target.closest&&e.target.closest('.kbc');if(!c||!kbDrag)return;e.preventDefault();e.dataTransfer.dropEffect='move';[].forEach.call(this.querySelectorAll('.kbc'),function(n){n.classList.toggle('over',n===c);});});
$('list').addEventListener('dragleave',function(e){if(!this.contains(e.relatedTarget))[].forEach.call(this.querySelectorAll('.kbc'),function(n){n.classList.remove('over');});});
$('list').addEventListener('drop',function(e){var c=e.target.closest&&e.target.closest('.kbc');if(!c||!kbDrag)return;e.preventDefault();var id=kbDrag;kbDrag='';kbSet(tasks.filter(function(x){return x.id===id;})[0],c.dataset.k);});
function tById(el){var r=el.closest('.task');return r&&tasks.filter(function(x){return x.id===r.dataset.id;})[0];}
/* click = done (as before) · double-click / double-tap = edit */
var DCK={id:'',t:0,tm:0,rev:null},DCW=350,holdBlock=0;
function rowEl(id){var r=$('list').querySelectorAll('.task'),i;for(i=0;i<r.length;i++)if(r[i].dataset.id===id)return r[i];return null;}
function tgl(t){var li=rowEl(t.id),c=li&&li.querySelector('[data-c]');t.done=!t.done;if(t.done&&Array.isArray(t.sub))t.sub.forEach(function(x){x.done=true;});t.doneAt=t.done?Date.now():0;t.st='';tSave();tMeta();
 if(!li||!c){tRender();return;}
 li.classList.toggle('done',t.done);li.classList.toggle('tkpop',t.done);c.innerHTML=t.done?TICK:'';if(t.done)sbParentDone(t,li);
 clearTimeout(tickT);var w=560;clearTimeout(outT);outT=setTimeout(function(){li.classList.add('out');},w);tickT=setTimeout(tRender,w+320);}
$('list').addEventListener('click',function(e){
 var d=e.target.closest('[data-d]'),t;
 if(d&&(t=tById(d))){tasks=tasks.filter(function(x){return x!==t;});tSave();tRender();return;}
 if(Date.now()<holdBlock)return;
 var r0=e.target.closest('.task');if(!r0||r0.classList.contains('out'))return;
 t=tById(r0);if(!t)return;
 if(e.target.closest('[data-c]')){DCK.id='';tgl(t);return;}/* only the circle toggles done */
 if(jig)return;
 var now=Date.now();
 if(DCK.id===t.id&&now-DCK.t<DCW){DCK.id='';etOpen(t);return;}/* row par double-click / double-tap = edit */
 DCK.id=t.id;DCK.t=now;
});
$('list').addEventListener('dblclick',function(e){var c=e.target.closest('.kc');if(!c||e.target.closest('button'))return;var t=tasks.filter(function(x){return x.id===c.dataset.id;})[0];if(t)etOpen(t);});
/* ===== long-press -> iOS-style jiggle -> drag to reorder (Open lists only; order = tasks array order) ===== */
var HOLD=420,hT=0,hX=0,hY=0,hRow=null,hId=0,jig=false,dg=null,dgRaf=0;
function grpOf(t){var inb=view==='inbox'||view==='targets',f=view==='targets'?'prog':inb?fI:fT,tl=L();if(f!=='open')return null;
 var all=tasks.filter(function(x){return inb?(inInbox(x)&&!x.done):isToday(x);});
 if(all.indexOf(t)<0)return null;if(inb)return{n:'Inbox',a:all};
 var lt=function(x){return x.due<tl;},od=lt(t);return{n:od?'Overdue':'Today',a:all.filter(function(x){return lt(x)===od;})};}
function jigOn(){jig=true;$('list').classList.add('jig');}
function jigOff(){dgEnd(false);holdCancel();jig=false;$('list').classList.remove('jig');}
function holdCancel(){clearTimeout(hT);hT=0;hRow=null;}
function dgStart(r,id,y){
 var t=tById(r);if(!t||!grpOf(t))return;
 dg={r:r,par:r.parentNode,id:id,y:y,go:y-r.getBoundingClientRect().top,sc:S.querySelector('.td-body')};
 r.style.transition='';r.classList.add('dragging');
 try{r.setPointerCapture(id);}catch(_){}
 try{if(navigator.vibrate)navigator.vibrate(12);}catch(_){}
 dgPlace();dgRaf=requestAnimationFrame(dgLoop);}
function dgRows(d){return[].filter.call(d.par.children,function(n){return n.classList&&n.classList.contains('task')&&!n.classList.contains('out');});}
function dgPlace(){
 var d=dg;if(!d)return;var r=d.r;r.style.transform='none';
 var rows=dgRows(d),i=rows.indexOf(r),j=i,h=r.getBoundingClientRect().height,cy=d.y-d.go+h/2,m;
 while(j>0){m=rows[j-1].getBoundingClientRect();if(cy<m.top+m.height/2)j--;else break;}
 while(j<rows.length-1){m=rows[j+1].getBoundingClientRect();if(cy>m.top+m.height/2)j++;else break;}
 if(j!==i&&i>=0){
  var bf=rows.map(function(n){return n.getBoundingClientRect().top;});
  if(j<i)d.par.insertBefore(r,rows[j]);else d.par.insertBefore(r,rows[j].nextSibling);
  rows.forEach(function(n,k){if(n===r)return;var dl=bf[k]-n.getBoundingClientRect().top;if(dl&&n.animate)n.animate([{transform:'translateY('+dl+'px)'},{transform:'none'}],{duration:230,easing:'cubic-bezier(.2,.8,.2,1)'});});}
 r.style.transform='translateY('+(d.y-d.go-r.getBoundingClientRect().top)+'px) scale(1.03)';}
function dgLoop(){
 var d=dg;if(!d)return;var s=d.sc;
 if(s){var b=s.getBoundingClientRect(),z=70,v=0;if(d.y<b.top+z)v=-(b.top+z-d.y)/5;else if(d.y>b.bottom-z)v=(d.y-(b.bottom-z))/5;if(v)s.scrollTop+=Math.max(-18,Math.min(18,v));}
 dgPlace();dgRaf=requestAnimationFrame(dgLoop);}
function dgEnd(commit){
 var d=dg;if(!d)return;dg=null;cancelAnimationFrame(dgRaf);holdBlock=Date.now()+500;jig=false;$('list').classList.remove('jig');
 try{d.r.releasePointerCapture(d.id);}catch(_){}
 if(!commit){d.r.classList.remove('dragging');d.r.style.transform='';d.r.style.transition='';return;}
 var ids=dgRows(d).map(function(n){return n.dataset.id;}),
  grp=ids.map(function(id){return tasks.filter(function(x){return x.id===id;})[0];}).filter(Boolean),
  slots=grp.map(function(x){return tasks.indexOf(x);}).sort(function(a,b){return a-b;}),
  moved=slots.some(function(ix,k){return tasks[ix]!==grp[k];});
 if(moved){slots.forEach(function(ix,k){tasks[ix]=grp[k];});tSave();}
 d.r.style.transition='transform .18s ease,box-shadow .18s ease';d.r.style.transform='none';
 setTimeout(function(){if(moved)tRender();else{d.r.classList.remove('dragging');d.r.style.transform='';d.r.style.transition='';}},190);}
$('list').addEventListener('pointerdown',function(e){if(e.pointerType==='mouse'&&e.button!==0)return;
 var r=e.target.closest&&e.target.closest('.task');if(!r||r.classList.contains('out')||e.target.closest('button'))return;
 var t=tById(r);if(!t||!grpOf(t))return;
 holdCancel();hRow=r;hX=e.clientX;hY=e.clientY;hId=e.pointerId;
 if(!jig)hT=setTimeout(function(){hT=0;var r2=hRow;if(!r2)return;hRow=null;jigOn();holdBlock=Date.now()+900;dgStart(r2,hId,hY);},HOLD);});
$('list').addEventListener('pointermove',function(e){
 if(dg){if(e.pointerId===dg.id)dg.y=e.clientY;return;}
 if(!hRow)return;hY=e.clientY;
 var mv=Math.max(Math.abs(e.clientX-hX),Math.abs(e.clientY-hY));
 if(jig){if(mv>5){var r=hRow;hRow=null;dgStart(r,e.pointerId,e.clientY);}}
 else if(mv>10)holdCancel();});
['pointerup','pointercancel'].forEach(function(n){$('list').addEventListener(n,function(){if(dg)dgEnd(true);holdCancel();});});
$('list').addEventListener('pointerleave',function(){if(!dg)holdCancel();});
$('list').addEventListener('touchmove',function(e){if(dg||(jig&&hRow))e.preventDefault();},{passive:false});
$('list').addEventListener('contextmenu',function(e){if(hRow||jig||Date.now()<holdBlock)e.preventDefault();});

/* ===== subtasks inside task rows: tick / auto-tick / hold-drag reorder ===== */
function sbRows(t){var a=Array.isArray(t.sub)?t.sub:[];if(!a.length)return'';var h='<div class="sbl" data-sb="'+t.id+'">';a.forEach(function(x){h+='<div class="sbk'+(x.done?' done':'')+'" data-sid="'+x.id+'"><button type="button" class="sbc" data-sc="1" aria-label="Toggle subtask">'+(x.done?TICK:'')+'</button><span class="sbtx">'+esc(x.text)+'</span></div>';});return h+'</div>';}
function sbChipSync(t,li){var du=li&&li.querySelector('.due');if(!du)return;var c=du.querySelector('.sbp');if(c)c.remove();du.insertAdjacentHTML('beforeend',sbChip(t));}
function sbSet(t,li,x,v,delay){x.done=v;var k=li&&li.querySelector('.sbk[data-sid="'+x.id+'"]');if(!k)return;var b=k.querySelector('.sbc');setTimeout(function(){k.classList.toggle('done',v);b.innerHTML=v?TICK:'';b.classList.remove('sbpop');if(v){void b.offsetWidth;b.classList.add('sbpop');}},delay||0);}
function sbParentDone(t,li){var n=0;(t.sub||[]).forEach(function(x){if(!x.done||true){var k=li.querySelector('.sbk[data-sid="'+x.id+'"]');if(k&&!k.classList.contains('done')){sbSet(t,li,x,true,n*110);n++;}}});sbChipSync(t,li);}
function sbCtx(e){var k=e.target.closest&&e.target.closest('.sbk');if(!k)return null;var l=k.closest('.sbl'),t=tasks.filter(function(x){return x.id===l.dataset.sb;})[0];return t?{k:k,l:l,t:t}:null;}
['dblclick','mousedown','touchstart'].forEach(function(ev){$('list').addEventListener(ev,function(e){if(e.target.closest&&e.target.closest('.sbl'))e.stopPropagation();},{capture:true,passive:true});});
$('list').addEventListener('click',function(e){var c=sbCtx(e);if(!c)return;e.stopPropagation();if(Date.now()<holdBlock||!e.target.closest('[data-sc]'))return;
 var x=(c.t.sub||[]).filter(function(y){return y.id===c.k.dataset.sid;})[0],li=rowEl(c.t.id);if(!x)return;sbSet(c.t,li,x,!x.done,0);tSave();sbChipSync(c.t,li);},true);
var sd=null,sT=0,sH=null;
function sbCancel(){clearTimeout(sT);sT=0;sH=null;}
$('list').addEventListener('pointerdown',function(e){var c=sbCtx(e);if(!c)return;e.stopPropagation();if(e.pointerType==='mouse'&&e.button!==0)return;if(e.target.closest('button')||c.l.children.length<2)return;
 sbCancel();sH={c:c,x:e.clientX,y:e.clientY,id:e.pointerId};sT=setTimeout(function(){sT=0;var h=sH;if(!h)return;sH=null;sbStart(h.c,h.id,h.y);},HOLD);},true);
function sbStart(c,id,y){sd={k:c.k,l:c.l,t:c.t,id:id,y:y,go:y-c.k.getBoundingClientRect().top};c.l.classList.add('jig');c.k.classList.add('dragging');holdBlock=Date.now()+900;
 try{c.k.setPointerCapture(id);}catch(_){}try{if(navigator.vibrate)navigator.vibrate(12);}catch(_){}sbPlace();}
function sbPlace(){var d=sd;if(!d)return;var k=d.k;k.style.transform='none';var rows=[].slice.call(d.l.children),i=rows.indexOf(k),j=i,h=k.getBoundingClientRect().height,cy=d.y-d.go+h/2,m;
 while(j>0){m=rows[j-1].getBoundingClientRect();if(cy<m.top+m.height/2)j--;else break;}
 while(j<rows.length-1){m=rows[j+1].getBoundingClientRect();if(cy>m.top+m.height/2)j++;else break;}
 if(j!==i){var bf=rows.map(function(n){return n.getBoundingClientRect().top;});
  if(j<i)d.l.insertBefore(k,rows[j]);else d.l.insertBefore(k,rows[j].nextSibling);
  rows.forEach(function(n,q){if(n===k)return;var dl=bf[q]-n.getBoundingClientRect().top;if(dl&&n.animate)n.animate([{transform:'translateY('+dl+'px)'},{transform:'none'}],{duration:230,easing:'cubic-bezier(.2,.8,.2,1)'});});}
 k.style.transform='translateY('+(d.y-d.go-k.getBoundingClientRect().top)+'px) scale(1.03)';}
function sbEnd(){var d=sd;if(!d)return;sd=null;holdBlock=Date.now()+500;d.l.classList.remove('jig');try{d.k.releasePointerCapture(d.id);}catch(_){}
 var ids=[].map.call(d.l.children,function(n){return n.dataset.sid;}),old=d.t.sub||[],nw=ids.map(function(id){return old.filter(function(x){return x.id===id;})[0];}).filter(Boolean);
 if(nw.length===old.length&&nw.some(function(x,q){return x!==old[q];})){d.t.sub=nw;tSave();}
 d.k.style.transition='transform .18s ease,box-shadow .18s ease';d.k.style.transform='none';setTimeout(function(){d.k.classList.remove('dragging');d.k.style.transform='';d.k.style.transition='';},190);}
$('list').addEventListener('pointermove',function(e){if(sd){if(e.pointerId===sd.id){sd.y=e.clientY;sbPlace();}return;}
 if(sH&&Math.max(Math.abs(e.clientX-sH.x),Math.abs(e.clientY-sH.y))>10)sbCancel();});
['pointerup','pointercancel'].forEach(function(n){$('list').addEventListener(n,function(){if(sd)sbEnd();sbCancel();});});
$('list').addEventListener('touchmove',function(e){if(sd)e.preventDefault();},{passive:false});
$('list').addEventListener('contextmenu',function(e){if(sd||sH||Date.now()<holdBlock)e.preventDefault();});
/* edit-task modal */
function bdClose(el,fn){var dn=false;el.addEventListener('mousedown',function(e){dn=(e.target===el);});el.addEventListener('touchstart',function(e){dn=(e.target===el);},{passive:true});el.addEventListener('click',function(e){var ok=dn&&e.target===el;dn=false;if(ok)fn();});}
var etCur=null,ETD=/^\d{4}-\d{2}-\d{2}$/;
var etCv=null,ETLK='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>';
function etChPaint(){var b=$('etCh');if(!b)return;var t=etCur,lb=etCv&&SYAPI.chLabel?SYAPI.chLabel(etCv):null,lock=!!(t&&t.cn);
 if(lb){b.innerHTML='<button type="button" class="etchb on" data-a="pick"'+(lock?' disabled':'')+'>'+ETLK+'<span>'+esc(lb.n)+' \u00b7 '+esc(lb.k)+'</span></button>'+(lock?'':'<button type="button" class="etchx" data-a="rm" aria-label="Remove chapter link">\u2715</button>');}
 else b.innerHTML='<button type="button" class="etchb ic" data-a="pick" aria-label="Link a chapter" title="Link a chapter">'+ETLK+'</button>';
 b.classList.toggle('lock',lock);b.title=lock?'Un-complete the task to change its chapter':'';}
function etOpen(t){etCur=t;etCv=t.ch&&SYAPI.chLabel&&SYAPI.chLabel({id:t.ch})?{id:t.ch,lk:t.lk||'l'}:null;etChPaint();var h='<option value="">General</option>';subs.forEach(function(x){h+='<option value="'+esc(x.id)+'">'+esc(x.n)+'</option>';});
 $('etS').innerHTML=h;$('etS').value=t.subj&&sub(t.subj)?t.subj:'';etSbPaint();$('etD').value=ETD.test(t.due)?t.due:'';$('etSD').value=ETD.test(t.ds)?t.ds:'';$('etSDB').style.display=t.bd?'':'none';etDLbl();etSLbl();etDClose();etSClose();$('etTx').value=t.text;etSub=(Array.isArray(t.sub)?t.sub:[]).map(function(x){return{id:x.id,text:x.text,done:!!x.done};});sbPaint($('etSb'),function(){return etSub;},false);$('etm').classList.add('on');
 setTimeout(function(){var x=$('etTx');x.focus({preventScroll:true});x.setSelectionRange(x.value.length,x.value.length);},120);}
function etSbPaint(){var v=$('etS').value,o=sub(v);$('etSt').textContent=o?o.n:'General';var d=$('etSd');d.style.background=o?SC(v):'rgba(255,255,255,.28)';}
function etDLbl(){var v=$('etD').value,tg=etCur&&etCur.bd;$('etDt').textContent=ETD.test(v)?(tg?'Deadline \u00b7 ':'')+dueLbl(v):(tg?'Deadline':'No date');}
function etSLbl(){var v=$('etSD').value;$('etSDt').textContent=ETD.test(v)?'Start \u00b7 '+dueLbl(v):'Start date';}
function etSClose(){$('etSDP').classList.remove('on');$('etSDB').setAttribute('aria-expanded','false');}
var etPy=0,etPm=0;
function etDClose(){$('etDP').classList.remove('on');$('etDB').setAttribute('aria-expanded','false');}
function etCalH(id){var f=(new Date(etPy,etPm,1).getDay()+6)%7,n=new Date(etPy,etPm+1,0).getDate(),cur=$(id||'etD').value,h='<div class="mc"><div class="mch"><button type="button" data-pn="-1">\u2039</button><span>'+new Date(etPy,etPm,1).toLocaleString('en',{month:'long',year:'numeric'})+'</span><button type="button" data-pn="1">\u203a</button></div><div class="mcg">'+'MTWTFSS'.split('').map(function(x){return'<em>'+x+'</em>';}).join(''),i,k;
 for(i=0;i<f;i++)h+='<i></i>';
 for(i=1;i<=n;i++){k=L(new Date(etPy,etPm,i));h+='<button type="button" data-pd="'+k+'" class="'+(k===L()?'t ':'')+(k===cur?'s':'')+'">'+i+'</button>';}
 return h+'</div><button type="button" class="cus" data-nd="1" style="margin-top:6px">No date</button></div>';}
function etClose(){closeDD();etDClose();etSClose();$('etm').classList.remove('on');etCur=null;}
function etSave(){var t=etCur;if(!t)return;var v=$('etTx').value.replace(/\s+/g,' ').trim().slice(0,200);if(!v){toast('Task description can\'t be empty');$('etTx').focus();return;}
 var d=$('etD').value,sd=$('etSD').value;if(t.bd&&ETD.test(sd)&&ETD.test(d)&&sd>d){toast('Start date can\'t be after the deadline');return;}sbFlush($('etSb'),function(){return etSub;});t.sub=etSub.filter(function(x){return x.text&&x.text.trim();}).map(function(x){return{id:x.id||nid(),text:x.text.trim().slice(0,120),done:!!x.done};});t.text=v;t.subj=sub($('etS').value)?$('etS').value:'';if(!t.cn){t.ch=etCv?etCv.id:'';t.lk=etCv?etCv.lk:'l';}t.due=ETD.test(d)?d:'';if(t.bd)t.ds=ETD.test(sd)?sd:'';wkFixTime(t);tSave();etClose();tRender();toast('Task updated');}
sbBind($('sbPanel'),function(){return addSubs;},sbLbl);sbBind($('etSb'),function(){return etSub;},function(){});sbGrip($('etSb'),function(){return etSub;});
$('cSb').addEventListener('click',function(){var p=$('sbPanel'),open=p.hidden;p.hidden=!open;this.classList.toggle('on',open);this.setAttribute('aria-expanded',open);if(open)sbPaint(p,function(){return addSubs;},true);else{sbFlush(p,function(){return addSubs;});sbLbl();}});
$('etCh').addEventListener('click',function(e){var b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.a==='rm'){etCv=null;etChPaint();}else SYAPI.cpOpen(true);});
SYAPI.etPick=function(v){etCv={id:v.id,lk:v.lk};if(v.subj&&sub(v.subj)){$('etS').value=v.subj;etSbPaint();}etChPaint();};
$('etDB').addEventListener('click',function(){etSClose();var p=$('etDP');if(p.classList.contains('on')){etDClose();return;}closeDD();var v=$('etD').value,b=ETD.test(v)?new Date(v+'T00:00'):lnow();etPy=b.getFullYear();etPm=b.getMonth();p.innerHTML=etCalH();p.classList.add('on');this.setAttribute('aria-expanded','true');});
$('etDP').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var D=b.dataset;
 if('pn' in D){etPm+=+D.pn;if(etPm>11){etPm=0;etPy++;}if(etPm<0){etPm=11;etPy--;}this.innerHTML=etCalH();return;}
 if('pd' in D)$('etD').value=D.pd;else if('nd' in D)$('etD').value='';else return;etDLbl();etDClose();});
$('etSB').addEventListener('click',function(){etDClose();etSClose();});
$('etSDB').addEventListener('click',function(){var p=$('etSDP');if(p.classList.contains('on')){etSClose();return;}closeDD();etDClose();var v=$('etSD').value,b=ETD.test(v)?new Date(v+'T00:00'):lnow();etPy=b.getFullYear();etPm=b.getMonth();p.innerHTML=etCalH('etSD');p.classList.add('on');this.setAttribute('aria-expanded','true');});
$('etSDP').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var D=b.dataset;
 if('pn' in D){etPm+=+D.pn;if(etPm>11){etPm=0;etPy++;}if(etPm<0){etPm=11;etPy--;}this.innerHTML=etCalH('etSD');return;}
 if('pd' in D)$('etSD').value=D.pd;else if('nd' in D)$('etSD').value='';else return;etSLbl();etSClose();});
$('etm').addEventListener('click',function(e){var P=e.composedPath();if($('etSDP').classList.contains('on')&&P.indexOf($('etSDP'))<0&&P.indexOf($('etSDB'))<0)etSClose();});
$('etm').addEventListener('click',function(e){var P=e.composedPath();if($('etDP').classList.contains('on')&&P.indexOf($('etDP'))<0&&P.indexOf($('etDB'))<0)etDClose();});
$('etX').addEventListener('click',etClose);$('etCancel').addEventListener('click',etClose);$('etSave').addEventListener('click',etSave);
bdClose($('etm'),etClose);
$('etTx').addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.isComposing){e.preventDefault();etSave();}});
$('wkSw').addEventListener('click',function(){wkTg=!wkTg;lsSet('pf-wkt',wkTg?1:0);this.setAttribute('aria-checked',wkTg?'true':'false');toast(wkTg?'Targets will show in Week':'Targets hidden from Week');});
$('seg').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;if(view==='inbox')fI=b.dataset.g;else{fT=b.dataset.g;addDue=vDay||'today';}animAll=true;tRender();});
$('dPv').addEventListener('click',function(){dayGo(-1);});
$('dNx').addEventListener('click',function(){dayGo(1);});
$('dCal').addEventListener('click',function(){daySet('');});
$('cSt').addEventListener('click',function(){popFor='st';var h='',o=[['today','Today'],['tomorrow','Tomorrow'],['week','Next week']];o.forEach(function(x){h+='<button data-st="'+x[0]+'">'+x[1]+'</button>';});h+='<div class="sep"></div><button data-cal="1">'+ICAL+'Pick a date\u2026</button>';popOpen(h,this);});
$('cStI').addEventListener('change',function(){addStart=this.value||'';tRender();});
var _lk=L();setInterval(function(){var k=L();if(k!==_lk){_lk=k;if(view==='today'||view==='inbox'||view==='targets')tRender();}},30000);
$('list').addEventListener('click',function(e){var g=e.target.closest('.gh[data-gh]');if(!g)return;gcol[g.dataset.gh]=!gcol[g.dataset.gh];tRender();});
$('list').addEventListener('keydown',function(e){if(e.key!=='Enter'&&e.key!==' ')return;var g=e.target.closest&&e.target.closest('.gh[data-gh]');if(!g)return;e.preventDefault();gcol[g.dataset.gh]=!gcol[g.dataset.gh];tRender();});
$('cDue').title='Due date';$('cSub').title='Subject';$('cSb').title='Subtasks';
(function(){var c=$('in').closest('.card.add');
 c.addEventListener('pointerdown',function(){c.classList.add('open');});
 $('in').addEventListener('focus',function(){c.classList.add('open');});
 S.addEventListener('pointerdown',function(e){if(e.composedPath().indexOf(c)>-1)return;if($('in').value||addSubs.length||!$('sbPanel').hidden||$('pop').classList.contains('on')||$('plp').classList.contains('on'))return;c.classList.remove('open');});})();
$('clr').addEventListener('click',function(){var inb=view==='inbox';tasks=tasks.filter(function(t){return!(t.done&&(inb?inInbox(t)&&!kbd(t):!inInbox(t)));});tSave();tRender();});
$('in').addEventListener('focus',function(){$('pop').classList.remove('on');});
$('in').addEventListener('keydown',function(e){if(e.key==='Enter'&&(this.value.trim()||SYAPI.ch)){$('pop').classList.remove('on');var nt={sub:sbTake(),id:nid(),text:(this.value.trim()||SYAPI.sugg()).slice(0,200),done:false,due:dv(addDue),ds:tgStart(),subj:addSb,at:Date.now(),doneAt:0,src:(view==='inbox'||view==='targets')?'inbox':'',st:'',bd:view==='targets',ch:SYAPI.ch?SYAPI.ch.id:'',lk:SYAPI.ch?SYAPI.ch.lk:'l',cn:0};SYAPI.ch=null;tasks.push(nt);freshId=nt.id;$('v-tasks').classList.remove('addopen');addStart='';if(view==='today'&&nt.due&&nt.due!==vD()&&!(vD()===L()&&nt.due<L()))toast('Added to '+dueLbl(nt.due));tSave();this.value='';if(view==='targets'?false:view==='inbox'?fI==='done':fT==='done'){if(view==='inbox')fI='open';else fT='open';animAll=true;}tRender();}});
/* popups: date + subject */
function popOpen(h,b){var p=$('pop');if(p.classList.contains('on')&&p.dataset.o===b.id){p.classList.remove('on');return;}p.dataset.o=b.id;p.innerHTML=h;p.style.left=b.offsetLeft+'px';p.classList.remove('on');void p.offsetWidth;p.classList.add('on');}
$('cDue').addEventListener('click',function(){popFor='due';var h='';for(var k in DL)h+='<button data-due="'+k+'">'+DL[k]+'</button>';h+='<div class="sep"></div><button data-cal="1">'+ICAL+'Pick a date…</button>';popOpen(h,this);});
$('cSub').addEventListener('click',function(){var h='';subs.forEach(function(s){h+='<button data-sub="'+s.id+'"'+(s.id===addSb?' class="sel"':'')+'><span class="dot" style="background:'+SC(s.id)+'"></span>'+esc(s.n)+'</button>';});
 h+='<button data-cus="1" class="cus"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Custom</button>';popOpen(h,this);});
function calH(){var f=(new Date(pcy,pcm,1).getDay()+6)%7,n=new Date(pcy,pcm+1,0).getDate(),cur=popFor==='st'?(addStart||L()):dv(addDue),h='<div class="mc"><div class="mch"><button data-pn="-1">‹</button><span>'+new Date(pcy,pcm,1).toLocaleString('en',{month:'long',year:'numeric'})+'</span><button data-pn="1">›</button></div><div class="mcg">'+'MTWTFSS'.split('').map(function(x){return'<em>'+x+'</em>';}).join(''),i,k;
 for(i=0;i<f;i++)h+='<i></i>';
 for(i=1;i<=n;i++){k=L(new Date(pcy,pcm,i));h+='<button data-pd="'+k+'" class="'+(k===L()?'t ':'')+(k===cur?'s':'')+'">'+i+'</button>';}
 return h+'</div></div>';}
$('pop').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var D=b.dataset;
 if('pn' in D){pcm+=+D.pn;if(pcm>11){pcm=0;pcy++;}if(pcm<0){pcm=11;pcy--;}this.innerHTML=calH();return;}
 if('cal' in D){var t=lnow();pcy=t.getFullYear();pcm=t.getMonth();this.innerHTML=calH();return;}
 if('cus' in D){this.classList.remove('on');mdOpen();return;}
 if('st' in D)addStart=(D.st==='today'?'':D.st==='tomorrow'?L(addD(lnow(),1)):D.st==='week'?L(addD(lnow(),7)):D.st);else if('due' in D)addDue=D.due;else if('pd' in D){if(popFor==='st')addStart=D.pd;else addDue=D.pd;}else if('sub' in D)addSb=addSb===D.sub?'':D.sub;
 this.classList.remove('on');tRender();});
/* generic capsule dropdown (same look as the calendar popup) */
var DDS={};
function mkDD(btn,pop,items,cb){DDS[pop]={btn:btn,items:items,cb:cb};
 $(btn).addEventListener('click',function(){var d=DDS[pop],p=$(pop),open=p.classList.contains('on');closeDD();if(open)return;
  var cur=d.items.sel(),h='';d.items.list().forEach(function(o){h+='<button data-v="'+esc(o.v)+'"'+(o.v===cur?' class="sel"':'')+'>'+(o.c?'<span class="dot" style="background:'+o.c+'"></span>':'')+'<span>'+esc(o.t)+'</span>'+(o.v===cur?CHK:'')+'</button>';});
  p.innerHTML=h;p.classList.add('on');$(btn).parentNode.classList.add('open');});
 $(pop).addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;closeDD();cb(b.dataset.v);});}
mkDD('etSB','etSP',{list:function(){var l=[{v:'',t:'General'}];subs.forEach(function(x){l.push({v:x.id,t:x.n,c:SC(x.id)});});return l;},sel:function(){return $('etS').value;}},function(v){$('etS').value=v;etSbPaint();});
function closeDD(){[].forEach.call(S.querySelectorAll('.dpop.on'),function(p){p.classList.remove('on');p.parentNode.classList.remove('open');});}
S.addEventListener('click',function(e){var P=e.composedPath();if(P.indexOf($('caps'))<0)$('pop').classList.remove('on');[].forEach.call(S.querySelectorAll('.dd'),function(d){if(P.indexOf(d)<0){d.classList.remove('open');d.querySelector('.dpop').classList.remove('on');}});if(P.indexOf($('lgp'))<0&&P.indexOf($('bLog'))<0&&P.indexOf($('lgL'))<0){$('lgp').classList.remove('on');$('lgL').classList.remove('on');}});
/* custom subjects modal (only custom ones are listed here) */
function customs(){return subs.filter(function(s){return!LEG[s.id];});}
function mdRender(){var c=customs();$('mList').innerHTML=c.length?c.map(function(s){return'<div class="mr"><span class="dot" style="background:'+SC(s.id)+'"></span>'+esc(s.n)+'<button data-rm="'+s.id+'" aria-label="Delete '+esc(s.n)+'">'+TRASH+'</button></div>';}).join(''):'<div class="empty" style="padding:18px 0">No custom subjects yet</div>';}
function mdOpen(){mdRender();$('md').classList.add('on');setTimeout(function(){$('mIn').focus();},250);}
function mdClose(){$('md').classList.remove('on');}
function subsChanged(){subSave();mdRender();fillChips();tRender();anR();}
function addSubj(){var v=$('mIn').value.trim().slice(0,30);if(!v)return;if(subs.some(function(s){return s.n.toLowerCase()===v.toLowerCase();})){toast('Subject already exists');return;}
 subs.push({id:'c'+nid(),n:v,c:PAL[customs().length%PAL.length]});$('mIn').value='';subsChanged();toast('Added '+v);}
$('mAdd').addEventListener('click',addSubj);$('mIn').addEventListener('keydown',function(e){if(e.key==='Enter')addSubj();});$('mDone').addEventListener('click',mdClose);bdClose($('md'),mdClose);
$('mList').addEventListener('click',function(e){var b=e.target.closest('[data-rm]');if(!b)return;var id=b.dataset.rm;subs=subs.filter(function(s){return s.id!==id;});
 tasks.forEach(function(t){if(t.subj===id)t.subj='';});tSave();if(addSb===id)addSb='';var mv=sess.filter(function(q){return q.sub===id;}).length;if(fs.subj===id){fs.subj='';fSave();}subsChanged();if(mv)toast(mv+' session'+(mv>1?'s':'')+' moved to General');});
/* ===== flow timer (persistent, background-safe) ===== */
var POMO=15e5,fs={mode:'flow',acc:0,t0:0,cm:45,subj:'',task:'',sAt:0,sg:[]},fInt=null,outT=0;
(function(){var fv=lsGet(FK,null);if(fv&&typeof fv==='object'){if(fv.mode==='pomo'||fv.mode==='custom')fs.mode=fv.mode;fs.acc=Math.max(0,+fv.acc||0);fs.t0=+fv.t0>0?+fv.t0:0;fs.subj=typeof fv.subj==='string'?fv.subj:'';fs.task=typeof fv.task==='string'?fv.task:'';fs.sAt=+fv.sAt||0;fs.sg=Array.isArray(fv.sg)?fv.sg.filter(function(g){return Array.isArray(g)&&+g[1]>+g[0]&&+g[0]>0;}).map(function(g){return[+g[0],+g[1]];}):[];fs.cm=Math.min(600,Math.max(1,Math.round(+fv.cm||45)));}})();
sess=lsGet(SS,[]);if(!Array.isArray(sess))sess=[];sess=sess.filter(function(s){return s&&+s.s>0&&+s.ms>0;});
function fSave(){lsSet(FK,fs);}function sSave(){lsSet(SS,sess);}
function fTot(){return fs.mode==='pomo'?POMO:fs.mode==='custom'?fs.cm*6e4:0;}
function fEl(){return fs.acc+(fs.t0?Math.max(0,Date.now()-fs.t0):0);}
function hms(ms){var s=Math.floor(ms/1000);return p2(Math.floor(s/3600))+':'+p2(Math.floor(s%3600/60))+':'+p2(s%60);}
var PLAY='<path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/>',PAUSE='<rect x="6" y="5" width="4.5" height="14" rx="1.5"/><rect x="13.5" y="5" width="4.5" height="14" rx="1.5"/>';
function fPaint(){
 var run=!!fs.t0,tot=fTot(),e=fEl(),idle=!run&&!e;
 $('time').textContent=hms(tot?Math.ceil(Math.max(0,tot-e)/1000)*1000:e);
 $('state').textContent=idle?(fs.mode==='flow'?'Flow state':fs.mode==='pomo'?'Pomodoro · 25 min':'Custom · '+fs.cm+' min'):run?(fs.mode==='flow'?'In flow':'Focus'):'Paused';
 $('tc').classList.toggle('run',run);$('stop').disabled=idle;$('pi').innerHTML=run?PAUSE:PLAY;$('play').setAttribute('aria-label',run?'Pause timer':'Start timer');
 $('pb').style.width=(tot?Math.min(1,e/tot):(e%36e5)/36e5)*100+'%';
 [].forEach.call($('modes').children,function(b){b.classList.toggle('on',b.dataset.m===fs.mode);});
 $('cu').classList.toggle('on',fs.mode==='custom');$('modes').classList.toggle('lk',!idle);$('cm').value=fs.cm;$('cm').disabled=!idle;
 document.title=run?hms(tot?Math.max(0,tot-e):e)+' \u00b7 '+baseTitle:baseTitle;
 $('tdot').hidden=!run;[].forEach.call(document.querySelectorAll('.live-dot'),function(d){d.hidden=!run;});
}
function totalMs(){var t=0;sess.forEach(function(s){t+=Math.min(+s.ms||0,1728e5);});return t;}
function addSess(o){var prev=totalMs();sess.push(o);sSave();afterLog(o.ms,prev);}
function fLog(c){var e=Math.min(fEl(),c||1e12);if(e>=5000&&fs.sAt){var sg=fs.sg.slice(),rem=e,out=[];if(fs.t0)sg.push([fs.t0,Date.now()]);
 sg.forEach(function(g){if(rem<=0)return;var l=Math.min(g[1]-g[0],rem);if(l>0){out.push([g[0],g[0]+l]);rem-=l;}});
 toast('Logged '+(e<6e4?Math.round(e/1000)+'s':H(e))+' to '+(sub(fs.subj)?sub(fs.subj).n:'General'));
 addSess({s:out.length?out[0][0]:fs.sAt,ms:Math.round(e),sub:fs.subj,task:fs.task,m:fs.mode,sg:out});}}
function fHalt(){clearInterval(fInt);fInt=null;fs.acc=0;fs.t0=0;fs.sAt=0;fs.sg=[];fSave();}
function fTick(){var t=fTot();if(t&&fEl()>=t){fLog(t);fHalt();chime();sdAsk(fs.task,t);var c=$('tc');c.classList.remove('flash');void c.offsetWidth;c.classList.add('flash');}fPaint();}
$('play').addEventListener('click',function(){unlockAudio();if(fs.t0){var _n=Date.now();fs.acc=fEl();fs.sg.push([fs.t0,_n]);fs.t0=0;clearInterval(fInt);fInt=null;}else{if(!fs.sAt)fs.sAt=Date.now();fs.t0=Date.now();fInt=setInterval(fTick,250);}fSave();fPaint();});
var sdT='';
function sdClose(){$('sdm').classList.remove('on');sdT='';}
function sdAsk(tid,ms){if(!tid||!(ms>=5000))return;var t=tasks.filter(function(x){return x.id===tid;})[0];if(!t||t.done)return;sdT=t.id;
 $('sdD').textContent=ms<6e4?Math.round(ms/1000)+'s':H(ms);$('sdN').textContent='\u201C'+t.text+'\u201D';$('sdm').classList.add('on');setTimeout(function(){$('sdYes').focus({preventScroll:true});},80);}
$('sdNo').addEventListener('click',sdClose);
bdClose($('sdm'),sdClose);
$('sdYes').addEventListener('click',function(){var t=tasks.filter(function(x){return x.id===sdT;})[0];sdClose();if(!t||t.done)return;
 t.done=true;t.doneAt=Date.now();t.st='';tSave();fillLink();fSave();tRender();toast('Task marked done');});
$('stop').addEventListener('click',function(){var e=fEl(),tid=fs.task;fLog();fHalt();fPaint();sdAsk(tid,e);});
$('cm').addEventListener('change',function(){fs.cm=Math.min(600,Math.max(1,Math.round(+this.value||45)));fSave();fPaint();});
$('tc').addEventListener('animationend',function(e){if(e.target===this)this.classList.remove('flash','shake');});
$('modes').addEventListener('animationend',function(e){if(e.target===this)this.classList.remove('jiggle');});
$('modes').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var c=$('tc');
 if(fs.t0||fs.acc){var md=$('modes');md.classList.remove('jiggle');void md.offsetWidth;md.classList.add('jiggle');toast(fs.t0?'Timer is running — press Stop (■) before changing mode':'Session is paused — press Stop (■) to save it, then change mode');return;}fs.mode=b.dataset.m;fSave();fPaint();});
if(fs.t0){var ft=fTot();if(!(ft&&fEl()>=ft))fInt=setInterval(fTick,250);}
/* manual log */
$('bLog').addEventListener('click',function(){var p=$('lgp');p.classList.toggle('on');$('lgL').classList.toggle('on',p.classList.contains('on'));$('lgD').value=L();$('lgD').max=L();if(p.classList.contains('on')){lgRender();$('lgM').focus();}});
/* manual entries: SAME records as sess (m:'manual') — delete removes exactly that one record, then everything is re-derived */
function lgRender(){
 var box=$('lgL'),rows=[];
 sess.forEach(function(q,i){if(q&&q.m==='manual')rows.push(i);});
 rows.sort(function(a,b){return(+sess[b].s)-(+sess[a].s);});
 if(!rows.length){box.innerHTML='<div class="lgh">MANUAL ENTRIES</div><div class="lgr"><span>No manual entries yet</span></div>';return;}
 box.innerHTML='<div class="lgh">MANUAL ENTRIES</div>'+rows.map(function(i){var q=sess[i];
  return'<div class="lgr" role="listitem" data-i="'+i+'" data-s="'+(+q.s)+'" data-ms="'+(+q.ms)+'"><i class="dot" style="background:'+SC(sk(q))+'"></i><b class="lt">'+esc(H(+q.ms))+'</b><span class="lm"><em>'+esc(sub(q.sub)?sub(q.sub).n:'General')+'</em><small>'+esc(fmtD(new Date(logicalKey(+q.s)+'T00:00')))+'</small></span><button type="button" data-x="1" aria-label="Delete manual entry of '+esc(H(+q.ms))+'">Delete</button></div>';}).join('');
}
$('lgL').addEventListener('click',function(e){
 var b=e.target.closest('[data-x]');if(!b)return;var r=b.closest('.lgr'),i=+r.dataset.i,q=sess[i];
 if(!q||q.m!=='manual'||+q.s!==+r.dataset.s||+q.ms!==+r.dataset.ms){lgRender();return;}
 if(!window.confirm('Delete this manual entry ('+H(+q.ms)+')? This cannot be undone.'))return;
 sess.splice(i,1);sSave();anR();lgRender();toast('Deleted '+H(+q.ms)+' manual entry');
});
$('lgA').addEventListener('click',function(){var m=Math.round(+$('lgM').value),d=$('lgD').value||L();if(!(m>=1&&m<=1440)){toast('Enter 1–1440 minutes');return;}if(d>L()){toast('Future dates not allowed');return;}
 var ds=dayStart(d),end=d===L()?Date.now():ds+21*36e5,st=Math.max(ds,end-m*6e4);toast('Logged '+H(m*6e4)+' to '+(sub(fs.subj)?sub(fs.subj).n:'General'));addSess({s:st,ms:m*6e4,sub:fs.subj,task:fs.task,m:'manual',sg:[[st,st+m*6e4]]});$('lgM').value='';$('lgp').classList.remove('on');$('lgL').classList.remove('on');});
/* subject chips + link task (auto-selects the task's subject) */
function fillChips(){$('chips').innerHTML=subs.map(function(s){return'<button class="chip'+(s.id===fs.subj?' on':'')+'" data-s="'+s.id+'"><span class="dot" style="background:'+SC(s.id)+'"></span>'+esc(s.n)+'</button>';}).join('');}
$('chips').addEventListener('click',function(e){var b=e.target.closest('.chip');if(!b)return;fs.subj=fs.subj===b.dataset.s?'':b.dataset.s;fSave();fillChips();});
function linkList(){var o=tasks.filter(isToday);return o.length?[{v:'',t:'No linked task'}].concat(o.map(function(t){return{v:t.id,t:t.text,c:t.subj?SC(t.subj):''};})):[{v:'',t:'No pending tasks today'}];}
function fillLink(){if(!tasks.some(function(t){return t.id===fs.task&&isToday(t);}))fs.task='';var t=tasks.filter(function(x){return x.id===fs.task;})[0];$('lnkT').textContent=t?t.text:(tasks.some(isToday)?'No linked task':'No pending tasks today');}
mkDD('lnkB','lnkP',{list:linkList,sel:function(){return fs.task;}},function(v){fs.task=v;var t=tasks.filter(function(x){return x.id===v;})[0];if(t&&t.subj){fs.subj=t.subj;fillChips();toast('Subject set to '+(sub(t.subj)||{n:''}).n);}fSave();fillLink();});
mkDD('rngB','rngP',{list:function(){return[['all','All time'],['30d','Last 30 days'],['week','This week'],['today','Today']].map(function(x){return{v:x[0],t:x[1]};});},sel:function(){return rng;}},function(v){rng=v;$('rngT').textContent=({all:'All time','30d':'Last 30 days',week:'This week',today:'Today'})[v];anR();});
mkDD('crB','crP',{list:function(){return[{v:'30d',t:'Last 30 days'},{v:'all',t:'All time'}];},sel:function(){return crg;}},function(v){crg=v;$('crT').textContent=v==='30d'?'Last 30 days':'All time';anR();});
/* ===== analytics: ONE source of truth = sess ===== */
function sk(s){return sub(s.sub)?s.sub:'';}
function slices(){var out=[];sess.forEach(function(s){var st=+s.s,ms=Math.min(+s.ms||0,1728e5),k=sk(s),sg=Array.isArray(s.sg)&&s.sg.length?s.sg:[[st,st+ms]],left=ms;if(!(ms>0))return;
 sg.forEach(function(g){var c=+g[0],en=Math.min(+g[1],c+left),d,he,e;if(!(en>c))return;left-=en-c;while(c<en){d=new Date(c);he=new Date(d.getFullYear(),d.getMonth(),d.getDate(),d.getHours()+1).getTime();e=Math.min(en,he);out.push({d:logicalKey(c),h:d.getHours(),k:k,ms:e-c,t:c});c=e;}});});return out;}
function keys(){return subs.map(function(s){return s.id;}).concat(['']);}
function kc(k){return k?SC(k):'#8e8e93';}function kn(k){return k?SN(k):'General';}
function lg1(k,txt){return'<button class="lg1'+(hid[k]?' off':'')+'" data-hs="'+k+'" aria-pressed="'+!hid[k]+'"><i class="dot" style="background:'+kc(k)+'"></i>'+kn(k)+' <em>'+txt+'</em></button>';}
function toggleSub(e){var b=e.target.closest('[data-hs]');if(!b)return;var k=b.dataset.hs;hid[k]=!hid[k];anR();}
$('tlg').addEventListener('click',toggleSub);$('lg').addEventListener('click',toggleSub);
function lvl(ms){var h=ms/36e5,i=0;for(var j=0;j<TIERS.length;j++)if(h>=TIERS[j][1])i=j;return i;}
var TIERS=[['Novice',0,'🌱'],['Apprentice',10,'📘'],['Scholar',50,'🎓'],['Deep Work Master',100,'🧠'],['Legend',250,'👑'],['Mythic',500,'🐉'],['Ascended',1000,'🌌']];
function B(id,n,d,e,k,t,u,c){return[id,n,d,e,function(s){return s.X[k]||0;},t,u,c];}
var BC=[['all','All types'],['streak','🔥 Streaks'],['hours','⏱️ Focus hours'],['session','🏃 Sessions'],['time','🌗 Time of day'],['subject','📚 Subjects'],['habit','📆 Habits']];
var BADGES=[
B('s3','Warm Up','3-day streak','⚡','best',3,'days','streak'),B('s7','Week Warrior','7-day streak','🏆','best',7,'days','streak'),B('s14','Fortnight','14-day streak','🌟','best',14,'days','streak'),B('s30','Unstoppable','30-day streak','💎','best',30,'days','streak'),B('s60','Iron Will','60-day streak','🛡️','best',60,'days','streak'),B('s100','Immortal','100-day streak','🏅','best',100,'days','streak'),
B('h10','10 Hours','10h total focus','⏱️','totH',10,'h','hours'),B('h25','25 Hours','25h total focus','🔖','totH',25,'h','hours'),B('h50','50 Hours','50h total focus','📚','totH',50,'h','hours'),B('h100','100 Hours','100h total focus','🧠','totH',100,'h','hours'),B('h250','Legendary','250h total focus','👑','totH',250,'h','hours'),B('h500','Mythic','500h total focus','🐉','totH',500,'h','hours'),
B('first','First Focus','Log your first session','🔥','n',1,'session','session'),B('n10','Getting Started','Log 10 sessions','🌱','n',10,'sessions','session'),B('n25','Consistent','Log 25 sessions','📈','n',25,'sessions','session'),B('n50','Half Century','Log 50 sessions','🎯','n',50,'sessions','session'),B('n100','Centurion','Log 100 sessions','⚔️','n',100,'sessions','session'),
B('m1','Hour Power','A 1h+ session','⏳','maxH',1,'h','session'),B('mar','Marathon','A 2h+ session','🏃','maxH',2,'h','session'),B('m4','Ultra Marathon','A 4h+ session','🚀','maxH',4,'h','session'),
B('dd2','Solid Day','2h+ focus in one day','🌤️','dayH',2,'h','habit'),B('dd4','Deep Day','4h+ focus in one day','🌊','dayH',4,'h','habit'),B('dd8','Beast Mode','8h+ focus in one day','🦁','dayH',8,'h','habit'),B('dd12','Unreal','12h+ focus in one day','🌋','dayH',12,'h','habit'),
B('wk20','20h Week','20h focus in one week','📅','weekH',20,'h','habit'),B('wk40','40h Week','40h focus in one week','🗓️','weekH',40,'h','habit'),B('wk60','60h Week','60h focus in one week','⚡','weekH',60,'h','habit'),
B('d10','10 Study Days','Study on 10 different days','📆','days',10,'days','habit'),B('d30','30 Study Days','Study on 30 different days','🗂️','days',30,'days','habit'),B('d60','60 Study Days','Study on 60 different days','📖','days',60,'days','habit'),B('wke','Weekend Warrior','Study on 4 weekend days','🏖️','wkend',4,'days','habit'),B('c20','Habit Formed','Study 20 of the last 30 days','🧬','c30',20,'days','habit'),
B('early','Early Bird','Focus before 8 AM','🌅','early',1,'','time'),B('owl','Night Owl','Focus after 10 PM','🦉','owl',1,'','time'),B('mid','Midnight Oil','Focus between 12–4 AM','🕛','mid',1,'','time'),B('cyc','Full Cycle','Study in all 4 parts of the day','🌗','parts',4,'parts','time'),
B('multi','All-Rounder','Study 3+ subjects (1h+ each)','🎨','subN',3,'subjects','subject'),B('poly','Polymath','Study 5+ subjects (1h+ each)','🔭','subN',5,'subjects','subject'),B('spec','Specialist','25h in one subject','🔬','topSubH',25,'h','subject'),B('mast','Subject Master','50h in one subject','🏛️','topSubH',50,'h','subject'),
B('s150','Relentless','150-day streak','🔱','best',150,'days','streak'),B('s200','Titanium','200-day streak','🪐','best',200,'days','streak'),B('s365','Year of Focus','365-day streak','🌌','best',365,'days','streak'),B('d100','100 Study Days','Study on 100 different days','🗓️','days',100,'days','habit'),B('d200','200 Study Days','Study on 200 different days','📚','days',200,'days','habit'),
B('n250','Relentless Runner','Log 250 sessions','🏹','n',250,'sessions','session'),B('n500','Iron Routine','Log 500 sessions','⚙️','n',500,'sessions','session'),B('n1000','Thousand Club','Log 1000 sessions','🗿','n',1000,'sessions','session'),
B('mast2','Grandmaster','100h in one subject','🧙','topSubH',100,'h','subject'),B('titan','Titan','250h in one subject','🗻','topSubH',250,'h','subject'),
B('g8','Beast Day','8h+ focus in one day','🦁','dayH',8,'h','habit'),B('g12','Unreal Day','12h+ focus in one day','🌋','dayH',12,'h','habit'),B('w40','40h Week','40h focus in one week','🗓️','weekH',40,'h','habit'),B('w60','60h Week','60h focus in one week','⚡','weekH',60,'h','habit'),B('g4','Ultra Marathon','Single 4h+ session','🚀','maxH',4,'h','session')];
var RF='all',RC='all',LS=null;
(function(){var ORD={streak:['s3','s7','s14','s30','s60','s100','s150','s200','s365','d10','d30','d100','d200'],exec:['first','n10','n25','n50','n100','n250','n500','n1000'],prof:['multi','poly','spec','mast','mast2','titan'],grind:['g4','g8','g12','w40','w60']},out=[];
 Object.keys(ORD).forEach(function(c){ORD[c].forEach(function(id){var b=BADGES.filter(function(x){return x[0]===id;})[0];if(b){b[7]=c;out.push(b);}});});BADGES=out;})();
var RN=['Common','Rare','Epic','Legendary'];
function rar(b){var l=BADGES.filter(function(x){return x[7]===b[7];}),i=l.indexOf(b),r=l.length>1?i/(l.length-1):0;return r<.34?0:r<.67?1:r<.9?2:3;}
/* ===== Study Streak: the ONE canonical streak calculation (single source of truth) =====
   Derived only from real sessions (sess = pf-sess) bucketed by the central logical day (Day Rollover).
   dm = per-logical-day focus totals built from slices() in anR(). Nothing about the streak is ever stored. */
function studyStreak(dm){
 var now=lnow(),cur=0,best=0,run=0,prev=null,c=new Date(now),T=function(k){return dm[k]?dm[k].t:0;};
 if(!T(L(now)))c=addD(c,-1);while(T(L(c))){cur++;c=addD(c,-1);}
 Object.keys(dm).sort().forEach(function(k){var d=new Date(k+'T00:00');run=prev&&L(addD(prev,1))===k?run+1:1;prev=d;if(run>best)best=run;});
 return{cur:cur,best:best};}
/* shows the canonical streak everywhere it is displayed (Timer stat card + nav pill) */
function paintStreak(n){$('sStr').innerHTML=n+'<em>Days</em>';var c=document.getElementById('streak-count'),p=document.getElementById('streak-pill');if(c)c.textContent=n;if(p)p.setAttribute('aria-label','Study Streak, '+n+(n===1?' day':' days'));}
function xs(s){var X={best:s.best,n:s.n,totH:s.tot/36e5,maxH:s.max/36e5,dayH:s.dayMax/36e5,subN:s.subN,early:s.early?1:0,owl:s.owl?1:0,c30:s.c30||0,days:0,wkend:0,mid:0},wk={},pt={},dm=s.dm||{},sb=s.sbj||{};
 Object.keys(dm).forEach(function(k){if(!(dm[k].t>0))return;X.days++;var d=new Date(k+'T00:00'),g=d.getDay();if(g===0||g===6)X.wkend++;var w=L(mon(d));wk[w]=(wk[w]||0)+dm[k].t;});
 X.weekH=Math.max.apply(null,Object.keys(wk).map(function(k){return wk[k]/36e5;}).concat([0]));
 sess.forEach(function(q){var h=new Date(+q.s).getHours();if(h<4)X.mid=1;pt[h>=22||h<5?3:h>=17?2:h>=12?1:0]=1;});X.parts=Object.keys(pt).length;
 X.topSubH=Math.max.apply(null,Object.keys(sb).filter(function(k){return k;}).map(function(k){return sb[k]/36e5;}).concat([0]));return X;}
function anR(cel){
 var sl=slices(),now=lnow(),td=L(now),dm={},i,all={};
 sl.forEach(function(x){var o=dm[x.d]||(dm[x.d]={t:0,b:{}});o.t+=x.ms;o.b[x.k]=(o.b[x.k]||0)+x.ms;});
  var T=function(k){return dm[k]?dm[k].t:0;},sr=studyStreak(dm),st=sr.cur,best=sr.best;
 var w=[];for(i=0;i<7;i++)w.push(T(L(addD(now,-i))));var c30=0;for(i=0;i<30;i++)if(T(L(addD(now,-i))))c30++;
 paintStreak(st);$('sTod').textContent=H(T(td));$('sAvg').textContent=H(w.reduce(function(a,b){return a+b;},0)/7);$('sPk').textContent=H(Math.max.apply(null,w));$('sCon').textContent=Math.round(c30/30*100)+'%';
 trends(dm,now);heat(dm,td);donut(sl,now);curve(sl,now);
 var tot=totalMs(),sbj={},early=false,owl=false,max=0;sess.forEach(function(s){sbj[sk(s)]=(sbj[sk(s)]||0)+Math.min(+s.ms||0,1728e5);var h=new Date(+s.s).getHours();if(h>=5&&h<8)early=true;if(h>=22||h<4)owl=true;if(s.ms>max)max=+s.ms;});
 var dmx=0;Object.keys(dm).forEach(function(k){if(dm[k].t>dmx)dmx=dm[k].t;});
 rewards({dayMax:dmx,n:sess.length,best:best,tot:tot,max:max,early:early,owl:owl,subN:Object.keys(sbj).filter(function(k){return k&&sbj[k]>=36e5;}).length,sbj:sbj,dm:dm,c30:c30,today:T(td)},cel);
}
function niceMax(h){var s=[.5,1,2,3,4,6,8,12,24],i;for(i=0;i<s.length;i++)if(s[i]*4>=h)return s[i];return 24;}
function yl(h){return h<1?Math.round(h*60)+'m':h+'h';}
function trends(dm,now){
 var ws=addD(mon(now),wOff*7),ks=keys(),days=[],mx=0,wt=0,tot={},i,j;
 for(i=0;i<7;i++){var d=addD(ws,i),k=L(d),b=(dm[k]||{b:{}}).b,vt=0;ks.forEach(function(q){vt+=b[q]||0;tot[q]=(tot[q]||0)+(b[q]||0);});days.push({d:d,k:k,b:b,vt:vt});mx=Math.max(mx,vt);wt+=vt;}
 var stp=niceMax(mx/36e5),sc=stp*4*36e5,key=ks.join();
 $('wt').textContent=H(wt);$('wl').textContent=wOff===0?'THIS WEEK':wOff===-1?'LAST WEEK':ws.getDate()+' '+MNAME[ws.getMonth()]+' – '+addD(ws,6).getDate()+' '+MNAME[addD(ws,6).getMonth()];$('wn').disabled=wOff>=0;
 var y='';for(i=0;i<=4;i++)y+='<div class="yl" style="top:'+(100-i*25)+'%"><span>'+yl(stp*i)+'</span></div>';$('yax').innerHTML=y;
 var cols=$('cols'),fresh=barKey!==key;
 if(fresh){cols.innerHTML=days.map(function(){return'<div class="col"><div class="bar">'+ks.map(function(q){return'<i data-q="'+q+'" style="background:'+kc(q)+'"></i>';}).join('')+'</div><div class="dl"></div></div>';}).join('');barKey=key;void cols.offsetWidth;}
 [].forEach.call(cols.children,function(col,n){var dd=days[n],bar=col.firstChild;col.classList.toggle('now',dd.k===L());col.dataset.i=n;col.lastChild.innerHTML=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][n]+'<small>'+dd.d.getDate()+'</small>';
  bar.style.height=(dd.vt/sc*100)+'%';[].forEach.call(bar.children,function(el){var q=el.dataset.q;el.style.flexGrow=Math.max(0,(dd.b[q]||0)/1000);});});
 cols._d=days;
 var lg='';ks.forEach(function(q){if(tot[q]>0)lg+=lg1(q,H(tot[q]));});$('tlg').innerHTML=lg||'<span class="cap2">No sessions this week</span>';
}
$('cols').addEventListener('mousemove',function(e){var col=e.target.closest('.col'),tip=$('tip');if(!col||!this._d){tip.classList.remove('on');return;}var dd=this._d[+col.dataset.i],wasOn=tip.classList.contains('on'),nm=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][+col.dataset.i],tt=0,rows='';
 keys().forEach(function(q){var v=dd.b[q]||0;if(!(v>0))return;tt+=v;rows+='<div><i class="dot" style="background:'+kc(q)+'"></i><span>'+esc(kn(q))+'</span><em>'+H(v)+'</em></div>';});
 tip.innerHTML='<b><span>'+nm+'</span><em>'+(tt?H(tt):'—')+'</em></b>'+(rows||'<div class="no">No focus logged</div>');
 var bar=col.firstChild,pr=$('plot').getBoundingClientRect(),br=bar.getBoundingClientRect(),cr=col.getBoundingClientRect(),tw=tip.offsetWidth||200,th=tip.offsetHeight||100,gap=14,
  bl=(br.width>0?br.left:cr.left+cr.width/2-14)-pr.left,bw=br.width>0?br.width:28,x=bl+bw+gap;
 var bt=br.height>0?br.top-pr.top:pr.height-4,y;
 if(bt-th-10>=0){y=bt-th-10;x=Math.max(0,Math.min(pr.width-tw,bl+bw/2-tw/2));}
 else{if(x+tw>pr.width)x=bl-tw-gap;x=Math.max(0,Math.min(pr.width-tw,x));y=Math.max(0,Math.min(pr.height-th,bt));}
 tip.classList.toggle('nt',!wasOn);tip.style.left=x+'px';tip.style.top=y+'px';tip.classList.add('on');});
$('cols').addEventListener('mouseleave',function(){$('tip').classList.remove('on');});
$('wp').addEventListener('click',function(){wOff--;anR();});$('wn').addEventListener('click',function(){if(wOff<0){wOff++;anR();}});
function heat(dm,td){var now=lnow(),fm=new Date(now.getFullYear(),now.getMonth()+mOff,1),nd=new Date(fm.getFullYear(),fm.getMonth()+1,0).getDate(),lead=(fm.getDay()+6)%7,vals=[],i;
 for(i=1;i<=nd;i++)vals.push((dm[L(new Date(fm.getFullYear(),fm.getMonth(),i))]||{t:0}).t);var hm=Math.max.apply(null,vals.concat([1]));
 $('mlab').textContent=fm.toLocaleString('en',{month:'short',year:'numeric'}).toUpperCase();
 var h='MON TUE WED THU FRI SAT SUN'.split(' ').map(function(d){return'<div class="dw">'+d+'</div>';}).join('');for(i=0;i<lead;i++)h+='<div class="blank"></div>';
 vals.forEach(function(v,n){var k=L(new Date(fm.getFullYear(),fm.getMonth(),n+1));h+='<div class="cell'+(v?' has':'')+(k===td?' today':'')+'"'+(v?' style="background:rgba(var(--ar),'+(.28+v/hm*.6).toFixed(2)+');--g:'+(.15+v/hm*.6).toFixed(2)+'"':'')+' title="'+H(v)+'">'+'<i>'+(n+1)+'</i><span>'+(v?H(v):'OFF')+'</span></div>';});$('cal').innerHTML=h;}
$('pm').addEventListener('click',function(){mOff--;anR();});$('nm').addEventListener('click',function(){mOff++;anR();});
function donut(sl,now){var td=L(now),wk0=L(mon(now)),d30=L(addD(now,-29)),bs={},vt=0,C=2*Math.PI*80;
 sl.forEach(function(x){var ok=rng==='all'||(rng==='today'&&x.d===td)||(rng==='week'&&x.d>=wk0)||(rng==='30d'&&x.d>=d30);if(ok){bs[x.k]=(bs[x.k]||0)+x.ms;if(!hid[x.k])vt+=x.ms;}});
 var ks=Object.keys(bs).sort(function(a,b){return bs[b]-bs[a];}),svg=$('dsv'),key=ks.join('|'),vc=ks.filter(function(k){return!hid[k];}).length,o=0;
 if(key!==dnKey||svg.querySelectorAll('[data-k]').length!==ks.length){svg.innerHTML='<circle cx="100" cy="100" r="80" stroke="rgba(255,255,255,.05)"/>'+ks.map(function(k){return'<circle data-k="'+k+'" cx="100" cy="100" r="80" stroke="'+kc(k)+'" style="stroke-dasharray:0 '+C+'"/>';}).join('');dnKey=key;void svg.getBoundingClientRect();}
 ks.forEach(function(k){var c=svg.querySelector('[data-k="'+k+'"]');if(!c)return;var l=hid[k]||!vt?0:bs[k]/vt*C;c.style.strokeDasharray=Math.max(0,l-(vc>1?4:0))+' '+C;c.style.strokeDashoffset=-o;o+=l;});
 $('dTot').textContent=vt?H(vt):'No data';$('dTot').nextElementSibling.style.display=vt?'':'none';svg._bs=bs;
 $('lg').innerHTML=ks.length?ks.map(function(k){return lg1(k,'');}).join(''):'<span class="cap2">No data yet</span>';}
$('dsv').addEventListener('mousemove',function(e){var c=e.target.closest&&e.target.closest('[data-k]'),t=$('dtip');if(!c||!this._bs||hid[c.dataset.k]){t.classList.remove('on');return;}var k=c.dataset.k,r=this.parentNode.getBoundingClientRect();t.innerHTML='<b>'+kn(k)+'</b><div><i class="dot sq" style="background:'+kc(k)+'"></i>'+H(this._bs[k]).replace(' ','')+'</div>';t.style.left=Math.min(r.width-110,Math.max(0,e.clientX-r.left+12))+'px';t.style.top=Math.max(0,e.clientY-r.top-24)+'px';t.classList.add('on');});
$('dsv').addEventListener('mouseleave',function(){$('dtip').classList.remove('on');});
var HP=[],cvV=[],CVW=600,CS=6;
function fh(h){h=h%24;return(h%12||12)+(h<12?' AM':' PM');}
function curve(sl,now){var hr=[],i,tot=0,ck=crg==='30d'?L(addD(now,-29)):'';for(i=0;i<24;i++)hr.push(0);
 sl.forEach(function(x){if(ck&&x.d<ck)return;hr[(x.h-ROLL+24)%24]+=x.ms/6e4;});
 var S0=0,NH=24;CS=ROLL;for(i=0;i<24;i++)tot+=hr[i];cvV=hr.slice();
 var bw=0,bs=0;for(i=0;i<=21;i++){var s3=hr[i]+hr[i+1]+hr[i+2];if(s3>bw){bw=s3;bs=i;}}
 $('cvIns').innerHTML=tot>0?(function(){var avg=tot/24,pc=Math.round((bw/3/avg-1)*100);return'Peak focus <b style="color:var(--acc2)">'+fh(ROLL+bs)+' – '+fh(ROLL+bs+3)+'</b>'+(pc>0?' · <b style="color:var(--acc2)">'+pc+'% more productive</b> in this window than your daily average':'');})():'Log a few sessions to see your peak focus time.';
 var W=Math.max(320,Math.round($('cv').clientWidth||900)),Hh=250,pl=44,pr=10,pt=14,pb=30,pw=W-pl-pr,ph=Hh-pt-pb,mx=Math.max.apply(null,hr.slice(S0)),ym=Math.max(40,Math.ceil(mx/80)*80),P=[];
 for(i=S0;i<24;i++)P.push([pl+(i-S0+.5)/NH*pw,pt+ph-hr[i]/ym*ph]);HP=P;
 var d='M'+P[0][0].toFixed(1)+' '+P[0][1].toFixed(1),base=pt+ph;
 for(i=0;i<P.length-1;i++){var p0=P[i-1]||P[i],p1=P[i],p2=P[i+1],p3=P[i+2]||p2,cy=function(v){return Math.min(base,Math.max(pt,v)).toFixed(1);};d+='C'+(p1[0]+(p2[0]-p0[0])/6).toFixed(1)+' '+cy(p1[1]+(p2[1]-p0[1])/6)+' '+(p2[0]-(p3[0]-p1[0])/6).toFixed(1)+' '+cy(p2[1]-(p3[1]-p1[1])/6)+' '+p2[0].toFixed(1)+' '+p2[1].toFixed(1);}
 var g='';for(i=0;i<=4;i++){var yy=pt+ph-i/4*ph;g+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+yy+'" y2="'+yy+'" stroke="rgba(255,255,255,.06)"/><text class="cvt" x="'+(pl-8)+'" y="'+(yy+4)+'" text-anchor="end">'+Math.round(ym*i/4)+'</text>';}
 [0,3,6,9,12,15,18,21,24].forEach(function(h){g+='<text class="cvt" x="'+(pl+h/24*pw)+'" y="'+(Hh-8)+'" text-anchor="middle">'+fh(ROLL+h)+'</text>';});
 var band=tot>0&&bw>0?'<rect x="'+(pl+(bs-S0)/NH*pw)+'" y="'+pt+'" width="'+(3/NH*pw)+'" height="'+ph+'" rx="14" fill="rgba(var(--ar),.10)" stroke="rgba(var(--ar),.35)" stroke-dasharray="4 4"/>':'';
 CVW=W;$('cvs').setAttribute('viewBox','0 0 '+W+' '+Hh);$('cvs').innerHTML='<defs><linearGradient id="cvg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--acc)" stop-opacity=".35"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0"/></linearGradient></defs>'+g+band+'<path d="'+d+'L'+P[P.length-1][0]+' '+base+'L'+P[0][0]+' '+base+'Z" fill="url(#cvg)" id="cva" style="opacity:0;transition:opacity 1s .4s"/><path class="cvp" id="cvl" d="'+d+'" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1"/><line id="cvg1" y1="'+pt+'" y2="'+base+'" stroke="rgba(255,255,255,.25)" style="display:none"/><circle id="cvd" r="5.5" fill="#fff" stroke="var(--acc)" stroke-width="3" style="display:none"/>';
 void $('cvs').getBoundingClientRect();var l=$('cvl');l.style.transition='stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)';l.style.strokeDashoffset=tot>0?0:1;$('cva').style.opacity=tot>0?1:0;}
if(window.ResizeObserver)new ResizeObserver(function(){var w=$('cv').clientWidth;if(w&&Math.abs(w-CVW)>24){clearTimeout(window._rz);window._rz=setTimeout(anR,150);}}).observe($('cv'));
$('cv').addEventListener('mousemove',function(e){var r=this.getBoundingClientRect(),f=(e.clientX-r.left)/r.width*CVW,n=0,i,bd=1e9;HP.forEach(function(p,j){if(Math.abs(p[0]-f)<bd){bd=Math.abs(p[0]-f);n=j;}});
 var p=HP[n],ln=$('cvg1'),dt=$('cvd'),t=$('cvt');if(!ln||!p)return;ln.setAttribute('x1',p[0]);ln.setAttribute('x2',p[0]);ln.style.display='';dt.setAttribute('cx',p[0]);dt.setAttribute('cy',p[1]);dt.style.display='';
 t.innerHTML='<b>'+fh(CS+n)+' – '+fh(CS+n+1)+'</b><div>'+H(cvV[n]*6e4).replace(' ','')+' focused</div>';t.style.left=Math.min(r.width-110,Math.max(0,p[0]/CVW*r.width-45))+'px';t.style.top='0px';t.classList.add('on');});
$('cv').addEventListener('mouseleave',function(){var a=$('cvg1'),b=$('cvd');if(a)a.style.display='none';if(b)b.style.display='none';$('cvt').classList.remove('on');});
/* ===== rewards: tiers, badges, themes, celebrations ===== */
var QS=[['The secret of getting ahead is getting started.','Mark Twain'],['It always seems impossible until it is done.','Nelson Mandela'],['Well begun is half done.','Aristotle'],['We are what we repeatedly do. Excellence is a habit.','Will Durant'],['Success is the sum of small efforts repeated day in and day out.','Robert Collier'],['The expert in anything was once a beginner.','Helen Hayes'],['Don\'t watch the clock; do what it does. Keep going.','Sam Levenson'],['Discipline is the bridge between goals and accomplishment.','Jim Rohn'],['Action is the foundational key to all success.','Pablo Picasso'],['Genius is one percent inspiration and ninety-nine percent perspiration.','Thomas Edison'],['You don\'t have to be great to start, but you have to start to be great.','Zig Ziglar'],['Quality is not an act, it is a habit.','Aristotle'],['The harder I work, the luckier I get.','Samuel Goldwyn'],['Dream, dream, dream. Dreams transform into thoughts and thoughts result in action.','A. P. J. Abdul Kalam'],['If you want to shine like a sun, first burn like a sun.','A. P. J. Abdul Kalam'],['Arise, awake, and stop not till the goal is reached.','Swami Vivekananda'],['Strength does not come from winning. Your struggles develop your strengths.','Arnold Schwarzenegger'],['Energy and persistence conquer all things.','Benjamin Franklin'],['Fall seven times, stand up eight.','Japanese proverb'],['Nothing will work unless you do.','Maya Angelou'],['The only way to do great work is to love what you do.','Steve Jobs'],['Focus on being productive instead of busy.','Tim Ferriss'],['What you do every day matters more than what you do once in a while.','Gretchen Rubin'],['A year from now you may wish you had started today.','Karen Lamb'],['Motivation gets you going; habit keeps you going.','Jim Ryun'],['Hard work beats talent when talent doesn\'t work hard.','Tim Notke'],['Do something today that your future self will thank you for.','Sean Patrick Flanery'],['Perseverance is not a long race; it is many short races one after another.','Walter Elliott'],['The man who moves a mountain begins by carrying away small stones.','Confucius'],['Great things are done by a series of small things brought together.','Vincent van Gogh'],['Study without desire spoils the memory, and it retains nothing it takes in.','Leonardo da Vinci']];
function qod(){var n=lnow(),d=Math.floor(new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime()/864e5),q=QS[((d%QS.length)+QS.length)%QS.length],ex=new Date(2027,0,22),dl=Math.max(0,Math.round((ex-new Date(n.getFullYear(),n.getMonth(),n.getDate()))/864e5));
 $('qDays').textContent=dl;$('qTxt').textContent='\u201C'+q[0]+'\u201D';$('qAut').textContent='\u2014 '+q[1];}
setInterval(function(){try{qod();}catch(e){}},6e4);
function rewards(s,cel){
 qod();LS=s;s.X=xs(s);var li=lvl(s.tot),T=TIERS[li],nx=TIERS[li+1],h=s.tot/36e5;
 $('pAv').textContent=T[2];$('pT').textContent=T[0];$('pH').textContent=(h<10?h.toFixed(1):Math.round(h))+'h focused · Lv '+(li+1);
 var pr=nx?Math.min(100,(h-T[1])/(nx[1]-T[1])*100):100;
 var on=function(b){return b[4](s)>=b[5];},ub=BADGES.filter(on).map(function(b){return b[0];}),seen=lsGet(SEEN,null),nw=[];
 if(seen&&cel)nw=ub.filter(function(x){return seen.indexOf(x)<0;});
 lsSet(SEEN,ub);theme='ember';RT.dataset.t=theme;
 var xp=Math.floor(h*100)+ub.length*50;
 $('rHero').innerHTML='<div class="pc"><div class="ring2" style="--p:'+pr.toFixed(1)+'"><span class="lvav">'+T[2]+'</span><span class="lvn">LV '+(li+1)+'</span></div><div class="pci"><small>PLAYER LEVEL</small><b class="lvt">'+T[0]+'</b><span class="xpl"><em>XP</em>'+xp.toLocaleString()+'</span></div></div><div class="xpw"><div class="xpt"><div class="nl"><small>'+(nx?'Next level':'Max level')+'</small><strong>'+(nx?nx[2]+' '+nx[0]:'👑 '+T[0])+'</strong></div><div class="tgx"><strong>'+(nx?Math.max(0,nx[1]-h).toFixed(1)+'h':'Done')+'</strong><small>'+(nx?'to go':'all levels cleared')+'</small></div></div><div class="xpb"><i style="width:'+pr+'%"></i></div></div><div class="rst"><div><b>🔥 '+s.best+'</b><small>Best streak</small></div><div><b>'+s.n+'</b><small>Sessions</small></div></div>';
 $('bdC').textContent=ub.length+'/'+BADGES.length;
 var pg=function(b){return Math.min(1,b[4](s)/b[5]);},cs=function(b){var c=Math.min(b[5],b[4](s));return(b[6]==='h'?c.toFixed(1):Math.floor(c))+' / '+b[5]+' '+b[6];};
 var nU=ub.length;
 $('rTab').innerHTML=[['all','All'],['on','Unlocked '+nU],['lock','Locked '+(BADGES.length-nU)]].map(function(f){return'<button class="rtb'+(RF===f[0]?' on':'')+'" data-f="'+f[0]+'">'+f[1]+'</button>';}).join('')+'<button class="rtb rall" data-all="1">'+(['streak','exec','prof','grind'].every(function(k){return RCO[k];})?'Expand all':'Collapse all')+'</button>';
 var SEC={streak:['🔥','Streak Milestones'],exec:['🎯','Execution'],prof:['📚','Study Profile'],grind:['🔥','Hardcore']};
 var secH=function(k){var l=BADGES.filter(function(b){return b[7]===k;}),u=l.filter(on).length,nxt=l.filter(function(b){return!on(b);})[0],
  vis=l.filter(function(b){return RF==='all'||(RF==='on'?on(b):!on(b));});if(!vis.length)return'';
  return'<section class="rsc'+(RCO[k]?' shut':'')+'"><div class="rsh" data-sk="'+k+'" role="button" tabindex="0" aria-expanded="'+(!RCO[k])+'" title="Click to show / hide"><span class="ico">'+SEC[k][0]+'</span><b>'+SEC[k][1]+'</b><span class="cnt">'+u+' / '+l.length+'</span><svg class="chv" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></div><div class="mb2"><i style="width:'+(u/l.length*100)+'%"></i></div><div class="rl">'+vis.map(function(b){
   var o=on(b),isN=b===nxt;
   return'<div class="bt'+(o?' on':isN?' nxt':' lk')+(nw.indexOf(b[0])>=0?' new':'')+'"><i>'+b[3]+'</i><span><b>'+b[1]+'</b><small>'+b[2]+'</small></span>'+(o?'<em class="st ok">'+TICK+'</em>':isN?'<em class="st">'+cs(b)+'</em>':'<em class="st lkd">🔒</em>')+(isN?'<s class="pl"><u style="width:'+pg(b)*100+'%"></u></s>':'')+'</div>';}).join('')+'</div></section>';};
 var c1=secH('streak')+secH('grind'),c2=secH('exec')+secH('prof');
 $('rSecs').innerHTML=(c1?'<div class="rcol">'+c1+'</div>':'')+(c2?'<div class="rcol">'+c2+'</div>':'')||'<p class="cap2" style="margin-top:20px">Nothing here yet</p>';
 if(nw.length){toast('🎉 Unlocked: '+nw.map(function(x){return BADGES.filter(function(q){return q[0]===x;})[0][1];}).join(', '));fxConfetti();}
}
$('rTab').addEventListener('click',function(e){if(!LS)return;var a=e.target.closest('[data-all]');if(a){var ks=['streak','exec','prof','grind'],sh=!ks.every(function(k){return RCO[k];});ks.forEach(function(k){RCO[k]=sh;});rewards(LS,false);return;}var b=e.target.closest('[data-f]');if(!b)return;RF=b.dataset.f;rewards(LS,false);});
function rcTgl(h){var k=h.dataset.sk,sc=h.parentNode;RCO[k]=!RCO[k];sc.classList.toggle('shut',!!RCO[k]);h.setAttribute('aria-expanded',String(!RCO[k]));var ab=$('rTab').querySelector('.rall');if(ab)ab.textContent=['streak','exec','prof','grind'].every(function(q){return RCO[q];})?'Expand all':'Collapse all';}
$('rSecs').addEventListener('click',function(e){var h=e.target.closest('[data-sk]');if(h)rcTgl(h);});
$('rSecs').addEventListener('keydown',function(e){if(e.key!=='Enter'&&e.key!==' ')return;var h=e.target.closest('[data-sk]');if(h){e.preventDefault();rcTgl(h);}});
function afterLog(ms,prev){var a=lvl(prev),b=lvl(prev+ms);anR(true);if(b>a)levelUp(b);else if(ms>=72e5){fxConfetti();toast('🔥 Epic session · '+H(ms));}}
function levelUp(i){var o=$('lvl');$('lvlE').textContent=TIERS[i][2];$('lvlT').textContent=TIERS[i][0];o.classList.add('on');fxConfetti(170);setTimeout(function(){o.classList.remove('on');},3600);}
$('lvl').addEventListener('click',function(){this.classList.remove('on');});
var cfRaf=0;
function fxConfetti(n){if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;var cv=$('cf'),r=RT.getBoundingClientRect(),dpr=window.devicePixelRatio||1;cv.width=r.width*dpr;cv.height=r.height*dpr;var x=cv.getContext('2d');x.scale(dpr,dpr);
 var col=['#ff9f0a','#ffd60a','#30d158','#0a84ff','#bf5af2','#ff375f','#64d2ff'],ps=[],i;n=n||120;
 for(i=0;i<n;i++)ps.push({x:r.width/2+(Math.random()-.5)*160,y:r.height*.45,vx:(Math.random()-.5)*15,vy:-Math.random()*15-4,w:5+Math.random()*6,h:3+Math.random()*5,r:Math.random()*6,vr:(Math.random()-.5)*.4,c:col[i%col.length],a:1});
 var t0=performance.now();cancelAnimationFrame(cfRaf);
 (function f(t){var k=t-t0;x.clearRect(0,0,r.width,r.height);ps.forEach(function(p){p.vy+=.35;p.vx*=.992;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;p.a=Math.max(0,1-k/3200);x.save();x.globalAlpha=p.a;x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.w/2,-p.h/2,p.w,p.h);x.restore();});
  if(k<3300)cfRaf=requestAnimationFrame(f);else x.clearRect(0,0,r.width,r.height);})(t0);}
/* ===== Syllabus (chapter tracker + task linking) ===== */
(function(){
var K='pf-syl',Y=lsGet(K,{}),CH={},ok=false,op={},opn={},fl='all',q='',ed='',edc='',pv=0,fx='',rc=null,rk='b',cs='',
D=[['phy','Physics','#ff375f',[['Mechanics I','Mathematical Tools|Motion in a Straight Line|Motion in a Plane|Relative Motion|Laws of Motion|Work, Energy and Power|Circular Motion'],['Mechanics II & Waves','Centre of Mass & System of Particles|Rotational Motion|Gravitation|Oscillations (SHM)|Waves'],['Thermodynamics','Mechanical Properties of Solids|Mechanical Properties of Fluids|Thermal Properties of Matter|Kinetic Theory of Gases|Thermodynamics'],['Electromagnetism','Electric Charges, Fields & Potential|Electrostatic Potential and Capacitance|Current Electricity|Moving Charges and Magnetism|Magnetism and Matter|Electromagnetic Induction (EMI)|Alternating Current (AC)|Electromagnetic Waves (EMW)'],['Optics & Modern','Ray Optics and Optical Instruments|Wave Optics|Dual Nature of Matter and Radiation|Atoms|Nuclei (Radioactive Decay)|Semiconductor Electronics'],['Experimental','Error in Measurements & Dimensions']]],
['math','Maths','#0a84ff',[['Algebra','Basic Mathematics|Quadratic Equations|Sequence and Series|Permutations and Combinations|Binomial Theorem|Determinants|Matrices|Complex Number|Sets|Relations and Functions|Probability'],['Calculus','Limit, Continuity & Differentiability|Method of Differentiation|Application of Derivatives (AOD)|Indefinite Integration|Definite Integration|Application of Integrals (Area)|Differential Equation'],['Coordinate & Vectors','Straight Lines|Circles|Conic Sections: Parabola|Conic Sections: Ellipse|Conic Sections: Hyperbola|Vector Algebra|Three Dimensional Geometry'],['Trigonometry & Stats','Trigonometric Functions|Trigonometric Equation|Inverse Trigonometric Functions (ITF)|Solution of Triangle (As per batch)|Statistics']]],
['org','Organic','#ffd60a',[['','Basic Principles & Tech: IUPAC|Basic Principles & Tech: GOC|Basic Principles & Tech: Isomerism|Hydrocarbon|Haloalkanes and Haloarenes|Alcohols, Phenols and Ethers|Aldehydes, Ketones & Carboxylic Acids|Amines|Biomolecules|Polymers (As per batch planner)']]],
['ino','Inorganic','#bf5af2',[['','Classification of Elements & Periodicity|Chemical Bonding & Molecular Structure|Coordination Compounds|p-Block Elements|d and f-Block Elements|Principles of Qualitative Analysis (Salt)']]],
['pch','Physical','#30d158',[['','Some Basic Concepts of Chemistry (Mole)|Redox Reactions|Structure of Atom|Thermodynamics|Chemical Equilibrium|Ionic Equilibrium|Solutions|Electrochemistry|Chemical Kinetics']]]],
COL=[[0,2],[1,3,4]],TS={phy:'phy',math:'math',org:'chem',ino:'chem',pch:'chem'},
SL={t:'To Do',g:'Doing',d:'Done',m:'Mastered'},CL={t:'#8e8e93',g:'#ff9f0a',d:'#30d158',m:'#ff6a3d'},
RT2={b:'Reference Book / PDF',v:'Lecture Video',n:'Short Notes / Summary',p:'DPP / Practice Sheet',e:'External Link / Website'},
FOLD='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 7a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/></svg>',
CV='<svg class="syv" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
LINK='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>';
if(!Y||typeof Y!=='object'||Array.isArray(Y))Y={};if(!Y.c||typeof Y.c!=='object')Y.c={};if(!Array.isArray(Y.r))Y.r=[];
D.forEach(function(s){s[3].forEach(function(g){g[1]=g[1].split('|');g[1].forEach(function(n){CH[s[0]+'|'+n]={n:n,s:s,g:g[0]};});});});
var IDS=Object.keys(CH);
function save(){lsSet(K,Y);}
function gc(id){var c=Y.c[id];if(c&&typeof c.p!=='number')c.p=+c.p||0;return c||{s:'t',l:0,lt:0,d:0,dt:0,r:0,p:0};}
function cd(id){var c=Y.c[id]||(Y.c[id]={s:'t',l:0,lt:0,d:0,dt:0,r:0,p:0});if(typeof c.p!=='number')c.p=+c.p||0;return c;}
function cp(c){if(c.s==='d'||c.s==='m')return 1;if(c.s!=='g')return 0;var a=c.lt>0?Math.min(1,c.l/c.lt):-1,b=c.dt>0?Math.min(1,c.d/c.dt):-1;return Math.min(.99,a>=0&&b>=0?.6*a+.4*b:a>=0?a:b>=0?b:Math.min(.85,c.l*.05+c.d*.03));}
function sids(s){var r=[];s[3].forEach(function(g){g[1].forEach(function(n){r.push(s[0]+'|'+n);});});return r;}
function agg(ids){var o={t:0,g:0,d:0,m:0},f=0,p=0;ids.forEach(function(i){var c=gc(i);o[c.s]++;if(c.s==='d'||c.s==='m')f++;else p+=cp(c);});var n=ids.length||1;o.full=f/n;o.part=p/n;o.pct=Math.round((o.full+o.part)*100);return o;}
function bar(a){return'<div class="syb"><i class="g" style="width:'+a.full*100+'%"></i><i class="o" style="width:'+a.part*100+'%"></i></div>';}
function cnt(el,a,b){if(!el)return;if(a===b||matchMedia('(prefers-reduced-motion:reduce)').matches){el.textContent=b;return;}var t0=performance.now();(function f(t){var k=Math.min(1,(t-t0)/700);el.textContent=Math.round(a+(b-a)*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(f);})(t0);}
function top(){var a=agg(IDS),L=0,Dd=0,R=0,PQ=0;IDS.forEach(function(i){var c=gc(i);L+=c.l;Dd+=c.d;R+=c.r;PQ+=c.p;});
 $('syT').innerHTML='<h3>Syllabus Progress</h3><div class="sypc"><b id="syN">'+pv+'</b><em>%</em></div><small class="syl">SYLLABUS COVERED</small>'+bar(a)+
 '<div class="syn"><span>Mastered<b style="color:#ff6a3d">'+a.m+'</b></span><span>Done<b style="color:#30d158">'+a.d+'</b></span><span>Doing<b style="color:#ff9f0a">'+a.g+'</b></span><span>To Do<b>'+a.t+'</b></span></div>'+
 '<div class="syx"><span><b>'+L+'</b>Lectures</span><span><b>'+Dd+'</b>DPPs</span><span><b>'+R+'</b>Revisions</span><span><b>'+PQ+'</b>PYQs</span></div>'+
 D.map(function(s){var x=agg(sids(s));return'<div class="sybr"><span>'+s[1]+'</span><div class="syb"><i style="width:'+Math.min(100,(x.full+x.part)*100)+'%;background:'+s[2]+'"></i></div><em>'+x.pct+'%</em></div>';}).join('');
 cnt($('syN'),pv,a.pct);pv=a.pct;}
function vis(id){var c=gc(id);return(fl==='all'||c.s===fl)&&(!q||CH[id].n.toLowerCase().indexOf(q)>=0);}
function ctr(c,k,lab){var t=c[k+'t'],fu=t>0&&c[k]>=t;return'<div><div class="syl2"><label>'+lab+'</label>'+(ed===k?'<input type="number" min="0" max="999" value="'+(t||'')+'" data-k="'+k+'" aria-label="Target">':'<button data-a="tg" data-k="'+k+'">'+(t?'Edit Target':'Set Target')+'</button>')+'</div><div class="syct'+(k==='d'?' dg':'')+(fu?' fl':'')+'" data-ck="'+k+'" style="--p:'+(t?Math.min(100,c[k]/t*100):0)+'%"><button data-a="m" data-k="'+k+'" aria-label="Decrease">\u2212</button><b>'+c[k]+(t?'/'+t:'')+'</b><button data-a="p" data-k="'+k+'" aria-label="Increase">+</button></div></div>';}
function res(id){var s=CH[id].s[0],r=Y.r.filter(function(x){return x.sc==='all'||(x.sc==='sub'&&x.s===s)||(x.sc==='ch'&&x.c===id);});
 return r.length?r.map(function(x){return'<div class="syrs'+(x.d?' d':'')+'" data-rw="'+x.id+'"><button class="syck" data-a="rk" data-r="'+x.id+'" aria-label="Toggle done">'+(x.d?TICK:'')+'</button><div><div class="syrt">'+(x.u?'<a href="'+esc(x.u)+'" target="_blank" rel="noopener">'+esc(x.t)+'</a>':esc(x.t))+'</div><small>'+RT2[x.k]+(x.sc==='ch'?'':' · '+(x.sc==='all'?'Global':'Subject'))+'</small></div><button data-a="rd" data-r="'+x.id+'" aria-label="Delete">×</button></div>';}).join(''):'<div class="syem">No personal resources tracked yet.</div>';}
function chap(id){var c=gc(id),o=!!opn[id],h='<div class="syc'+(o?' on':'')+' sy-'+c.s+'" data-c="'+esc(id)+'"><button class="syr" data-t="1"><span class="syn2">'+esc(CH[id].n)+'</span>'+(c.s==='g'&&(c.l||c.d||c.r||c.p)?'<span class="syk">L '+c.l+(c.lt?'/'+c.lt:'')+' · D '+c.d+(c.dt?'/'+c.dt:'')+(c.r?' · R '+c.r:'')+(c.p?' · P '+c.p:'')+'</span>':'')+'<i class="syd" style="background:'+CL[c.s]+'"></i>'+CV+'</button>';
 if(o)h+='<div class="syx2'+(fx===id?' fx':'')+'"><label>STATUS</label><div class="sys">'+['t','g','d','m'].map(function(k){return'<button data-s="'+k+'" style="--k:'+CL[k]+'"'+(c.s===k?' class="on"':'')+'>'+SL[k]+'</button>';}).join('')+'</div><div class="syq">'+ctr(c,'l','LECTURES')+ctr(c,'d','DPPS')+'</div><div class="syq"><div><label>REVISIONS</label><div class="syct" data-ck="r"><button data-a="m" data-k="r" aria-label="Decrease">−</button><b>'+c.r+'</b><button data-a="p" data-k="r" aria-label="Increase">+</button></div></div><div><label>PYQs</label><div class="syct" data-ck="p"><button data-a="m" data-k="p" aria-label="Decrease">\u2212</button><b>'+(+c.p||0)+'</b><button data-a="p" data-k="p" aria-label="Increase">+</button></div></div></div><div class="syrh"><label>MY RESOURCES &amp; CHECKLIST</label><button data-a="add">+ Add</button></div>'+res(id)+'</div>';
 return h+'</div>';}
function card(s,i){var ids=sids(s).filter(vis),f=q||fl!=='all';if(f&&!ids.length)return'';var a=agg(sids(s)),h='<div class="card sycd" style="--sc:'+s[2]+';--i:'+i+'"><div class="syh"><h2><i></i>'+s[1]+'</h2><b>'+a.pct+'%</b></div>'+bar(a);
 s[3].forEach(function(g){var gi=g[1].map(function(n){return s[0]+'|'+n;}),v=gi.filter(vis);if(!v.length)return;if(!g[0]){h+=v.map(chap).join('');return;}
  var k=s[0]+'|'+g[0],o=f||op[k];h+='<div class="syg2'+(o?' on':'')+'"><button class="syf2" data-g="'+esc(k)+'">'+FOLD+'<span>'+esc(g[0])+'</span><em>'+agg(gi).pct+'%</em>'+CV+'</button>'+(o?'<div class="sycl'+(fx===k?' fx':'')+'">'+v.map(chap).join('')+'</div>':'')+'</div>';});
 return h+'</div>';}
var lastN=2,COLS={2:[[0,2],[1,3,4]],3:[[0],[1],[2,3,4]]};
function ncol(){var m=$('main'),cs=getComputedStyle(m),w=m.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);return(m.classList.contains('wide')&&w>=1626)?3:2;}
function paint(){top();lastN=ncol();$('syG').classList.toggle('c3',lastN===3);$('syG').innerHTML=COLS[lastN].map(function(c){return'<div class="sycol">'+c.map(function(i){return card(D[i],i);}).join('')+'</div>';}).join('');fx='';
 var i=$('syG').querySelector('input');if(i){i.focus({preventScroll:true});i.select();}post();}
function enter(){var s=$('sy');s.classList.remove('in');void s.offsetWidth;s.classList.add('in');paint();setTimeout(function(){s.classList.remove('in');},1400);}
$('syF').innerHTML=['all','t','g','d','m'].map(function(k){return'<button class="pill'+(k==='all'?' on':'')+'" data-f="'+k+'">'+(k==='all'?'All':SL[k])+'</button>';}).join('');
$('syF').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;fl=b.dataset.f;[].forEach.call(this.children,function(x){x.classList.toggle('on',x===b);});paint();});
$('syQ').addEventListener('input',function(){q=this.value.trim().toLowerCase();paint();});
function commit(inp){if(!ed)return;var k=ed;ed='';if(inp&&edc){var c=cd(edc);c[k+'t']=Math.max(0,Math.min(999,Math.floor(+inp.value)||0));save();}paint();}
var busy=0,jgK=null,pop=null;
function RM(){return matchMedia('(prefers-reduced-motion:reduce)').matches;}
function collapse(el,fn){if(!el||RM()){fn();return;}busy=1;var s=el.style;s.overflow='hidden';s.maxHeight=el.offsetHeight+'px';s.transition='max-height .26s cubic-bezier(.4,0,.2,1),opacity .2s ease,padding .26s,margin .26s';void el.offsetHeight;s.maxHeight='0px';s.opacity='0';s.paddingTop='0px';s.paddingBottom='0px';s.marginTop='0px';s.marginBottom='0px';setTimeout(function(){busy=0;fn();},270);}
function post(){var G=$('syG');
 if(jgK){var k=jgK;jgK=null;[].forEach.call(G.querySelectorAll('.syc'),function(el){if(el.dataset.c===k.id){var t=el.querySelector('.syct[data-ck="'+k.k+'"]');if(t){void t.offsetWidth;t.classList.add('jg');}}});}
 if(pop){var p=pop;pop=null;[].forEach.call(G.querySelectorAll('.syrs'),function(el){if(el.dataset.rw===p)el.classList.add('tkpop');});}}
var ceOn=false,ceK=null;
function ceHit(e){var t=e.target;if(t.tagName==='INPUT')return true;var b=t.closest&&t.closest('.syct b');if(!b)return false;
 var ct=b.closest('.syct'),k=ct&&ct.dataset.ck,ch=b.closest('.syc'),id=ch&&ch.dataset.c;if(!k||!id)return false;
 var c=gc(id),tg=(k==='l'||k==='d')?c[k+'t']:0;ceOn=true;ceK={id:id,k:k};
 b.innerHTML='<input class="sye" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" autocomplete="off" aria-label="Type count" value="'+c[k]+'">'+(tg?'<span>/'+tg+'</span>':'');
 var i=b.querySelector('input');i.focus({preventScroll:true});i.select();return true;}
function ceDone(inp,sv,np){if(!ceOn)return;ceOn=false;var o=ceK;ceK=null;
 if(sv&&inp&&o){var raw=inp.value.replace(/\D/g,'');
  if(raw!==''){var v=Math.min(999,parseInt(raw,10)),c=cd(o.id),ln=(o.k==='l'||o.k==='d'),tg=ln?c[o.k+'t']:0,old=c[o.k];
   if(tg>0&&v>tg){v=tg;toast('Target is '+tg+' \u00b7 set to '+tg);}
   if(v!==old){c[o.k]=v;if(ln&&v>0&&c.s==='t')c.s='g';save();
    if(tg>0&&v>=tg&&old<tg){jgK={id:o.id,k:o.k};toast((o.k==='d'?'DPP':'Lecture')+' target completed ('+v+'/'+tg+')');}}}}
 if(!np)paint();}
$('syG').addEventListener('keydown',function(e){var t=e.target;if(!t.classList||!t.classList.contains('sye'))return;
 if(e.key==='Enter'){e.preventDefault();e.stopPropagation();ceDone(t,true);}
 else if(e.key==='Escape'){ceOn=false;ceK=null;}
 else if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();var v=parseInt(t.value.replace(/\D/g,''),10)||0;t.value=Math.max(0,Math.min(999,v+(e.key==='ArrowUp'?1:-1)));t.select();}
 else if(e.key.length===1&&!/[0-9]/.test(e.key)&&!e.ctrlKey&&!e.metaKey){e.preventDefault();}},true);
$('syG').addEventListener('focusout',function(e){var t=e.target;if(!t.classList||!t.classList.contains('sye'))return;var r=e.relatedTarget;ceDone(t,true,!!(r&&r.tagName==='BUTTON'&&$('syG').contains(r)));});
$('syG').addEventListener('click',function(e){if(busy)return;if(ceHit(e))return;var b=e.target.closest('button'),D2,id,c;if(!b)return;D2=b.dataset;id=(b.closest('.syc')||{dataset:{}}).dataset.c;
 if(D2.g){var k0=D2.g,o0=!!op[k0],bx=b.parentNode.querySelector('.sycl');
  if(o0&&bx&&!(q||fl!=='all')){collapse(bx,function(){op[k0]=false;fx='';paint();});return;}
  op[k0]=!o0;fx=op[k0]?k0:'';}
 else if(D2.t){var opening=!opn[id],xb=b.parentNode.querySelector('.syx2');
  if(!opening&&xb){collapse(xb,function(){delete opn[id];if(edc===id)ed='';fx='';paint();});return;}
  if(opening){opn[id]=1;fx=id;}else delete opn[id];ed='';}
 else if(id){c=cd(id);
  if(D2.s)c.s=D2.s;
  else if(D2.a==='p'||D2.a==='m'){var k=D2.k,tg=(k==='r'||k==='p')?0:c[k+'t'];
   if(D2.a==='p'&&tg>0&&c[k]>=tg){jgK={id:id,k:k};toast((k==='d'?'DPP':'Lecture')+' target completed ('+c[k]+'/'+tg+')');}
   else{c[k]=Math.max(0,c[k]+(D2.a==='p'?1:-1));if(D2.a==='p'&&k!=='r'&&k!=='p'&&c.s==='t')c.s='g';}}
  else if(D2.a==='tg'){ed=D2.k;edc=id;}
  else if(D2.a==='add'){rsOpen(id);return;}
  else if(D2.a==='rk'){Y.r.forEach(function(x){if(x.id===D2.r){x.d=x.d?0:1;if(x.d)pop=x.id;}});}
  else if(D2.a==='rd'){Y.r=Y.r.filter(function(x){return x.id!==D2.r;});}
  save();}
 paint();});
$('syG').addEventListener('keydown',function(e){if(e.target.tagName!=='INPUT')return;if(e.key==='Enter'){e.preventDefault();commit(e.target);}else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();ed='';paint();}});
$('syG').addEventListener('focusout',function(e){if(e.target.tagName==='INPUT'&&ed)commit(e.target);});
$('syG').addEventListener('animationend',function(e){var t=e.target;if(t.classList.contains('fx'))t.classList.remove('fx');else if(t.classList.contains('jg'))t.classList.remove('jg');});
/* ---- resources popup ---- */
function rsOpen(id){rc=id;rk='b';$('rsS').value='ch';$('rsN').value='';$('rsU').value='';$('rsTt').textContent=RT2.b;$('rsm').classList.add('on');setTimeout(function(){$('rsN').focus({preventScroll:true});},120);}
$('rsT').addEventListener('click',function(){$('slL').innerHTML=Object.keys(RT2).map(function(k){return'<button data-k="'+k+'"'+(k===rk?' class="sel"':'')+'>'+RT2[k]+(k===rk?CHK:'')+'</button>';}).join('');$('slm').classList.add('on');});
$('slL').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;rk=b.dataset.k;$('rsTt').textContent=RT2[rk];$('slm').classList.remove('on');});
$('rsV').addEventListener('click',function(){var t=$('rsN').value.trim().slice(0,80),u=$('rsU').value.trim();if(!t){toast('Add a title first');$('rsN').focus();return;}if(u&&!/^https?:\/\//i.test(u)){toast('Link must start with https://');return;}
 Y.r.push({id:nid(),t:t,k:rk,u:u,sc:$('rsS').value,c:rc,s:CH[rc].s[0],d:0});save();$('rsm').classList.remove('on');paint();toast('Resource saved');});
$('rsC').addEventListener('click',function(){$('rsm').classList.remove('on');});$('rsX').addEventListener('click',function(){$('rsm').classList.remove('on');});
/* ---- connect chapter (+ icon) ---- */
var KN={l:'Lecture',d:'DPP',r:'Revision'};
function kinds(lk){var s=String(lk||''),o=[];['l','d','r'].forEach(function(k){if(s.indexOf(k)>=0)o.push(k);});return o;}
function kname(lk){return kinds(lk).map(function(k){return KN[k];}).join(' + ');}
function pend(id,k){return tasks.filter(function(t){return t.ch===id&&!t.done&&kinds(t.lk).indexOf(k)>=0;}).length;}
function stat(id,k){if(k==='r')return 0;var c=gc(id),t=c[k+'t'];if(!(t>0))return 0;if(c[k]>=t)return 2;if(c[k]+pend(id,k)>=t)return 1;return 0;}
function allDone(id){var c=gc(id);if(!(c.lt>0||c.dt>0))return false;return(!(c.lt>0)||c.l>=c.lt)&&(!(c.dt>0)||c.d>=c.dt);}
var sel={l:0,d:0,r:0};
function goLbl(){var n=['l','d','r'].filter(function(k){return sel[k];}),g=$('cpB').querySelector('.cpgo');if(!g)return;g.disabled=!n.length;g.textContent=n.length?'Link '+n.map(function(k){return KN[k];}).join(' + '):'Select what to link';}
function cpMsg(t,cls){var m=$('cpB').querySelector('.cpm2');if(!m)return;if(t){m.textContent=t;m.className='cpm2 show'+(cls?' '+cls:'');}else m.className='cpm2';}
function cpList(){var qq=$('cpQ').value.trim().toLowerCase(),h='',any=0;D.forEach(function(s){var b='';s[3].forEach(function(g){var m=g[1].filter(function(n){return!qq||n.toLowerCase().indexOf(qq)>=0;});if(!m.length)return;b+=(g[0]?'<div class="cpg">'+esc(g[0])+'</div>':'')+m.map(function(n){var id=s[0]+'|'+n,dn=allDone(id);return'<button data-c="'+esc(id)+'"><span>'+esc(n)+'</span><i'+(dn?' class="gd" title="Targets completed"':'')+' style="background:'+(dn?'#30d158':CL[gc(id).s])+'"></i></button>';}).join('');});if(b){any=1;h+='<div class="cph"><i style="background:'+s[2]+'"></i>'+s[1]+'</div>'+b;}});
 $('cpL').innerHTML=any?h:'<div class="empty" style="padding:24px 0">No chapter found</div>';}
function cpOpen(ed){SYAPI.cpEd=!!ed;cs='';$('cpQ').value='';$('cpA').hidden=false;$('cpB').hidden=true;$('cpT').textContent='Connect Chapter';cpList();$('cpm').classList.add('on');setTimeout(function(){$('cpQ').focus({preventScroll:true});},120);}
$('cpQ').addEventListener('input',cpList);
$('cpL').addEventListener('click',function(e){var b=e.target.closest('button');if(!b||!b.dataset.c)return;cs=b.dataset.c;var c=CH[cs],g=gc(cs);sel={l:0,d:0,r:0};$('cpT').textContent='Link as';$('cpA').hidden=true;$('cpB').hidden=false;
 $('cpB').innerHTML='<button class="cpb" data-b="1">\u2190 Back</button><div class="cpn">'+esc(c.n)+'<small>'+c.s[1]+(c.g?' \u00b7 '+esc(c.g):'')+'</small></div><div class="cpo">'+['l','d','r'].map(function(k){var st=stat(cs,k),tg=k==='r'?0:g[k+'t'],sm=k==='r'?g.r+' done':(tg?g[k]+'/'+tg:g[k]+' done');return'<button type="button" data-lk="'+k+'"'+(st?' class="fin" data-st="'+st+'"':'')+'><i class="cpk">'+TICK+'</i><b>'+KN[k]+'</b><small>'+(st===2?'✅ ':'')+sm+'</small></button>';}).join('')+'</div><div class="cpm2" role="status" aria-live="polite"></div><button type="button" class="cpgo" data-go="1" disabled>Select what to link</button>';
 $('cpB').scrollTop=0;});
$('cpB').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
 if(b.dataset.b){$('cpA').hidden=false;$('cpB').hidden=true;$('cpT').textContent='Connect Chapter';return;}
 if(b.dataset.lk){var k=b.dataset.lk;
  if(b.classList.contains('fin')){var st=+b.dataset.st,g=gc(cs),tg=g[k+'t'];cpMsg(KN[k]+(st===2?' target completed':' target already fully planned')+' ('+(st===2?g[k]:g[k]+pend(cs,k))+'/'+tg+')',st===2?'ok':'');b.classList.remove('jg');void b.offsetWidth;b.classList.add('jg');return;}
  sel[k]=sel[k]?0:1;b.classList.toggle('on',!!sel[k]);cpMsg('');goLbl();return;}
 if(b.dataset.go&&!b.disabled){var lk=['l','d','r'].filter(function(x){return sel[x];}).join('');if(!lk)return;
  if(SYAPI.cpEd){$('cpm').classList.remove('on');SYAPI.cpEd=false;if(SYAPI.etPick)SYAPI.etPick({id:cs,lk:lk,subj:TS[CH[cs].s[0]]});return;}SYAPI.ch={id:cs,lk:lk};var ts=TS[CH[cs].s[0]];if(sub(ts))addSb=ts;$('cpm').classList.remove('on');tRender();$('in').focus({preventScroll:true});}});
$('cpB').addEventListener('animationend',function(e){if(e.target.classList.contains('jg'))e.target.classList.remove('jg');});
var plB=$('plB'),plp=$('plp');
plB.addEventListener('click',function(){plp.classList.toggle('on');plB.classList.toggle('on',plp.classList.contains('on'));});
plp.addEventListener('click',function(e){if(e.target.closest('[data-cc]')){plp.classList.remove('on');plB.classList.remove('on');cpOpen();}});
S.addEventListener('click',function(e){var P=e.composedPath();if(P.indexOf(plp)<0&&P.indexOf(plB)<0){plp.classList.remove('on');plB.classList.remove('on');}});
$('cCh').addEventListener('click',function(){SYAPI.ch=null;tRender();});
['cpm','rsm','slm'].forEach(function(i){$(i).addEventListener('click',function(e){if(e.target===this)this.classList.remove('on');});});
/* ---- hooks used by the task engine ---- */
SYAPI.cpOpen=cpOpen;SYAPI.chLabel=function(a){return a&&CH[a.id]?{n:CH[a.id].n,k:kname(a.lk||'l')}:null;};
SYAPI.chip=function(){var b=$('cCh'),a=SYAPI.ch;if(!a||!CH[a.id]){SYAPI.ch=null;b.style.display='none';return;}b.style.display='';b.innerHTML=LINK+esc(CH[a.id].n)+' \u00b7 '+kname(a.lk)+' \u2715';};
SYAPI.sugg=function(){var a=SYAPI.ch;if(!a||!CH[a.id])return'';var g=gc(a.id);return CH[a.id].n+' '+kinds(a.lk).map(function(k){return(k==='d'?'DPP ':k==='r'?'Rev ':'L')+(g[k]+pend(a.id,k)+1);}).join(' + ');};
SYAPI.tag=function(t){return t.ch&&CH[t.ch]?'<span class="tag" style="color:var(--acc2);background:rgba(var(--ar),.12);border:1px solid rgba(var(--ar),.35)">'+(t.cn?'✅ ':'')+kname(t.lk)+'</span>':'';};
SYAPI.wtag=function(t){
 if(!(t.ch&&CH[t.ch]))return'';
 var ks=kinds(t.lk);if(!ks.length)return'';
 var I1='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
  I2='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
 return'<span class="wtg'+(t.cn?' ok':'')+'" title="'+esc(kname(t.lk))+'">'+(t.cn?I2:I1)
  +ks.map(function(k){return'<b data-s="'+k.toUpperCase()+'" data-m="'+(k==='l'?'Lec':k==='d'?'DPP':'Rev')+'" data-f="'+(k==='l'?'Lecture':k==='d'?'DPP':'Revision')+'"></b>';}).join('')+'</span>';};
SYAPI.sync=function(){if(!ok)return;var ch=0;tasks.forEach(function(t){var c0=t.ch&&CH[t.ch];if(!c0||(t.done?1:0)===(t.cn?1:0))return;var c=cd(t.ch),ks=kinds(t.lk),cm=typeof t.cm==='string'?t.cm:(t.cn?ks.join(''):''),m=[];
 if(t.done){ks.forEach(function(k){var tg=k==='r'?0:c[k+'t'];if(tg>0&&c[k]>=tg)return;c[k]++;m.push(k);if(k!=='r'&&c.s==='t')c.s='g';});t.cm=m.join('');
  toast(m.length?'+1 '+m.map(function(k){return k==='d'?'DPP':k==='r'?'revision':'lecture';}).join(' + ')+' \u00b7 '+c0.n:'Target already completed \u00b7 '+c0.n);}
 else{kinds(cm).forEach(function(k){c[k]=Math.max(0,c[k]-1);});t.cm='';}
 t.cn=t.done?1:0;ch=1;});if(ch){save();if(view==='syl')paint();}};
SYAPI.paint=enter;
SYAPI.esc=function(){var m=['slm','rsm','cpm'].filter(function(i){return $(i).classList.contains('on');})[0];if(m){$(m).classList.remove('on');return true;}if(plp.classList.contains('on')){plp.classList.remove('on');plB.classList.remove('on');return true;}return false;};
SYAPI.close=function(){['slm','rsm','cpm'].forEach(function(i){$(i).classList.remove('on');});plp.classList.remove('on');};
if(window.ResizeObserver)new ResizeObserver(function(){if(view==='syl'&&$('main').clientWidth&&ncol()!==lastN)paint();}).observe($('main'));
ok=true;
})();
/* ===== v30: Task | Week toggle + Google-Calendar style week planner =====
   Timed task = tasks[i].ws / .we (epoch ms). No ws/we = all-day strip. t.due always = logical day of ws.
   Grid rows start at the Day Rollover hour, so everything shifts with the rollover setting. */
var tkMode='task',wkOff=0,wkSel='',wkD=null,wkBlk=0,wkTap={id:'',t:0},wkRaf=0,wkNowI=0,wkFresh=false,wkNs='',wkPop='';
var WH=42,WM=WH/60,FULLM=['January','February','March','April','May','June','July','August','September','October','November','December'],WKD=['MON','TUE','WED','THU','FRI','SAT','SUN'],
 ICLK='<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
 ICLKB='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
function wkTid(id){return tasks.filter(function(t){return t.id===id;})[0];}
function wkMon(){return addD(mon(lnow()),7*wkOff);}
function wkKeys(){var m=wkMon(),a=[],i;for(i=0;i<7;i++)a.push(L(addD(m,i)));return a;}
function wkT(ms){var d=new Date(ms),h=d.getHours(),m=d.getMinutes();return(h%12||12)+':'+p2(m)+' '+(h<12?'AM':'PM');}
function wkDur(m){var h=Math.floor(m/60),r=m%60;return h?(h+'h'+(r?' '+r+'m':'')):r+'m';}
function wkGmt(){var o=-new Date().getTimezoneOffset(),a=Math.abs(o);return'GMT'+(o<0?'-':'+')+p2(Math.floor(a/60))+':'+p2(a%60);}
function wkTitle(){
 if(tkMode!=='week'){var q=vD().split('-'),n=new Date(+q[0],+q[1]-1,+q[2]);return n.getDate()+' '+FULLM[n.getMonth()]+' '+n.getFullYear();}
 var m=wkMon(),e=addD(m,6),ms=MNAME[m.getMonth()],me=MNAME[e.getMonth()];
 if(m.getFullYear()!==e.getFullYear())return ms+' '+m.getDate()+', '+m.getFullYear()+' \u2013 '+me+' '+e.getDate()+', '+e.getFullYear();
 if(m.getMonth()!==e.getMonth())return ms+' '+m.getDate()+' \u2013 '+me+' '+e.getDate()+', '+e.getFullYear();
 return ms+' '+m.getDate()+'\u2013'+e.getDate()+', '+e.getFullYear();}
function wkThumb(){var sg=$('wkSeg'),th=sg.querySelector('i'),a=sg.querySelector('button.on');if(!th||!a||!a.offsetWidth)return;th.style.width=a.offsetWidth+'px';th.style.transform='translateX('+(a.offsetLeft-3)+'px)';}
function wkBar(){var b=$('wkBar');if(!b)return;b.classList.toggle('tk',tkMode!=='week');$('wkTi').textContent=wkTitle();
 [].forEach.call($('wkSeg').querySelectorAll('button'),function(x){var on=x.dataset.m===tkMode;x.classList.toggle('on',on);x.setAttribute('aria-pressed',String(on));});
 wkThumb();requestAnimationFrame(wkThumb);}
function wkView(){var td=view==='today',wk=td&&tkMode==='week';
 $('wkBar').hidden=!td;$('v-tasks').classList.toggle('tdv',td);$('tkPane').hidden=wk;$('wkPane').hidden=!wk;$('main').classList.toggle('wkw',wk);
 if(wk)wkFresh=true;wkBar();}
function wkSetMode(m){if(m===tkMode)return;tkMode=m;wkNewX();wkView();
 if(m==='week'){wkPaint(false);}else{animAll=true;tRender();}
 $('main').scrollTop=0;}
function wkSync(){if(view!=='today'||tkMode!=='week'||(wkD&&wkD.act))return;wkBar();wkPaint(!wkFresh);wkFresh=false;}
function wkClr(t){var s=t.subj&&sub(t.subj);return s?SC(s.id):'#8e8e93';}
function wkItems(keys){
 var ad={},tm={},set={};keys.forEach(function(k){ad[k]=[];tm[k]=[];set[k]=1;});
 tasks.forEach(function(t){
  if((inInbox(t)&&!(wkTg&&kbd(t)))||!t.due)return;
  if(t.ws>0&&t.we>t.ws){var k=logicalKey(t.ws);if(!set[k])return;var ds=dayStart(k),s=Math.max(0,Math.round((t.ws-ds)/6e4)),e=Math.min(1440,Math.round((t.we-ds)/6e4));if(e<=s)e=Math.min(1440,s+15);tm[k].push({t:t,s:s,e:e});}
  else if(set[t.due])ad[t.due].push(t);});
 return{ad:ad,tm:tm};}
function wkLay(a){
 a.sort(function(x,y){return x.s-y.s||y.e-x.e;});
 var cur=null,end=0,cl=[];
 a.forEach(function(x){var ve=Math.max(x.e,x.s+30);
  if(!cur||x.s>=end){cur={items:[],lanes:[]};cl.push(cur);end=0;}
  var l=0;while(cur.lanes[l]!==undefined&&cur.lanes[l]>x.s)l++;cur.lanes[l]=ve;x.l=l;cur.items.push(x);end=Math.max(end,ve);});
 cl.forEach(function(c){var n=c.lanes.length;c.items.forEach(function(x){x.n=n;});});}
function wkCls(h){return h<30?' s1':h<46?' s2':h>=74?' t3':'';}
var ICHAIN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
 ICHK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
function wkTag(t){return SYAPI.wtag?SYAPI.wtag(t):'';}
function wkSubs(t,x){var sb=t.sub||[];if(!sb.length)return'';var h=Math.max(22,(x.e-x.s)*WM-2),r=Math.floor((h-72)/16);if(r<1)return'';var n=sb.length,m=n<=r?n:r-1,o='<div class="wsx'+(mkOf(t)?' mkw':'')+'">';sb.slice(0,m).forEach(function(q,i){o+='<div class="wsxr'+(q.done?' done':'')+'"><button type="button" class="wsxc" data-i="'+i+'" aria-label="Toggle subtask">'+(q.done?TICK:'')+'</button><span>'+esc(q.text)+'</span></div>';});if(n>m)o+='<div class="wsxm">+'+(n-m)+' more</div>';return o+'</div>';}
function wkInner(t,x,ds,ph){
 var s=t.subj&&sub(t.subj);
 return'<div class="wh"><span class="wl">'+(mkOf(t)?'MOCK TEST':s?SN(s.id):'General')+'</span>'+wkTag(t)+'</div><span class="wtt">'+esc(t.text)+'</span>'+(ph||!x?'':wkSubs(t,x))
  +'<span class="wtm">'+ICLK+'<em>'+(x?wkT(ds+x.s*6e4)+' \u2013 '+wkT(ds+x.e*6e4):'')+'</em></span>'
  +(ph?'':'<button type="button" class="wck" data-wc="1" aria-label="Toggle '+esc(t.text)+'">'+(t.done?TICK:'')+'</button>')+'<i class="wrz"></i>';}
function wkBlock(x,ds){
 var t=x.t,h=Math.max(22,(x.e-x.s)*WM-2),w=100/x.n;
 return'<div class="wev'+(t.mk?' wmk':'')+(t.done?' done':'')+(wkSel===t.id?' sel':'')+(wkPop===t.id?' wpp':'')+wkCls(h)+'" data-id="'+t.id+'" style="--c:'+wkClr(t)+';top:'+(x.s*WM+1)+'px;height:'+h+'px;left:calc('+(x.l*w)+'% + 3px);width:calc('+w+'% - 6px)">'
  +wkInner(t,x,ds,false)+'</div>';}
function wkAd(t){
 return'<div class="wad'+(t.mk?' wmk':'')+(t.done?' done':'')+(wkSel===t.id?' sel':'')+'" data-id="'+t.id+'" style="--c:'+wkClr(t)+'"><button type="button" class="wdc" data-wc="1" aria-label="Toggle '+esc(t.text)+'">'+(t.done?TICK:'')+'</button><span class="wat">'+esc(t.text)+'</span>'+wkTag(t)+'</div>';}
function wkPaint(keep,dir){
 var sc=$('wkS'),inn=$('wkIn');if(!sc||!inn)return;
 var keys=wkKeys(),it=wkItems(keys),tl=L(),st=sc.scrollTop,h='',i;
 h+='<div class="wkst"><div class="wkg"><div class="wkgu wkgt"><span>'+wkGmt()+'</span></div>';
 keys.forEach(function(k,i){h+='<div class="wkdh'+(k===tl?' td':'')+'"><small>'+WKD[i]+'</small><b>'+(+k.slice(8))+'</b></div>';});
 h+='</div><div class="wkg wkar"><div class="wkgu"><span>ALL-DAY</span></div>';
 keys.forEach(function(k){h+='<div class="wkad" data-k="'+k+'">'+it.ad[k].map(wkAd).join('')+(it.ad[k].length?'':'<button type="button" class="wkap" data-k="'+k+'" aria-label="Add all-day task" title="Add task"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button>')+'</div>';});
 h+='</div></div><div class="wkg wkbd"><div class="wkgu wkgl">';
 for(i=0;i<24;i++)h+='<span'+(i===0?' class="f"':'')+' style="top:'+(i*WH)+'px">'+fh(ROLL+i)+'</span>';
 h+='</div>';
 keys.forEach(function(k){
  var ds=dayStart(k),a=it.tm[k],j;wkLay(a);
  h+='<div class="wkc'+(k===tl?' td':'')+'" data-k="'+k+'">';
  for(j=0;j<24;j++){var hh=(ROLL+j)%24;h+='<div class="hc" data-i="'+j+'" data-l="'+(hh%12||12)+':00 '+(hh<12?'AM':'PM')+'"></div>';}
  h+=a.map(function(x){return wkBlock(x,ds);}).join('');
  if(k===tl)h+='<div class="wnow" style="top:'+((Date.now()-ds)/6e4*WM)+'px"></div>';
  h+='</div>';});
 h+='</div>';
 inn.innerHTML=h;inn.classList.toggle('q',!!keep);wkPop='';
 if(keep)sc.scrollTop=st;else wkNowScroll(false);
 if(dir){inn.classList.remove('wkL','wkR');void inn.offsetWidth;inn.classList.add(dir>0?'wkR':'wkL');}
 clearInterval(wkNowI);wkNowI=setInterval(wkTick,3e4);}
function wkTick(){if(tkMode!=='week'||view!=='today')return;var n=$('wkS').querySelector('.wnow');if(!n)return;n.style.top=((Date.now()-dayStart(n.parentNode.dataset.k))/6e4*WM)+'px';}
function wkNowScroll(smooth){var sc=$('wkS'),tl=L(),y=0;if(wkKeys().indexOf(tl)>=0)y=Math.max(0,(Date.now()-dayStart(tl))/6e4*WM-170);sc.scrollTo({top:y,behavior:smooth?'smooth':'auto'});}
function wkMarkSel(){[].forEach.call($('wkS').querySelectorAll('.wev,.wad'),function(n){n.classList.toggle('sel',n.dataset.id===wkSel);});}
function wkTgl(t,el){
 t.done=!t.done;if(t.done&&Array.isArray(t.sub))t.sub.forEach(function(x){x.done=true;});t.doneAt=t.done?Date.now():0;t.st='';tSave();tMeta();fillLink();
 el.classList.toggle('done',t.done);var c=el.querySelector('[data-wc]');c.innerHTML=t.done?TICK:'';
 el.classList.remove('tkpop');void el.offsetWidth;if(t.done)el.classList.add('tkpop');}
/* ---- pointer engine: move / resize / all-day <-> timed ---- */
function wkCols(){return[].slice.call($('wkS').querySelectorAll('.wkbd .wkc'));}
function wkSnap(m){return Math.round(m/15)*15;}
function wkAt(x,y){
 var cs=wkCols(),ci=0,i,r;for(i=0;i<cs.length;i++){if(x>=cs[i].getBoundingClientRect().left)ci=i;}
 r=cs[ci].getBoundingClientRect();
 return{col:cs[ci],key:cs[ci].dataset.k,min:(y-r.top)/WM,ad:y<$('wkS').querySelector('.wkst').getBoundingClientRect().bottom};}
function wkTm(el,ds,s,e){var m=el.querySelector('.wtm em');if(m)m.textContent=wkT(ds+s*6e4)+' \u2013 '+wkT(ds+e*6e4);}
function wkPill(d,e){
 var p=d.pill;if(!p){p=document.createElement('div');p.className='wpill';d.el.parentNode.appendChild(p);d.pill=p;}
 var ty=e*WM+6;if(ty+66>24*WH)ty=Math.max(0,e*WM-72);
 p.style.top=ty+'px';p.innerHTML='<small>'+wkT(d.ds+e*6e4)+'</small><div>'+ICLKB+'<span>Ends at '+wkT(d.ds+e*6e4)+'</span><em>('+wkDur(e-d.s)+')</em></div>';}
function wkStart(d,mode){
 var t=d.t,ds,br;d.mode=mode;d.act=true;RT.classList.add('wkdrag');clearTimeout(d.ht);
 if(mode==='mv'){
  if(d.kind==='tm'){ds=dayStart(logicalKey(t.ws));d.s=Math.round((t.ws-ds)/6e4);d.dur=Math.max(15,Math.round((t.we-t.ws)/6e4));br=d.el.getBoundingClientRect();d.go=(d.y0-br.top)/WM;d.vis=d.el;
   d.el.classList.add('drag');d.el.style.left='3px';d.el.style.width='calc(100% - 6px)';}
  else{d.dur=60;d.go=18;var s=t.subj&&sub(t.subj),ph=document.createElement('div');
   ph.className='wev ph drag'+wkCls(d.dur*WM-2);ph.style.cssText='--c:'+wkClr(t)+';height:'+(d.dur*WM-2)+'px;left:3px;width:calc(100% - 6px);top:0';
   ph.innerHTML=wkInner(t,null,0,true);
   d.vis=ph;d.el.classList.add('ghost');}
 }else{
  ds=dayStart(logicalKey(t.ws));d.ds=ds;d.s=Math.round((t.ws-ds)/6e4);d.e=Math.min(1440,Math.round((t.we-ds)/6e4));
  d.el.classList.add('resizing','sel');wkSel=t.id;wkMarkSel();wkPill(d,d.e);}
 wkAuto();}
function wkUpd(){
 var d=wkD;if(!d||!d.act)return;var p=wkAt(d.cx,d.cy),t=d.t;
 if(d.mode==='rz'){
  var r=d.el.parentNode.getBoundingClientRect(),e=wkSnap((d.cy-r.top)/WM);e=Math.max(d.s+15,Math.min(1440,e));d.e=e;
  var h=Math.max(22,(e-d.s)*WM-2);d.el.style.height=h+'px';d.el.classList.remove('s1','s2');if(wkCls(h))d.el.classList.add(wkCls(h).trim());
  wkTm(d.el,d.ds,d.s,e);wkPill(d,e);return;}
 [].forEach.call(S.querySelectorAll('.wkad.over'),function(n){n.classList.remove('over');});
 if(p.ad){var ac=S.querySelector('.wkad[data-k="'+p.key+'"]');if(ac)ac.classList.add('over');d.to={ad:1,key:p.key};d.vis.classList.add('toad');return;}
 d.vis.classList.remove('toad');
 var s=Math.max(0,Math.min(1440-d.dur,wkSnap(p.min-d.go)));
 if(d.vis.parentNode!==p.col)p.col.appendChild(d.vis);
 d.vis.style.top=(s*WM+1)+'px';wkTm(d.vis,dayStart(p.key),s,s+d.dur);d.to={key:p.key,s:s};}
function wkAuto(){
 cancelAnimationFrame(wkRaf);
 (function f(){var d=wkD;if(!d||!d.act)return;
  var sc=$('wkS'),r=sc.getBoundingClientRect(),sh=sc.querySelector('.wkst').getBoundingClientRect(),dy=0;
  if(d.cy>r.bottom-46)dy=Math.min(22,(d.cy-(r.bottom-46))/3+2);
  else if(d.cy>sh.bottom&&d.cy<sh.bottom+36&&sc.scrollTop>0)dy=-Math.min(22,((sh.bottom+36)-d.cy)/3+2);
  if(dy){sc.scrollTop+=dy;wkUpd();}
  wkRaf=requestAnimationFrame(f);})();}
function wkAbort(){var d=wkD;if(d)clearTimeout(d.ht);window.removeEventListener('pointermove',wkMv);window.removeEventListener('pointerup',wkUp);window.removeEventListener('pointercancel',wkUp);}
function wkDown(e){
 if(e.button>0||(wkD&&wkD.act))return;
 if(e.target.closest('input,[data-wc],.wsb,.wsxc,.wkap'))return;
 var ev=e.target.closest('.wev:not(.new)'),ad=e.target.closest('.wad');
 if(!ev&&!ad){if(wkSel&&!e.target.closest('.wev')){wkSel='';wkMarkSel();}return;}
 var el=ev||ad,t=wkTid(el.dataset.id);if(!t)return;
 wkSel=t.id;wkMarkSel();
 var rz=ev&&e.target.closest('.wrz')&&t.ws>0;
 wkD={t:t,el:el,kind:ev?'tm':'ad',mode:'pend',act:false,x0:e.clientX,y0:e.clientY,cx:e.clientX,cy:e.clientY,pid:e.pointerId,type:e.pointerType,ht:0};
 window.addEventListener('pointermove',wkMv);window.addEventListener('pointerup',wkUp);window.addEventListener('pointercancel',wkUp);
 if(rz){e.preventDefault();wkStart(wkD,'rz');}
 else if(e.pointerType!=='mouse'){var d0=wkD;d0.ht=setTimeout(function(){if(wkD===d0&&!d0.act){try{navigator.vibrate&&navigator.vibrate(8);}catch(x){}wkStart(d0,'mv');wkUpd();}},380);}}
function wkMv(e){
 var d=wkD;if(!d||e.pointerId!==d.pid)return;d.cx=e.clientX;d.cy=e.clientY;
 if(!d.act){var m=Math.hypot(e.clientX-d.x0,e.clientY-d.y0);
  if(d.type==='mouse'){if(m<5)return;wkStart(d,'mv');}
  else{if(m>9){clearTimeout(d.ht);wkAbort();wkD=null;}return;}}
 wkUpd();}
function wkUp(e){
 var d=wkD;if(!d||(e&&e.pointerId!==d.pid))return;
 wkAbort();wkD=null;cancelAnimationFrame(wkRaf);
 if(!d.act)return;
 RT.classList.remove('wkdrag');wkBlk=Date.now()+350;wkPop=d.t.id;
 var t=d.t,cancel=d.cancel||(e&&e.type==='pointercancel');
 if(!cancel){
  if(d.mode==='rz'){t.we=d.ds+d.e*6e4;}
  else if(d.to){
   if(d.to.ad){if(t.ws){delete t.ws;delete t.we;}t.due=d.to.key;}
   else{var ds=dayStart(d.to.key);t.ws=ds+d.to.s*6e4;t.we=t.ws+d.dur*6e4;t.due=d.to.key;}}
  tSave();tMeta();fillLink();}
 wkPaint(true);}
/* quick create: click an empty hour */
function wkNewX(){[].forEach.call(S.querySelectorAll('.wev.new'),function(n){n.dataset.x='1';n.remove();});}
function wkNewRz(el,e){
 if(e.button>0)return;e.preventDefault();e.stopPropagation();
 var m=+el.dataset.m,col=el.parentNode,ds=dayStart(el.dataset.k),inp=el.querySelector('input'),sc=$('wkS'),cy=e.clientY,go=1,pid=e.pointerId,
  d={el:el,s:m,ds:ds,e:m+(+el.dataset.dur||60),pill:null};
 el.dataset.rz='1';el.classList.add('resizing');RT.classList.add('wkdrag');
 function upd(){var r=col.getBoundingClientRect(),en=wkSnap((cy-r.top)/WM);en=Math.max(m+15,Math.min(1440,en));d.e=en;el.dataset.dur=en-m;
  el.style.height=Math.max(22,(en-m)*WM-2)+'px';
  el.querySelector('.wnt').textContent=wkT(ds+m*6e4)+' \u2013 '+wkT(ds+en*6e4);wkPill(d,en);}
 function mv(ev){if(ev.pointerId!==pid)return;cy=ev.clientY;upd();}
 function up(ev){if(ev.pointerId!==pid)return;go=0;
  window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);
  if(d.pill)d.pill.remove();el.classList.remove('resizing');RT.classList.remove('wkdrag');wkBlk=Date.now()+350;delete el.dataset.rz;
  inp.focus({preventScroll:true});}
 (function lp(){if(!go)return;var r=sc.getBoundingClientRect();if(cy>r.bottom-46){sc.scrollTop+=Math.min(22,(cy-(r.bottom-46))/3+2);upd();}requestAnimationFrame(lp);})();
 window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);upd();}
function wkNew(hc,y){
 wkNewX();
 var col=hc.parentNode,r=hc.getBoundingClientRect(),m=(+hc.dataset.i)*60+Math.max(0,Math.min(3,Math.floor((y-r.top)/(WH/4))))*15;m=Math.min(m,1440-60);
 var list=[''].concat(subs.map(function(s){return s.id;})),cur=Math.max(0,list.indexOf(addSb));wkNs=list[cur];
 var ds=dayStart(col.dataset.k);
 var el=document.createElement('div');el.className='wev new';el.dataset.k=col.dataset.k;el.dataset.m=m;el.dataset.dur=60;
 el.style.cssText='top:'+(m*WM+1)+'px;height:'+(60*WM-2)+'px;left:3px;width:calc(100% - 6px)';
 function paintSb(){var s=wkNs&&sub(wkNs);el.style.setProperty('--c',s?SC(s.id):'#8e8e93');el.querySelector('.wsb b').textContent=s?s.n:'General';}
 el.innerHTML='<div class="wh"><span class="wl"><button type="button" class="wsb" aria-label="Change subject"><i></i><b></b></button></span><span class="wnt">'+wkT(ds+m*6e4)+' \u2013 '+wkT(ds+(m+60)*6e4)+'</span></div><input class="wni" maxlength="200" placeholder="New task" autocomplete="off" aria-label="New task"><i class="wrz" aria-label="Drag to set duration"></i>';
 col.appendChild(el);paintSb();
 var inp=el.querySelector('input');
 el.querySelector('.wrz').addEventListener('pointerdown',function(e){wkNewRz(el,e);});
 el.querySelector('.wsb').addEventListener('click',function(){cur=(cur+1)%list.length;wkNs=list[cur];paintSb();inp.focus({preventScroll:true});});
 inp.addEventListener('keydown',function(e){
  if(e.key==='Enter'&&!e.isComposing){e.preventDefault();e.stopPropagation();wkMake(el,inp);}
  else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();wkNewX();}});
 el.addEventListener('focusout',function(){setTimeout(function(){if(el.dataset.x||el.dataset.rz||el.contains(S.activeElement))return;if(inp.value.trim())wkMake(el,inp);else{el.dataset.x='1';el.remove();}},120);});
 inp.focus({preventScroll:true});}
function wkMake(el,inp){
 var v=inp.value.replace(/\s+/g,' ').trim().slice(0,200);if(!v||el.dataset.x)return;el.dataset.x='1';
 var k=el.dataset.k,m0=+el.dataset.m,dur=Math.max(15,Math.min(1440-m0,+el.dataset.dur||60)),ws=dayStart(k)+m0*6e4,nt={sub:[],id:nid(),text:v,done:false,due:k,subj:wkNs,at:Date.now(),doneAt:0,src:'',st:'',bd:false,ch:'',lk:'l',cn:0,ws:ws,we:ws+dur*6e4};
 tasks.push(nt);freshId=nt.id;wkSel=nt.id;wkPop=nt.id;tSave();tMeta();fillLink();el.remove();wkPaint(true);}
var wkAdOv=null,wkAdPrev='today',wkAdN=0;
function wkAdMk(){if(wkAdOv)return wkAdOv;var o=document.createElement('div');o.className='wkaov';o.hidden=true;o.innerHTML='<div class="wkaw" role="dialog" aria-label="New all-day task"><div class="wkah"><b>New all-day task</b><button type="button" class="wkax" aria-label="Close">\u00d7</button></div><div class="wkab"></div></div>';($('main').closest('.root')||$('main').parentNode).appendChild(o);o.addEventListener('mousedown',function(e){if(e.target===o)wkAdClose();});o.querySelector('.wkax').addEventListener('click',wkAdClose);return(wkAdOv=o);}
function wkAdOpen(k){var o=wkAdMk(),card=$('in').closest('.card.add');wkAdPrev=addDue;addDue=k;wkAdN=tasks.length;o.querySelector('.wkab').appendChild(card);o.hidden=false;tRender();setTimeout(function(){$('in').focus();},40);}
function wkAdClose(){if(!wkAdOv||wkAdOv.hidden)return;wkAdOv.hidden=true;$('tkPane').insertBefore($('in').closest('.card.add'),$('list'));$('pop').classList.remove('on');addDue=wkAdPrev;tRender();if(tkMode==='week')wkPaint(true);}
$('in').addEventListener('keydown',function(e){if(e.key==='Enter'&&wkAdOv&&!wkAdOv.hidden&&tasks.length>wkAdN)wkAdClose();});
function wkEsc(){
 if(wkAdOv&&!wkAdOv.hidden){wkAdClose();return true;}
 if($('etm').classList.contains('on')||$('sdm').classList.contains('on')||$('pfm').classList.contains('on')||$('stm').classList.contains('on'))return false;
 if(wkD&&wkD.act){wkD.cancel=1;wkUp({type:'pointercancel',pointerId:wkD.pid});return true;}
 if(S.querySelector('.wev.new')){wkNewX();return true;}
 if(tkMode==='week'&&view==='today'&&wkSel){wkSel='';wkMarkSel();return true;}
 return false;}
function wkFixTime(t){/* edit modal changed the date of a timed task: keep clock offset, move day */
 if(!(t.ws>0&&t.we>t.ws))return;
 if(!t.due){delete t.ws;delete t.we;return;}
 var cur=logicalKey(t.ws);if(cur===t.due)return;
 var off=t.ws-dayStart(cur),dur=t.we-t.ws;t.ws=dayStart(t.due)+off;t.we=t.ws+dur;}
function wkRoll(){tasks.forEach(function(t){if(t.ws>0&&t.we>t.ws)t.due=logicalKey(t.ws);});}
$('wkSeg').addEventListener('click',function(e){var b=e.target.closest('button');if(b)wkSetMode(b.dataset.m);});
$('wkP').addEventListener('click',function(){wkOff--;wkBar();wkPaint(true,-1);});
$('wkNx').addEventListener('click',function(){wkOff++;wkBar();wkPaint(true,1);});
$('wkTd').addEventListener('click',function(){var was=wkOff;wkOff=0;wkBar();wkPaint(true,was>0?-1:was<0?1:0);wkNowScroll(true);});
$('wkS').addEventListener('pointerdown',wkDown);
$('wkS').addEventListener('touchmove',function(e){if(wkD&&wkD.act&&e.cancelable)e.preventDefault();},{passive:false});
$('wkS').addEventListener('pointerdown',function(e){if(e.target.closest('.wkap,.wsxc'))e.stopPropagation();},true);
$('wkS').addEventListener('dblclick',function(e){if(e.target.closest('input,[data-wc],.wsxc,.wkap,.wev.new,.wrz'))return;var it=e.target.closest('.wev,.wad'),t=it&&wkTid(it.dataset.id);if(!t||$('etm').classList.contains('on'))return;wkTap.id='';etOpen(t);});
$('wkS').addEventListener('contextmenu',function(e){if(wkD)e.preventDefault();});
$('wkS').addEventListener('click',function(e){
 if(Date.now()<wkBlk)return;
 var ap=e.target.closest('.wkap');if(ap){wkAdOpen(ap.dataset.k);return;}
 var sx=e.target.closest('.wsxc');if(sx){var ev0=sx.closest('.wev'),t0=ev0&&wkTid(ev0.dataset.id),q=t0&&(t0.sub||[])[+sx.dataset.i];if(q){q.done=!q.done;tSave();wkPaint(true);tRender();}return;}
 var c=e.target.closest('[data-wc]'),it,t;
 if(c){it=c.closest('.wev,.wad');t=it&&wkTid(it.dataset.id);if(t)wkTgl(t,it);return;}
 if(e.target.closest('.wev.new'))return;
 var nw=S.querySelector('.wev.new'),ip=nw&&nw.querySelector('input');if(ip&&ip.value.trim()){wkMake(nw,ip);return;}
 it=e.target.closest('.wev,.wad');
 if(it){t=wkTid(it.dataset.id);if(!t)return;var n=Date.now();if(wkTap.id===t.id&&n-wkTap.t<350){wkTap.id='';etOpen(t);}else{wkTap.id=t.id;wkTap.t=n;}return;}
 var hc=e.target.closest('.hc');
 if(hc){wkNew(hc,e.clientY);return;}
 if(wkSel){wkSel='';wkMarkSel();}});
window.addEventListener('resize',function(){if(view==='today')wkThumb();});
/* ===== Mocks (analytics) — nested shadow DOM ===== */
(function(){const R=S.getElementById('mkHost').attachShadow({mode:'open'});const I={plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="4"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',tag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V5a2 2 0 0 1 2-2h8l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="8" cy="8" r="1.3"/></svg>',link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',type:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V5h16v2M12 5v14M9 19h6"/></svg>',chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',l:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',r:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',phy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/></svg>',che:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6L5 19a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 19l-5-10V3"/><path d="M7.5 15h9"/></svg>',mat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 5H6l6 7-6 7h12"/></svg>',edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>',del:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',clip:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="12" height="17" rx="3"/><path d="M9 4h6v2H9zM9.5 13l2 2 3.5-4"/></svg>',gauge:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l4-6"/></svg>',trophy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M10 17h4"/></svg>',trend:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8M15 7h6v6"/></svg>',target:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>',clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4M8.5 7.5L12 4l3.5 3.5"/><path d="M7.5 10H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5"/></svg>'};
R.innerHTML=`<style>:host{display:block;--s1:#1c1c1e;--s2:#2c2c2e;--line:rgba(255,255,255,.08);--ink:#f5f5f7;--mut:#98989d;--dim:#636366;--macc:var(--acc,#ff9f0a);--macc2:var(--acc2,#ffc247);--mar:var(--ar,255,159,10);--r:28px;color:var(--ink);font:500 14px/1.4 -apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text",Inter,"Helvetica Neue",system-ui,sans-serif;letter-spacing:-.011em}*{box-sizing:border-box;margin:0}

button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;transition:transform .18s cubic-bezier(.3,1.5,.5,1),background .3s,color .25s,box-shadow .3s,border-color .3s,opacity .3s}button:active{transform:scale(.95)}
input,select{font:inherit;color:inherit}
.wrap{padding:4px 0 40px}
.top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:22px}
h1{font-size:clamp(28px,5vw,40px);font-weight:800;letter-spacing:-.035em}
.btn{padding:11px 20px;border-radius:999px;font-weight:700;background:linear-gradient(135deg,var(--macc2),var(--macc));color:#1a1000;box-shadow:0 10px 26px -10px rgba(var(--mar),.8)}.btn:hover{box-shadow:0 12px 34px -6px rgba(var(--mar),.9)}
.card{position:relative;border-radius:var(--r);background:rgba(28,28,30,.72);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border:1px solid var(--line);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 22px 50px -32px #000}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px}
.stat{padding:18px 20px;animation:rise .6s cubic-bezier(.2,.8,.2,1) both;transition:transform .25s,box-shadow .3s}.stat:hover{transform:translateY(-3px);box-shadow:0 0 0 1px rgba(var(--mar),.25),0 20px 40px -20px rgba(var(--mar),.35)}
.stat small{display:block;color:var(--mut);font-weight:700;font-size:12px;letter-spacing:.04em;text-transform:uppercase}.stat b{display:block;font-size:34px;font-weight:800;letter-spacing:-.03em;margin-top:4px}.stat i{font-style:normal;color:var(--dim);font-size:12px}
@keyframes rise{from{opacity:0;transform:translateY(14px);filter:blur(5px)}}@keyframes popin{from{opacity:0;transform:scale(.92) translateY(-6px)}}@keyframes draw{to{stroke-dashoffset:0}}@keyframes fade{from{opacity:0}}@keyframes dotin{from{transform:scale(0)}}
.chart{padding:24px;animation:rise .7s .15s cubic-bezier(.2,.8,.2,1) both}
.ch{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:14px}.ch h2{font-size:20px;font-weight:800;margin-right:auto;letter-spacing:-.02em}
.pill{display:inline-flex;align-items:center;gap:8px;padding:9px 15px;border-radius:999px;background:rgba(255,255,255,.04);border:1px solid var(--line);font-weight:600;font-size:13px;color:var(--mut)}.pill:hover{border-color:rgba(var(--mar),.4);color:var(--ink)}
.pill.on{color:#fff;border-color:transparent}.pill .dt{width:9px;height:9px;border-radius:50%;background:currentColor;box-shadow:0 0 10px currentColor}
.sw{width:30px;height:18px;border-radius:99px;background:var(--s2);position:relative;transition:.3s}.sw::after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:.3s cubic-bezier(.3,1.6,.5,1)}.on>.sw{background:var(--macc)}.on>.sw::after{transform:translateX(12px)}
.tgt input{width:62px;background:rgba(0,0,0,.4);border:0;border-radius:8px;padding:3px 8px;color:var(--macc);font-weight:800;outline:0}
#plot{position:relative;margin-top:6px}svg{display:block;width:100%;overflow:visible}
.ln{fill:none;stroke-width:2.6;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;animation:draw 1.3s cubic-bezier(.3,.7,.2,1) forwards}.ar{animation:fade 1.2s .5s both}
.dot{stroke-width:2;transform-box:fill-box;transform-origin:center;transition:transform .2s cubic-bezier(.3,1.6,.5,1);animation:dotin .5s 1s both}.dot.hot{transform:scale(1.55)}
.tip{position:absolute;pointer-events:none;min-width:170px;padding:12px 14px;border-radius:18px;background:rgba(20,20,22,.92);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid var(--line);box-shadow:0 20px 40px -10px #000;opacity:0;transform:scale(.95);transition:opacity .15s,transform .2s;z-index:5;font-size:13px}.tip.on{opacity:1;transform:none}
.tip h4{font-size:14px;font-weight:800;margin-bottom:6px}.tip div{display:flex;align-items:center;gap:8px;color:#d1d1d6;padding:2px 0}.tip em{width:10px;height:10px;border-radius:50%;border:2px solid;flex:none}.tip span{margin-left:auto;font-weight:700;color:var(--ink);padding-left:12px}
.empty{padding:60px 0;text-align:center;color:var(--dim)}
h3{font-size:22px;font-weight:800;letter-spacing:-.02em;margin:34px 4px 14px}
.tbl{padding:8px 10px;overflow-x:auto;animation:rise .7s .3s both}table{width:100%;border-collapse:collapse;min-width:720px}
th{text-align:left;font-size:11px;letter-spacing:.1em;color:var(--mut);padding:14px 12px;font-weight:700}td{padding:14px 12px;border-top:1px solid var(--line);vertical-align:middle}tr.row{transition:background .25s}tr.row:hover{background:rgba(255,255,255,.025)}
.dm{color:var(--dim);font-weight:700;letter-spacing:.06em;font-size:13px}.nm{font-weight:800;font-size:15px}.tag{margin-left:8px;font-size:10px;font-weight:800;padding:2px 7px;border-radius:7px;border:1px solid var(--line);color:var(--mut);vertical-align:middle}
.sc{color:var(--macc);font-weight:800;font-size:19px}.sc small{color:var(--mut);font-size:12px;font-weight:700}
.chip{display:inline-block;margin:2px 3px 2px 0;padding:3px 9px;border-radius:8px;font-size:11px;font-weight:800;border:1px solid}
.ic{width:34px;height:34px;border-radius:12px;display:inline-grid;place-items:center;color:var(--mut);background:rgba(255,255,255,.04);margin-left:6px}.ic:hover{color:var(--ink);background:rgba(255,255,255,.1)}.ic.del{color:#ff6482;background:rgba(255,100,130,.1)}.ic.del.arm{background:#ff375f;color:#fff;width:auto;padding:0 12px;font-size:12px;font-weight:800}
.ic svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.ov{position:fixed;inset:0;z-index:20;background:rgba(0,0,0,.6);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);display:none;place-items:center;padding:16px}.ov.on{display:grid;animation:fade .25s}
.pan{width:min(480px,100%);max-height:92vh;overflow:auto;padding:22px;border-radius:var(--r);background:rgba(28,28,30,.96);border:1px solid var(--line);animation:popin .32s cubic-bezier(.2,1.2,.4,1)}
.tabs{display:grid;grid-template-columns:1fr 1fr;padding:4px;border-radius:999px;background:#000;margin-bottom:18px}.tabs button{padding:10px;border-radius:999px;font-weight:700;color:var(--mut)}.tabs .on{background:var(--s2);color:var(--macc2)}
.lb{display:flex;justify-content:space-between;font-size:11px;font-weight:800;letter-spacing:.1em;color:var(--macc2);margin:14px 4px 7px;text-transform:uppercase}.lb a{color:var(--macc);cursor:pointer;letter-spacing:0;text-transform:none}
.in{width:100%;padding:13px 16px;border-radius:18px;background:#000;border:1px solid var(--line);outline:0;font-weight:700;color-scheme:dark}.in:focus{border-color:rgba(var(--mar),.6);box-shadow:0 0 0 4px rgba(var(--mar),.12)}
.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:10px}.g .in{text-align:center}
.save{width:100%;margin-top:20px;padding:15px;border-radius:999px;background:#fff;color:#000;font-weight:800;font-size:15px}
.opt{display:flex;justify-content:space-between;width:100%;padding:15px 16px;border-radius:16px;font-weight:700;text-align:left;margin-bottom:4px}.opt:hover{background:rgba(255,255,255,.05)}.opt.on{background:rgba(var(--mar),.1);color:var(--macc2)}
.toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,30px);opacity:0;padding:12px 20px;border-radius:999px;background:#ff375f;font-weight:700;z-index:30;transition:.35s cubic-bezier(.3,1.5,.5,1);pointer-events:none}.toast.on{opacity:1;transform:translate(-50%,0)}
@media(max-width:600px){.chart{padding:16px}}
.sub{color:var(--mut);font-size:13.5px;margin-top:4px}h1{font-family:var(--f-display,inherit)}h3{font-family:var(--f-display,inherit)}
.btn{display:inline-flex;align-items:center;gap:8px}.btn svg,.pill svg,.save svg{width:16px;height:16px;flex:none}.btn.sm{padding:9px 14px;font-size:12.5px}
.stat{position:relative;overflow:hidden}.stat .si{position:absolute;right:16px;top:16px;width:34px;height:34px;border-radius:12px;display:grid;place-items:center;background:rgba(var(--mar),.1);color:var(--macc2)}.stat .si svg{width:17px;height:17px}
.rel{position:relative;display:inline-block}.pill{font-family:var(--f-body,inherit)}
.ov{display:grid;opacity:0;visibility:hidden;transition:opacity .3s,visibility .3s}.ov.on{opacity:1;visibility:visible;animation:none}.ov.away{opacity:0;pointer-events:none}
.pan{animation:none;overflow:visible;max-height:none;width:min(500px,100%);transform:scale(.93) translateY(16px);transition:transform .5s cubic-bezier(.2,1.2,.4,1);background:rgba(28,28,30,.97);box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 40px 90px -20px #000}.ov.on .pan{transform:none}
.tabs{position:relative}.thumb{position:absolute;top:4px;bottom:4px;left:4px;width:calc(50% - 4px);border-radius:999px;background:var(--s2);transition:transform .45s cubic-bezier(.3,1.3,.5,1)}.tabs.l .thumb{transform:translateX(100%)}
.tabs button{position:relative;z-index:1;display:flex;gap:8px;align-items:center;justify-content:center}.tabs .on{background:none}.tabs svg{width:16px;height:16px}
.lb{font-family:var(--f-display,inherit)}
.cap{display:flex;align-items:center;gap:10px;height:46px;padding:0 16px;border-radius:999px;background:#000;border:1px solid var(--line);color:var(--mut);font-weight:700;font-size:13.5px;white-space:nowrap}
.cap svg{width:17px;height:17px;flex:none}.cap input{flex:1;min-width:0;width:100%;background:none;border:0;outline:0;color:var(--ink);font-weight:700;font-size:14px;color-scheme:dark}
button.cap:hover,.cap:focus-within{border-color:rgba(var(--mar),.55);color:var(--ink);box-shadow:0 0 0 4px rgba(var(--mar),.1)}button.cap[aria-expanded=true]{border-color:rgba(var(--mar),.6);color:var(--macc2)}
button.cap>svg:last-child:not(:first-child){width:14px;height:14px;opacity:.6;transition:transform .35s cubic-bezier(.3,1.4,.5,1)}button.cap[aria-expanded=true]>svg:last-child{transform:rotate(180deg)}
.caps{display:flex;flex-wrap:wrap;gap:10px}.cap.ic1{width:46px;padding:0;justify-content:center}.cap.ic1.has{width:auto;padding:0 8px 0 15px;color:var(--macc2);border-color:rgba(var(--mar),.4);background:rgba(var(--mar),.08);max-width:260px}.cap.ic1.has>span{overflow:hidden;text-overflow:ellipsis}
.cap .x{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.08)}.cap .x svg{width:12px;height:12px}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.sc3 i{font-style:normal;color:var(--c);display:grid}.sc3:focus-within{border-color:var(--c);box-shadow:0 0 0 4px color-mix(in srgb,var(--c) 18%,transparent)}.sc3 input{text-align:center;padding-right:4px}
.cap small{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--macc2);font-weight:800}
.save{display:flex;align-items:center;justify-content:center;gap:9px;font-family:var(--f-body,inherit);transition:transform .2s cubic-bezier(.3,1.5,.5,1),box-shadow .3s}.save:hover{box-shadow:0 14px 34px -10px rgba(var(--mar),.7)}
.rise{animation:rise .45s cubic-bezier(.2,.8,.2,1) both}
.dd{position:absolute;top:calc(100% + 10px);left:0;z-index:40;min-width:230px;padding:8px;border-radius:24px;background:rgba(36,36,40,.97);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);border:1px solid var(--line);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 30px 60px -10px #000;opacity:0;visibility:hidden;transform:scale(.88) translateY(-10px);filter:blur(6px);transform-origin:top left;transition:opacity .22s,transform .45s cubic-bezier(.2,1.25,.4,1),filter .3s,visibility .3s}.dd.on{opacity:1;visibility:visible;transform:none;filter:none}
.dd.r{left:auto;right:0;transform-origin:top right}.dd .opt{display:flex;align-items:center;gap:8px;margin:0 0 2px;padding:12px 14px;border-radius:16px}.dd .opt span{flex:1}.dd .opt em{width:16px;font-style:normal;display:grid}.dd .opt svg{width:15px;height:15px}.dd .opt .rm{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;color:#ff6482;opacity:0;transition:.2s}.dd .opt:hover .rm{opacity:1}.dd .opt .rm:hover{background:rgba(255,100,130,.15)}
.dd .addc{height:42px;margin-top:6px;background:rgba(255,255,255,.04)}
.cal{width:292px}.mch{display:flex;justify-content:space-between;align-items:center;padding:6px 4px 10px;font-weight:800;font-size:14px}.mch button{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.06)}.mch button:hover{background:rgba(255,255,255,.12)}.mch svg{width:15px;height:15px}
.mcg{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}.cgw{animation:sl .35s cubic-bezier(.2,.9,.3,1)}.cgw.r{--dx:18px}.cgw.l{--dx:-18px}@keyframes sl{from{opacity:0;transform:translateX(var(--dx,0))}}
.mcg em{font-style:normal;text-align:center;font-size:10px;color:var(--dim);font-weight:800;padding:4px 0}.mcg button{height:35px;border-radius:50%;font-size:13px;font-weight:700}.mcg button:hover{background:rgba(255,255,255,.09)}.mcg .t{box-shadow:inset 0 0 0 1px rgba(var(--mar),.6);color:var(--macc2)}.mcg .s{background:linear-gradient(135deg,var(--macc2),var(--macc));color:#1a1000;font-weight:800;box-shadow:0 6px 16px -4px rgba(var(--mar),.7)}
.calf{display:flex;justify-content:center;padding-top:8px}.calf button{padding:8px 18px;border-radius:999px;background:rgba(var(--mar),.12);color:var(--macc2);font-weight:800;font-size:12.5px}
.toast{background:rgba(36,36,40,.96);border:1px solid rgba(var(--mar),.4);color:var(--ink)}.toast.err{background:#ff375f;border-color:transparent}
.tip{min-width:250px;padding:14px;border-radius:22px;transition:opacity .18s,transform .25s,left .3s cubic-bezier(.2,1,.3,1),top .3s cubic-bezier(.2,1,.3,1)}.tip.on{transform:none}.tip .th{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:6px}.tip .th h4{margin:0;font-size:15px}.tip .th small{color:var(--mut);font-weight:600;font-size:12px}
.tip .ring{position:relative;width:44px;height:44px;flex:none}.ring svg{width:44px;height:44px;transform:rotate(-90deg)}.ring circle{fill:none;stroke-width:4.5}.ring .rb{stroke:rgba(255,255,255,.08)}.ring .rf{stroke:var(--macc);stroke-linecap:round;stroke-dasharray:calc(var(--p)*1.131) 113.1;animation:rg .8s cubic-bezier(.2,.8,.2,1)}@keyframes rg{from{stroke-dasharray:0 113.1}}.ring b{position:absolute;inset:0;display:grid;place-items:center;font-size:11px;font-weight:800;color:var(--ink)}
.tip .big{display:flex;align-items:baseline;gap:4px;padding:2px 0 10px;border-bottom:1px solid var(--line);margin-bottom:8px}.big b{font-size:30px;font-weight:800;letter-spacing:-.03em;color:var(--ink)}.big span{color:var(--mut);font-weight:700;font-size:13px}.big em{margin-left:auto;font-style:normal;font-weight:800;font-size:12px;padding:3px 9px;border-radius:99px}.big em.up{color:#30d158;background:rgba(48,209,88,.12)}.big em.dn{color:#ff6482;background:rgba(255,100,130,.12)}
.tip .sr{display:grid;grid-template-columns:22px 62px 1fr auto;align-items:center;gap:8px;padding:4px 0;animation:rise .4s var(--d) both}.sr i{font-style:normal;color:var(--c);display:grid}.sr svg{width:16px;height:16px}.sr span{margin:0;padding:0;color:#d1d1d6;font-weight:600}.sr b{color:var(--ink);font-weight:800;font-size:12.5px}.sr .bar{display:block;height:6px;border-radius:9px;background:rgba(255,255,255,.07);overflow:hidden;margin:0;padding:0}.bar>span{display:block;height:100%;width:var(--w);border-radius:9px;background:var(--c);margin:0;padding:0;transform-origin:left;animation:gr .7s var(--d) cubic-bezier(.2,.8,.2,1) both}@keyframes gr{from{transform:scaleX(0)}}
.tip .ft{display:flex;justify-content:space-between;color:var(--mut);font-size:12px;font-weight:700;padding-top:8px;margin-top:6px;border-top:1px solid var(--line)}.ft b{color:var(--macc2)}
.upg{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:12px}.up{display:flex;align-items:center;gap:16px;padding:16px 18px;animation:rise .55s var(--d) both;transition:transform .25s,box-shadow .3s}.up:hover{transform:translateY(-3px);box-shadow:0 0 0 1px rgba(var(--mar),.25),0 20px 40px -20px rgba(var(--mar),.35)}
.ud{width:56px;height:60px;border-radius:18px;flex:none;display:grid;place-content:center;text-align:center;background:linear-gradient(160deg,rgba(var(--mar),.2),rgba(var(--mar),.05));border:1px solid rgba(var(--mar),.3)}.ud b{font-size:22px;font-weight:800;line-height:1;color:var(--macc2)}.ud small{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--mut);font-weight:800;margin-top:3px}
.ui{flex:1;min-width:0}.um{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}.um span{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:99px;font-size:11.5px;font-weight:700;background:rgba(255,255,255,.05);border:1px solid var(--line);color:var(--mut)}.um svg{width:12px;height:12px}.um .hot{color:var(--macc2);border-color:rgba(var(--mar),.4);background:rgba(var(--mar),.1)}.um .ch{color:var(--macc2)}
.ua{display:flex;align-items:center;gap:2px;flex:none}
tr.row{animation:rise .5s var(--d) both}.chip{display:inline-flex;align-items:center;gap:5px}.chip svg{width:11px;height:11px}
.halo{transition:transform .32s cubic-bezier(.2,1,.3,1),opacity .2s}
.tip .th>div:first-child{display:block}.tip .big span,.tip .ft span{margin:0;padding:0}.big em{width:auto;height:auto;border:0;border-radius:99px;margin-left:auto}.tip .ft span{color:var(--mut)}.tip .ft{display:flex}
/* v2: compact, glass, no hover glow */
.card{--r:22px;background:var(--glass,rgba(14,15,18,.62));border:1px solid var(--glass-edge,rgba(255,255,255,.08));-webkit-backdrop-filter:blur(18px) saturate(1.4);backdrop-filter:blur(18px) saturate(1.4);box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}
.btn,.btn:hover,.save:hover,.stat:hover,.up:hover{box-shadow:none}.btn{padding:9px 16px;font-size:13px}.btn:hover,.stat:hover,.up:hover{transform:translateY(-2px)}
.top{margin-bottom:14px}h1{font-size:clamp(24px,3vw,30px)}.sub{font-size:12.5px;margin-top:2px}
.stats{grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:12px}.stat{padding:11px 14px}.stat small{font-size:10px}.stat b{font-size:23px;margin-top:2px}.stat i{font-size:11px}
.stat .si{width:auto;height:auto;background:none;right:12px;top:12px;color:var(--dim)}.stat .si svg{width:14px;height:14px}
.chart{padding:14px 18px}.ch{margin-bottom:8px}.ch h2{font-size:16px}.pill{padding:6px 12px;font-size:12px}h3{font-size:17px;margin:20px 4px 9px}
.tbl{padding:2px 8px}th{padding:9px 10px;font-size:10px}td{padding:9px 10px}.nm{font-size:14px}.sc{font-size:17px}.dm{font-size:12px}
.sb{display:inline-flex;gap:5px;margin-right:12px;font-weight:800;font-size:13px}.sb b{color:var(--c);font-size:10px;letter-spacing:.08em;align-self:center}
.ic{width:28px;height:28px;border-radius:10px}.ic svg{width:14px;height:14px}
.upg{grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:10px}.up{padding:9px 12px;gap:12px}.ud{width:40px;height:42px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid var(--line)}.ud b{font-size:16px;color:var(--ink)}.ud small{font-size:9px;margin-top:2px}
.um{margin-top:4px}.um span{padding:2px 9px;font-size:11px}.um .hot,.um .ch{color:var(--macc2);background:rgba(var(--mar),.08);border-color:rgba(var(--mar),.3)}.btn.sm{padding:6px 13px;font-size:12px}.btn.sm svg{width:13px;height:13px}
.ov{background:rgba(0,0,0,.38);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
.pan{width:min(420px,100%);padding:14px;border-radius:26px;background:rgba(30,30,34,.5);-webkit-backdrop-filter:blur(40px) saturate(1.7);backdrop-filter:blur(40px) saturate(1.7);border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 40px 90px -20px rgba(0,0,0,.7)}
.tabs{margin-bottom:6px;background:rgba(0,0,0,.28)}.tabs button{padding:8px;font-size:13px}.thumb{background:rgba(255,255,255,.1)}
.lb{margin:9px 4px 5px;font-size:10px}.cap{height:40px;padding:0 14px;font-size:13px;background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.08)}
button.cap:hover,.cap:focus-within,.sc3:focus-within{box-shadow:none}.cap.ic1{width:40px}.cap.ic1.has{padding:0 6px 0 14px}.cap .x{width:22px;height:22px}.mc2{font-style:normal;font-size:11px;font-weight:800;padding:2px 7px;border-radius:99px;background:rgba(var(--mar),.18)}
.save{margin-top:12px;padding:12px;font-size:14px}.g3,.g2,.caps{gap:8px}.mcg .s{box-shadow:none}.calf button{font-size:12px;padding:6px 16px}
.dd{background:rgba(34,34,38,.88);-webkit-backdrop-filter:blur(30px) saturate(1.6);backdrop-filter:blur(30px) saturate(1.6)}.dd .opt{padding:9px 12px;font-size:13px}.cal{width:262px}.mcg button{height:31px;font-size:12px}.dd .addc{height:38px}
.tip{min-width:170px;max-width:210px;padding:10px 12px;border-radius:16px;background:rgba(24,24,28,.36);-webkit-backdrop-filter:blur(16px) saturate(1.5);backdrop-filter:blur(16px) saturate(1.5);border:1px solid rgba(255,255,255,.14);box-shadow:0 14px 30px -14px rgba(0,0,0,.6)}
.tip .th{margin-bottom:4px;gap:10px}.tip .th h4{font-size:13px}.tip .th small{font-size:11px}.tip .ring,.ring svg{width:32px;height:32px}.ring circle{stroke-width:5}.ring b{font-size:9px}
.tip .big{padding:0 0 6px;margin-bottom:5px}.big b{font-size:20px}.big span{font-size:11px}.big em{font-size:10.5px;padding:2px 7px}
.tip .sr{grid-template-columns:15px 56px 1fr auto;gap:6px;padding:2px 0;font-size:12px}.sr svg{width:13px;height:13px}.sr .bar{height:4px}.sr b{font-size:11.5px}.tip .ft{font-size:11px;padding-top:5px;margin-top:4px}
/* v3 */
.mid{display:grid;grid-template-columns:minmax(0,1fr) 318px;gap:12px;align-items:stretch}.side{display:flex;flex-direction:column;gap:12px;min-width:0}.mid>.chart{display:flex;flex-direction:column}.mid>.chart #plot{flex:1}
@media(max-width:1100px){.mid{grid-template-columns:1fr}}
.tip{opacity:0;transform:scale(.9);transition:opacity .16s,transform .3s cubic-bezier(.2,1.25,.4,1);min-width:190px;max-width:230px}.tip.on{opacity:1;transform:none}.tip.glide{transition:opacity .16s,transform .3s,left .28s cubic-bezier(.2,1,.3,1),top .28s cubic-bezier(.2,1,.3,1)}
.tip .rw{display:flex;align-items:center;gap:8px;padding:3px 6px;margin:0 -6px;border-radius:9px;font-size:12px;color:#d1d1d6;animation:rise .35s var(--d) both;transition:background .2s,opacity .25s}
.tip .rw em{width:10px;height:10px;border-radius:50%;border:2px solid var(--c);background:transparent;flex:none}.tip .rw em.f{background:var(--c)}
.tip .rw span{margin:0;padding:0;flex:1;font-weight:600}.tip .rw b{margin-left:auto;font-weight:800;color:var(--ink);font-size:12px}
.tip.hasact .rw:not(.act){opacity:.5}.tip .rw.act{background:rgba(255,255,255,.1)}
.sp{padding:14px}.sh{display:flex;align-items:center;gap:8px;margin-bottom:8px}.sh h3{margin:0;font-size:15px;letter-spacing:-.01em}.cnt{min-width:20px;height:20px;padding:0 6px;border-radius:99px;display:grid;place-items:center;font-size:11px;font-weight:800;background:rgba(var(--mar),.16);color:var(--macc2)}
.mini{margin-left:auto;padding:4px 10px;border-radius:99px;font-size:11.5px;font-weight:800;color:var(--macc2);background:rgba(var(--mar),.1)}.mini:hover{background:rgba(var(--mar),.2)}
.ul{display:flex;flex-direction:column;gap:6px;max-height:300px;overflow:auto;scrollbar-width:none}.ul::-webkit-scrollbar{display:none}
.ur{position:relative;border-radius:16px;background:rgba(255,255,255,.035);border:1px solid var(--line);overflow:hidden;animation:rise .5s var(--d) both;transition:background .25s,border-color .25s}.ur:hover{background:rgba(255,255,255,.06)}
.ur.soon{border-color:rgba(var(--mar),.35)}.ur.soon::before{content:"";position:absolute;left:0;top:10px;bottom:10px;width:3px;border-radius:0 3px 3px 0;background:var(--macc)}
.uh{display:flex;align-items:center;gap:11px;width:100%;padding:9px 12px;text-align:left}
.dtl{width:36px;height:38px;border-radius:11px;flex:none;display:grid;place-content:center;text-align:center;background:rgba(255,255,255,.06)}.dtl b{font-size:15px;line-height:1;font-weight:800}.dtl small{font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--mut);font-weight:800;margin-top:2px}
.ur .ui{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.ur .nm{font-size:13.5px;display:flex;align-items:center;gap:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ur .nm .tag{margin:0}.ur .ui small{font-size:11.5px;color:var(--mut);font-weight:600}.ur .ui small em{font-style:normal;color:var(--macc2);font-weight:800}
.cv{width:16px;height:16px;color:var(--dim);transition:transform .35s cubic-bezier(.3,1.4,.5,1);flex:none}.cv svg{width:16px;height:16px}.ur.open .cv{transform:rotate(180deg)}
.ux{display:grid;grid-template-rows:0fr;transition:grid-template-rows .38s cubic-bezier(.2,.9,.3,1)}.ur.open .ux{grid-template-rows:1fr}.uxi{overflow:hidden;min-height:0;padding:0 12px}.ur.open .uxi{padding-bottom:10px}
.cl{display:flex;flex-wrap:wrap;gap:5px;max-height:84px;overflow:auto;scrollbar-width:none;margin-bottom:9px}.cl span{padding:3px 9px;border-radius:99px;font-size:11px;font-weight:700;color:var(--ink);background:rgba(255,255,255,.07);white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
.ua2{display:flex;align-items:center;gap:4px}
.ue{padding:18px 6px;text-align:center;color:var(--dim);font-size:12.5px;line-height:1.5}
.sg{display:grid;grid-template-columns:86px 1fr 34px 38px;align-items:center;gap:8px;padding:5px 0;font-size:12.5px;font-weight:700}.sg span{display:flex;align-items:center;gap:7px;color:#d1d1d6}.sg i{width:8px;height:8px;border-radius:50%;background:var(--c)}
.sg u{display:block;height:6px;border-radius:9px;background:rgba(255,255,255,.07);overflow:hidden}.sg s{display:block;height:100%;border-radius:9px;background:var(--c);transform-origin:left;animation:gr .8s var(--d) cubic-bezier(.2,.8,.2,1) both}.sg b{text-align:right;font-weight:800}.sg em{font-style:normal;font-size:10.5px;font-weight:800;text-align:right}.sg em.up{color:#30d158}.sg em.dn{color:#ff6482}
.sn{display:flex;justify-content:space-between;gap:8px;margin-top:8px;padding-top:9px;border-top:1px solid var(--line);font-size:11.5px;color:var(--mut);font-weight:600}.sn b{font-weight:800}
.mb{display:block;width:64px;height:3px;border-radius:9px;background:rgba(255,255,255,.08);margin-top:5px;overflow:hidden}.mb u{display:block;height:100%;background:var(--macc);border-radius:9px}
.dd{background:rgba(30,30,34,.985)}
/* v4: app fonts, compact table, coloured chips, scroll fix, icon-only pills */
:host{font-family:Poppins,var(--f-body,inherit),-apple-system,system-ui,sans-serif;letter-spacing:0}
button,input,.pill,.btn,.save,.cap,.opt,.lb,h1,h2,h3,.sub,td,th{font-family:Poppins,var(--f-body,inherit),system-ui,sans-serif}
h1{font-weight:800;letter-spacing:-.02em;line-height:1.15}.sub{font-weight:500;font-size:13px;margin-top:3px;color:var(--mut)}
h3,.ch h2,.sh h3{font-weight:700;letter-spacing:-.01em}.stat small{font-weight:600;letter-spacing:.06em}.stat b{font-weight:700;letter-spacing:-.02em}
.btn{font-weight:600}.pill{font-weight:600}.tag{font-weight:600}.nm{font-weight:700;letter-spacing:-.01em}
.tbl table{min-width:0;table-layout:auto}.tbl th,.tbl td{padding:11px 14px 11px 10px;white-space:nowrap}.tbl th{font-weight:600;letter-spacing:.08em}
.tbl th:nth-child(1){width:108px}.tbl th:nth-child(2){width:230px}.tbl th:nth-child(3){width:150px}.tbl th:nth-child(4){width:96px}.tbl th:last-child{width:56px}
.tbl .dm{font-weight:600;letter-spacing:.02em}.sc{font-weight:700}
tr.row,.ur{user-select:none;-webkit-user-select:none}
.sb{display:inline-flex;align-items:center;gap:0;margin:0 6px 0 0;padding:4px 10px;border-radius:9px;font-weight:700;font-size:12px;line-height:1.2;color:var(--c);background:color-mix(in srgb,var(--c) 14%,transparent);border:1px solid color-mix(in srgb,var(--c) 34%,transparent)}
.sb b{color:inherit;font-size:inherit;letter-spacing:.02em;margin-right:5px;align-self:auto}
.ul{max-height:min(380px,56vh);overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.18) transparent;padding-right:3px}
.ul::-webkit-scrollbar{display:block;width:5px}.ul::-webkit-scrollbar-thumb{background:rgba(255,255,255,.18);border-radius:9px}
.ur{flex:none}.cl{max-height:none;overflow:visible}.ur .nm{font-size:13.5px}.ur .ui small{font-weight:500}.cl span{font-weight:600}
.sp{padding:16px 18px}.sh{margin-bottom:10px}.sh h3{font-size:16px}
.sg{grid-template-columns:96px 1fr 40px 44px;gap:10px;padding:8px 0;font-size:13px;font-weight:600}.sg span{font-weight:600;color:#e5e5ea}.sg b{font-weight:700;font-variant-numeric:tabular-nums}.sg u{height:7px}.sg em{font-weight:700;font-size:11px}
.sn{margin-top:12px;padding-top:12px;font-size:12px;font-weight:500}.sn b{font-weight:700}
.dd .opt{gap:6px;padding:9px 10px 9px 14px;font-weight:600}.dd .opt span{flex:1;min-width:0}.dd .opt em{order:2;width:18px;flex:none;justify-content:center}.dd .opt .rm{order:3;width:22px;height:22px;flex:none;margin:0}.dd .opt .rm.ph{visibility:hidden}.dd .opt:hover .rm{opacity:1}
.pan{padding:12px 14px 14px}.lb{margin:8px 4px 4px;font-size:10px;font-weight:700}.caps{gap:8px}.cap{height:38px;font-weight:600}.cap.ic1{width:38px}.cap.ic1.has{gap:8px;padding:0 6px 0 13px}.cap.ic1 .x{margin:0}
.cap.ic1:not(.has) .x,.cap.ic1:not(.has)>span{display:none}.cap.ic1:not(.has)>svg{width:17px;height:17px}.cap.ic1.has>svg{width:15px;height:15px}
.save{margin-top:10px;padding:11px;font-weight:700}.tabs button{font-weight:600}
</style><div class="wrap">
<div class="top"><div><h1>Mocks</h1><p class="sub">Schedule tests, log results, watch your trajectory.</p></div><button class="btn" id="add">${I.plus}Add Mock</button></div>
<div class="stats" id="stats"></div>
<div class="mid"><div class="card chart"><div class="ch"><h2>Performance Trajectory</h2><div class="rel"><button class="pill" id="flt" data-dd="#fdd"></button><div class="dd r" id="fdd"></div></div><button class="pill" id="pct"><span class="sw"></span>%</button><label class="pill tgt">TARGET <input id="tg" type="number" min="0"></label></div><div class="ch" id="leg" style="margin-bottom:0"></div><div id="plot"></div></div>
<div class="side"><div class="card sp" id="upw"></div><div class="card sp" id="strw"></div></div></div>
<h3>Test History</h3><div class="card tbl"><table><thead><tr><th>DATE</th><th>TEST NAME</th><th>SCORE</th><th>ACCURACY</th><th>SUBJECT BREAKDOWN</th><th style="text-align:right">ACTIONS</th></tr></thead><tbody id="hist"></tbody></table></div></div>
<div class="ov" id="ov2"><div class="pan"><div class="tabs"><i class="thumb"></i><button id="tb0">Schedule Mock</button><button id="tb1">Log Results</button></div>
<div class="lb">Test name</div><label class="cap"><input id="fn" placeholder="e.g. QPT - 6" autocomplete="off"></label>
<div class="lb">Details</div><div class="caps"><div class="rel"><button class="cap ic1" id="dB" data-dd="#dP" aria-expanded="false" title="Date">${I.cal}<span id="dT"></span><b class="x" data-xd="1">${I.x}</b></button><div class="dd cal" id="dP"></div></div>
<div class="rel"><button class="cap ic1" id="cB" data-dd="#cP" aria-expanded="false" title="Category">${I.tag}<span id="cT"></span><b class="x" data-xc="1">${I.x}</b></button><div class="dd" id="cP"></div></div>
<div class="rel" id="lw"><button class="cap ic1" id="lB"></button></div></div>
<div id="logf"><div class="lb">Marks</div><div class="g3" id="fs"></div>
<div class="lb">Totals</div><div class="g2"><label class="cap"><small>Obtained</small><input id="fo" disabled placeholder="Auto"></label><label class="cap"><small>Out of</small><input id="fm" type="number" value="300"></label></div>
<div class="lb">Accuracy tracking</div><div class="g2"><label class="cap"><input id="fa" type="number" min="0" placeholder="Attempted"></label><label class="cap"><input id="fk" type="number" min="0" placeholder="Correct"></label></div></div>
<button class="save" id="sv"></button></div></div><div class="toast" id="toast"></div>
`;

const $=s=>R.querySelector(s),$$=s=>[...R.querySelectorAll(s)],esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),z=n=>(n<10?'0':'')+n;
const SID={phy:'phy',che:'chem',mat:'math'},sc2=(k,d)=>{try{const c=SC(SID[k]);return c||d}catch(e){return d}};
const SUB=[{k:'phy',n:'Physics',a:'PHY',get c(){return sc2('phy','#ff375f')}},{k:'che',n:'Chemistry',a:'CHE',get c(){return sc2('che','#ff9f0a')}},{k:'mat',n:'Maths',a:'MAT',get c(){return sc2('mat','#0a84ff')}}];
const KEY='pf-mocks';let D={tests:[
{id:1,name:'QPT - 1',date:'2026-08-18',cat:'QPT',s:{phy:7,che:0,mat:0},max:300,done:1},
{id:2,name:'QPT - 5',date:'2026-09-27',cat:'QPT',s:{phy:50,che:50,mat:50},max:300,done:1},
{id:3,name:'Practice Mock Test',date:'2026-10-05',cat:'Uncategorized',s:{phy:70,che:50,mat:20},max:300,done:1}],
cats:['QPT','Uncategorized'],target:300,pct:true,filter:'All',on:{phy:1,che:1,mat:1}};
try{const x=JSON.parse(localStorage.getItem(KEY));if(x&&Array.isArray(x.tests)){x.tests=x.tests.filter(t=>t&&typeof t==='object'&&t.s&&typeof t.s==='object'&&typeof t.name==='string'&&typeof t.date==='string');if(!Array.isArray(x.cats))x.cats=['QPT','Uncategorized'];if(!x.on||typeof x.on!=='object')x.on=null;D=x;if(!D.tgSet&&D.target===200)D.target=300;D.on=D.on||{};SUB.forEach(s=>{if(D.on[s.k]==null)D.on[s.k]=1});if(!D.cats.includes('Uncategorized'))D.cats.push('Uncategorized');D.tests.forEach(t=>{if(!t.chs)t.chs=t.ch?[t.ch]:[]})}}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){}};
const today=()=>{try{return L()}catch(e){const n=new Date();return n.getFullYear()+'-'+z(n.getMonth()+1)+'-'+z(n.getDate())}};
const tot=t=>Math.round(SUB.reduce((a,s)=>a+(+(t.s||{})[s.k]||0),0)*100)/100,fd=(d,l)=>{const o=new Date(d+'T00:00');return l?o.toLocaleDateString('en-GB',{day:'numeric',month:'short'}):o.toLocaleDateString('en-GB')};
const dLbl=d=>new Date(d+'T00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
const relD=d=>Math.round((new Date(d+'T00:00')-new Date(today()+'T00:00'))/864e5);
const relL=n=>n===0?'Today':n===1?'Tomorrow':n>1?'In '+n+' days':Math.abs(n)+(n===-1?' day':' days')+' overdue';
const toast=(m,err)=>{const t=$('#toast');t.textContent=m;t.classList.toggle('err',!!err);t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),2400)};
const done=()=>D.tests.filter(t=>t.done).sort((a,b)=>a.date.localeCompare(b.date));
const vw=()=>done().filter(t=>D.filter==='All'||t.cat===D.filter);
const count=(el,v,suf='',dp=0)=>{const t0=performance.now();(function f(n){const p=Math.min(1,(n-t0)/800),e=1-Math.pow(1-p,3);el.textContent=(dp?+(v*e).toFixed(dp):Math.round(v*e))+suf;if(p<1)requestAnimationFrame(f)})(t0)};
const chNames=ids=>ids.map(id=>{try{const l=SYAPI.chLabel({id,lk:'l'});return l?l.n:''}catch(e){return''}}).filter(Boolean);
/* ---- task sync: scheduled mocks live in Tasks (Upcoming) + Week ---- */
const outer=()=>{try{tRender()}catch(e){}try{if(view==='today')wkView()}catch(e){}};
function syncTask(m){try{let t=m.tid&&tasks.find(x=>x.id===m.tid);
if(m.done){if(t&&!t.done){t.done=true;t.doneAt=Date.now()}}
else{if(!t){t={sub:[],id:nid(),text:'',done:false,due:'',subj:'',at:Date.now(),doneAt:0,src:'',st:'',bd:false,ch:'',lk:'l',cn:0,mk:m.id};tasks.push(t);m.tid=t.id}
t.text=m.name.slice(0,200);t.due=m.date;if(t.done){t.done=false;t.doneAt=0}if(!t.cn){t.ch='';t.lk=''}const nm=chNames(m.chs||[]),ol=t.sub||[];t.sub=nm.map(n=>ol.find(x=>x.text===n)||{id:nid(),text:n.slice(0,120),done:false});try{wkFixTime(t)}catch(e){}}
tSave();outer()}catch(e){}}
function dropTask(m){try{const i=tasks.findIndex(x=>x.id===m.tid);if(i>-1){tasks[i].done=false;tSave();tasks.splice(i,1);tSave();outer()}}catch(e){}}
/* ---- stats / controls ---- */
function stats(){const d=vw(),n=d.length,sp=d.map(t=>tot(t)/(t.max||300)*100),r1=x=>Math.round(x*10)/10,avg=n?r1(sp.reduce((a,b)=>a+b,0)/n):0,best=n?r1(Math.max(...sp)):0;
const at=d.reduce((a,t)=>a+(+t.att||0),0),ck=d.reduce((a,t)=>a+(+t.att?Math.min(+t.cor||0,+t.att):0),0),acc=at?Math.min(100,Math.round(ck/at*100)):null;
const dl=n>1?r1(sp[n-1]-sp[n-2]):null;
const it=[['Tests Taken',n,'','#f5f5f7','completed','clip'],['Avg Score %',avg,'%','#f5f5f7','per test','gauge'],['Best Score %',best,'%','#30d158','personal best','trophy'],['Recent Trend',dl==null?'--':(dl>=0?'+':'')+dl+' %Pt.','',dl==null?'#98989d':dl>=0?'#30d158':'#ff6482','vs last test','trend'],['Accuracy',acc,'%','#ff9f0a','correct / attempted','target']];
$('#stats').innerHTML=it.map((x,i)=>`<div class="card stat" style="animation-delay:${i*70}ms"><span class="si">${I[x[5]]}</span><small>${x[0]}</small><b style="color:${x[3]}" data-v="${typeof x[1]==='number'?x[1]:''}" data-s="${x[2]}">${x[1]==null?'--':typeof x[1]==='number'?0+x[2]:x[1]}</b><i>${x[4]}</i></div>`).join('');
$$('.stat b[data-v]').forEach(b=>{if(b.dataset.v!=='')count(b,+b.dataset.v,b.dataset.s,/\./.test(b.dataset.v)?1:0)})}
function ctrl(){$('#flt').innerHTML=I.tag+esc(D.filter)+I.chev;$('#pct').classList.toggle('on',D.pct);$('#tg').value=D.target;
$('#leg').innerHTML=SUB.map(s=>`<button class="pill ${D.on[s.k]?'on':''}" data-k="${s.k}" style="${D.on[s.k]?`background:${s.c}`:''}"><span class="dt" style="${D.on[s.k]?'color:#fff':`color:${s.c}`}"></span>${s.n}</button>`).join('')}
/* ---- chart ---- */
function chart(){const box=$('#plot'),d=vw();if(!d.length){box.innerHTML='<div class="empty">No tests logged yet — add a mock to see your trajectory.</div>';return}
const W=box.clientWidth||700,H=W<520?250:320,ML=44,MR=26,MT=16,MB=34,iw=W-ML-MR,ih=H-MT-MB,P=D.pct,mx=Math.max(...d.map(t=>t.max||300));
const val=(t,k)=>{const m=t.max||300;return k==='t'?(P?tot(t)/m*100:tot(t)):(P?(+t.s[k]||0)/(m/3)*100:(+t.s[k]||0))};
const ser=[{k:'t',c:'#f5f5f7',n:'Obtained Score',w:1},...SUB.filter(s=>D.on[s.k]).map(s=>({k:s.k,c:s.c,n:s.n}))];
let top=P?100:Math.max(mx,D.target);top=Math.max(top,...d.flatMap(t=>ser.map(s=>val(t,s.k))));if(!P){const st=Math.pow(10,Math.floor(Math.log10(top)));top=Math.ceil(top/(st/2))*(st/2)}else top=Math.ceil(top/10)*10;
const X=i=>d.length<2?ML+iw/2:ML+i*iw/(d.length-1),Y=v=>MT+ih-Math.max(0,Math.min(v,top))/top*ih,steps=P?10:6;
let g='';for(let i=0;i<=steps;i++){const v=top/steps*i,y=Y(v);g+=`<line x1="${ML}" x2="${W-MR}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,${i?.06:.12})"/><text x="${ML-10}" y="${y+4}" text-anchor="end" fill="#98989d" font-size="11" font-weight="700">${Math.round(v)}</text>`}
const xl=d.map((t,i)=>`<text x="${X(i)}" y="${H-8}" text-anchor="${i==0&&d.length>1?'start':i==d.length-1&&d.length>1?'end':'middle'}" fill="#98989d" font-size="11" font-weight="700">${esc(t.name.length>16?t.name.slice(0,15)+'…':t.name)}</text>`).join('');
const sm=p=>{if(p.length<2)return'';let s=`M${p[0][0]},${p[0][1]}`;for(let i=0;i<p.length-1;i++){const a=p[i-1]||p[i],b=p[i],c=p[i+1],e=p[i+2]||c;s+=`C${b[0]+(c[0]-a[0])/6},${Math.min(MT+ih,Math.max(MT,b[1]+(c[1]-a[1])/6))} ${c[0]-(e[0]-b[0])/6},${Math.min(MT+ih,Math.max(MT,c[1]-(e[1]-b[1])/6))} ${c[0]},${c[1]}`}return s};
let out='<defs><linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9f0a" stop-opacity=".32"/><stop offset="1" stop-color="#ff9f0a" stop-opacity=".02"/></linearGradient><linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".0"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>'+g+xl;
if(D.target>0){const tp=P?d.map(t=>D.target/(t.max||300)*100):null,flat=!P||tp.every(v=>Math.abs(v-tp[0])<1e-9),tv=Y(P?tp[tp.length-1]:D.target);
if(flat)out+=`<line x1="${ML}" x2="${W-MR}" y1="${tv}" y2="${tv}" stroke="#ffc247" stroke-width="1.6" stroke-dasharray="6 6" opacity=".8"/>`;
else out+=`<polyline points="${d.map((t,i)=>X(i)+','+Y(tp[i])).join(' ')}" fill="none" stroke="#ffc247" stroke-width="1.6" stroke-dasharray="6 6" opacity=".8"/>`;
out+=`<text x="${W-MR}" y="${tv-6}" text-anchor="end" fill="#ffc247" font-size="11" font-weight="800">TARGET ${D.target}</text>`}
ser.forEach(s=>{const p=d.map((t,i)=>[X(i),Y(val(t,s.k))]);if(s.w&&p.length>1)out+=`<path class="ar" d="${sm(p)}L${p[p.length-1][0]},${MT+ih}L${p[0][0]},${MT+ih}Z" fill="url(#gA)"/>`;
if(p.length>1)out+=`<path class="ln" pathLength="1" d="${sm(p)}" stroke="${s.c}" style="${s.w?'stroke-width:3.2;filter:drop-shadow(0 0 8px rgba(255,159,10,.45))':''}"/>`;
p.forEach((q,i)=>out+=`<circle class="dot i${i}" data-k="${s.k}" cx="${q[0]}" cy="${q[1]}" r="${s.w?5.5:4.5}" fill="${s.w?s.c:'#000'}" stroke="${s.w?'#ff9f0a':s.c}" style="animation-delay:${1+i*.15}s"/>`)});
out+=`<rect id="hit" x="${ML-10}" y="${MT}" width="${iw+20}" height="${ih}" fill="transparent"/>`;
box.innerHTML=`<svg viewBox="0 0 ${W} ${H}" height="${H}">${out}</svg><div class="tip" id="tip"></div>`;
const tip=$('#tip'),hit=$('#hit');let cur='',cbi=-1,tmr=0;
const pts=[];ser.forEach(s=>d.forEach((t,i)=>pts.push({i,k:s.k,x:X(i),y:Y(val(t,s.k))})));
const off=()=>{cur='';cbi=-1;clearTimeout(tmr);tip.classList.remove('on','glide');$$('.dot').forEach(c=>c.classList.remove('hot'))};
const put=(px,py)=>{const tw=tip.offsetWidth,th=tip.offsetHeight,rt=px<W/2,l=Math.max(4,Math.min(W-tw-4,px+(rt?18:-tw-18))),tp=Math.max(0,Math.min(H-th,py-th/2));tip.style.left=l+'px';tip.style.top=tp+'px';tip.style.transformOrigin=(rt?0:tw)+'px '+(py-tp)+'px'};
const act=k=>$$('.tip .rw').forEach(r=>r.classList.toggle('act',r.dataset.k===k));
const build=bi=>{const t=d[bi],m=t.max||300,pv=bi>0?d[bi-1]:null,pm=pv?(pv.max||300):0,dl=pv?(pm===m?tot(t)-tot(pv):Math.round(tot(t)/m*100-tot(pv)/pm*100)):null,dU=pv&&pm!==m?' %Pt.':'',pc=Math.round(tot(t)/m*100),f=(v,r)=>P?Math.round(v/(r.f?m:m/3)*100)+'%':v;
const rows=[...SUB.map(s=>({k:s.k,n:s.n,c:s.c,v:+t.s[s.k]||0})),{k:'t',n:'Obtained Score',c:'#30d158',v:tot(t),f:1},{k:'x',n:'Max Marks Boundary',c:'#f5f5f7',v:m,f:1}];
let h=`<div class="th"><div><h4>${esc(t.name)}</h4><small>${fd(t.date,1)}${t.cat&&t.cat!=='Uncategorized'?' · '+esc(t.cat):''}</small></div><div class="ring"><svg viewBox="0 0 44 44"><circle class="rb" cx="22" cy="22" r="18"/><circle class="rf" cx="22" cy="22" r="18" style="--p:${Math.min(100,pc)}"/></svg><b>${pc}%</b></div></div>`
+`<div class="big"><b>${tot(t)}</b><span>/${m}</span>${dl!=null?`<em class="${dl>=0?'up':'dn'}">${dl>=0?'▲':'▼'} ${Math.abs(dl)}${dU}</em>`:''}</div>`
+rows.map((r,i)=>`<div class="rw" data-k="${r.k}" style="--c:${r.c};--d:${i*40}ms"><em class="${r.f?'f':''}"></em><span>${r.n}</span><b>${f(r.v,r)}</b></div>`).join('');
const ft=[];if(+t.att)ft.push(`<span>Accuracy</span><b>${Math.min(100,Math.round(t.cor/t.att*100))}%</b>`);if(D.target>0){const tc=Math.min(D.target,m);ft.push(`<span>Target ${tc}</span><b>${tot(t)>=tc?'Hit ✅':(tc-tot(t))+' to go'}</b>`)};
return h+ft.map(x=>`<div class="ft">${x}</div>`).join('')};
hit.onpointermove=e=>{const r=box.getBoundingClientRect(),qx=e.clientX-r.left,qy=e.clientY-r.top;let best=null,bd=1e9;pts.forEach(p=>{const dd=Math.hypot(p.x-qx,p.y-qy);if(dd<bd){bd=dd;best=p}});
if(!best||bd>20){if(cur)off();return}
const key=best.i+'|'+best.k;if(key===cur)return;const was=tip.classList.contains('on'),pb=cbi;cur=key;cbi=best.i;clearTimeout(tmr);
$$('.dot').forEach(c=>c.classList.remove('hot'));$$('.dot.i'+best.i).forEach(c=>{if(c.dataset.k===best.k)c.classList.add('hot')});
if(was&&pb===best.i){tip.classList.add('glide');act(best.k);put(best.x,best.y)}
else{const open=()=>{tip.innerHTML=build(best.i);tip.classList.add('hasact');act(best.k);put(best.x,best.y);tip.classList.add('on')};
if(was){tip.classList.remove('on','glide');tmr=setTimeout(open,150)}else{tip.classList.remove('glide');open()}}};
hit.onpointerleave=off}
/* ---- upcoming + history ---- */
let uinit=0;const uopen=new Set();
const uvis=()=>{return D.tests.filter(t=>!t.done).sort((a,b)=>a.date.localeCompare(b.date))};let ukey='';
function upc(){const u=uvis();ukey=u.map(t=>t.id).join(',');if(!uinit&&u.length){uopen.add(u[0].id);uinit=1}
$('#upw').innerHTML=`<div class="sh"><h3>Upcoming</h3>${u.length?`<span class="cnt">${u.length}</span>`:''}<button class="mini" data-new="1">+ Schedule</button></div>`+(u.length?`<div class="ul">`+u.map((t,i)=>{const r=relD(t.date),o=new Date(t.date+'T00:00'),cn=chNames(t.chs||[]);
return`<div class="ur ${uopen.has(t.id)?'open':''} ${r<=1?'soon':''}" data-id="${t.id}" title="Double-click to edit" style="--d:${i*60}ms"><button class="uh" data-t="${t.id}"><span class="dtl"><b>${o.getDate()}</b><small>${o.toLocaleString('en',{month:'short'})}</small></span><span class="ui"><b class="nm">${esc(t.name)}${t.cat!=='Uncategorized'?`<span class="tag">${esc(t.cat)}</span>`:''}</b><small><em>${relL(r)}</em>${cn.length?' · '+cn.length+(cn.length>1?' chapters':' chapter'):''}</small></span><i class="cv">${I.chev}</i></button><div class="ux"><div class="uxi">${cn.length?`<div class="cl">${cn.map(n=>`<span>${esc(n)}</span>`).join('')}</div>`:''}<div class="ua2"><span style="flex:1"></span><button class="ic del" data-d="${t.id}">${I.del}</button></div></div></div></div>`}).join('')+'</div>':'<div class="ue">Nothing scheduled yet.<br>Plan your next mock to see it here.</div>')}
function strn(){const d=vw(),el=$('#strw');el.innerHTML=`<div class="sh"><h3>Subject Strength</h3></div>`;if(!d.length){el.innerHTML+='<div class="ue">Log a result to see insights.</div>';return}
const pc=(t,k)=>(+t.s[k]||0)/((t.max||300)/3)*100,av=SUB.map(s=>{const a=d.reduce((x,t)=>x+pc(t,s.k),0)/d.length,l=d[d.length-1],p=d.length>1?d[d.length-2]:null;return{...s,a,dl:p?Math.round(pc(l,s.k)-pc(p,s.k)):null}}),sr=[...av].sort((x,y)=>y.a-x.a);
el.innerHTML+=av.map((s,i)=>`<div class="sg" style="--c:${s.c};--d:${i*80}ms"><span><i></i>${s.n}</span><u><s style="width:${Math.round(s.a)}%"></s></u><b>${Math.round(s.a)}%</b>${s.dl==null?'<em></em>':`<em class="${s.dl>=0?'up':'dn'}">${s.dl>=0?'▲':'▼'}${Math.abs(s.dl)}</em>`}</div>`).join('')+((d.length>1||sr[0].a>0)&&new Set(sr.map(x=>Math.round(x.a*100))).size>1?`<div class="sn"><span>Strongest <b style="color:${sr[0].c}">${sr[0].n}</b></span><span>Focus on <b style="color:${sr[2].c}">${sr[2].n}</b></span></div>`:'')}
function hist(){const a=done().reverse();$('#hist').innerHTML=a.length?a.map((t,i)=>{const m=t.max||300,ac=+t.att?Math.min(100,Math.round(t.cor/t.att*100))+'%':'--';
return`<tr class="row" data-id="${t.id}" title="Double-click to edit" style="--d:${i*50}ms"><td class="dm">${fd(t.date)}</td><td><span class="nm">${esc(t.name)}</span>${t.cat!=='Uncategorized'?`<span class="tag">${esc(t.cat)}</span>`:''}</td><td><span class="sc">${tot(t)}<small>/${m}</small></span><span class="mb"><u style="width:${Math.min(100,tot(t)/m*100)}%"></u></span></td><td style="font-weight:800">${ac}</td><td>${SUB.map(s=>`<span class="sb" style="--c:${s.c}"><b>${s.a}:</b>${+t.s[s.k]||0}</span>`).join('')}</td><td style="text-align:right;white-space:nowrap"><button class="ic" data-sh="${t.id}" title="Share card" aria-label="Share test card">${I.share}</button><button class="ic del" data-d="${t.id}">${I.del}</button></td></tr>`}).join(''):'<tr><td colspan="6" class="empty">No results logged yet</td></tr>'}
function all(){stats();ctrl();chart();upc();strn();hist()}
/* ---- dropdowns (iOS-style spring drop) ---- */
let st={date:'',cat:'Uncategorized',chs:[]},mode=0,eid=null,cy=0,cm=0;
const closeDD=()=>{$$('.dd.on').forEach(x=>x.classList.remove('on'));$$('[aria-expanded=true]').forEach(b=>b.setAttribute('aria-expanded','false'))};
const calH=dir=>{const f=(new Date(cy,cm,1).getDay()+6)%7,n=new Date(cy,cm+1,0).getDate(),td=today();
let h=`<div class="mch"><button data-pn="-1">${I.l}</button><b>${new Date(cy,cm,1).toLocaleString('en',{month:'long',year:'numeric'})}</b><button data-pn="1">${I.r}</button></div><div class="cgw ${dir||''}"><div class="mcg">`+'MTWTFSS'.split('').map(x=>`<em>${x}</em>`).join('');
for(let i=0;i<f;i++)h+='<i></i>';for(let i=1;i<=n;i++){const k=cy+'-'+z(cm+1)+'-'+z(i);h+=`<button data-pd="${k}" class="${k===td?'t ':''}${k===st.date?'s':''}">${i}</button>`}
return h+'</div></div><div class="calf"><button data-td="1">Today</button></div>'};
const catH=()=>D.cats.map(c=>`<button class="opt ${c===st.cat?'on':''}" data-c="${esc(c)}"><span>${esc(c)}</span>${c!=='Uncategorized'?`<b class="rm" data-rc="${esc(c)}" title="Delete category">${I.x}</b>`:'<b class="rm ph"></b>'}<em>${c===st.cat?I.check:''}</em></button>`).join('')+`<label class="cap addc">${I.plus}<input id="nc" placeholder="New category" maxlength="20" autocomplete="off"></label>`;
const fltH=()=>['All',...D.cats.filter(c=>D.tests.some(t=>t.cat===c&&t.done))].map(c=>`<button class="opt ${c===D.filter?'on':''}" data-f="${esc(c)}"><span>${c==='All'?'All Tests':esc(c)}</span><em>${c===D.filter?I.check:''}</em></button>`).join('');
const paintD=()=>{$('#dB').classList.toggle('has',!!st.date);$('#dT').textContent=st.date?dLbl(st.date):''},paintCat=()=>{const h=!!st.cat&&st.cat!=='Uncategorized';$('#cB').classList.toggle('has',h);$('#cT').textContent=h?st.cat:''};
function paintCh(){const nm=chNames(st.chs),b=$('#lB');b.classList.toggle('has',!!nm.length);b.innerHTML=I.link+(nm.length?`<span>${esc(nm[0])}</span>${nm.length>1?`<em class="mc2">+${nm.length-1}</em>`:''}<b class="x" data-x="1">${I.x}</b>`:'');b.title=nm.length?nm.join(', '):'Link chapters'}
R.addEventListener('click',e=>{const xx=e.target.closest&&e.target.closest('[data-xd],[data-xc]');if(xx){e.stopPropagation();if(xx.hasAttribute('data-xd'))st.date='';else st.cat='Uncategorized';paintD();paintCat();closeDD();return}const P=e.composedPath(),b=e.target.closest&&e.target.closest('[data-dd]');
if(b){const p=$(b.dataset.dd),was=p.classList.contains('on');closeDD();if(!was){if(p.id==='dP'){const q=new Date((st.date||today())+'T00:00');cy=q.getFullYear();cm=q.getMonth();p.innerHTML=calH()}else if(p.id==='cP')p.innerHTML=catH();else p.innerHTML=fltH();p.classList.add('on');b.setAttribute('aria-expanded','true')}return}
if(!P.some(n=>n.classList&&n.classList.contains('dd')))closeDD()});
$('#dP').onclick=e=>{const b=e.target.closest('button');if(!b)return;const q=b.dataset;
if('pn' in q){cm+=+q.pn;if(cm>11){cm=0;cy++}if(cm<0){cm=11;cy--}$('#dP').innerHTML=calH(+q.pn>0?'r':'l');return}
if('pd' in q)st.date=q.pd;else if('td' in q)st.date=today();else return;paintD();closeDD()};
$('#cP').onclick=e=>{const rc=e.target.closest('[data-rc]');if(rc){const c=rc.dataset.rc;D.cats=D.cats.filter(x=>x!==c);D.tests.forEach(t=>{if(t.cat===c)t.cat='Uncategorized'});if(D.filter===c)D.filter='All';if(st.cat===c){st.cat='Uncategorized';paintCat()}save();$('#cP').innerHTML=catH();all();return}
const b=e.target.closest('[data-c]');if(b){st.cat=b.dataset.c;paintCat();closeDD()}};
$('#cP').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='nc'){const n=e.target.value.trim();if(!n)return;if(!D.cats.includes(n))D.cats.push(n);st.cat=n;save();paintCat();closeDD()}});
$('#fdd').onclick=e=>{const b=e.target.closest('[data-f]');if(b){D.filter=b.dataset.f;save();closeDD();all()}};
/* ---- modal ---- */
function tab(m){mode=m;$('.tabs').classList.toggle('l',!!m);$('#tb0').classList.toggle('on',!m);$('#tb1').classList.toggle('on',!!m);$('#logf').style.display=m?'':'none';$('#lw').style.display=m?'none':'';$('#sv').textContent=m?'Save Results':'Schedule Mock';const l=$('#logf');l.classList.remove('rise');void l.offsetWidth;if(m)l.classList.add('rise')}
const sum=()=>{$('#fo').value=SUB.reduce((a,s)=>a+(+($('#s_'+s.k)||{}).value||0),0)};
function openM(t,m){eid=t?t.id:null;st={date:t?t.date:'',cat:t?t.cat:'Uncategorized',chs:t&&t.chs?[...t.chs]:[]};
$('#fs').innerHTML=SUB.map(s=>`<label class="cap sc3" style="--c:${s.c}"><i>${I[s.k]}</i><input class="sin" id="s_${s.k}" type="number" min="0" placeholder="${s.a}" value="${t&&t.s&&t.s[s.k]?t.s[s.k]:''}"></label>`).join('');
$('#fn').value=t?t.name:'';$('#fm').value=t?t.max:300;$('#fa').value=t&&t.att||'';$('#fk').value=t&&t.cor||'';
tab(m!=null?m:(t&&t.done?1:0));{const lk=!!(t&&t.done),b0=$('#tb0');b0.style.opacity=lk?'.4':'';b0.style.cursor=lk?'not-allowed':'';b0.title=lk?'Already logged — can’t switch back to Schedule':''}paintD();paintCat();paintCh();sum();closeDD();$('#ov2').classList.add('on');setTimeout(()=>$('#fn').focus({preventScroll:true}),260)}
const closeM=()=>{closeDD();$('#ov2').classList.remove('on')};
$('#fs').oninput=sum;$('#add').onclick=()=>openM();$('#tb0').onclick=()=>{const o=eid!=null&&D.tests.find(x=>x.id===eid);if(o&&o.done)return toast('Logged results can’t be turned back into a schedule',1);tab(0)};$('#tb1').onclick=()=>tab(1);
$('#fn').onkeydown=e=>{if(e.key==='Enter')$('#sv').click()};
R.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#ov2').classList.contains('on')){e.stopPropagation();e.preventDefault();$$('.dd.on').length?closeDD():closeM()}});
let pick=null;const cpm=S.getElementById('cpm'),cpL=S.getElementById('cpL'),dn=document.createElement('button');dn.className='cpgo';dn.hidden=true;dn.type='button';cpm.querySelector('.cpbox').appendChild(dn);
const mark=()=>{if(!pick)return;cpL.querySelectorAll('button[data-c]').forEach(b=>{const on=pick.has(b.dataset.c);b.style.background=on?'rgba(var(--ar),.16)':'';b.style.color=on?'var(--acc2)':''})},upd=()=>{dn.textContent=pick&&pick.size?'Done · '+pick.size+' linked':'Done'};
cpL.addEventListener('click',e=>{if(!pick)return;const b=e.target.closest('button[data-c]');if(!b)return;e.stopImmediatePropagation();const id=b.dataset.c;pick.has(id)?pick.delete(id):pick.add(id);mark();upd()},true);
new MutationObserver(mark).observe(cpL,{childList:true});dn.onclick=()=>cpm.classList.remove('on');
$('#lB').onclick=e=>{if(e.target.closest('[data-x]')){st.chs=[];paintCh();return}
try{pick=new Set(st.chs);SYAPI.cpOpen();$('#ov2').classList.add('away');dn.hidden=false;S.getElementById('cpT').textContent='Link chapters';mark();upd();
const o=new MutationObserver(()=>{if(!cpm.classList.contains('on')){o.disconnect();st.chs=[...pick];pick=null;dn.hidden=true;$('#ov2').classList.remove('away');paintCh()}});o.observe(cpm,{attributes:true,attributeFilter:['class']})}catch(err){pick=null;$('#ov2').classList.remove('away');toast('Chapter picker unavailable',1)}};
$('#sv').onclick=()=>{const name=$('#fn').value.trim(),date=st.date||today();if(!name)return toast('Add a test name',1);if(!date)return toast('Pick a date',1);
const rn=v=>{v=String(v==null?'':v).trim();return v===''?0:Number(v)},mr=$('#fm').value.trim(),max=mr===''?300:Number(mr),att=rn($('#fa').value),cor=rn($('#fk').value),s={};
const prev=eid!=null&&D.tests.find(x=>x.id===eid);if(!mode&&prev&&prev.done)return toast('Logged results can’t be turned back into a schedule',1);
if(!isFinite(max)||max<=0||max>10000)return toast('Max marks must be between 1 and 10000',1);
if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||isNaN(new Date(date+'T00:00')))return toast('Pick a valid date',1);
SUB.forEach(x=>s[x.k]=rn(($('#s_'+x.k)||{}).value));
if(mode){if(![att,cor].every(v=>isFinite(v)&&v>=0))return toast('Attempted and correct can’t be negative',1);if(!SUB.every(x=>isFinite(s[x.k])))return toast('Enter valid marks',1);
const lim=max/3,bad=SUB.find(x=>s[x.k]>lim+1e-9);if(bad)return toast(bad.n+' can’t exceed '+(Math.round(lim*100)/100)+' (max ÷ 3)',1)}
if(mode&&(att>10000||cor>10000))return toast('Attempted/correct is too large',1);
if(mode&&cor>att)return toast('Correct can’t exceed attempted',1);if(mode&&SUB.reduce((a,x)=>a+s[x.k],0)>max)return toast('Total exceeds max marks',1);
const old=D.tests.find(x=>x.id===eid),t={id:eid||Date.now(),name,date,cat:st.cat,s:mode?s:{phy:0,che:0,mat:0},max,att:mode?att:0,cor:mode?cor:0,done:mode?1:0,chs:[...st.chs],tid:old&&old.tid||''};
const i=D.tests.findIndex(x=>x.id===eid);i>-1?D.tests[i]=t:D.tests.push(t);syncTask(t);if(D.filter!=='All'&&!D.tests.some(x=>x.cat===D.filter&&x.done))D.filter='All';save();closeM();all();toast(mode?'Results saved':'Mock scheduled · added to Tasks & Week')};
/* ---- misc handlers ---- */
$('#ov2').addEventListener('mousedown',e=>{if(e.target.id==='ov2')closeM()});
$('#pct').onclick=()=>{D.pct=!D.pct;save();ctrl();chart()};$('#tg').oninput=e=>{D.target=Math.max(0,Math.min(10000,+e.target.value||0));D.tgSet=1;save();chart()};
$('#leg').onclick=e=>{const b=e.target.closest('[data-k]');if(b){D.on[b.dataset.k]=D.on[b.dataset.k]?0:1;save();ctrl();chart()}};
R.addEventListener('click',e=>{const tg=e.target.closest('[data-t]');if(tg){const r=tg.closest('.ur'),id=+tg.dataset.t||tg.dataset.t;if(r.classList.toggle('open')){$$('.ur.open').forEach(o=>{if(o!==r)o.classList.remove('open')});uopen.clear();uopen.add(id)}else uopen.delete(id);return}if(e.target.closest('[data-new]')){openM();return}const ed=e.target.closest('[data-e]'),lg=e.target.closest('[data-l]'),de=e.target.closest('[data-d]');
if(ed)openM(D.tests.find(t=>t.id==ed.dataset.e));if(lg)openM(D.tests.find(t=>t.id==lg.dataset.l),1);
if(de){if(de.classList.contains('arm')){const t=D.tests.find(x=>x.id==de.dataset.d);if(t&&t.tid)dropTask(t);D.tests=D.tests.filter(x=>x.id!=de.dataset.d);if(D.filter!=='All'&&!D.tests.some(x=>x.cat===D.filter&&x.done))D.filter='All';save();all()}else{de.classList.add('arm');de.textContent='Sure?';setTimeout(()=>{if(de.isConnected){de.classList.remove('arm');de.innerHTML=I.del}},2500)}}});
R.addEventListener('dblclick',e=>{if(e.target.closest('.ic,.mini,input,.ov'))return;const r=e.target.closest('.ur,tr.row');if(!r)return;const t=D.tests.find(x=>String(x.id)===r.dataset.id);if(t){try{getSelection().removeAllRanges()}catch(_){}openM(t)}});
setInterval(()=>{const k=uvis().map(t=>t.id).join(',');if(k!==ukey&&view==='mocks')upc()},30000);
R.addEventListener('click',e=>{const b=e.target.closest('[data-sh]');if(b&&window.mkShOpen)window.mkShOpen(b.dataset.sh)});
let sig=SUB.map(s=>s.c).join();setInterval(()=>{const n=SUB.map(s=>s.c).join();if(n!==sig){sig=n;if(typeof view!=='undefined'&&view==='mocks')all()}},1200);
let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(chart,150)});if(window.ResizeObserver){let lw=0;new ResizeObserver(()=>{const w=$('#plot').clientWidth;if(w&&w!==lw){lw=w;chart()}}).observe($('#plot'))}
all();window.MKAPI={paint:all,of:t=>D.tests.find(m=>m.tid&&m.tid===t.id)||null,card:id=>{const t=D.tests.find(x=>String(x.id)===String(id));if(!t||!t.done)return null;const d=done(),i=d.findIndex(x=>x.id===t.id),pv=i>0?d[i-1]:null,m=t.max||300,ct=D.target>0?Math.min(D.target,m):0,tt=tot(t),pc=Math.max(0,Math.min(100,Math.round(tt/m*100))),pm=pv?(pv.max||300):0,dl=pv?(pm===m?tt-tot(pv):Math.round(tt/m*100-tot(pv)/pm*100)):null,dU=pv&&pm!==m?' %Pt.':'',cat=t.cat&&t.cat!=='Uncategorized'?t.cat:'';
const sm=m/3,pcs=SUB.map(s=>(+t.s[s.k]||0)/sm),mxp=Math.max(...pcs),star=mxp>0&&new Set(pcs).size>1,pcr=Math.max(0,Math.min(100,tt/m*100)),gr=pcr>=90?'Outstanding':pcr>=75?'Excellent':pcr>=60?'Good going':pcr>=40?'Building up':'Keep pushing';
const att=+t.att||0,cor=Math.min(+t.cor||0,att),acc=att?Math.min(100,Math.round(cor/att*100)):null,accr=att?Math.min(100,cor/att*100):null,
pr=x=>tot(x)/(x.max||300),me=pr(t),oth=d.filter(x=>x.id!==t.id).map(pr),mxo=oth.length?Math.max(...oth):null,
bst=mxo!=null&&me>mxo+1e-9,tie=mxo!=null&&me>0&&Math.abs(me-mxo)<=1e-9,fx=bst||(ct>0&&tt>=ct),
rk=1+oth.filter(v=>v>me+1e-9).length,top=d.reduce((a,x)=>pr(x)>pr(a)?x:a,d[0]),avg=Math.round(d.reduce((a,x)=>a+pr(x),0)/d.length*1000)/10,
tg=ct>0?Math.max(0,Math.min(100,Math.round(tt/ct*100))):0,
dTx=dl==null?'':dl===0?'<em>= Same as last</em>':`<em class="${dl>0?'mku':'mkd'}"><svg class="tri" viewBox="0 0 10 10" aria-hidden="true"><path d="${dl>0?'M5 1.5L9.2 8.5H.8z':'M.8 1.5H9.2L5 8.5z'}"/></svg>${Math.abs(dl)}${dU} vs last</em>`,
pills=[dTx,bst?`<em class="bs">${I.trophy}Personal best</em>`:tie?`<em class="bs">${I.trophy}Ties your best</em>`:'',acc!=null?`<em class="ac">${I.target}${acc}% acc</em>`:''].join('');
const nm=esc(t.name),hs=t.name.length>16?20:t.name.length>10?25:30,ds=String(tt).length,fs=ds>3?92:120,
ST=(()=>{const n=14,ro=46,ri=39;let q='';for(let k=0;k<n*2;k++){const r=k%2?ri:ro,an=Math.PI*k/n;q+=(k?'L':'M')+(50+r*Math.sin(an)).toFixed(1)+','+(50-r*Math.cos(an)).toFixed(1)}return q+'Z'})(),
tape=Array(6).fill(`<span>✦ Mock report</span><span>✦ ${nm}</span><span>✦ ${fd(t.date,1)}</span>`).join('');
const cols=SUB.map((s,j)=>{const v=+t.s[s.k]||0,p=Math.max(0,Math.min(100,Math.round(v/sm*100)));return`<div class="mkt" style="--c:${s.c};--p:${p}%;--d:${380+j*110}ms">${star&&pcs[j]===mxp?'<em class="mkst" role="img" aria-label="Strongest subject">★</em>':''}<div class="mkcol"><s></s></div><div class="mkv">${v}<small>/${Math.round(sm)}</small></div><div class="mkn">${esc(s.n)}</div></div>`}).join('');
const bi=pcs.indexOf(mxp),wi=pcs.indexOf(Math.min(...pcs)),dist=new Set(pcs).size>1,
ins=`<div class="mkin">${dist?`<div><span>Strongest</span><b><i style="background:${SUB[bi].c}"></i>${esc(SUB[bi].n)}</b></div><div><span>Focus on</span><b><i style="background:${SUB[wi].c}"></i>${esc(SUB[wi].n)}</b></div>`:`<div><span>Rank</span><b>${d.length>1?'#'+rk+' of '+d.length:'First test'}</b></div><div><span>Average</span><b>${avg}%</b></div>`}</div>`;
return{date:new Date(t.date+'T00:00'),cat,fx,back:`<div class="mkb"><div class="mkbt"><h4>${nm}</h4><span>Accuracy report</span></div><div class="mkdial"><svg viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="mkg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c6ff3d"/><stop offset="1" stop-color="#ffd37a"/></linearGradient></defs><circle class="tr" cx="60" cy="60" r="52"/>${acc?`<circle class="fl" cx="60" cy="60" r="52" stroke-dasharray="${(acc*3.267).toFixed(1)} 326.7"/>`:''}</svg><b>${acc!=null?acc+'<small>%</small>':'–'}</b></div><div class="mkcap">${acc==null?'Add attempted &amp; correct to unlock accuracy':accr>=90?'Laser sharp':accr>=75?'Sharp aim':accr>=60?'Steady aim':'Aim before you fire'}</div><div class="mkq3"><div><b>${att||'–'}</b><small>Attempted</small></div><div><b>${att?cor:'–'}</b><small>Correct</small></div><div><b>${att?att-cor:'–'}</b><small>Wrong</small></div></div><div class="mkrk"><div><span>Global Rank</span><b>${d.length>1?'#'+rk+' of '+d.length:'First test'}</b></div><div><span>All-time Best</span><b>${Math.round(pr(top)*1000)/10}%</b></div><div><span>Overall Average</span><b>${avg}%</b></div></div></div>`,html:`<div class="mkc"><div class="mkhd"><h4 style="--hs:${hs}px">${nm}</h4><span class="mkgr">${gr}</span></div><div class="mksc"><div class="mkbig" style="--fs:${fs}px"><b>${tt}</b><span>/${m}</span></div><div class="mkpr" role="img" aria-label="${pc} percent"><svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="mkpg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1d6"/><stop offset="1" stop-color="#ff8fd0"/></linearGradient></defs><circle class="tr" cx="50" cy="50" r="42"/>${pc?`<circle class="fl" cx="50" cy="50" r="42" stroke-dasharray="${(pc*2.639).toFixed(1)} 264"/>`:''}</svg><b>${pc}<small>%</small></b></div></div><div class="mkpl">${pills}</div><div class="mkcols" style="--n:${SUB.length}">${cols}</div>${ct>0?`<div class="mkft${tt>=ct?' hit':''}"><div class="mkfh"><span>Target ${ct}</span><b>${tt>=ct?'Hit ✅':(ct-tt)+' to go'}</b></div><u><s style="width:${tg}%"></s></u></div>`:'<div style="flex:1"></div>'}</div>`}}};
})();

/* ===== views + open/close ===== */
function setView(v){
 view=v;var tm=v==='timer',mk=v==='mocks';$('v-tasks').classList.toggle('tg',v==='targets');$('tgBar').hidden=v!=='targets';if(v!=='targets')$('v-tasks').classList.remove('addopen');$('pop').classList.remove('on');closeDD();
 [].forEach.call(S.querySelectorAll('.nav'),function(b){var on=b.dataset.v===v;b.classList.toggle('on',on);b.setAttribute('aria-selected',String(on));});
 var sy=v==='syl';$('main').classList.toggle('wide',sy);$('main').classList.remove('wkw');$('v-tasks').hidden=tm||sy||mk;$('v-mocks').hidden=!mk;$('v-timer').hidden=!tm;$('v-syl').hidden=!sy;
 if(mk){window.MKAPI&&MKAPI.paint();}else if(sy){SYAPI.paint();}else if(!tm){$('ttl').textContent=v==='today'?'Today':v==='targets'?'Targets':'Inbox';addDue=v==='today'?(vDay||'today'):'none';animAll=true;wkView();tRender();}
 else{fillLink();fillChips();fPaint();dnKey='';barKey='';anR();}
 $('main').scrollTop=0;
}
/* scroll perf: pause infinite animations while scrolling */
var tsIdle=0;$('main').addEventListener('scroll',function(){if(!RT.classList.contains('scrolling'))RT.classList.add('scrolling');clearTimeout(tsIdle);tsIdle=setTimeout(function(){RT.classList.remove('scrolling');},140);},{passive:true});
(function(){var bar=$('tgBar'),v=$('v-tasks');
 bar.addEventListener('click',function(e){var t=e.target.closest('.tgtab');
  if(t){tgTab=t.dataset.tt;[].forEach.call(bar.querySelectorAll('.tgtab'),function(b){var on=b===t;b.classList.toggle('on',on);b.setAttribute('aria-selected',String(on));});tRender();return;}
  if(e.target.closest('#tgAdd')){var o=v.classList.toggle('addopen');$('tgAdd').setAttribute('aria-expanded',String(o));if(o)setTimeout(function(){$('in').focus();},30);}});
})();
S.querySelector('.side').addEventListener('click',function(e){var b=e.target.closest('.nav');if(b)setView(b.dataset.v);});
/* sidebar collapse (desktop): icons only + profile pfp */
(function(){var app=S.querySelector('.app'),bt=$('sbt'),SK='pf-sbc';
 function ap(c){app.classList.toggle('sbc',c);bt.setAttribute('aria-expanded',String(!c));var l=c?'Expand sidebar':'Collapse sidebar';bt.setAttribute('aria-label',l);bt.title=l;}
 ap(!!lsGet(SK,0));
 bt.addEventListener('click',function(){var c=!app.classList.contains('sbc');ap(c);lsSet(SK,c?1:0);});
})();
function hubKey(e){if(e.key!=='Escape')return;e.preventDefault();if(SYAPI.esc&&SYAPI.esc())return;if(wkEsc())return;if($('rcm').classList.contains('on')){rcClose();return;}if($('sdm').classList.contains('on')){sdClose();return;}if($('etm').classList.contains('on')){if($('etDP').classList.contains('on')){etDClose();return;}if(S.querySelector('.dpop.on')){closeDD();return;}etClose();return;}if($('stm').classList.contains('on')){if($('cdDP').classList.contains('on')){cdDClose();return;}stClose();return;}if($('pfm').classList.contains('on')){if(rpOn){rpStop();return;}pfClose();return;}if($('lvl').classList.contains('on'))$('lvl').classList.remove('on');else if($('md').classList.contains('on'))mdClose();else if(S.querySelector('.pop.on,.logpop.on')){$('pop').classList.remove('on');$('lgp').classList.remove('on');$('lgL').classList.remove('on');closeDD();}}
function vvPin(){var v=window.visualViewport;if(!v)return;hub.style.top=v.offsetTop+'px';hub.style.height=v.height+'px';}
function vvOn(){var v=window.visualViewport;if(!v)return;vvPin();v.addEventListener('resize',vvPin);v.addEventListener('scroll',vvPin);}
function vvOff(){var v=window.visualViewport;if(v){v.removeEventListener('resize',vvPin);v.removeEventListener('scroll',vvPin);}hub.style.top='';hub.style.height='';}
function openHub(){hbFocus=document.activeElement;hub.hidden=false;vvOn();root.classList.add('td-lock');document.addEventListener('keydown',hubKey);setView(view);void hub.offsetWidth;hub.classList.add('open');}
function closeHub(){vvOff();if(SYAPI.close)SYAPI.close();mdClose();sdClose();$('pfm').classList.remove('on');$('stm').classList.remove('on');$('etm').classList.remove('on');hub.classList.remove('open');root.classList.remove('td-lock');document.removeEventListener('keydown',hubKey);
 setTimeout(function(){if(!hub.classList.contains('open'))hub.hidden=true;},matchMedia('(prefers-reduced-motion:reduce)').matches?0:300);if(hbFocus&&hbFocus.focus)hbFocus.focus({preventScroll:true});}
Promise.resolve().then(function(){hub.classList.add('boot');openHub();requestAnimationFrame(function(){requestAnimationFrame(function(){hub.classList.remove('boot');});});});
if(fs.t0&&fTot()&&fEl()>=fTot()){fLog(fTot());fHalt();}
fillChips();fPaint();tMeta();anR();
/* ===== Settings: Day Rollover Time ===== */
var cfg=$('stm'),RLAB=['12 AM','1 AM','2 AM','3 AM','4 AM','5 AM','6 AM'],DNM=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],rollT=0;
function fmtD(d){return DNM[d.getDay()]+' '+d.getDate()+' '+MNAME[d.getMonth()];}
function fmtT(ms){var d=new Date(ms),h=d.getHours();return(h%12||12)+':'+p2(d.getMinutes())+' '+(h<12?'AM':'PM');}
function cfgPaint(){
 [].forEach.call($('rolls').children,function(b){var on=+b.dataset.r===ROLL;b.classList.toggle('on',on);b.setAttribute('aria-checked',String(on));b.tabIndex=on?0:-1;});
 var k=L(),p=k.split('-'),kd=new Date(+p[0],+p[1]-1,+p[2]),s0=dayStart(k),e0=dayEnd(k);
 $('cfp').innerHTML='<div><small>CURRENT STUDY DAY</small><b>'+fmtD(kd)+'</b> · now '+fmtT(Date.now())+'</div><div><small>WINDOW</small><b>'+fmtD(new Date(s0))+', '+fmtT(s0)+'</b> → <b>'+fmtD(new Date(e0))+', '+fmtT(e0)+'</b></div>';}
function armRoll(){clearTimeout(rollT);var ms=dayEnd(L())-Date.now();rollT=setTimeout(function(){dayCheck();armRoll();},Math.max(1000,Math.min(ms+300,2e9)));}
function applyRoll(){_dk=L();wkRoll();tSave();refresh();fillLink();tRender();anR();cfgPaint();cdPaint();armRoll();}
function setRoll(h){h=+h;if(!(h>=0&&h<=6)||h===ROLL)return;ROLL=h;try{localStorage.setItem(RKEY,String(h));}catch(e){}applyRoll();toast('Your day now ends at '+RLAB[h]);}
/* ===== Settings modal (gear) + Countdown card ===== */
var CDK='pf-cd',CD={s:'jan',d:{jan:'2026-11-01',apr:''},b:''},cdShown=null,cdRaf=0,cdTok=0,cdMT=0,stFocus=null;
function cdUrlOk(u){return typeof u==='string'&&u.length<2e6&&/^(https?:\/\/|data:(image|video)\/)/i.test(u);}
function cdLoad(){var v=lsGet(CDK,null);if(!v||typeof v!=='object')return;if(v.s==='apr'||v.s==='jan')CD.s=v.s;if(v.d&&typeof v.d==='object')['jan','apr'].forEach(function(k){if(typeof v.d[k]==='string'&&(v.d[k]===''||/^\d{4}-\d{2}-\d{2}$/.test(v.d[k])))CD.d[k]=v.d[k];});if(typeof v.b==='string'&&cdUrlOk(v.b))CD.b=v.b;}
function cdSave(){lsSet(CDK,CD);}
function cdLeft(){var d=CD.d[CD.s];if(!d)return null;var a=d.split('-'),k=L().split('-');return Math.round((new Date(+a[0],+a[1]-1,+a[2])-new Date(+k[0],+k[1]-1,+k[2]))/864e5);}
function cdCount(el,txt){if(cdShown===txt)return;var num=/^\d+$/.test(txt),from=(cdShown!==null&&/^\d+$/.test(cdShown))?+cdShown:0;cdShown=txt;cancelAnimationFrame(cdRaf);
 if(!num||matchMedia('(prefers-reduced-motion:reduce)').matches){el.textContent=txt;return;}
 var to=+txt,t0=performance.now(),dur=Math.min(1100,500+Math.abs(to-from)*14);
 (function st(t){var p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3);el.textContent=Math.round(from+(to-from)*e);if(p<1)cdRaf=requestAnimationFrame(st);else{el.classList.remove('cdpulse');void el.offsetWidth;el.classList.add('cdpulse');}})(t0);}
function cdPaint(){var n=cdLeft(),t,a,b,lab;
 if(n===null){t='–';a='SET';b='DATE';lab='Set your target date';}
 else if(n<0){t='✅';a='SESSION';b='DONE';lab='Session finished';}
 else if(n===0){t='0';a='EXAM';b='DAY';lab='Exam day';}
 else{t=String(n);a=n===1?'DAY':'DAYS';b='REMAINING';lab=n+(n===1?' day':' days')+' remaining';}
 $('cdl1').textContent=a;$('cdl2').textContent=b;
 var c=$('cdc');c.title=lab+' — click for Reality Check';c.setAttribute('aria-label',lab+'. Open Reality Check');cdCount($('cdn'),t);if(typeof rcPaint==='function'&&$('rcm')&&$('rcm').classList.contains('on'))rcPaint(false);}
function cdIsVid(u){return /^data:video\//i.test(u)||/\.(mp4|webm|ogv|ogg|mov|m4v)(?:[?#]|$)/i.test(u);}
function cdProbe(u,cb){var fin=false,to=0;
 function ok(el){if(fin)return;fin=true;clearTimeout(to);cb(el);}
 function bad(){if(fin)return;fin=true;clearTimeout(to);cb(null);}
 function tryImg(next){var i=new Image();i.referrerPolicy='no-referrer';i.alt='';i.onload=function(){ok(i);};i.onerror=next;i.src=u;}
 function tryVid(next){var v=document.createElement('video');v.referrerPolicy='no-referrer';v.muted=true;v.defaultMuted=true;v.loop=true;v.autoplay=true;v.playsInline=true;v.setAttribute('muted','');v.setAttribute('playsinline','');v.preload='auto';v.onloadeddata=function(){ok(v);};v.onerror=next;v.src=u;}
 to=setTimeout(bad,15000);
 if(cdIsVid(u))tryVid(function(){tryImg(bad);});else tryImg(function(){tryVid(bad);});}
function cdMedia(el){var h=$('cdm');[].slice.call(h.querySelectorAll('img,video')).forEach(function(x){if(x.pause)x.pause();x.remove();});if(!el)return;el.className='';h.appendChild(el);requestAnimationFrame(function(){el.classList.add('on');});
 if(el.tagName==='VIDEO'&&!matchMedia('(prefers-reduced-motion:reduce)').matches){var p=el.play();if(p&&p.catch)p.catch(function(){});}}
function cdMsg(t,c){var m=$('cdMsg');m.textContent=t||'';m.className=c||'';}
function cdBnApply(){var u=($('cdUrl').value||'').trim();$('cdBn').classList.toggle('has',!!u);
 if(!u){var had=!!CD.b;cdTok++;CD.b='';cdSave();cdMedia(null);cdMsg(had?'Banner removed.':'','ok');return;}
 if(!cdUrlOk(u)){cdMsg('Enter a valid http(s) link to a photo, GIF or video. Your current banner was kept.','err');return;}
 if(u===CD.b){cdMsg('');return;}
 var tk=++cdTok;cdMsg('Loading…');
 cdProbe(u,function(el){if(tk!==cdTok)return;if(!el){cdMsg('Could not load that link — use a direct photo, GIF or video URL. Your current banner was kept.','err');return;}CD.b=u;cdSave();cdMedia(el);cdMsg(el.tagName==='VIDEO'?'Video banner applied.':'Banner applied.','ok');});}
function cdSegPaint(){[].forEach.call($('cdSeg').children,function(b){var on=b.dataset.s===CD.s;b.classList.toggle('on',on);b.setAttribute('aria-checked',String(on));b.tabIndex=on?0:-1;});$('cdDate').value=CD.d[CD.s]||'';cdDLbl();}
function stOpen(){stFocus=S.activeElement||null;cdDClose();cdSegPaint();$('cdUrl').value=CD.b;$('cdBn').classList.toggle('has',!!CD.b);cdMsg('');cfgPaint();apPaint();$('stBody').scrollTop=0;$('stm').classList.add('on');setTimeout(function(){$('stX').focus({preventScroll:true});},120);}
function stClose(){cdDClose();$('stm').classList.remove('on');if(stFocus&&stFocus.focus)stFocus.focus({preventScroll:true});}
$('sbset').addEventListener('click',stOpen);
$('cdc').addEventListener('click',rcOpen);
$('cdc').addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();rcOpen();}});
$('stX').addEventListener('click',stClose);$('stDone').addEventListener('click',stClose);bdClose($('stm'),stClose);
$('cdSeg').addEventListener('click',function(e){var b=e.target.closest('[data-s]');if(!b||b.dataset.s===CD.s)return;CD.s=b.dataset.s;cdSave();cdSegPaint();cdPaint();});
$('cdSeg').addEventListener('keydown',function(e){var d=e.key==='ArrowRight'||e.key==='ArrowDown'?1:e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:0;if(!d)return;e.preventDefault();CD.s=CD.s==='jan'?'apr':'jan';cdSave();cdSegPaint();cdPaint();var b=$('cdSeg').querySelector('.on');if(b)b.focus({preventScroll:true});});
var cdPy=0,cdPm=0;
function cdDLbl(){var v=$('cdDate').value;$('cdDt').textContent=/^\d{4}-\d{2}-\d{2}$/.test(v)?new Date(v+'T00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):'Pick a date';}
function cdDClose(){$('cdDP').classList.remove('on');$('cdDB').setAttribute('aria-expanded','false');}
function cdCalH(){var f=(new Date(cdPy,cdPm,1).getDay()+6)%7,n=new Date(cdPy,cdPm+1,0).getDate(),cur=$('cdDate').value,h='<div class="mc"><div class="mch"><button type="button" data-pn="-1" aria-label="Previous month">\u2039</button><span>'+new Date(cdPy,cdPm,1).toLocaleString('en',{month:'long',year:'numeric'})+'</span><button type="button" data-pn="1" aria-label="Next month">\u203a</button></div><div class="mcg">'+'MTWTFSS'.split('').map(function(x){return'<em>'+x+'</em>';}).join(''),i,k;
 for(i=0;i<f;i++)h+='<i></i>';
 for(i=1;i<=n;i++){k=L(new Date(cdPy,cdPm,i));h+='<button type="button" data-pd="'+k+'" class="'+(k===L()?'t ':'')+(k===cur?'s':'')+'">'+i+'</button>';}
 return h+'</div></div>';}
$('cdDB').addEventListener('click',function(){var p=$('cdDP');if(p.classList.contains('on')){cdDClose();return;}var v=$('cdDate').value,b=/^\d{4}-\d{2}-\d{2}$/.test(v)?new Date(v+'T00:00'):lnow();cdPy=b.getFullYear();cdPm=b.getMonth();p.innerHTML=cdCalH();p.classList.add('on');this.setAttribute('aria-expanded','true');});
$('cdDP').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var D=b.dataset;
 if('pn' in D){cdPm+=+D.pn;if(cdPm>11){cdPm=0;cdPy++;}if(cdPm<0){cdPm=11;cdPy--;}this.innerHTML=cdCalH();return;}
 if('pd' in D){$('cdDate').value=D.pd;CD.d[CD.s]=D.pd;cdSave();cdDLbl();cdPaint();cdDClose();}});
$('stm').addEventListener('click',function(e){var P=e.composedPath();if($('cdDP').classList.contains('on')&&P.indexOf($('cdDP'))<0&&P.indexOf($('cdDB'))<0)cdDClose();});
$('cdUrl').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();cdBnApply();}});
$('cdUrl').addEventListener('change',cdBnApply);
$('cdUrl').addEventListener('paste',function(){clearTimeout(cdMT);cdMT=setTimeout(cdBnApply,40);});
$('cdUrl').addEventListener('input',function(){$('cdBn').classList.toggle('has',!!this.value);cdMsg('');});
$('cdClr').addEventListener('click',function(){$('cdUrl').value='';cdBnApply();$('cdUrl').focus({preventScroll:true});});

/* ===== Reality Check popup: everything is derived from the target date (cdLeft) ===== */
var rcFocus=null,rcRafs={};
function rcSundays(){var d=CD.d[CD.s];if(!d)return 0;var a=d.split('-'),k=L().split('-'),e=new Date(+a[0],+a[1]-1,+a[2]),c=0;for(var x=new Date(+k[0],+k[1]-1,+k[2]);x<=e;x.setDate(x.getDate()+1))if(x.getDay()===0)c++;return c;}
function rcNum(el,to,anim){var id=el.id;cancelAnimationFrame(rcRafs[id]);
 if(typeof to!=='number'){el.textContent=to;return;}
 if(!anim||matchMedia('(prefers-reduced-motion:reduce)').matches||to===0){el.textContent=to;return;}
 var t0=performance.now(),dur=Math.min(1200,600+to*12);
 (function st(t){var p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3);el.textContent=Math.round(to*e);if(p<1)rcRafs[id]=requestAnimationFrame(st);})(t0);}
function rcPaint(anim){var n=cdLeft(),st=n===null?'none':n<0?'done':n===0?'day':'run',bx=$('rcm').firstChild,sun=rcSundays(),
 big,unit,sub,sl,wt,wp;
 bx.dataset.st=st;
 if(st==='none'){big='–';unit='Days';sub='NOT SET';sun='–';sl='–';wt='Set your date';wp='Pick your exam date and every number here calculates itself. No date, no reality.';}
 else if(st==='done'){big='✅';unit='';sub='SESSION DONE';sun=0;sl=0;wt='Well played';wp='The countdown is over. Rest, review what worked and what didn\u2019t, then plan the next round.';}
 else if(st==='day'){big=0;unit='Days';sub='EXAM DAY';sl=0;wt='Today is the day';wp='No prep time left to waste. <b>Walk in and take it</b> \u2014 you already did the work.';}
 else{big=n;unit=n===1?'Day':'Days';sub='REMAINING';sl=n;wt='If you waste 2h/day...';wp='You will lose <b>'+(n*2)+' hours</b> of prep time before the exam. In <b>'+n+(n===1?' day':' days')+'</b>, you will either be relieved or regretful. Choose now.';}
 rcNum($('rcN'),big,anim);$('rcN').dataset.l=String(big).length;$('rcU').textContent=unit;$('rcU').style.display=unit?'':'none';$('rcS').textContent=sub;
 rcNum($('rcSun'),sun,anim);rcNum($('rcSl'),sl,anim);$('rcWT').textContent=wt;$('rcWP').innerHTML=wp;if(st==='run'){rcTicks(n);rcClock();}}
var rcTm=0;
function rcPad(n,l){n=String(n);while(n.length<l)n='0'+n;return n;}
function rcClock(){var d=CD.d[CD.s];if(!d)return;var a=d.split('-'),ms=Math.max(0,new Date(+a[0],+a[1]-1,+a[2]).getTime()-Date.now()),h=Math.floor(ms/36e5),m=Math.floor(ms%36e5/6e4),sc=Math.floor(ms%6e4/1e3);$('rcClk').innerHTML=rcPad(h,2)+'<em>:</em>'+rcPad(m,2)+'<em>:</em>'+rcPad(sc,2);}
function rcTicks(n){var k=L().split('-'),t0=new Date(+k[0],+k[1]-1,+k[2]),wk=n>48,cnt=wk?Math.ceil(n/7)+1:n+1,h='',i,dt,c;
 for(i=0;i<cnt;i++){if(wk)c=i===0?'now':(i===cnt-1?'ex':'');else{dt=new Date(t0);dt.setDate(t0.getDate()+i);c=i===0?'now':i===n?'ex':(dt.getDay()===0?'sun':'');}
  h+='<i class="'+c+'" style="--i:'+Math.min(i,60)+'"></i>';}
 $('rcTk').innerHTML=h;$('rcTkN').textContent=wk?'1 tick = 1 week':'1 tick = 1 day \u00b7 tall = Sunday';}
function rcOpen(){rcFocus=S.activeElement||null;rcPaint(true);$('rcm').classList.add('on');clearInterval(rcTm);rcTm=setInterval(rcClock,1000);setTimeout(function(){$('rcX').focus({preventScroll:true});},140);}
function rcClose(){clearInterval(rcTm);$('rcm').classList.remove('on');if(rcFocus&&rcFocus.focus)rcFocus.focus({preventScroll:true});}
$('rcX').addEventListener('click',rcClose);bdClose($('rcm'),rcClose);
cdLoad();cdSegPaint();cdPaint();if(CD.b)cdProbe(CD.b,function(el){if(el)cdMedia(el);});rcPaint(false);

$('prof').addEventListener('click',function(){pfOpen();});$('prof').addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pfOpen();}});
$('cfgx').addEventListener('click',function(){pfOpen();});
/* ===== Settings: Appearance & Tags (visual only; never touches tasks, sessions, subjects, QPT or analytics data) ===== */
var PAL_TAG=['#ff375f','#ff453a','#ff9f0a','#ffd60a','#30d158','#66d4cf','#64d2ff','#0a84ff','#5e5ce6','#bf5af2','#ff6482','#ac8e68'],
 BGP=[{id:"aurora",n:"Aurora",s:"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900' preserveAspectRatio='xMidYMid slice'><defs><filter id='b' x='-50%' y='-50%' width='200%' height='200%'><feGaussianBlur stdDeviation='95'/></filter></defs><rect width='1600' height='900' fill='#070913'/><g filter='url(#b)'><ellipse cx='1250' cy='170' rx='430' ry='230' fill='#6f8cff' opacity='.9'/><ellipse cx='420' cy='260' rx='380' ry='190' fill='#9a8cff' opacity='.75'/><ellipse cx='830' cy='770' rx='540' ry='170' fill='#30c9b0' opacity='.5'/></g></svg>"},{id:"ember",n:"Ember",s:"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900' preserveAspectRatio='xMidYMid slice'><defs><radialGradient id='a' cx='82%' cy='100%' r='75%'><stop offset='0' stop-color='#ff9f0a' stop-opacity='.95'/><stop offset='.38' stop-color='#ff375f' stop-opacity='.5'/><stop offset='1' stop-color='#ff375f' stop-opacity='0'/></radialGradient><radialGradient id='c' cx='6%' cy='0%' r='55%'><stop offset='0' stop-color='#ff6482' stop-opacity='.35'/><stop offset='1' stop-color='#ff6482' stop-opacity='0'/></radialGradient></defs><rect width='1600' height='900' fill='#0b0605'/><rect width='1600' height='900' fill='url(#a)'/><rect width='1600' height='900' fill='url(#c)'/><circle cx='1163' cy='753' r='2.9' fill='#ffc247' opacity='0.8'/><circle cx='1162' cy='700' r='2.9' fill='#ffc247' opacity='0.4'/><circle cx='1523' cy='704' r='2.2' fill='#ffc247' opacity='0.6'/><circle cx='890' cy='276' r='2.1' fill='#ffc247' opacity='0.3'/><circle cx='1251' cy='829' r='1.3' fill='#ffc247' opacity='0.9'/><circle cx='1163' cy='849' r='2.7' fill='#ffc247' opacity='0.7'/><circle cx='1338' cy='195' r='2.9' fill='#ffc247' opacity='0.3'/><circle cx='736' cy='374' r='3' fill='#ffc247' opacity='0.6'/><circle cx='1496' cy='655' r='1.9' fill='#ffc247' opacity='0.6'/><circle cx='900' cy='711' r='1.7' fill='#ffc247' opacity='0.4'/><circle cx='704' cy='858' r='1.4' fill='#ffc247' opacity='0.7'/><circle cx='1116' cy='744' r='3.2' fill='#ffc247' opacity='0.8'/><circle cx='1424' cy='440' r='1.8' fill='#ffc247' opacity='0.4'/><circle cx='995' cy='210' r='1.3' fill='#ffc247' opacity='0.7'/><circle cx='1110' cy='290' r='2.9' fill='#ffc247' opacity='0.5'/><circle cx='717' cy='180' r='1.6' fill='#ffc247' opacity='0.9'/><circle cx='753' cy='661' r='2' fill='#ffc247' opacity='0.7'/><circle cx='1129' cy='254' r='2.3' fill='#ffc247' opacity='0.4'/><circle cx='1391' cy='456' r='1.9' fill='#ffc247' opacity='0.5'/><circle cx='715' cy='599' r='2.7' fill='#ffc247' opacity='0.3'/><circle cx='952' cy='283' r='1.2' fill='#ffc247' opacity='0.6'/><circle cx='1198' cy='361' r='2.6' fill='#ffc247' opacity='0.4'/><circle cx='1221' cy='375' r='3.2' fill='#ffc247' opacity='0.8'/><circle cx='1129' cy='839' r='2' fill='#ffc247' opacity='0.5'/><circle cx='917' cy='180' r='1.7' fill='#ffc247' opacity='0.9'/><circle cx='1522' cy='786' r='1.8' fill='#ffc247' opacity='0.8'/><circle cx='915' cy='371' r='2' fill='#ffc247' opacity='0.8'/><circle cx='1357' cy='770' r='1.4' fill='#ffc247' opacity='0.9'/><circle cx='918' cy='632' r='1.7' fill='#ffc247' opacity='0.8'/><circle cx='1036' cy='483' r='2' fill='#ffc247' opacity='0.3'/><circle cx='913' cy='776' r='2.5' fill='#ffc247' opacity='0.3'/><circle cx='1077' cy='560' r='2.4' fill='#ffc247' opacity='0.3'/><circle cx='1301' cy='675' r='2.9' fill='#ffc247' opacity='0.3'/><circle cx='1095' cy='367' r='2.5' fill='#ffc247' opacity='0.5'/><circle cx='933' cy='805' r='1.7' fill='#ffc247' opacity='0.4'/><circle cx='1457' cy='824' r='3.1' fill='#ffc247' opacity='0.4'/><circle cx='1097' cy='674' r='2.4' fill='#ffc247' opacity='0.5'/><circle cx='806' cy='291' r='1.3' fill='#ffc247' opacity='0.9'/></svg>"},{id:"grid",n:"Neon Grid",s:"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#05060f'/><stop offset='.42' stop-color='#1a0d38'/><stop offset='1' stop-color='#05060f'/></linearGradient><radialGradient id='s' cx='50%' cy='42%' r='30%'><stop offset='0' stop-color='#ff375f' stop-opacity='.75'/><stop offset='.5' stop-color='#bf5af2' stop-opacity='.3'/><stop offset='1' stop-color='#bf5af2' stop-opacity='0'/></radialGradient></defs><rect width='1600' height='900' fill='url(#g)'/><rect width='1600' height='900' fill='url(#s)'/><g stroke='#6f8cff' stroke-width='1.6' opacity='.55' fill='none'><path d='M800 380L-1270 900'/><path d='M800 380L-1040 900'/><path d='M800 380L-810 900'/><path d='M800 380L-580 900'/><path d='M800 380L-350 900'/><path d='M800 380L-120 900'/><path d='M800 380L110 900'/><path d='M800 380L340 900'/><path d='M800 380L570 900'/><path d='M800 380L800 900'/><path d='M800 380L1030 900'/><path d='M800 380L1260 900'/><path d='M800 380L1490 900'/><path d='M800 380L1720 900'/><path d='M800 380L1950 900'/><path d='M800 380L2180 900'/><path d='M800 380L2410 900'/><path d='M800 380L2640 900'/><path d='M800 380L2870 900'/><path d='M0 382 H1600'/><path d='M0 392 H1600'/><path d='M0 409 H1600'/><path d='M0 436 H1600'/><path d='M0 471 H1600'/><path d='M0 517 H1600'/><path d='M0 572 H1600'/><path d='M0 638 H1600'/><path d='M0 714 H1600'/><path d='M0 801 H1600'/><path d='M0 900 H1600'/></g><rect y='370' width='1600' height='3' fill='#9fb2ff' opacity='.7'/></svg>"},{id:"midnight",n:"Midnight",s:"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#050816'/><stop offset='.6' stop-color='#0e1230'/><stop offset='1' stop-color='#241046'/></linearGradient><radialGradient id='m' cx='80%' cy='24%' r='26%'><stop offset='0' stop-color='#b8c7ff' stop-opacity='.55'/><stop offset='1' stop-color='#b8c7ff' stop-opacity='0'/></radialGradient></defs><rect width='1600' height='900' fill='url(#g)'/><rect width='1600' height='900' fill='url(#m)'/><circle cx='488' cy='757' r='1.6' fill='#fff' opacity='0.4'/><circle cx='1221' cy='502' r='1' fill='#fff' opacity='0.3'/><circle cx='1475' cy='70' r='0.8' fill='#fff' opacity='0.5'/><circle cx='1338' cy='872' r='1.5' fill='#fff' opacity='0.2'/><circle cx='434' cy='208' r='1.6' fill='#fff' opacity='0.2'/><circle cx='842' cy='456' r='0.9' fill='#fff' opacity='0.2'/><circle cx='577' cy='377' r='1.3' fill='#fff' opacity='0.8'/><circle cx='188' cy='370' r='0.8' fill='#fff' opacity='0.5'/><circle cx='677' cy='672' r='1.6' fill='#fff' opacity='0.5'/><circle cx='287' cy='604' r='0.6' fill='#fff' opacity='0.2'/><circle cx='732' cy='717' r='1' fill='#fff' opacity='0.2'/><circle cx='1225' cy='651' r='0.7' fill='#fff' opacity='0.2'/><circle cx='637' cy='326' r='0.8' fill='#fff' opacity='0.2'/><circle cx='927' cy='559' r='1.1' fill='#fff' opacity='0.2'/><circle cx='1509' cy='754' r='1.6' fill='#fff' opacity='0.7'/><circle cx='699' cy='360' r='0.7' fill='#fff' opacity='0.5'/><circle cx='159' cy='892' r='1.8' fill='#fff' opacity='0.8'/><circle cx='61' cy='884' r='1.3' fill='#fff' opacity='0.2'/><circle cx='1356' cy='391' r='1.1' fill='#fff' opacity='0.2'/><circle cx='147' cy='82' r='0.7' fill='#fff' opacity='0.3'/><circle cx='526' cy='900' r='1.2' fill='#fff' opacity='0.4'/><circle cx='1505' cy='710' r='1.4' fill='#fff' opacity='0.5'/><circle cx='1108' cy='85' r='1.3' fill='#fff' opacity='0.5'/><circle cx='635' cy='615' r='0.7' fill='#fff' opacity='0.2'/><circle cx='1430' cy='115' r='1.3' fill='#fff' opacity='0.6'/><circle cx='995' cy='261' r='1.9' fill='#fff' opacity='0.4'/><circle cx='293' cy='694' r='1.5' fill='#fff' opacity='0.5'/><circle cx='1543' cy='350' r='1.5' fill='#fff' opacity='0.5'/><circle cx='494' cy='334' r='1.2' fill='#fff' opacity='0.4'/><circle cx='1298' cy='441' r='1.7' fill='#fff' opacity='0.7'/><circle cx='410' cy='219' r='1.1' fill='#fff' opacity='0.6'/><circle cx='648' cy='214' r='0.8' fill='#fff' opacity='0.5'/><circle cx='83' cy='728' r='0.7' fill='#fff' opacity='0.8'/><circle cx='346' cy='115' r='1.2' fill='#fff' opacity='0.4'/><circle cx='438' cy='850' r='1.2' fill='#fff' opacity='0.6'/><circle cx='1011' cy='688' r='1' fill='#fff' opacity='0.7'/><circle cx='1279' cy='463' r='1' fill='#fff' opacity='0.7'/><circle cx='569' cy='893' r='1.5' fill='#fff' opacity='0.6'/><circle cx='575' cy='584' r='1.1' fill='#fff' opacity='0.6'/><circle cx='1155' cy='19' r='1.5' fill='#fff' opacity='0.5'/><circle cx='388' cy='25' r='1.7' fill='#fff' opacity='0.4'/><circle cx='1595' cy='144' r='1.7' fill='#fff' opacity='0.8'/><circle cx='236' cy='457' r='0.8' fill='#fff' opacity='0.5'/><circle cx='1310' cy='826' r='1.1' fill='#fff' opacity='0.3'/><circle cx='405' cy='204' r='1.8' fill='#fff' opacity='0.4'/><circle cx='1462' cy='11' r='1.7' fill='#fff' opacity='0.5'/><circle cx='74' cy='183' r='0.9' fill='#fff' opacity='0.7'/><circle cx='1105' cy='714' r='1.9' fill='#fff' opacity='0.5'/><circle cx='1548' cy='163' r='1.2' fill='#fff' opacity='0.7'/><circle cx='458' cy='89' r='1.2' fill='#fff' opacity='0.8'/><circle cx='794' cy='133' r='1.2' fill='#fff' opacity='0.3'/><circle cx='13' cy='385' r='1.4' fill='#fff' opacity='0.6'/><circle cx='1029' cy='815' r='1.7' fill='#fff' opacity='0.4'/><circle cx='668' cy='666' r='2' fill='#fff' opacity='0.3'/><circle cx='1314' cy='734' r='0.8' fill='#fff' opacity='0.4'/><circle cx='799' cy='89' r='2' fill='#fff' opacity='0.5'/><circle cx='656' cy='268' r='1.9' fill='#fff' opacity='0.8'/><circle cx='713' cy='516' r='0.7' fill='#fff' opacity='0.5'/><circle cx='1127' cy='431' r='1.7' fill='#fff' opacity='0.5'/><circle cx='58' cy='223' r='1.7' fill='#fff' opacity='0.2'/><circle cx='71' cy='177' r='1.3' fill='#fff' opacity='0.6'/><circle cx='287' cy='481' r='0.8' fill='#fff' opacity='0.5'/><circle cx='1481' cy='530' r='1.8' fill='#fff' opacity='0.6'/><circle cx='1008' cy='592' r='1.9' fill='#fff' opacity='0.3'/><circle cx='453' cy='449' r='1.3' fill='#fff' opacity='0.4'/><circle cx='1492' cy='575' r='1.5' fill='#fff' opacity='0.5'/><circle cx='1146' cy='262' r='1' fill='#fff' opacity='0.4'/><circle cx='1248' cy='213' r='1' fill='#fff' opacity='0.3'/><circle cx='1115' cy='536' r='1' fill='#fff' opacity='0.5'/><circle cx='841' cy='548' r='0.8' fill='#fff' opacity='0.2'/><circle cx='772' cy='28' r='1.4' fill='#fff' opacity='0.2'/><circle cx='820' cy='557' r='1.7' fill='#fff' opacity='0.6'/><circle cx='1005' cy='95' r='1.6' fill='#fff' opacity='0.2'/><circle cx='1103' cy='469' r='1.2' fill='#fff' opacity='0.8'/><circle cx='827' cy='275' r='0.9' fill='#fff' opacity='0.5'/><circle cx='695' cy='444' r='1.9' fill='#fff' opacity='0.8'/><circle cx='975' cy='537' r='1' fill='#fff' opacity='0.3'/><circle cx='1265' cy='30' r='1.9' fill='#fff' opacity='0.3'/><circle cx='1595' cy='23' r='0.6' fill='#fff' opacity='0.3'/><circle cx='24' cy='703' r='1' fill='#fff' opacity='0.7'/><circle cx='500' cy='634' r='1.3' fill='#fff' opacity='0.5'/><circle cx='1192' cy='125' r='1.8' fill='#fff' opacity='0.6'/><circle cx='1469' cy='202' r='1.6' fill='#fff' opacity='0.8'/><circle cx='47' cy='384' r='1.5' fill='#fff' opacity='0.7'/><circle cx='1261' cy='163' r='1.4' fill='#fff' opacity='0.8'/><circle cx='1093' cy='653' r='0.9' fill='#fff' opacity='0.3'/><circle cx='1111' cy='626' r='1.4' fill='#fff' opacity='0.3'/><circle cx='1517' cy='642' r='1.7' fill='#fff' opacity='0.8'/><circle cx='646' cy='617' r='1' fill='#fff' opacity='0.8'/><circle cx='446' cy='796' r='2' fill='#fff' opacity='0.8'/><circle cx='1280' cy='216' r='46' fill='#e8eeff' opacity='.9'/></svg>"},{id:"waves",n:"Ink Waves",s:"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#06101a'/><stop offset='1' stop-color='#120a26'/></linearGradient></defs><rect width='1600' height='900' fill='url(#g)'/><g fill='none' stroke-width='2.4'><path d='M-50 140 C 300 93, 520 186, 800 143 S 1300 102, 1650 163' stroke='#64d2ff' opacity='0.1'/><path d='M-50 184 C 300 107, 520 260, 800 187 S 1300 122, 1650 222' stroke='#6f8cff' opacity='0.2'/><path d='M-50 228 C 300 183, 520 272, 800 240 S 1300 192, 1650 250' stroke='#9a8cff' opacity='0.2'/><path d='M-50 272 C 300 210, 520 333, 800 283 S 1300 223, 1650 302' stroke='#64d2ff' opacity='0.2'/><path d='M-50 316 C 300 269, 520 362, 800 322 S 1300 278, 1650 339' stroke='#6f8cff' opacity='0.3'/><path d='M-50 360 C 300 285, 520 434, 800 360 S 1300 300, 1650 397' stroke='#9a8cff' opacity='0.3'/><path d='M-50 404 C 300 353, 520 454, 800 414 S 1300 363, 1650 429' stroke='#64d2ff' opacity='0.3'/><path d='M-50 448 C 300 362, 520 533, 800 462 S 1300 379, 1650 490' stroke='#6f8cff' opacity='0.4'/><path d='M-50 492 C 300 446, 520 537, 800 499 S 1300 455, 1650 514' stroke='#9a8cff' opacity='0.4'/><path d='M-50 536 C 300 458, 520 613, 800 543 S 1300 473, 1650 574' stroke='#64d2ff' opacity='0.4'/><path d='M-50 580 C 300 505, 520 654, 800 582 S 1300 520, 1650 617' stroke='#6f8cff' opacity='0.5'/><path d='M-50 624 C 300 580, 520 667, 800 625 S 1300 589, 1650 645' stroke='#9a8cff' opacity='0.5'/><path d='M-50 668 C 300 626, 520 709, 800 676 S 1300 634, 1650 688' stroke='#64d2ff' opacity='0.5'/><path d='M-50 712 C 300 646, 520 777, 800 720 S 1300 659, 1650 744' stroke='#6f8cff' opacity='0.6'/></g></svg>"}],
 BGK='pf-bg',BGU='pf-bg-url',BGO='pf-bg-op',BGL_K='pf-bg-list',BGH_K='pf-bg-hidden',BGH=[],BGL=[],BG_MAX=24,BG={id:'none',url:'',op:40},bgBusy=false,rcT=0,
 CHK_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
 PAL_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.4-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7H17a4 4 0 0 0 4-4c0-4.4-4-8.2-9-8.2z" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7.6" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="10.4" cy="7.2" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="7.2" r="1" fill="currentColor" stroke="none"/></svg>';
function bgUrlOk(u){return typeof u==='string'&&u.length<2e6&&/^(https?:\/\/|data:image\/)/i.test(u);}
function bgPreset(id){for(var i=0;i<BGP.length;i++)if(BGP[i].id===id)return BGP[i];return null;}
function bgPUrl(p){return'data:image/svg+xml;utf8,'+encodeURIComponent(p.s);}
function bgSrc(){if(BG.id==='custom'&&bgUrlOk(BG.url))return BG.url;var p=bgPreset(BG.id);return p?bgPUrl(p):'';}
function cssUrl(u){return'url("'+String(u).replace(/[\\"\n\r]/g,function(c){return encodeURIComponent(c);})+'")';}
function bgApply(){var u=bgSrc(),st=document.documentElement.style;
 if(u){st.setProperty('--pf-bg-img',cssUrl(u));st.setProperty('--pf-bg-op',String(BG.op/100));}
 else{st.removeProperty('--pf-bg-img');st.setProperty('--pf-bg-op','0');}}
(function(){var id=lsGet(BGK,'none'),u=lsGet(BGU,''),o=+lsGet(BGO,40);
 BG.url=bgUrlOk(u)?u:'';BG.id=(typeof id==='string'&&((id==='custom'&&BG.url)||bgPreset(id)))?id:'none';
 BG.op=isFinite(o)?Math.max(0,Math.min(100,Math.round(o))):40;
 var l=lsGet(BGL_K,[]),n0;if(Array.isArray(l))l.forEach(function(u){if(bgUrlOk(u)&&BGL.indexOf(u)<0&&BGL.length<BG_MAX)BGL.push(u);});n0=BGL.length;
 if(BG.url&&BGL.indexOf(BG.url)<0)BGL.push(BG.url);if(BGL.length!==n0||!Array.isArray(l))lsSet(BGL_K,BGL);})();
(function(){var h=lsGet(BGH_K,[]);if(Array.isArray(h))h.forEach(function(i){if(typeof i==='string'&&bgPreset(i)&&BGH.indexOf(i)<0)BGH.push(i);});})();
bgApply();
function bgMsg(t,err){var m=$('bgMsg');m.textContent=t||'';m.classList.toggle('err',!!err);}
function bgTile(id,label,src,cu){var b=document.createElement('button'),on=id==='custom'?(BG.id==='custom'&&BG.url===cu):BG.id===id;b.type='button';b.className='bgt'+(id==='none'?' none':'')+(on?' on':'');b.dataset.bg=id;b.setAttribute('role','radio');b.setAttribute('aria-checked',String(on));if(cu)b.dataset.url=cu;
 b.setAttribute('aria-label',label+' background');if(src){b.style.backgroundImage=cssUrl(src);var e=document.createElement('em');e.textContent=label;b.appendChild(e);}else b.textContent=label;
 var k=document.createElement('span');k.className='bgk';k.innerHTML=CHK_SVG;b.appendChild(k);if(!cu&&id==='none')return b;
 var w=document.createElement('div'),x=document.createElement('button');w.className='bgw';w.setAttribute('role','presentation');w.appendChild(b);x.type='button';x.className='bgx';x.dataset.bgx='1';if(cu)x.dataset.url=cu;else x.dataset.preset=id;x.setAttribute('aria-label','Remove '+label);x.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';w.appendChild(x);return w;}
function bgPaint(){var g=$('bgs');g.textContent='';g.appendChild(bgTile('none','None',''));BGP.forEach(function(p){if(BGH.indexOf(p.id)<0)g.appendChild(bgTile(p.id,p.n,bgPUrl(p)));});BGL.forEach(function(u,i){g.appendChild(bgTile('custom','Custom '+(i+1),u,u));});var rs=$('bgRs');rs.hidden=!BGH.length;rs.textContent='Restore '+BGH.length+' removed default'+(BGH.length>1?'s':'');}
function opPaint(){var r=$('bgop'),has=!!bgSrc();r.value=BG.op;r.style.setProperty('--p',BG.op+'%');r.disabled=!has;$('opw').classList.toggle('off',!has);$('bgopv').textContent=has?BG.op+'%':'Off';}
function bgSave(){lsSet(BGK,BG.id);lsSet(BGU,BG.url||'');lsSet(BGL_K,BGL);lsSet(BGH_K,BGH);lsSet(BGO,BG.op);}
$('bgRs').addEventListener('click',function(){BGH.length=0;bgSave();bgPaint();bgMsg('Default backgrounds restored.');});
$('bgs').addEventListener('click',function(e){
 var x=e.target.closest('[data-bgx]');
 if(x&&x.dataset.preset){var pi=x.dataset.preset;if(bgPreset(pi)&&BGH.indexOf(pi)<0){BGH.push(pi);if(BG.id===pi)BG.id='none';bgSave();bgApply();bgPaint();opPaint();bgMsg('Default background removed.');}return;}
 if(x){var ru=x.dataset.url,ri=BGL.indexOf(ru);if(ri>-1){BGL.splice(ri,1);if(BG.url===ru){BG.url='';if(BG.id==='custom')BG.id='none';}bgSave();bgApply();bgPaint();opPaint();bgMsg('Custom background removed.');}return;}
 var b=e.target.closest('[data-bg]');if(!b)return;var id=b.dataset.bg;
 if(id==='custom'){var u=b.dataset.url;if(!u||BGL.indexOf(u)<0||(BG.id==='custom'&&BG.url===u))return;BG.id='custom';BG.url=u;}
 else{if(id===BG.id)return;if(id!=='none'&&!bgPreset(id))return;BG.id=id;}
 bgSave();bgApply();bgPaint();opPaint();bgMsg('');});
$('bgop').addEventListener('input',function(){BG.op=Math.max(0,Math.min(100,Math.round(+this.value)));this.style.setProperty('--p',BG.op+'%');$('bgopv').textContent=BG.op+'%';bgApply();lsSet(BGO,BG.op);});
function bgAdd(){
 var u=($('bgUrl').value||'').trim(),btn=$('bgAdd');if(bgBusy)return;
 if(!u){bgMsg('Paste an image URL first.',true);return;}
 if(!bgUrlOk(u)){bgMsg('Enter a valid http(s) image link. Your current background was kept.',true);return;}
 if(BGL.indexOf(u)>-1){BG.id='custom';BG.url=u;bgSave();bgApply();bgPaint();opPaint();$('bgUrl').value='';bgMsg('Already added — selected.');return;}
 if(BGL.length>=BG_MAX){bgMsg('Limit reached ('+BG_MAX+' custom backgrounds). Remove one first.',true);return;}
 bgBusy=true;btn.disabled=true;bgMsg('Checking image…');
 var im=new Image(),done=false,to=setTimeout(function(){fin(false);},15000);
 function fin(ok){if(done)return;done=true;clearTimeout(to);im.onload=im.onerror=null;bgBusy=false;btn.disabled=false;
  if(ok){if(BGL.indexOf(u)<0)BGL.push(u);BG.id='custom';BG.url=u;bgSave();bgApply();bgPaint();opPaint();$('bgUrl').value='';bgMsg('Background applied.');}
  else bgMsg("Couldn't load that image. Your current background was kept.",true);}
 im.onload=function(){fin(im.naturalWidth>0);};im.onerror=function(){fin(false);};im.src=u;}
$('bgAdd').addEventListener('click',bgAdd);
$('bgUrl').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();bgAdd();}});
$('bgUrl').addEventListener('input',function(){if(!bgBusy)bgMsg('');});
function tagCol(id){var c=SC(id);return okCol(c)?c.toLowerCase():'#8e8e93';}
function tagCard(s){var c=tagCol(s.id),inPal=PAL_TAG.indexOf(c)>-1,n=esc(s.n),h='<div class="tg" data-id="'+esc(s.id)+'"><div class="tgh"><i class="tgd" style="background:'+c+'"></i><b>'+n+'</b></div><div class="tgs" role="radiogroup" aria-label="'+n+' color">';
 PAL_TAG.forEach(function(p){var on=p===c;h+='<button type="button" class="sw'+(on?' on':'')+'" role="radio" aria-checked="'+on+'" data-col="'+p+'" style="--sc:'+p+'" aria-label="'+n+' '+p+'">'+CHK_SVG+'</button>';});
 return h+'<label class="sw cust'+(inPal?'':' on')+'" style="--sc:'+(inPal?'transparent':c)+'" title="Custom color"><span class="ci">'+PAL_SVG+'</span>'+CHK_SVG+'<input type="color" value="'+c+'" aria-label="Custom color for '+n+'"></label></div></div>';}
function tagPaint(){$('tagg').innerHTML=subs.length?subs.map(tagCard).join(''):'<div class="empty">No subjects yet</div>';}
function tagMark(id){var cards=$('tagg').children,i,card=null;for(i=0;i<cards.length;i++)if(cards[i].dataset.id===id){card=cards[i];break;}if(!card)return;
 var c=tagCol(id),hit=false;card.querySelector('.tgd').style.background=c;
 [].forEach.call(card.querySelectorAll('.sw[data-col]'),function(b){var on=b.dataset.col===c;b.classList.toggle('on',on);b.setAttribute('aria-checked',String(on));if(on)hit=true;});
 var cu=card.querySelector('.sw.cust');cu.classList.toggle('on',!hit);cu.style.setProperty('--sc',hit?'transparent':c);cu.querySelector('input').value=c;}
function recolor(){dnKey='';barKey='';mdRender();fillChips();tMeta();tRender();anR();if($('lgL').classList.contains('on'))lgRender();}
function setTag(id,col,live){if(!okCol(col)||!sub(id))return;col=col.toLowerCase();if(TC[id]===col)return;TC[id]=col;lsSet(TCK,TC);tagMark(id);clearTimeout(rcT);if(live)rcT=setTimeout(recolor,90);else recolor();}
$('tagg').addEventListener('click',function(e){var b=e.target.closest('.sw[data-col]');if(!b)return;var card=b.closest('.tg');if(card)setTag(card.dataset.id,b.dataset.col,false);});
$('tagg').addEventListener('input',function(e){var i=e.target.closest('input[type=color]');if(!i)return;var card=i.closest('.tg');if(card)setTag(card.dataset.id,i.value,true);});
function apPaint(){tagPaint();bgPaint();opPaint();bgMsg('');}

$('rolls').addEventListener('click',function(e){var b=e.target.closest('[data-r]');if(b)setRoll(b.dataset.r);});
$('rolls').addEventListener('keydown',function(e){var d=e.key==='ArrowRight'||e.key==='ArrowDown'?1:e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:0;if(!d)return;e.preventDefault();var n=(ROLL+d+7)%7;setRoll(n);var b=$('rolls').querySelector('.on');if(b)b.focus({preventScroll:true});});

/* ===== Settings: Data (full backup / restore of all pf-* localStorage) ===== */
var BK_APP='pre-qft-master-plan',BK_FMT=1;
function bkKeys(){var o=[];try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf('pf-')===0)o.push(k);}}catch(e){}return o.sort();}
function dtMsg(t,err){var m=$('dtMsg');m.textContent=t;m.classList.toggle('err',!!err);}
function bkBuild(){
 var data={},now=Date.now();
 bkKeys().forEach(function(k){var raw=localStorage.getItem(k),v;if(raw==null)return;try{v=JSON.parse(raw);}catch(e){return;}data[k]=v;});
 /* a running timer is exported as paused so a restored backup never resumes with a stale start time */
 var f=data['pf-flow'];if(f&&typeof f==='object'&&+f.t0>0){f=JSON.parse(JSON.stringify(f));f.sg=(Array.isArray(f.sg)?f.sg:[]).concat([[+f.t0,now]]);f.acc=(+f.acc||0)+Math.max(0,now-(+f.t0));f.t0=0;data['pf-flow']=f;}
 return{app:BK_APP,format:BK_FMT,exportedAt:now,exportedAtISO:new Date(now).toISOString(),data:data};
}
function isObj(v){return v&&typeof v==='object'&&!Array.isArray(v);}
function bkValidate(b){
 if(!isObj(b))return'Not a backup file';
 if(b.app!==BK_APP)return'This is not a Study Lab backup';
 if(b.format!==BK_FMT)return'Unsupported backup version';
 if(!isObj(b.data))return'Backup has no data';
 var d=b.data,ks=Object.keys(d),i,k,v,j;
 if(!ks.length)return'Backup is empty';
 for(i=0;i<ks.length;i++){k=ks[i];v=d[k];
  if(k.indexOf('pf-')!==0)return'Unexpected key: '+k;
  if(k==='pf-sess'){if(!Array.isArray(v))return'Sessions are malformed';
   for(j=0;j<v.length;j++){var q=v[j];if(!isObj(q)||!(isFinite(q.s)&&+q.s>0)||!(isFinite(q.ms)&&+q.ms>0)||(q.sg!==undefined&&!Array.isArray(q.sg)))return'Session #'+(j+1)+' is malformed';}}
  else if(k==='pf-tasks'){if(!Array.isArray(v))return'Tasks are malformed';
   for(j=0;j<v.length;j++){var t=v[j];if(!isObj(t)||typeof t.text!=='string'||!t.text||(t.due!==undefined&&typeof t.due!=='string'))return'Task #'+(j+1)+' is malformed';}}
  else if(k==='pf-rollover'){if(!(typeof v==='number'&&v>=0&&v<=6&&Math.floor(v)===v))return'Day Rollover value is invalid';}
  else if(k==='pf-qpt-done'||k==='pf-notes'){if(!isObj(v))return(k==='pf-notes'?'Notes':'QPT state')+' are malformed';}
  else if(k==='pf-subj'){if(!Array.isArray(v))return'Subjects are malformed';for(j=0;j<v.length;j++)if(!isObj(v[j])||typeof v[j].id!=='string'||typeof v[j].n!=='string')return'Subject #'+(j+1)+' is malformed';}
  else if(k==='pf-mocks'){if(!isObj(v)||!Array.isArray(v.tests))return'Mock data is malformed';
   if(v.cats!==undefined&&(!Array.isArray(v.cats)||v.cats.some(function(c){return typeof c!=='string';})))return'Mock categories are malformed';
   if(v.target!==undefined&&!(isFinite(v.target)&&+v.target>=0))return'Mock target is invalid';
   for(j=0;j<v.tests.length;j++){var m=v.tests[j];if(!isObj(m)||typeof m.name!=='string'||typeof m.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(m.date)||!isObj(m.s)||(m.max!==undefined&&!(isFinite(m.max)&&+m.max>0))||(m.done!==0&&m.done!==1)||['att','cor'].some(function(q){return m[q]!==undefined&&!(isFinite(m[q])&&+m[q]>=0);})||(+m.cor||0)>(+m.att||0)||['phy','che','mat'].some(function(q){return m.s[q]!==undefined&&!(isFinite(m.s[q])&&+m.s[q]<=((+m.max||300)/3)+1e-9);}))return'Mock test #'+(j+1)+' is malformed';}}
  else if(k==='pf-flow'){if(!isObj(v))return'Timer state is malformed';}
  else if(k==='pf-seen'){if(v!==null&&!Array.isArray(v))return'Rewards state is malformed';}
  else if(k==='pf-theme'){if(typeof v!=='string')return'Theme is malformed';}
  else if(k==='pf-bg-list'||k==='pf-bg-hidden'){if(!Array.isArray(v))return'Background list is malformed';}
   else if(k==='pf-profile'){if(!isObj(v))return'Profile is malformed';}
 }
 return'';
}
function bkApply(b){
 var d=b.data,old={},cur=[],i;
 try{for(i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf('pf-')===0)cur.push(k);}}catch(e){return false;}
 cur.forEach(function(k){old[k]=localStorage.getItem(k);});
 window.__pfImporting=true;_imp=true;
 try{
  cur.forEach(function(k){localStorage.removeItem(k);});
  Object.keys(d).forEach(function(k){var v=d[k];if(k==='pf-flow'&&isObj(v)&&+v.t0>0){v=JSON.parse(JSON.stringify(v));v.sg=(Array.isArray(v.sg)?v.sg:[]).concat([[+v.t0,+b.exportedAt||Date.now()]]);v.acc=(+v.acc||0)+Math.max(0,(+b.exportedAt||Date.now())-(+v.t0));v.t0=0;}localStorage.setItem(k,JSON.stringify(v));});
  /* migration flags: a restored backup must never be re-processed by the one-time legacy cleanup */
  localStorage.setItem('pf-v2','1');localStorage.setItem('pf-reset-v1','1');
  return true;
 }catch(e){
  try{Object.keys(localStorage).filter(function(k){return k.indexOf('pf-')===0;}).forEach(function(k){localStorage.removeItem(k);});Object.keys(old).forEach(function(k){localStorage.setItem(k,old[k]);});}catch(e2){}
  window.__pfImporting=false;_imp=false;return false;
 }
}
$('dtExp').addEventListener('click',function(){
 try{
  var b=bkBuild(),blob=new Blob([JSON.stringify(b,null,2)],{type:'application/json'}),a=document.createElement('a'),n=new Date();
  a.href=URL.createObjectURL(blob);a.download='study-lab-backup-'+n.getFullYear()+p2(n.getMonth()+1)+p2(n.getDate())+'-'+p2(n.getHours())+p2(n.getMinutes())+'.json';
  document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1500);
  dtMsg('Exported '+Object.keys(b.data).length+' data items.');
 }catch(e){dtMsg('Export failed.',true);}
});
$('dtImp').addEventListener('click',function(){$('dtFile').value='';$('dtFile').click();});
$('dtFile').addEventListener('change',function(){
 var f=this.files&&this.files[0];if(!f)return;
 var r=new FileReader();
 r.onerror=function(){dtMsg('Could not read the file. Nothing was changed.',true);};
 r.onload=function(){
  var b,err;
  try{b=JSON.parse(String(r.result));}catch(e){dtMsg('Invalid file: not valid JSON. Nothing was changed.',true);return;}
  err=bkValidate(b);if(err){dtMsg('Invalid backup: '+err+'. Nothing was changed.',true);return;}
  if(!window.confirm('Import this backup? It will REPLACE all current tasks, sessions, notes, QPT progress and settings.'))return;
  if(!bkApply(b)){dtMsg('Import failed. Your existing data was kept.',true);return;}
  dtMsg('Backup restored. Reloading…');location.reload();
 };
 r.readAsText(f);
});


/* ===== v17: profile (pf-profile) ===== */
var GR=[['#ff8f3a','#d946ef'],['#0a84ff','#bf5af2'],['#30d158','#0a84ff'],['#ff375f','#ff9f0a'],['#ffd60a','#ff9f0a'],['#64d2ff','#5e5ce6'],['#ff6482','#bf5af2']],
 TGI=['M8 7l-5 5 5 5M16 7l5 5-5 5','M13 3L5 14h6l-1 7 8-11h-6z','M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z','M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z','M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 5v16','M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z','M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z','M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'],
 TGP=[['DEV',0,0],['STUDENT',1,4],['TOPPER',4,2],['GRINDER',2,1],['BEAST',3,3],['AIR 1',5,5],['LEGEND',6,6],['OWL',1,7]],pfTag=null,FLP='M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z';
function tgNorm(t){if(!t||typeof t!=='object')return null;var x=String(t.t||'').trim().slice(0,10),g=+t.g,i=+t.i,e=typeof t.e==='string'?t.e.slice(0,8):'';if(!x&&!e)return null;return{t:x,e:e,g:g>=0&&g<GR.length?g|0:0,i:i>=0&&i<TGI.length?i|0:0};}
function tgSvg(t){if(t.e)return'<span class="te">'+esc(t.e)+'</span>';return'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+TGI[t.i]+'"/></svg>';}
function tagHtml(t){return'<span class="ptag" style="--tg1:'+GR[t.g][0]+';--tg2:'+GR[t.g][1]+'">'+tgSvg(t)+esc(t.t)+'</span>';}
function tagSet(el,t){t=tgNorm(t);if(!t){el.hidden=true;el.innerHTML='';return;}el.hidden=false;el.style.setProperty('--tg1',GR[t.g][0]);el.style.setProperty('--tg2',GR[t.g][1]);el.innerHTML=tgSvg(t)+esc(t.t);}
function tgPaint(keep){var t=pfTag;
 $('tgP').innerHTML='';var _legacy='<button type="button" class="none'+(!tgNorm(t)?' on':'')+'" data-p="-1">None</button>'+TGP.map(function(p,n){var on=t&&t.t===p[0]&&t.g===p[1]&&t.i===p[2];return'<button type="button" data-p="'+n+'" class="'+(on?'on':'')+'">'+tagHtml({t:p[0],g:p[1],i:p[2]})+'</button>';}).join('');
 $('tgG').innerHTML=GR.map(function(g,n){return'<button type="button" data-g="'+n+'" class="'+(t&&t.g===n?'on':'')+'" style="background:linear-gradient(135deg,'+g[0]+','+g[1]+')" aria-label="Colour '+(n+1)+'"></button>';}).join('');
 $('tgI').innerHTML=TGI.map(function(p,n){return'<button type="button" data-i="'+n+'" class="'+(t&&t.i===n&&!t.e?'on':'')+'" aria-label="Icon '+(n+1)+'">'+tgSvg({i:n})+'</button>';}).join('')+'<button type="button" data-em="1" class="tgemb'+(t&&t.e?' on':'')+'" aria-label="Emojis" aria-expanded="'+!$('tgE').hidden+'">'+(t&&t.e?'<span class="te">'+esc(t.e)+'</span>':'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8.5 14.2a4 4 0 0 0 7 0M9 9.6h.01M15 9.6h.01"/></svg>')+'</button>';
 if(!keep)$('pfTt').value=t?t.t:'';}
var PFK='pf-profile',PF=lsGet(PFK,null);if(!PF||typeof PF!=='object'||Array.isArray(PF))PF={};
PF={name:typeof PF.name==='string'?PF.name.slice(0,24):'',avatar:typeof PF.avatar==='string'?PF.avatar:'',banner:typeof PF.banner==='string'?PF.banner:'',status:typeof PF.status==='string'?PF.status.slice(0,60):'',bpos:pnorm(PF.bpos),apos:pnorm(PF.apos),tag:tgNorm(PF.tag)};
var pDef={e:$('pAv').textContent,t:$('pT').textContent,h:$('pH').textContent},RK={e:'🌱',t:'Novice',lv:1,pr:0};
function okAv(u){return/^https?:\/\//i.test(u)||/^data:image\//i.test(u);}
function setAv(el,url,emo){el.textContent=emo;if(url&&okAv(url)){var im=new Image();im.alt='';im.referrerPolicy='no-referrer';im.onload=function(){el.textContent='';el.appendChild(im);rpSync();};im.src=url;}}
function setBn(el,url){url=(url&&okAv(url))?url:'';if((el.dataset.u||'')===url)return;el.dataset.u=url;el.textContent='';el.classList.remove('has');if(!url)return;var im=new Image();im.alt='';im.referrerPolicy='no-referrer';im.onload=function(){if(el.dataset.u===url){el.textContent='';el.appendChild(im);el.classList.add('has');rpSync();}};im.src=url;}
function dayStat(){var tl=L(),a=tasks.filter(function(t){return t.due===tl&&!inInbox(t);});return{n:a.length,d:a.filter(function(t){return t.done;}).length};}
function profPaint(){
 var cu=!!(PF.name||PF.status||PF.avatar);
 $('pT').textContent=PF.name||pDef.t;$('pH').textContent=PF.status||pDef.h;
 var pl=$('pLv');pl.hidden=!(PF.name||PF.status);pl.textContent=pDef.e+' '+pDef.t+' · '+pDef.h.replace(/^.*?· /,'');
 setAv($('pAv'),PF.avatar,pDef.e);setBn($('pBn'),PF.banner);tagSet($('pTg'),PF.tag);$('pBn').style.setProperty('--pfop',posCss(pnorm(PF.bpos)));$('pAv').style.setProperty('--pfop',posCss(pnorm(PF.apos)));$('prof').classList.toggle('custom',cu);}
var _rw=rewards;rewards=function(s,c){_rw(s,c);try{var _li=lvl(s.tot),_T=TIERS[_li],_nx=TIERS[_li+1],_h=s.tot/36e5;RK={e:_T[2],t:_T[0],lv:_li+1,pr:_nx?Math.max(0,Math.min(100,(_h-_T[1])/(_nx[1]-_T[1])*100)):100};}catch(e){}pDef={e:$('pAv').textContent,t:$('pT').textContent,h:$('pH').textContent};profPaint();};
profPaint();
function pfPrev(){var n=$('pfN').value.trim(),a=$('pfA').value.trim(),bn=$('pfB').value.trim(),st=$('pfS').value,ds=dayStat();
 $('pvN').textContent=n||pDef.t;tagSet($('pvTg'),pfTag);$('pvS').textContent=st.trim()||pDef.h;setAv($('pvA'),a,pDef.e);
 $('pfC').textContent='Max 60 characters ('+st.length+'/60)';setBn($('pvBn'),bn);var bad=!!a&&!okAv(a),badB=!!bn&&!okAv(bn);$('pfAh').hidden=!bad;$('pfBh').hidden=!badB;
 $('pvC').textContent=RK.e+' '+RK.t+' · Lv '+RK.lv;$('pvB').style.width=RK.pr+'%';rpPaintPrev();rpSync();return!bad&&!badB;}
function pfOpen(){emShut();$('pfN').value=PF.name;$('pfA').value=PF.avatar;$('pfB').value=PF.banner;$('pfS').value=PF.status;rpStop();rpPos={b:pnorm(PF.bpos),a:pnorm(PF.apos)};$('pfscroll').scrollTop=0;pfTag=tgNorm(PF.tag);tgPaint();pfPrev();$('pfm').classList.add('on');setTimeout(function(){$('pfN').focus({preventScroll:true});},120);}
function pfClose(){rpStop();$('pfm').classList.remove('on');}
/* ===== v26: drag-to-reposition banner & avatar (saved as object-position %) ===== */
var rpPos={b:{x:50,y:50},a:{x:50,y:50}},rpOn='',rpDrag=null;
function pcl(v){return typeof v==='number'&&isFinite(v)?Math.max(0,Math.min(100,v)):50;}
function pnorm(p){return{x:pcl(p&&p.x),y:pcl(p&&p.y)};}
function posCss(p){return Math.round(p.x*10)/10+'% '+Math.round(p.y*10)/10+'%';}
function rpEl(w){return $(w==='b'?'pvBn':'pvA');}
function rpBtn(w){return $(w==='b'?'rpBb':'rpBa');}
function rpPaintPrev(){$('pvBn').style.setProperty('--pfop',posCss(rpPos.b));$('pvA').style.setProperty('--pfop',posCss(rpPos.a));}
function rpSync(){var hb=!$('pvBn').querySelector('img'),ha=!$('pvA').querySelector('img');$('rpBb').hidden=hb;$('rpBa').hidden=ha;if((rpOn==='b'&&hb)||(rpOn==='a'&&ha))rpStop();}
function rpStop(){rpDrag=null;['b','a'].forEach(function(w){rpEl(w).classList.remove('rp-on','drag');var b=rpBtn(w);b.classList.remove('on');b.setAttribute('aria-pressed','false');});rpOn='';$('rpH').hidden=true;}
function rpStart(w){rpStop();if(!rpEl(w).querySelector('img'))return;rpOn=w;rpEl(w).classList.add('rp-on');var b=rpBtn(w);b.classList.add('on');b.setAttribute('aria-pressed','true');$('rpT').textContent='Drag the '+(w==='b'?'banner':'avatar')+' to reposition, then tap ✅';$('rpH').hidden=false;}
['b','a'].forEach(function(w){
 rpBtn(w).addEventListener('click',function(e){e.stopPropagation();if(rpOn===w)rpStop();else rpStart(w);});
 rpBtn(w).addEventListener('keydown',function(e){if(rpOn!==w)return;var d={ArrowLeft:[3,0],ArrowRight:[-3,0],ArrowUp:[0,3],ArrowDown:[0,-3]}[e.key];if(!d)return;e.preventDefault();var p=rpPos[w];p.x=pcl(p.x+d[0]);p.y=pcl(p.y+d[1]);rpPaintPrev();});
 var el=rpEl(w);
 el.addEventListener('pointerdown',function(e){if(rpOn!==w||(e.button!==undefined&&e.button!==0))return;var im=el.querySelector('img');if(!im||!im.naturalWidth)return;
  var r=el.getBoundingClientRect(),sc=Math.max(r.width/im.naturalWidth,r.height/im.naturalHeight),ox=im.naturalWidth*sc-r.width,oy=im.naturalHeight*sc-r.height,p=rpPos[w];
  if(ox<=.5&&oy<=.5){$('rpT').textContent='This image already fits exactly, so there is nothing to move.';return;}
  rpDrag={w:w,x:e.clientX,y:e.clientY,px:p.x,py:p.y,ox:ox,oy:oy,id:e.pointerId};try{el.setPointerCapture(e.pointerId);}catch(_){}el.classList.add('drag');e.preventDefault();});
 el.addEventListener('pointermove',function(e){var d=rpDrag;if(!d||d.w!==w||e.pointerId!==d.id)return;var p=rpPos[w];if(d.ox>.5)p.x=pcl(d.px-(e.clientX-d.x)/d.ox*100);if(d.oy>.5)p.y=pcl(d.py-(e.clientY-d.y)/d.oy*100);rpPaintPrev();});
 function up(){if(rpDrag&&rpDrag.w===w){rpDrag=null;el.classList.remove('drag');}}
 el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
});
$('rpR').addEventListener('click',function(){if(!rpOn)return;rpPos[rpOn]={x:50,y:50};rpPaintPrev();});
$('pfA').addEventListener('input',function(){rpPos.a={x:50,y:50};rpPaintPrev();});
$('pfB').addEventListener('input',function(){rpPos.b={x:50,y:50};rpPaintPrev();});
['pfN','pfA','pfB','pfS'].forEach(function(i){$(i).addEventListener('input',pfPrev);$(i).addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();$('pfSave').click();}});});
$('pfSave').addEventListener('click',function(){if(!pfPrev()){var _a=$('pfA').value.trim();toast('Avatar / banner link must start with https://');(_a&&!okAv(_a)?$('pfA'):$('pfB')).focus();return;}
 PF={name:$('pfN').value.trim().slice(0,24),avatar:$('pfA').value.trim(),banner:$('pfB').value.trim(),status:$('pfS').value.trim().slice(0,60),bpos:pnorm(rpPos.b),apos:pnorm(rpPos.a),tag:tgNorm(pfTag)};lsSet(PFK,PF);profPaint();pfClose();toast('Profile updated');});
function tgEnsure(){if(!pfTag)pfTag={t:'',g:0,i:0};}
$('tgP').addEventListener('click',function(e){var b=e.target.closest('[data-p]');if(!b)return;var n=+b.dataset.p;pfTag=n<0?null:{t:TGP[n][0],g:TGP[n][1],i:TGP[n][2]};tgPaint();pfPrev();});
$('tgG').addEventListener('click',function(e){var b=e.target.closest('[data-g]');if(!b)return;tgEnsure();pfTag.g=+b.dataset.g;tgPaint(true);pfPrev();});
var EMG=[["Smileys & People",["😀","😃","😄","😁","😆","😅","😂","🤣","🥲","☺️","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠","😈","👿","👹","👺","🤡","💩","👻","💀","☠️","👽","👾","🤖","🎃","😺","😸","😹","😻","😼","😽","🙀","😿","😾"]],["Animals & Nature",["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐽","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞","🐜","🪰","🪲","🪳","🦟","🦗","🕷️","🕸️","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🦭","🐊","🐅","🐆","🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐕‍🦺","🐈","🐈‍⬛","🪶","🐓","🦃","🦤","🦚","🦜","🦢","🦩","🕊️","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿️","🦔","🐾","🐉","🐲","🌵","🎄","🌲","🌳","🌴","🪵","🌱","🌿","☘️","🍀","🎍","🪴","🎋","🍃","🍂","🍁","🍄","🐚","🪨","🌾","💐","🌷","🌹","🥀","🌺","🌸","🌼","🌻","🌞","🌝","🌛","🌜","🌚","🌕","🌖","🌗","🌘","🌑","🌒","🌓","🌔","🌙","🌎","🌍","🌏","🪐","💫","⭐️","🌟","✨","⚡️","☄️","💥","🔥","🌪️","🌈","☀️","🌤️","⛅️","🌥️","☁️","🌦️","🌧️","⛈️","🌩️","🌨️","❄️","☃️","⛄️","🌬️","💨","💧","💦","☔️","☂️","🌊","🌫️"]],["Places & Buildings",["🏔️","⛰️","🌋","🗻","🏕️","🏖️","🏜️","🏝️","🏞️","🏟️","🏛️","🏗️","🧱","🪨","🪵","🛖","🏘️","🏚️","🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏪","🏫","🏬","🏭","🏯","🏰","💒","🗼","🗽","⛪️","🕌","🛕","🕍","⛩️","🕋","⛲️","⛺️","🌁","🌃","🏙️","🌄","🌅","🌆","🌇","🌉","♨️","🎠","🎡","🎢","💈","🎪","🗿","🗺️","🧭"]],["Activities & Sports",["⚽️","🏀","🏈","⚾️","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍","🏏","🪃","🥅","⛳️","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷","⛸️","🥌","🎿","⛷️","🏂","🪂","🏋️‍♀️","🏋️‍♂️","🤼‍♀️","🤼‍♂️","🤸‍♀️","🤸‍♂️","⛹️‍♀️","⛹️‍♂️","🤺","🤾‍♀","🤾‍♂️","🏌️‍♀️","🏌️‍♂️","🏇","🧘‍♀️","🧘‍♂️","🏄‍♀️","🏄‍♂️","🏊‍♀️","🏊‍♂️","🤽‍♀️","🤽‍♂️","🚣‍♀️","🚣‍♂️","🧗‍♀️","🧗‍♂️","🚵‍♀️","🚵‍♂️","🚴‍♀️","🚴‍♂️","🏆","🥇","🥈","🥉","🏅","🎖️","🏵️","🎗️","🎫","🎟️","🎪","🤹‍♀️","🤹‍♂️","🎭","🩰","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🪘","🎷","🎺","🪗","🎸","🪕","🎻","🎲","♟️","🎯","🎳","🎮","🎰","🧩"]],["Objects & Tech",["⌚️","📱","📲","💻","⌨️","🖥️","🖨️","🖱️","🖲️","🕹️","🗜️","💽","💾","💿","📀","📼","📷","📸","📹","🎥","📽️","🎞️","📞","☎️","📟","📠","📺","📻","🎙️","🎚️","🎛️","🧭","⏱️","⏲️","⏰","🕰️","⌛️","⏳","📡","🔋","🔌","💡","🔦","🕯️","🪔","🧯","🛢️","💸","💵","💴","💶","💷","🪙","💰","💳","💎","⚖️","🪜","🧰","🪛","🔧","🔨","⚒️","🛠️","⛏️","🪚","🔩","⚙️","🪤","🧱","⛓️","🧲","🔫","💣","🧨","🪓","🔪","🗡️","⚔️","🛡️","🚬","⚰️","🪦","⚱️","🏺","🔮","📿","🧿","💈","⚗️","🔭","🔬","🕳️","🩹","🩺","💊","💉","🩸","🧬","🦠","🧫","🧪","🌡️","🧹","🪠","🧺","🧻","🚽","🚰","🚿","🛁","🛀","🧼","🪥","🪒","🧽","🪣","🧴","🛎️","🔑","🗝️","🚪","🪑","🛋️","🛏️","🛌","🧸","🪆","🖼️","🪞","🪟","🛍️","🛒","🎁","🎈","🎏","🎀","🪄","🪅","🎊","🎉","🎎","🏮","🎐","🧧","✉️","📩","📨","📧","💌","📥","📤","📦","🏷️","🪧","📪","📫","📬","📭","📮","📯","📜","📃","📄","📑","🧾","📊","📈","📉","🗒️","🗓️","📆","📅","🗑️","📇","🗃️","🗳️","🗄️","📋","📁","📂","🗂️","🗞️","📰","📓","📔","📒","📕","📗","📘","📙","📚","📖","🔖","🧷","🔗","📎","🖇️","📐","📏","🧮","📌","📍","✂️","🖊️","🖋️","✒️","🖌️","🖍️","📝","✏️","🔍","🔎","🔏","🔐","🔒","🔓"]],["Symbols & Math",["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🕎","☯️","☦️","🛐","⛎","♈️","♉️","♊️","♋️","♌️","♍","♎️","♏️","♐️","♑️","♒️","♓️","🆔","⚛️","🉑","☢️","☣️","📴","📳","🈶","🈚️","🈸","🈺","🈷️","✴️","🆚","💮","🉐","㊙️","㊗️","🈴","🈵","🈹","🈲","🅰️","🅱️","🆎","🆑","🅾️","🆘","❌","⭕️","🛑","⛔️","📛","🚫","💯","💢","♨️","🚷","🚯","🚳","🚱","🔞","📵","🚭","❗️","❕","❓","❔","‼️","⁉️","🔅","🔆","〽️","⚠️","🚸","🔱","⚜️","🔰","♻️","✅","🈯️","💹","❇️","✳️","❎","🌐","💠","Ⓜ️","🌀","💤","🏧","🚾","♿️","🅿️","🛗","🈳","🈂️","🛂","🛃","🛄","🛅","🚹","🚺","🚼","⚧️","🚻","🚮","🎦","📶","🈁","🔣","ℹ️","🔤","🔡","🔠","🆖","🆗","🆙","🆒","🆕","🆓","0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟","🔢","#️⃣","*️⃣","⏏️","▶️","⏸️","⏯️","⏹️","⏺️","⏭️","⏮️","⏩","⏪","⏫","⏬","◀️","🔼","🔽","➡️","⬅️","⬆️","⬇️","↗️","↘️","↙️","↖️","↕️","↔️","↪️","↩️","⤴️","⤵️","🔀","🔁","🔂","🔄","🔃","🎵","🎶","➕","➖","➗","💱","💲","⚕️","☑️","✔️","➰","➿","©️","®️","™️"]]],EMK='pf-tag-emoji';
function emRec(){var r=lsGet(EMK,[]);return Array.isArray(r)?r.filter(function(x){return typeof x==='string'&&x;}).slice(0,10):[];}
function emPaint(){var r=emRec(),b=function(a){return a.map(function(x){return'<button type="button" data-e="'+esc(x)+'" aria-label="Emoji '+esc(x)+'">'+esc(x)+'</button>';}).join('');};
 var h=r.length?'<div class="tgeh">Recent</div><div class="tgeg">'+b(r)+'</div>':'';
 EMG.forEach(function(g){h+='<div class="tgeh">'+esc(g[0])+'</div><div class="tgeg">'+b(g[1])+'</div>';});
 $('tgE').innerHTML=h;}
function emPos(){var E=$('tgE'),m=S.querySelector('#tgI [data-em]');if(E.hidden||!m)return;var r=m.getBoundingClientRect(),w=Math.min(350,window.innerWidth-16);
 E.style.width=w+'px';var l=Math.max(8,Math.min(r.right-w,window.innerWidth-w-8));E.style.left=l+'px';
 var room=r.top-16;E.style.maxHeight=Math.max(160,Math.min(300,room))+'px';E.style.bottom=(window.innerHeight-r.top+8)+'px';E.style.top='auto';}
function emShut(){var E=$('tgE');if(!E.hidden){E.hidden=true;var m=S.querySelector('#tgI [data-em]');if(m)m.setAttribute('aria-expanded','false');}}
window.addEventListener('resize',emPos);S.addEventListener('scroll',function(e){if(e.target!==$('tgE'))emShut();},true);
S.addEventListener('mousedown',function(e){var E=$('tgE');if(E.hidden)return;if(E.contains(e.target)||e.target.closest('[data-em]'))return;emShut();},true);
S.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('tgE').hidden){e.stopPropagation();emShut();}},true);
$('tgI').addEventListener('click',function(e){var m=e.target.closest('[data-em]');if(m){var E=$('tgE');E.hidden=!E.hidden;if(!E.hidden){emPaint();emPos();E.scrollTop=0;}m.setAttribute('aria-expanded',String(!E.hidden));return;}
 var b=e.target.closest('[data-i]');if(!b)return;tgEnsure();pfTag.i=+b.dataset.i;pfTag.e='';tgPaint(true);pfPrev();});
$('tgE').addEventListener('click',function(e){var b=e.target.closest('[data-e]');if(!b)return;var em=b.dataset.e;tgEnsure();pfTag.e=em;
 var r=emRec().filter(function(x){return x!==em;});r.unshift(em);lsSet(EMK,r.slice(0,10));emShut();tgPaint(true);pfPrev();});
$('pfTt').addEventListener('input',function(){if(!pfTag)pfTag={t:'',g:0,i:0};pfTag.t=this.value.slice(0,10);tgPaint(true);pfPrev();});
$('pfTt').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();$('pfSave').click();}});
$('pfCancel').addEventListener('click',pfClose);$('pfX').addEventListener('click',pfClose);bdClose($('pfm'),pfClose);

/* ===== Share card: front = profile + today's tasks, back = subject-wise hours; exports a PNG ===== */
var shSide='f',shData=null,shBusy=false,shFocus=null,SHC=null,SHF='Poppins, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',SG1='#ff8f3a',SG2='#d946ef';
var SHI={clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4.2l2.6 1.6M9.5 2.8h5"/></svg>',
 done:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12.4l2.7 2.7L16 9.6"/></svg>',
 book:'<svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 5v16"/></svg>',
 tick:'<svg viewBox="0 0 16 16" fill="none" stroke="#1a0e04" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.6l3 3L12.5 5"/></svg>'};
function shHM(ms){var m=Math.round(ms/6e4);if(m<=0)return'0m';return m<60?m+'m':(m%60?Math.floor(m/60)+'h '+(m%60)+'m':Math.floor(m/60)+'h');}
function shParts(ms){var m=Math.round(ms/6e4),hh=Math.floor(m/60),mm=m%60,o=[];if(hh>0)o.push([String(hh),'h']);if(mm>0||!hh)o.push([String(mm),'m']);return o;}
function shColor(n){return getComputedStyle(RT).getPropertyValue(n).trim();}
function shCtx(){if(!SHC)SHC=document.createElement('canvas').getContext('2d');return SHC;}
function shClip(c,s,w){s=String(s);if(c.measureText(s).width<=w)return s;while(s.length>1&&c.measureText(s+'…').width>w)s=s.slice(0,-1);return s+'…';}
function shWrap(c,s,w,max){var words=String(s).split(/\s+/),lines=[],cur='';words.forEach(function(wd){var t=cur?cur+' '+wd:wd;if(c.measureText(t).width>w&&cur){lines.push(cur);cur=wd;}else cur=t;});if(cur)lines.push(cur);
 if(lines.length>max){lines=lines.slice(0,max);lines[max-1]=lines[max-1]+'…';}return lines.map(function(l){return shClip(c,l,w);});}
function shCollect(){
 var tl=L(),dayS=dayStart(tl),dayE=dayEnd(tl);
 var list=tasks.filter(function(t){return(t.due===tl&&!inInbox(t))||(t.done&&t.doneAt>=dayS&&t.doneAt<dayE);});
 list.sort(function(a,b){return(a.done===b.done?0:a.done?1:-1);});
 var done=list.filter(function(t){return t.done;}).length;
 var sl=slices().filter(function(x){return x.d===tl;}),tot=0,by={};
 sl.forEach(function(x){tot+=x.ms;by[x.k]=(by[x.k]||0)+x.ms;});
 var rows=Object.keys(by).map(function(k){return{k:k,n:k?(sub(k)?sub(k).n:'General'):'General',c:kc(k),ms:by[k]};}).sort(function(a,b){return b.ms-a.ms;});
 var ses=sess.filter(function(s){return logicalKey(+s.s)===tl;}),best=0;ses.forEach(function(s){best=Math.max(best,Math.min(+s.ms||0,1728e5));});
 var li=lvl(totalMs()),T=TIERS[li],d=new Date(tl+'T00:00');
 var dm={};slices().forEach(function(x){(dm[x.d]=dm[x.d]||{t:0}).t+=x.ms;});
 var sr=studyStreak(dm),wk=[];for(var q=6;q>=0;q--){var k=L(addD(new Date(tl+'T00:00'),-q));wk.push(!!(dm[k]&&dm[k].t));}
 return{tag:tgNorm(PF.tag),stk:sr.cur,stkBest:sr.best,wk:wk,name:PF.name||'Student',bio:PF.status||'',avatar:okAv(PF.avatar)?PF.avatar:'',banner:okAv(PF.banner)?PF.banner:'',apos:posCss(pnorm(PF.apos)),bpos:posCss(pnorm(PF.bpos)),
  emoji:T[2],rank:T[0],lv:li+1,tasks:list,done:done,total:list.length,pct:list.length?Math.round(done/list.length*100):0,
  ms:tot,rows:rows,sessions:ses.length,best:best,date:fmtD(d),dateY:fmtD(d)+' '+d.getFullYear()};
}
/* ---- shared layout maths (live card + PNG use the same metrics) ---- */
var TG=11,LH=17,SBH=19,MH=15,SBMAX=3;
function shFit(c,tasks,avail,w){var r,k;for(k=40;k>=1;k--){r=shFit0(c,tasks,avail,w,k);if(!r.hidden)return r;}return shFit0(c,tasks,avail,w,3);}
function shFit0(c,tasks,avail,w,mx){
 var out=[],y=0,n=tasks.length;c.font='700 13px '+SHF;
 for(var i=0;i<n;i++){
  var t=tasks[i],tl=shWrap(c,t.text,w,2),sb=t.sub||[],res=avail-(i===n-1?0:MH+TG),gap=out.length?TG:0,pl=null;
  for(var s=Math.min(sb.length,mx);s>=0;s--){
   var hh=tl.length*LH+(s?6+s*SBH+(sb.length>s?MH:0):0);
   if(y+gap+hh<=res){pl={t:t,lines:tl,s:s,h:hh};break;}
  }
  if(!pl)break;y+=gap+pl.h;out.push(pl);
 }
 return{items:out,hidden:n-out.length};
}
function shFitRows(n,avail){var m=n;while(m>0){var cap=m*34+(m-1)*6+(m<n?6+MH:0);if(cap<=avail)break;m--;}return m;}
function shTaskHtml(it){
 var sb=it.t.sub||[],h='<div class="shtk'+(it.t.done?' done':'')+'"><span class="shc">'+(it.t.done?SHI.tick:'')+'</span><div class="shtx"><div class="shtt">'+esc(it.t.text)+'</div>';
 if(it.s){h+='<div class="shsl">'+sb.slice(0,it.s).map(function(x){return'<div class="shsb'+(x.done?' done':'')+'"><span class="shc">'+(x.done?SHI.tick:'')+'</span><span class="t">'+esc(x.text)+'</span></div>';}).join('');
  if(sb.length>it.s)h+='<div class="shmore">+'+(sb.length-it.s)+' more</div>';h+='</div>';}
 return h+'</div></div>';
}
function shFlame(z){return'<svg class="shfl'+(z?' z':'')+'" viewBox="0 0 24 24" aria-hidden="true"><path fill="url(#shFlG)" stroke="none" d="M12 1.8c.6 3-.7 4.7-2.6 6.7C7.6 10.4 6.4 12.4 6.4 15a5.6 5.6 0 0 0 11.2 0c0-2.3-.9-4-2.1-5.4-.3 1.4-.9 2.3-1.9 2.8.6-3.7 0-7.8-1.6-10.6z"/><path class="i" fill="url(#shFlI)" stroke="none" d="M12 21.4a3.1 3.1 0 0 0 3.1-3.2c0-1.7-1.1-2.7-2-3.9-.5.9-1 1.3-1.7 1.5.2-1.3-.1-2.4-.8-3.5-.3 1.4-1.7 2.4-1.7 4.6a3.1 3.1 0 0 0 3.1 3.5z"/></svg>';}
function shStkPill(d){return'<div class="shstk'+(d.stk?'':' z')+'"><svg viewBox="0 0 24 24"><path d="'+FLP+'"/></svg>'+d.stk+' DAY STREAK</div>';}
function shStkTile(d){return'<div class="bkst"><span class="fi"><svg viewBox="0 0 24 24"><path d="'+FLP+'"/></svg></span><div class="tx"><b>'+d.stk+' day streak</b><small>Best '+d.stkBest+(d.stkBest===1?' day':' days')+'</small></div><div class="wk">'+d.wk.map(function(o){return'<i'+(o?' class="on"':'')+'></i>';}).join('')+'</div></div>';}
function shAvHtml(d){return d.avatar?'<img alt="" referrerpolicy="no-referrer" src="'+esc(d.avatar)+'">':esc(d.emoji);}
function shPaint(){
 var d=shData=shCollect(),F=$('shFront'),B=$('shBack'),bn=d.banner?'<img alt="" referrerpolicy="no-referrer" src="'+esc(d.banner)+'" onerror="this.remove()">':'';
 F.innerHTML='<div class="shbn" style="--pfop:'+d.bpos+'">'+bn+'</div><div class="shdate">'+esc(d.dateY)+'</div>'
  +'<div class="shbody dw'+(d.banner?' hb':'')+'"><div class="dwid"><div class="shav" style="--pfop:'+d.apos+'"><div class="in">'+shAvHtml(d)+'</div></div><div class="dwn"><div class="shnm"><span class="n">'+esc(d.name)+'</span>'+(d.tag?tagHtml(d.tag):'')+'</div>'+(d.bio?'<div class="shbio">'+esc(d.bio)+'</div>':'')+'</div></div>'
  +'<div class="dwcard"><div><div class="dwlb">Daily completion</div><div class="dwbig"><b>'+d.done+'</b><span>/'+d.total+' tasks</span></div></div><div class="dwr" role="img" aria-label="'+d.pct+' percent"><svg viewBox="0 0 64 64"><defs><linearGradient id="dwg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5eead4"/><stop offset="1" stop-color="#ffb25e"/></linearGradient></defs><circle class="tr" cx="32" cy="32" r="27"/>'+(d.pct?'<circle class="fl" cx="32" cy="32" r="27" stroke-dasharray="'+(d.pct*1.6965).toFixed(1)+' 169.7"/>':'')+'</svg><b>'+d.pct+'<small>%</small></b></div></div>'
  +'<div class="shchips"><span class="shchip rk">'+esc(d.emoji)+' '+esc(d.rank)+'</span><span class="shchip tm">'+SHI.clock+shHM(d.ms)+'</span><span class="shchip sk'+(d.stk?'':' z')+'">'+shFlame(!d.stk)+d.stk+'</span></div>'
  +'<div class="shtl" id="shTl"></div></div>';
 var tl=$('shTl'),r=shFit(shCtx(),d.tasks,tl.clientHeight-28,300);
 tl.innerHTML=r.items.length||r.hidden?r.items.map(shTaskHtml).join('')+(r.hidden>0?'<div class="shmore">+'+r.hidden+' more task'+(r.hidden>1?'s':'')+'</div>':''):'<div class="shnone">No tasks planned today</div>';
 /* back */
 var mx=d.rows.length?d.rows[0].ms:1;
 B.innerHTML='<div class="bkh"><div class="shav" style="--pfop:'+d.apos+'"><div class="in">'+shAvHtml(d)+'</div></div><div class="nm">'+esc(d.name)+'</div><div class="shdate">'+esc(d.date)+'</div></div>'
  +'<div class="bkhero"><div class="shtm">'+shParts(d.ms).map(function(p){return'<span><b>'+p[0]+'</b><i>'+p[1]+'</i></span>';}).join('')+'</div><div class="bklb">Total focus today</div><div class="bkbar"></div></div>'
  +'<div class="bk3"><div class="sk'+(d.stk?'':' z')+'"><b>'+shFlame(!d.stk)+d.stk+'</b><small>Streak</small></div><div><b>'+d.done+'/'+d.total+'</b><small>Tasks</small></div><div><b>'+d.sessions+'</b><small>Sessions</small></div></div>'
  +'<div class="bksh">'+SHI.book+'By subject</div><div class="shsubs" id="shSubs"></div>';
 var sb=$('shSubs'),m=shFitRows(d.rows.length,sb.clientHeight);
 sb.innerHTML=d.rows.length?d.rows.slice(0,m).map(function(r){return'<div class="shsr"><div class="shrw"><i style="background:'+r.c+'"></i><span>'+esc(r.n)+'</span><em>'+shHM(r.ms)+'</em><u>'+Math.round(r.ms/d.ms*100)+'%</u></div><div class="shbr"><s style="background:'+r.c+';width:'+Math.max(4,Math.round(r.ms/mx*100))+'%"></s></div></div>';}).join('')+(m<d.rows.length?'<div class="shmore">+'+(d.rows.length-m)+' more</div>':''):'<div class="shnone">No focus logged today</div>';
 requestAnimationFrame(function(){requestAnimationFrame(function(){var p=$('shPb');if(p)p.style.width=d.pct+'%';});});
}
function shScale(){var s=Math.min(1,(window.innerHeight-130)/640,(window.innerWidth-24)/360);if(!(s>.3))s=.3;$('shm').style.setProperty('--shs',s.toFixed(4));}
function shSet(side,now){var f=$('shFlip');shSide=side;if(now)f.classList.add('nt');f.classList.toggle('flip',side==='b');if(now){void f.offsetWidth;f.classList.remove('nt');}}
async function shOpen(){
 shFocus=S.activeElement||document.activeElement;shScale();
 try{await Promise.race([Promise.all(['500','600','700','800'].map(function(w){return document.fonts.load(w+' 14px Poppins');})),new Promise(function(r){setTimeout(r,900);})]);}catch(e){}
 shPaint();shSet('f',true);$('shm').classList.add('on');window.addEventListener('resize',shScale);
 setTimeout(function(){$('shFlip').focus({preventScroll:true});},120);
}
function shClose(){$('shm').classList.remove('on');window.removeEventListener('resize',shScale);if(shFocus&&shFocus.focus)try{shFocus.focus({preventScroll:true});}catch(e){}}
$('shBtn').addEventListener('click',shOpen);
$('shFlip').addEventListener('click',function(){shSet(shSide==='f'?'b':'f');});
$('shFlip').addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();shSet(shSide==='f'?'b':'f');}});
bdClose($('shm'),shClose);
S.addEventListener('keydown',function(e){if(e.key==='Escape'&&$('shm').classList.contains('on')){e.stopPropagation();shClose();}},true);

/* ---- mock test share card (Mocks > Test History) ---- */
function mkShScale(){var s=Math.min(1,(window.innerHeight-130)/640,(window.innerWidth-24)/360);if(!(s>.3))s=.3;$('mkShm').style.setProperty('--shs',s.toFixed(4));}
var mkBusy=0,mkFocus=null,mkSide='f';
function mkShClose(){$('mkShm').classList.remove('on');window.removeEventListener('resize',mkShScale);if(mkFocus&&mkFocus.focus)try{mkFocus.focus({preventScroll:true});}catch(e){}}
function mkSet(side,now){var f=$('mkShFlip');mkSide=side;if(now)f.classList.add('nt');f.classList.toggle('flip',side==='b');if(now){void f.offsetWidth;f.classList.remove('nt');}}
function mkConf(){var cl=['#c6ff3d','#fff1d6','#ffc247','#ff4fa3','#8fdcff'],h='<div class="mkcf" aria-hidden="true">';for(var k=0;k<30;k++)h+='<i style="--x:'+(Math.random()*100).toFixed(1)+'%;--dx:'+((Math.random()-.5)*90).toFixed(0)+'px;--r:'+((Math.random()-.5)*900).toFixed(0)+'deg;--d:'+(Math.random()*.7).toFixed(2)+'s;--c:'+cl[k%5]+'"></i>';return h+'</div>';}
function mkCount(){var el=$('mkShFront').querySelector('.mkbig b');if(!el||matchMedia('(prefers-reduced-motion:reduce)').matches)return;var v=+el.textContent,t0=performance.now();(function f(n){var q=Math.min(1,(n-t0)/900),e=1-Math.pow(1-q,3);el.textContent=Math.round(v*e);if(q<1)requestAnimationFrame(f);})(t0);}
async function mkShOpen(id){if(mkBusy)return;var c=window.MKAPI&&MKAPI.card(id);if(!c)return;mkBusy=1;
 try{mkFocus=S.activeElement||document.activeElement;mkShScale();
  try{await Promise.race([Promise.all(['500','600','700','800'].map(function(w){return document.fonts.load(w+' 14px Poppins');})),new Promise(function(r){setTimeout(r,900);})]);}catch(e){}
  var d=shCollect(),bn=d.banner?'<img alt="" referrerpolicy="no-referrer" src="'+esc(d.banner)+'" onerror="this.remove()">':'',dt=esc(fmtD(c.date)+' '+c.date.getFullYear());
  $('mkShFront').innerHTML='<div class="shdate">'+dt+'</div><div class="shbody"><div class="mkid"><div class="shav" style="--pfop:'+d.apos+'"><div class="in">'+shAvHtml(d)+'</div></div><div class="shnm"><span class="n">'+esc(d.name)+'</span>'+(d.tag?tagHtml(d.tag):'')+'</div>'+'</div>'+c.html+'</div>'+(c.fx?mkConf():'')+'<div class="shhint">Tap to flip</div>';
  $('mkShBack').innerHTML='<div class="shdate">'+dt+'</div><div class="shbody">'+c.back+'</div><div class="shhint">Tap to flip back</div>';
  mkSet('f',true);$('mkShm').classList.add('on');window.addEventListener('resize',mkShScale);mkCount();
  setTimeout(function(){$('mkShFlip').focus({preventScroll:true});},120);
 }finally{mkBusy=0;}}
window.mkShOpen=mkShOpen;
$('mkShFlip').addEventListener('click',function(){mkSet(mkSide==='f'?'b':'f');});
$('mkShFlip').addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();mkSet(mkSide==='f'?'b':'f');}});
bdClose($('mkShm'),mkShClose);
S.addEventListener('keydown',function(e){if(e.key==='Escape'&&$('mkShm').classList.contains('on')){e.stopPropagation();mkShClose();}},true);

/* ---- PNG export (canvas, logical 360x640 scaled x3) ---- */
function shImg(u){return new Promise(function(res){if(!u)return res(null);var im=new Image();im.crossOrigin='anonymous';im.referrerPolicy='no-referrer';im.onload=function(){res(im);};im.onerror=function(){res(null);};im.src=u;setTimeout(function(){res(null);},6000);});}
function shRR(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function shCover(c,im,x,y,w,h,pos){var sc=Math.max(w/im.naturalWidth,h/im.naturalHeight),iw=im.naturalWidth*sc,ih=im.naturalHeight*sc,pp=pos.split(' '),px=parseFloat(pp[0])/100,py=parseFloat(pp[1])/100;
 c.drawImage(im,x-(iw-w)*(isNaN(px)?.5:px),y-(ih-h)*(isNaN(py)?.5:py),iw,ih);}
async function shRender(side){
 var d=shData||shCollect(),K=3,cv=document.createElement('canvas');cv.width=1080;cv.height=1920;var c=cv.getContext('2d');c.scale(K,K);
 var acc=shColor('--acc')||'#ff9f0a',acc2=shColor('--acc2')||'#ffc247',ar=shColor('--ar')||'255,159,10',ink='#f5f5f7',mut='#98989d',dim='#636366',BG='#131315';
 try{await Promise.all(['500','600','700','800'].map(function(w){return document.fonts.load(w+' 20px Poppins');}));}catch(e){}
 var imgs=await Promise.all([side==='f'?shImg(d.banner):null,shImg(d.avatar)]),tainted=(side==='f'&&d.banner&&!imgs[0])||(d.avatar&&!imgs[1]);
 /* base */
 c.fillStyle=BG;c.fillRect(0,0,360,640);
 var g1=c.createRadialGradient(360,640,0,360,640,300);g1.addColorStop(0,'rgba(217,70,239,.08)');g1.addColorStop(1,'rgba(217,70,239,0)');c.fillStyle=g1;c.fillRect(0,0,360,640);
 var g2=c.createRadialGradient(0,352,0,0,352,280);g2.addColorStop(0,'rgba('+ar+',.07)');g2.addColorStop(1,'rgba('+ar+',0)');c.fillStyle=g2;c.fillRect(0,0,360,640);c.translate(1,1);
 function T(s,x,y,font,col,al,sp){c.font=font;c.fillStyle=col;c.textBaseline='middle';
  if(!sp){c.textAlign=al||'left';c.fillText(s,x,y);return c.measureText(s).width;}
  var w=0,i;for(i=0;i<s.length;i++)w+=c.measureText(s[i]).width+(i<s.length-1?sp:0);
  var sx=al==='center'?x-w/2:al==='right'?x-w:x;c.textAlign='left';for(i=0;i<s.length;i++){c.fillText(s[i],sx,y);sx+=c.measureText(s[i]).width+sp;}return w;}
 function TW(s,font,sp){c.font=font;if(!sp)return c.measureText(s).width;var w=0;for(var i=0;i<s.length;i++)w+=c.measureText(s[i]).width+(i<s.length-1?sp:0);return w;}
 function pill(x,y,w,h,fill,stroke){shRR(c,x,y,w,h,h/2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
 function circ(x,y,r,dn,lw){c.beginPath();c.arc(x,y,r,0,7);if(dn){c.fillStyle=acc;c.fill();c.strokeStyle='#1a0e04';c.lineWidth=r*.2;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(x-r*.42,y+r*.04);c.lineTo(x-r*.1,y+r*.38);c.lineTo(x+r*.46,y-r*.3);c.stroke();}else{c.strokeStyle=dim;c.lineWidth=lw;c.stroke();}}
 function avatar(cx,cy,r,ring,hole,shadow){
  if(shadow){c.beginPath();c.arc(cx,cy,r+5,0,7);c.fillStyle=BG;c.fill();}
  var g=c.createLinearGradient(cx-r,cy-r,cx+r,cy+r);g.addColorStop(0,acc2);g.addColorStop(.55,acc);g.addColorStop(1,SG2);c.beginPath();c.arc(cx,cy,r,0,7);c.fillStyle=g;c.fill();
  var ir=r-ring;c.save();c.beginPath();c.arc(cx,cy,ir,0,7);c.clip();c.fillStyle='#1d1d1f';c.fillRect(cx-ir,cy-ir,ir*2,ir*2);
  if(imgs[1])shCover(c,imgs[1],cx-ir,cy-ir,ir*2,ir*2,d.apos);else{c.font='500 '+(hole)+'px '+SHF;c.textAlign='center';c.textBaseline='middle';c.fillStyle=ink;c.fillText(d.emoji,cx,cy+1);}c.restore();}
 function ico(path,x,y,s,col,lw){c.save();c.translate(x,y);c.scale(s/24,s/24);c.strokeStyle=col;c.lineWidth=lw;c.lineCap='round';c.lineJoin='round';c.stroke(new Path2D(path));c.restore();}
 function datePill(x,y,right){var w=TW(d.date.toUpperCase(),'700 9.5px '+SHF,1.33)+22,px=right?x-w:x;pill(px,y,w,24,'rgba(0,0,0,.38)','rgba(255,255,255,.14)');T(d.date.toUpperCase(),px+w/2,y+12.5,'700 9.5px '+SHF,ink,'center',1.33);}
 function tagDraw(t,x,cy){var f='800 9.5px '+SHF,w=TW(t.t.toUpperCase(),f,.6)+7+12+5+10,g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,GR[t.g][0]);g.addColorStop(1,GR[t.g][1]);
  c.save();c.shadowColor=GR[t.g][1]+'88';c.shadowBlur=7;shRR(c,x,cy-10,w,20,10);c.fillStyle=g;c.fill();c.restore();ico(TGI[t.i],x+7,cy-6,12,'#fff',2.4);T(t.t.toUpperCase(),x+7+12+5,cy+.5,f,'#fff','left',.6);return w;}
 function stkDraw(){var s=d.stk+' DAY STREAK',f='800 9.5px '+SHF,w=TW(s,f,1.15)+9+12+5+11,x=342-w;c.save();c.globalAlpha=d.stk?1:.6;
  c.shadowColor='rgba('+ar+',.5)';c.shadowBlur=8;pill(x,16,w,24,'rgba('+ar+',.2)','rgba('+ar+',.5)');c.restore();c.globalAlpha=d.stk?1:.6;
  ico(FLP,x+9,22,12,acc2,2.2);T(s,x+9+12+5,28.5,f,acc2,'left',1.15);c.globalAlpha=1;}
 if(side==='f'){
  /* banner */
  c.save();c.beginPath();c.rect(0,0,360,140);c.clip();c.fillStyle='rgba('+ar+',.16)';c.fillRect(0,0,360,140);
  var bg=c.createRadialGradient(0,0,0,0,0,430);bg.addColorStop(0,'rgba('+ar+',.6)');bg.addColorStop(.68,'rgba('+ar+',0)');c.fillStyle=bg;c.fillRect(0,0,360,140);
  if(imgs[0])shCover(c,imgs[0],0,0,360,140,d.bpos);
  var fg=c.createLinearGradient(0,0,0,140);fg.addColorStop(0,'rgba(19,19,21,0)');fg.addColorStop(.45,'rgba(19,19,21,0)');fg.addColorStop(1,BG);c.fillStyle=fg;c.fillRect(0,0,360,140);c.restore();
  datePill(16,16,false);stkDraw();
  avatar(60,140,38,3,34,true);
  var y=190;c.font='800 24px '+SHF;var tgW=d.tag?TW(d.tag.t.toUpperCase(),'800 9.5px '+SHF,.6)+34+8:0,nmS=shClip(c,d.name,316-tgW);T(nmS,22,y+15.5,'800 24px '+SHF,ink);
  if(d.tag)tagDraw(d.tag,22+c.measureText(nmS).width+8,y+16.5);y+=30;
  if(d.bio){c.font='500 12.5px '+SHF;var bl=shWrap(c,d.bio,316,2);bl.forEach(function(l,i){T(l,22,y+3+8.5+i*17,'500 12.5px '+SHF,mut);});y+=3+bl.length*17;}
  y+=12;
  /* chips */
  var rt=d.emoji+' '+d.rank,rw=TW(rt,'700 11.5px '+SHF)+26;pill(22,y,rw,28,'rgba('+ar+',.13)','rgba('+ar+',.38)');T(rt,22+13,y+14.5,'700 11.5px '+SHF,acc2);
  var ht=shHM(d.ms),hx=22+rw+8,hw=TW(ht,'700 11.5px '+SHF)+11+13+6+13;pill(hx,y,hw,28,'rgba(255,255,255,.05)','rgba(255,255,255,.1)');
  ico('M19.5 13.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0zM12 9.5v4.2l2.6 1.6M9.5 2.8h5',hx+11,y+8.5,13,ink,2);
  T(ht,hx+11+13+6,y+14.5,'700 11.5px '+SHF,ink);
  y+=28+16;
  /* completion */
  ico('M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM8 12.4l2.7 2.7L16 9.6',22,y+2.5,15,acc,2);
  T('DAILY COMPLETION',22+23,y+10.5,'700 10px '+SHF,mut,'left',1.2);
  var pt=d.pct+'%',pw=TW(pt,'600 10.5px '+SHF)+18;pill(338-pw,y,pw,20,'rgba(255,255,255,.07)');T(pt,338-pw/2,y+10.5,'600 10.5px '+SHF,mut,'center');
  T(d.done+'/'+d.total,338-pw-8,y+10.5,'800 14px '+SHF,ink,'right');
  y+=20+9;shRR(c,22,y,316,8,4);c.fillStyle='rgba(255,255,255,.08)';c.fill();
  if(d.pct>0){var fw=Math.max(8,316*d.pct/100),gr=c.createLinearGradient(22,0,22+fw,0);gr.addColorStop(0,SG1);gr.addColorStop(1,SG2);c.save();c.shadowColor='rgba(217,70,239,.45)';c.shadowBlur=7;shRR(c,22,y,fw,8,4);c.fillStyle=gr;c.fill();c.restore();}
  y+=8+14;
  /* task panel */
  var PH=598-y;shRR(c,22.5,y+.5,315,PH-1,20);c.fillStyle='rgba(255,255,255,.035)';c.fill();c.strokeStyle='rgba(255,255,255,.06)';c.lineWidth=1;c.stroke();
  var ix0=39,iy0=y+1+14,r=shFit(c,d.tasks,PH-2-28,282),ty=iy0;
  if(!d.tasks.length)T('No tasks planned today',ix0,ty+8.5,'600 12px '+SHF,dim);
  r.items.forEach(function(it,n){
   if(n)ty+=TG;var tx=ix0+31;circ(ix0+10,ty+8.5,9.1,it.t.done,1.8);
   it.lines.forEach(function(l,j){T(l,tx,ty+8.5+j*LH,'700 13px '+SHF,it.t.done?dim:ink);if(it.t.done){c.font='700 13px '+SHF;c.fillStyle=dim;c.fillRect(tx,ty+8.5+j*LH,c.measureText(l).width,1.2);}});
   var sy=ty+it.lines.length*LH+6,sb=it.t.sub||[];
   if(it.s){sb.slice(0,it.s).forEach(function(x,j){var cy=sy+j*SBH+9.5;circ(tx+7,cy,6.3,x.done,1.5);c.font='600 12px '+SHF;var sl=shClip(c,x.text,282-31-22);T(sl,tx+22,cy,'600 12px '+SHF,x.done?dim:mut);if(x.done){c.fillStyle=dim;c.fillRect(tx+22,cy,c.measureText(sl).width,1.2);}});
    if(sb.length>it.s)T('+'+(sb.length-it.s)+' more',tx+22,sy+it.s*SBH+7.5,'600 11px '+SHF,dim);}
   ty+=it.h;});
  if(r.hidden>0)T('+'+r.hidden+' more task'+(r.hidden>1?'s':''),ix0+31,ty+(r.items.length?TG:0)+7.5,'600 11px '+SHF,dim);
 }else{
  avatar(22+15,22+15,15,2,15,false);
  datePill(338,25,true);
  c.font='700 13px '+SHF;var dw=TW(d.date.toUpperCase(),'700 9.5px '+SHF,1.33)+22;T(shClip(c,d.name,316-30-10-dw-10),22+30+10,37,'700 13px '+SHF,ink);
  /* hero */
  var hg=c.createRadialGradient(180,95,0,180,95,130);hg.addColorStop(0,'rgba('+ar+',.2)');hg.addColorStop(1,'rgba('+ar+',0)');c.fillStyle=hg;c.fillRect(50,20,260,170);
  var pr=shParts(d.ms),tw=0,i;pr.forEach(function(q,n){tw+=TW(q[0],'800 58px '+SHF,-2.3)+3+TW(q[1],'700 22px '+SHF)+(n?12:0);});
  var sx=180-tw/2;pr.forEach(function(q,n){if(n)sx+=12;var w1=T(q[0],sx,127,'800 58px '+SHF,ink,'left',-2.3);c.textBaseline='alphabetic';var wn=TW(q[0],'800 58px '+SHF,-2.3);sx+=wn+3;T(q[1],sx,127-1,'700 22px '+SHF,acc2,'left');sx+=TW(q[1],'700 22px '+SHF);});
  T('TOTAL FOCUS TODAY',180,152.5,'600 10.5px '+SHF,mut,'center',2.1);
  var bgr=c.createLinearGradient(158,0,202,0);bgr.addColorStop(0,SG1);bgr.addColorStop(1,SG2);shRR(c,158,173,44,3,1.5);c.fillStyle=bgr;c.fill();
  /* streak tile */
  shRR(c,22.5,198.5,315,55,16);var sg=c.createLinearGradient(22,0,338,0);sg.addColorStop(0,'rgba('+ar+',.14)');sg.addColorStop(1,'rgba(217,70,239,.06)');c.fillStyle='rgba(255,255,255,.03)';c.fill();c.fillStyle=sg;c.fill();c.strokeStyle='rgba('+ar+',.3)';c.lineWidth=1;c.stroke();
  var fg2=c.createLinearGradient(36,209,70,243);fg2.addColorStop(0,acc2);fg2.addColorStop(.55,acc);fg2.addColorStop(1,SG2);c.beginPath();c.arc(53,226,17,0,7);c.fillStyle=fg2;c.fill();ico(FLP,44,217,18,'#1a0e04',2);
  T(d.stk+' day streak',80,220,'800 16px '+SHF,ink);T('BEST '+d.stkBest+(d.stkBest===1?' DAY':' DAYS'),80,238.5,'600 9.5px '+SHF,dim,'left',.95);
  d.wk.forEach(function(o,n){var cx=236+n*14;c.beginPath();c.arc(cx,226,4.5,0,7);if(o){c.save();c.shadowColor='rgba('+ar+',.6)';c.shadowBlur=6;c.fillStyle=acc;c.fill();c.restore();}else{c.fillStyle='rgba(255,255,255,.1)';c.fill();}});
  /* tiles */
  var tiles=[[d.emoji+' '+d.rank,'RANK · LV '+d.lv],[d.done+'/'+d.total,'TASKS DONE'],[String(d.sessions),'SESSIONS'],[d.best?shHM(d.best):'—','LONGEST']];
  tiles.forEach(function(q,n){var x=22+(n%2)*162,y2=262+Math.floor(n/2)*64;shRR(c,x+.5,y2+.5,153,55,16);c.fillStyle='rgba(255,255,255,.04)';c.fill();c.strokeStyle='rgba(255,255,255,.08)';c.lineWidth=1;c.stroke();
   c.font='800 16px '+SHF;T(shClip(c,q[0],126),x+14,y2+22,'800 16px '+SHF,ink);T(q[1],x+14,y2+40.5,'600 9.5px '+SHF,dim,'left',.95);});
  /* subjects */
  var hy=404;ico('M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 5v16',22,hy,14,mut,2);
  T('BY SUBJECT',22+22,hy+7,'700 10.5px '+SHF,mut,'left',1.47);
  var ry=hy+14+12,avail=576-ry,m=shFitRows(d.rows.length,avail),mx=d.rows.length?d.rows[0].ms:1;
  if(!d.rows.length)T('No focus logged today',180,ry+16,'600 12px '+SHF,dim,'center');
  d.rows.slice(0,m).forEach(function(q,n){var y3=ry+n*40;c.beginPath();c.arc(27,y3+9,5,0,7);c.fillStyle=q.c;c.fill();
   var pc=Math.round(q.ms/d.ms*100)+'%';T(pc,338,y3+9,'600 11px '+SHF,mut,'right');var tmw=T(shHM(q.ms),338-36-9,y3+9,'800 13px '+SHF,ink,'right');
   c.font='700 13px '+SHF;T(shClip(c,q.n,316-20-tmw-36-18),42,y3+9,'700 13px '+SHF,ink);
   shRR(c,22,y3+27,316,6,3);c.fillStyle='rgba(255,255,255,.07)';c.fill();shRR(c,22,y3+27,Math.max(6,316*q.ms/mx),6,3);c.fillStyle=q.c;c.fill();});
  if(m<d.rows.length)T('+'+(d.rows.length-m)+' more',22,ry+m*40+7.5,'600 11px '+SHF,dim);
 }
 T('STUDY LAB · '+d.dateY.toUpperCase(),180,626,'600 8.5px '+SHF,dim,'center',1.1);
 /* rounded card edge */
 c.setTransform(K,0,0,K,0,0);c.globalCompositeOperation='destination-in';shRR(c,0,0,360,640,30);c.fillStyle='#000';c.fill();c.globalCompositeOperation='source-over';
 return{canvas:cv,tainted:tainted};
}

var _dk=L();function dayCheck(){var k=L();if(k!==_dk){_dk=k;refresh();fillLink();tRender();anR();}if(cfg.classList.contains('on'))cfgPaint();cdPaint();fPaint();}
armRoll();setInterval(dayCheck,3e4);document.addEventListener('visibilitychange',function(){if(!document.hidden)dayCheck();});
})();

/* ===== script (3 of 3) ===== */
(function(){
var KW='<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#7a5a3a"/><circle cx="16" cy="16" r="12.3" fill="#8bc34a"/><circle cx="16" cy="16" r="9.5" fill="#6faa2f"/><circle cx="16" cy="16" r="4.2" fill="#f4f0c8"/><g fill="#1b1b12"><ellipse cx="16" cy="8.6" rx=".9" ry="1.5"/><ellipse cx="16" cy="23.4" rx=".9" ry="1.5"/><ellipse cx="8.6" cy="16" rx="1.5" ry=".9"/><ellipse cx="23.4" cy="16" rx="1.5" ry=".9"/><ellipse cx="10.8" cy="10.8" rx=".9" ry="1.5" transform="rotate(-45 10.8 10.8)"/><ellipse cx="21.2" cy="21.2" rx=".9" ry="1.5" transform="rotate(-45 21.2 21.2)"/><ellipse cx="21.2" cy="10.8" rx=".9" ry="1.5" transform="rotate(45 21.2 10.8)"/><ellipse cx="10.8" cy="21.2" rx=".9" ry="1.5" transform="rotate(45 10.8 21.2)"/></g></svg>',CK='kiwi-cfg',HK='kiwi-hist',MODEL='gemini-2.5-flash',$=function(i){return document.getElementById(i)};
function lj(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}}
function sj(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function saveCfg(){sj(CK,cfg);$('kwB').style.display=cfg.on?'':'none';if(!cfg.on)$('kwP').classList.remove('on')}
function iso(d){var x=new Date();x.setDate(x.getDate()+d);return x.getFullYear()+'-'+('0'+(x.getMonth()+1)).slice(-2)+'-'+('0'+x.getDate()).slice(-2)}
var IC={cal:'<rect x="3" y="4.5" width="18" height="17" rx="3"/><path d="M8 2.5v4M16 2.5v4M3 10h18M9 15.5l2 2 4-4"/>',tg:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',fire:'<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4.2.3 1.2 1 2 1.8 2.2C10.5 9 11 6 12 3z"/>',ar:'<path d="M5 12h14M13 6l6 6-6 6"/>',hist:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2"/>',plus:'<path d="M12 5v14M5 12h14"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',fs:'<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',cl:'<path d="M21.4 11.6l-9 9a5.5 5.5 0 0 1-7.8-7.8l9-9a3.7 3.7 0 0 1 5.2 5.2l-9 9a1.8 1.8 0 0 1-2.6-2.6l8.5-8.5"/>',sd:'<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>'};
function ic(n){return'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+IC[n]+'</svg>'}
/* ---------- settings form (shared) ---------- */
function cfgHTML(){var st=stOf();
return'<div class="kwCf"><div class="row"><div><b>Enable KIWI</b><small>Personalized study advice, analysis and planning.</small></div><span class="kwT"><input type="checkbox" id="kwOn"'+(cfg.on?' checked':'')+'><i></i></span></div>'+
'<label class="kwLb">GEMINI API KEY<span class="kwStt '+st[0]+'" id="kwSt">'+st[1]+'</span></label><input type="password" id="kwK" placeholder="AIza..." autocomplete="new-password" spellcheck="false" value="'+esc(cfg.key||'')+'"><div class="h"><a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Get a key</a> · Stays on this device and is sent only to Google Gemini.</div>'+
'<label>CUSTOM INSTRUCTIONS / ABOUT ME</label><textarea id="kwAb" placeholder="I\'m a dropper targeting JEE 2027. Be strict if I miss my daily targets...">'+esc(cfg.about)+'</textarea><div class="h">Extra context / behaviour for KIWI. Sent with every message.</div>'+
'<div class="kwAc"><button type="button" class="kwBt" id="kwTs">Test Connection</button><button type="button" class="kwBt pri" id="kwSv">Save</button><button type="button" class="kwBt dng" id="kwKr">Remove Key</button></div><div class="kwRs" id="kwRs" role="status" aria-live="polite"></div></div>'}
function keySync(r){var e=r&&r.querySelector('#kwSt');if(e){var t=stOf();e.className='kwStt '+t[0];e.textContent=t[1]}if(built&&$('kwH')){head();var w=document.querySelector('#kwP .kwNote');if(w&&ak())w.remove()}}
function bindCfg(r){var g=function(i){return r.querySelector('#'+i)},rs=g('kwRs'),tm=0,say=function(t,c){rs.textContent=t;rs.className='kwRs '+(c||'');clearTimeout(tm);if(c==='ok')tm=setTimeout(function(){if(rs.textContent===t){rs.textContent='';rs.className='kwRs'}},3500)};
g('kwOn').onchange=function(){cfg.on=this.checked;saveCfg()};
g('kwK').oninput=function(){cfg.key=this.value.trim();saveCfg();keySync(r);say('')};
g('kwAb').oninput=function(){cfg.about=this.value;saveCfg()};
g('kwSv').onclick=function(){cfg.key=g('kwK').value.trim();cfg.about=g('kwAb').value;saveCfg();keySync(r);say(cfg.key?'Saved ✅':'Saved. Add your Gemini API key to start.',cfg.key?'ok':'')};
g('kwKr').onclick=function(){cfg.key='';g('kwK').value='';saveCfg();keySync(r);say('Key removed.','ok')};
g('kwTs').onclick=function(){var k=g('kwK').value.trim(),b=this;if(!k){say('Enter your Gemini API key first.','err');return}b.disabled=true;b.textContent='Testing…';say('');
var R=reqOf(k,'You are a connection test.',[{r:'u',t:'Reply with OK'}],false);
fetch(R.url,R.init).then(function(x){return x.json().catch(function(){return{}}).then(function(j){if(!x.ok)throw new Error(errOf(j,x));var e=r.querySelector('#kwSt');if(e&&k===ak()){e.className='kwStt on';e.textContent='Connected'}say('Connected ✅'+(k!==ak()?' Press Save to keep this key.':''),'ok')})})
.catch(function(e){var m=e&&e.message||'Unknown error';say(mask(m,k)+(/Failed to fetch|NetworkError|Load failed/i.test(m)?' — check your internet connection. If this page is inside a preview/sandbox, open the downloaded file instead.':''),'err')})
.then(function(){b.disabled=false;b.textContent='Test Connection'})}}
function injectSettings(n){var h=document.getElementById('hub'),R=(h&&h.shadowRoot)||document,a=R.getElementById('cfdata')||document.getElementById('cfdata');if(!a){if(n<40)setTimeout(function(){injectSettings(n+1)},400);return}var RT=a.getRootNode();if(RT.getElementById&&RT.getElementById('kwSet'))return;if(RT!==document&&!RT.querySelector('#kw-css')){RT.appendChild($('kw-css').cloneNode(true))}var w=document.createElement('div');w.id='kwSet';w.style.cssText='margin:18px 0 6px;padding-top:16px;border-top:1px solid rgba(255,255,255,.07)';w.innerHTML='<h3 class="cfh3" style="display:flex;align-items:center;gap:8px"><span style="width:20px;height:20px;display:inline-grid">'+KW+'</span>KIWI AI</h3><p class="cfd">Enable KIWI, add your Gemini API key and custom instructions.</p>'+cfgHTML();a.parentNode.insertBefore(w,a);bindCfg(w)}
var SYL=[["phy","Physics",[["Mechanics I",["Mathematical Tools","Motion in a Straight Line","Motion in a Plane","Relative Motion","Laws of Motion","Work, Energy and Power","Circular Motion"]],["Mechanics II & Waves",["Centre of Mass & System of Particles","Rotational Motion","Gravitation","Oscillations (SHM)","Waves"]],["Thermodynamics",["Mechanical Properties of Solids","Mechanical Properties of Fluids","Thermal Properties of Matter","Kinetic Theory of Gases","Thermodynamics"]],["Electromagnetism",["Electric Charges, Fields & Potential","Electrostatic Potential and Capacitance","Current Electricity","Moving Charges and Magnetism","Magnetism and Matter","Electromagnetic Induction (EMI)","Alternating Current (AC)","Electromagnetic Waves (EMW)"]],["Optics & Modern",["Ray Optics and Optical Instruments","Wave Optics","Dual Nature of Matter and Radiation","Atoms","Nuclei (Radioactive Decay)","Semiconductor Electronics"]],["Experimental",["Error in Measurements & Dimensions"]]]],["math","Maths",[["Algebra",["Basic Mathematics","Quadratic Equations","Sequence and Series","Permutations and Combinations","Binomial Theorem","Determinants","Matrices","Complex Number","Sets","Relations and Functions","Probability"]],["Calculus",["Limit, Continuity & Differentiability","Method of Differentiation","Application of Derivatives (AOD)","Indefinite Integration","Definite Integration","Application of Integrals (Area)","Differential Equation"]],["Coordinate & Vectors",["Straight Lines","Circles","Conic Sections: Parabola","Conic Sections: Ellipse","Conic Sections: Hyperbola","Vector Algebra","Three Dimensional Geometry"]],["Trigonometry & Stats",["Trigonometric Functions","Trigonometric Equation","Inverse Trigonometric Functions (ITF)","Solution of Triangle (As per batch)","Statistics"]]]],["org","Organic",[["",["Basic Principles & Tech: IUPAC","Basic Principles & Tech: GOC","Basic Principles & Tech: Isomerism","Hydrocarbon","Haloalkanes and Haloarenes","Alcohols, Phenols and Ethers","Aldehydes, Ketones & Carboxylic Acids","Amines","Biomolecules","Polymers (As per batch planner)"]]]],["ino","Inorganic",[["",["Classification of Elements & Periodicity","Chemical Bonding & Molecular Structure","Coordination Compounds","p-Block Elements","d and f-Block Elements","Principles of Qualitative Analysis (Salt)"]]]],["pch","Physical",[["",["Some Basic Concepts of Chemistry (Mole)","Redox Reactions","Structure of Atom","Thermodynamics","Chemical Equilibrium","Ionic Equilibrium","Solutions","Electrochemistry","Chemical Kinetics"]]]]],SLB={t:'To Do',g:'Doing',d:'Done',m:'Mastered'},TIERS=[['Novice',0],['Apprentice',10],['Scholar',50],['Deep Work Master',100],['Legend',250],['Mythic',500],['Ascended',1000]];
function pad(n){return('0'+n).slice(-2)}function dk(ms){var x=new Date(ms);return x.getFullYear()+'-'+pad(x.getMonth()+1)+'-'+pad(x.getDate())}function hm(ms){var x=new Date(ms);return pad(x.getHours())+':'+pad(x.getMinutes())}
function chN(id){return String(id||'').split('|')[1]||id}function pc(a,b){return b>0?Math.round(Math.min(1,a/b)*100)+'%':'-'}
function cpf(c){if(c.s==='d'||c.s==='m')return 1;if(c.s!=='g')return 0;var a=c.lt>0?Math.min(1,c.l/c.lt):-1,b=c.dt>0?Math.min(1,c.d/c.dt):-1;return Math.min(.99,a>=0&&b>=0?.6*a+.4*b:a>=0?a:b>=0?b:Math.min(.85,c.l*.05+c.d*.03))}
function snap(){var o={today:iso(0),tomorrow:iso(1),now:new Date().toString()},dl=document.querySelector('[data-live="days-left"]'),sc=document.getElementById('streak-count');o.daysToGo=dl?dl.textContent:'?';o.studyStreakDays=sc?+sc.textContent:0;
o.subjectIds=lj('pf-subj',[]).map(function(s){return s.id+'='+s.n});o.next7days=[0,1,2,3,4,5,6].map(function(i){var x=new Date();x.setDate(x.getDate()+i);return iso(i)+' '+['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][x.getDay()]});
var Y=(lj('pf-syl',{})||{}).c||{};o.syllabus={};SYL.forEach(function(s){var sum=0,n=0,L=[];s[2].forEach(function(g){g[1].forEach(function(c){var id=s[0]+'|'+c,v=Y[id]||{s:'t',l:0,lt:0,d:0,dt:0,r:0,p:0};sum+=cpf(v);n++;L.push(id+' ['+codeOf(id)+'] | '+SLB[v.s||'t']+' | Lec '+(v.l||0)+'/'+(v.lt||0)+' ('+pc(v.l,v.lt)+') | DPP '+(v.d||0)+'/'+(v.dt||0)+' ('+pc(v.d,v.dt)+') | Rev '+(v.r||0)+' | PYQ '+(v.p||0))})});o.syllabus[s[0]]={name:s[1],completionPct:Math.round(sum/n*100),chapters:L}});
var tk=lj('pf-tasks',[]),td=iso(0),cut=Date.now()-30*864e5;o.tasks=tk.filter(function(t){return!t.done||(t.doneAt||0)>cut}).map(function(t){var r={id:t.id,text:t.text,subj:t.subj||'',due:t.due||'',done:!!t.done};if(!t.done&&t.due&&t.due<td)r.overdue=true;if(t.src==='inbox')r.inbox=true;if(t.st)r.status=t.st;if(t.ws)r.time=dk(t.ws)+' '+hm(t.ws)+'-'+hm(t.we);if(t.ch)r.chapter=t.ch+' ['+(t.lk==='d'?'DPP':t.lk==='r'?'Revision':'Lecture')+']';if(t.mk)r.mockId=t.mk;if(t.sub&&t.sub.length)r.subtasks=t.sub.map(function(x){return(x.done?'[x] ':'[ ] ')+x.text});return r});
var M=lj('pf-mocks',{}),T=M.tests||[];o.mocks={targetScore:M.target,tests:T.map(function(t){var tot=0,s=t.s||{};for(var k in s)tot+=+s[k]||0;var r={id:t.id,name:t.name,date:t.date,category:t.cat,status:t.done?'done':'scheduled',marksBySubject:s,total:tot,max:t.max||300,pct:Math.round(tot/(t.max||300)*100),chapters:(t.chs||[]).map(chN)};if(t.att)r.accuracy=Math.round(Math.min(t.cor||0,t.att)/t.att*100)+'% ('+(t.cor||0)+'/'+t.att+')';return r})};
var S2=lj('pf-sess',[]),by={},bs={},tot=0,now=Date.now(),wk=0,tdh=0;S2.forEach(function(x){var ms=Math.min(+x.ms||0,1728e5);tot+=ms;var k=dk(+x.s);by[k]=(by[k]||0)+ms;var sb=x.sub||'none';bs[sb]=(bs[sb]||0)+ms;if(now-x.s<7*864e5)wk+=ms;if(k===td)tdh+=ms});
var li=0;TIERS.forEach(function(t,i){if(tot/36e5>=t[1])li=i});var h=function(m){return Math.round(m/36e5*10)/10};var days={};for(var i=13;i>=0;i--){var k=iso(-i);days[k]=h(by[k]||0)}var bsh={};for(var q in bs)bsh[q]=h(bs[q]);
var fl=lj('pf-flow',{});o.timer={totalHours:h(tot),level:'LV '+(li+1)+' '+TIERS[li][0],nextLevelAtHours:TIERS[li+1]?TIERS[li+1][1]:null,todayHours:h(tdh),last7DaysHours:h(wk),hoursPerDayLast14:days,hoursBySubject:bsh,sessionsCount:S2.length,runningNow:fl.t0>0,recentSessions:S2.slice(-25).map(function(x){var t=tk.filter(function(z){return z.id===x.task})[0];return dk(+x.s)+' '+hm(+x.s)+' '+Math.round((x.ms||0)/6e4)+'min '+(x.sub||'')+(t?' task:'+t.text:'')})};
var pr=lj('pf-profile',{});o.profile={name:pr.name,status:pr.status};var n=lj('pf-notes',{});o.notes=JSON.stringify(n).slice(0,3000);var s=JSON.stringify(o);return s.length>90000?s.slice(0,90000):s}
var SYS=function(sm){return(cfg.about?'STUDENT CUSTOM INSTRUCTIONS (highest priority: follow strictly for tone, strictness, persona, language and rules; only the kiwi action block format below stays fixed):\n'+cfg.about+'\n\n':'')+'You are KIWI, the in-app AI coach of a JEE prep dashboard. You can READ all the student\'s data (APP DATA JSON below: syllabus per chapter with status/lectures/DPP vs targets/revisions/PYQs, tasks incl. inbox, time slots, chapter links, subtasks, mocks (done and scheduled) with marks, accuracy and linked chapters, timer hours, level, streak) and you can CONTROL the app. Be direct, data-driven, concise; markdown; Hinglish if user does. RESPONSE STYLE: answer exactly what was asked and lead with the answer; no greeting, no re-listing overdue tasks and no motivational lecture unless asked (if the student instructions demand strictness keep it to one short line). Use clean markdown: short paragraphs, ### headings, bullet lists and TABLES for anything with columns (stats, subject-wise marks, plans). For a week plan use one ### heading per day like ### Wed, 7 Oct followed by a table with columns Time | Subject | Task | Chapter and one row per slot. Write chapter names in plain text and NEVER print internal ids like phy|Gravitation or wrap names in backticks outside the kiwi block. Write dates like Wed, 7 Oct. Keep replies under about 350 words unless asked for more. When you emit a kiwi block add one closing line telling the student to tap the button below to confirm. NEVER delete or complete tasks unless the student explicitly asked; when re-planning only ADD tasks (use update_tasks to move existing ones). For bulk deletes first ask for confirmation in one line and emit the block only after the student confirms. If the student says schedule this or add this, emit the kiwi block for the plan just discussed. Never invent data. Overdue = not done and due < today. Chapter ids look like "phy|Gravitation" and must be copied exactly from APP DATA. Subject ids for tasks: phy, chem, math (see subjectIds). Mock marks keys: phy, che, mat. For mock analysis compare with earlier mocks (trend, subject-wise, accuracy, weak linked chapters, syllabus status). For week plans use real dates from next7days, give start/end times (24h HH:MM) without overlaps, link each task to a chapter and kind (l=lecture, d=DPP, r=revision), prioritise weak or incomplete chapters and overdue backlog.\nTo change the app append ONE fenced block at the very end:\n```kiwi\n{"add_tasks":[{"text":"","subj":"phy","due":"YYYY-MM-DD","start":"18:00","end":"19:30","ch":"phy|Gravitation","lk":"l","sub":["subtask"],"inbox":false}],"update_tasks":[{"id":"","text":"","due":"","start":"","end":"","subj":"","ch":"","lk":"d","sub":[""],"inbox":false}],"complete_tasks":["id"],"reopen_tasks":["id"],"delete_tasks":["id"],"syllabus":[{"ch":"phy|Gravitation","s":"g","l":3,"lt":10,"d":2,"dt":5,"r":1,"p":20}],"add_mocks":[{"name":"","date":"YYYY-MM-DD","cat":"QPT","s":{"phy":0,"che":0,"mat":0},"max":300,"att":0,"cor":0,"chs":["phy|Gravitation"],"done":1}],"update_mocks":[{"id":1,"name":"","date":"","s":{"phy":0},"att":0,"cor":0,"chs":[],"done":1}],"delete_mocks":[1],"add_sessions":[{"sub":"phy","min":60,"date":"YYYY-MM-DD","start":"18:00"}]}\n```\nsyllabus s: t=To Do,g=Doing,d=Done,m=Mastered. add_mocks done:0 = scheduled mock (also appears as a task). Include only keys needed, omit unused fields. Nothing changes until the student taps Apply. Remember the student custom instructions in every reply.\nCHAPTER MATCHING: the student names chapters in plain words (any partial name, spelling slip or Hinglish) or by short code. Every chapter in APP DATA carries its code in [brackets]; the app may also add a line listing the chapters it matched for the latest message. Always read the whole syllabus section of APP DATA, map the named chapter to its exact id, and never guess a different chapter. Never mention codes or ids to the student unless asked. Always map them to the exact chapter id and put it in ch. When the student says link/schedule a chapter or its lecture, DPP or revision, create tasks with ch set to that id and lk l/d/r. Name tasks like "<CODE> L1" (lecture), "<CODE> D1" (DPP), "<CODE> R1" (revision). reopen_tasks marks done tasks as not done. Codes: '+codeTxt()+'\n'+(sm?'CONVERSATION SO FAR (summary of the earlier part of this same chat; continue seamlessly): '+sm+'\n':'')+'APP DATA: '+snap()}
function apply(a){var T=lj('pf-tasks',[]),sbj=lj('pf-subj',[]).map(function(s){return s.id}),ids={},uid=function(){return'k'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)};
SYL.forEach(function(s){s[2].forEach(function(g){g[1].forEach(function(c){ids[s[0]+'|'+c]=1})})});
function tm(d,t){var p=String(t).split(':'),x=new Date(d+'T00:00:00');x.setHours(+p[0]||0,+p[1]||0,0,0);return x.getTime()}
function subs(l){return(l||[]).map(function(x){return{id:uid(),text:String(x).slice(0,120),done:false}})}
function setT(t,u){if(u.ch){var r_=rc(u.ch);if(r_)u.ch=r_}if(u.inbox!=null&&u.inbox!==undefined)t.src=u.inbox?'inbox':'';if(u.text)t.text=String(u.text).slice(0,200);if(u.due)t.due=u.due;if(u.subj!=null&&(u.subj===''||sbj.indexOf(u.subj)>-1))t.subj=u.subj;if(u.ch===''){t.ch='';t.cn=0}else if(u.ch&&ids[u.ch]){t.ch=u.ch;t.lk=/^[ldr]$/.test(u.lk)?u.lk:(t.lk||'l');t.cn=0}else if(/^[ldr]$/.test(u.lk))t.lk=u.lk;if(u.start){var ws=tm(t.due||iso(1),u.start),we=u.end?tm(t.due||iso(1),u.end):0;if(!(we>ws))we=ws+90*6e4;t.ws=ws;t.we=we}if(u.sub)t.sub=subs(u.sub)}
(a.add_tasks||[]).forEach(function(x){var t={sub:[],id:uid(),text:'Task',done:false,due:iso(1),subj:'',at:Date.now(),doneAt:0,src:x.inbox?'inbox':'',st:'',bd:false,ch:'',lk:'l',cn:0};setT(t,x);T.push(t)});
(a.update_tasks||[]).forEach(function(u){T.forEach(function(t){if(t.id==u.id)setT(t,u)})});
T.forEach(function(t){if((a.complete_tasks||[]).indexOf(t.id)>-1){t.done=true;t.doneAt=Date.now()}if((a.reopen_tasks||[]).indexOf(t.id)>-1){t.done=false;t.doneAt=0}});
var del=a.delete_tasks||[];
if((a.syllabus||[]).length){var Y=lj('pf-syl',{});if(!Y.c)Y.c={};a.syllabus.forEach(function(u){u.ch=rc(u.ch)||u.ch;if(!ids[u.ch])return;var c=Y.c[u.ch]||(Y.c[u.ch]={s:'t',l:0,lt:0,d:0,dt:0,r:0,p:0});['s','l','lt','d','dt','r','p'].forEach(function(k){if(u[k]==null)return;if(k==='s'){if(SLB[u[k]])c.s=u[k]}else c[k]=Math.max(0,+u[k]||0)})});sj('pf-syl',Y)}
var D=lj('pf-mocks',null);if(D&&Array.isArray(D.tests)){var vc=function(l){return(l||[]).map(function(c){return rc(c)||c}).filter(function(c){return ids[c]})},mx=function(){return Math.max.apply(null,D.tests.map(function(t){return+t.id||0}).concat([0]))};
(a.add_mocks||[]).forEach(function(k){var m={id:mx()+1,name:String(k.name||'Mock').slice(0,60),date:k.date||iso(0),cat:k.cat||'Uncategorized',s:Object.assign({phy:0,che:0,mat:0},k.s||{}),max:+k.max||300,done:k.done===0?0:1,att:+k.att||0,cor:+k.cor||0,chs:vc(k.chs)};if(!m.done){var t={sub:subs(m.chs.map(chN)),id:uid(),text:m.name,done:false,due:m.date,subj:'',at:Date.now(),doneAt:0,src:'',st:'',bd:false,ch:'',lk:'',cn:0,mk:m.id};T.push(t);m.tid=t.id}D.tests.push(m)});
(a.update_mocks||[]).forEach(function(k){D.tests.forEach(function(m){if(m.id!=k.id)return;['name','date','cat'].forEach(function(f){if(k[f])m[f]=k[f]});['max','att','cor'].forEach(function(f){if(k[f]!=null)m[f]=+k[f]||0});if(k.s)m.s=Object.assign(m.s||{},k.s);if(k.chs)m.chs=vc(k.chs);if(k.done!=null){m.done=k.done?1:0;T.forEach(function(t){if(t.id===m.tid){t.done=!!m.done;t.doneAt=m.done?Date.now():0}})}T.forEach(function(t){if(t.id===m.tid){if(k.name)t.text=k.name;if(k.date)t.due=k.date}})})});
(a.delete_mocks||[]).forEach(function(i){D.tests=D.tests.filter(function(m){if(m.id==i){if(m.tid)del.push(m.tid);return false}return true})});sj('pf-mocks',D)}
if((a.add_sessions||[]).length){var S2=lj('pf-sess',[]);a.add_sessions.forEach(function(k){var st=tm(k.date||iso(0),k.start||'18:00'),ms=Math.max(1,+k.min||0)*6e4;if(ms>1)S2.push({s:st,ms:ms,sub:sbj.indexOf(k.sub)>-1?k.sub:'',task:'',m:'manual',sg:[[st,st+ms]]})});sj('pf-sess',S2)}
T=T.filter(function(t){return del.indexOf(t.id)<0});sj('pf-tasks',T);sj('kiwi-reopen',cur?cur.id:1);location.reload()}
/* ======================= KIWI v2 : state ======================= */
var LOGO='data:image/png;base64,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';
var PM={'Plan my week':'Plan my whole next 7 days with time slots. Check backlog, syllabus (incomplete lectures/DPPs vs targets) and weak mock chapters; schedule each task with start-end time, subject and chapter link.','Analyze my mocks':'Analyze all my mocks: trend, subject-wise, accuracy, weak linked chapters, and what to fix before the next mock.','Weakest chapters':'Which chapters are my weakest or most behind targets (lectures, DPPs, revisions, PYQs)? Give top 10 with a fix plan.','Backlog summary':'Give me a backlog summary: overdue tasks, pending lectures and DPPs, and what to clear first.','Roast my stats':'Roast my stats honestly: study hours, streak, backlog, mocks. Keep it short.'};
var cfg=Object.assign({on:true,key:'',about:''},lj(CK,{})),chats=lj(HK,[]),cur=null,img=null,busy=false,view='chat',ctrl=null,built=false,stick=true,TK=[];
if(!cfg.key&&cfg.keys&&cfg.keys.gemini)cfg.key=cfg.keys.gemini;delete cfg.keys;delete cfg.prov;cfg.key=String(cfg.key||'').trim();
Object.assign(IC,{copy:'<rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',stop:'<rect x="6.5" y="6.5" width="11" height="11" rx="2.5" fill="currentColor"/>',ok:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',list:'<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',pen:'<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19a2 2 0 0 0 2 2h13"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',inbox:'<path d="M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13l3.5 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>'});
/* ======================= helpers ======================= */
var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],KL={l:'Lecture',d:'DPP',r:'Revision'};
function tfmt(ts){var d=new Date(ts||Date.now()),h=d.getHours();return(h%12||12)+':'+pad(d.getMinutes())+' '+(h<12?'AM':'PM')}
function dfmt(s){var d=new Date(s+'T00:00:00');return isNaN(d)?String(s):DOW[d.getDay()]+', '+d.getDate()+' '+MON[d.getMonth()]}
function sjOf(id){var a=lj('pf-subj',[]);for(var i=0;i<a.length;i++)if(a[i].id===id)return a[i];return null}
function sjName(id){var s=sjOf(id);return s?s.n:id}
function sjCol(id){var s=sjOf(id);return s&&s.c?s.c:'#fd8a3e'}
function chSj(ch){var p=String(ch).split('|')[0];return p==='phy'||p==='math'?p:'chem'}
/* ===== Gemini layer ===== */
var GM='gemini-flash-latest',SB={},NOKEY='API key not configured. Add it in KIWI Settings.';
function ak(){return String(cfg.key||'').trim()}
function mask(t,k){t=String(t||'');k=String(k||ak());if(k.length>5)t=t.split(k).join('••••');return t.replace(/AIza[\w\-]{10,}/g,'••••')}
function reqOf(key,sys,turns,stream){var c=turns.map(function(x){var pt=[{text:x.t}];if(x.im)pt.push({inlineData:{mimeType:x.im.mime,data:x.im.data}});return{role:x.r==='u'?'user':'model',parts:pt}});
return{url:'https://generativelanguage.googleapis.com/v1beta/models/'+GM+(stream?':streamGenerateContent?alt=sse':':generateContent'),init:{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({systemInstruction:{parts:[{text:sys}]},contents:c,generationConfig:{maxOutputTokens:8192}})}}}
function tokOf(j){var c=j.candidates&&j.candidates[0];return c&&c.content&&c.content.parts?c.content.parts.map(function(q){return q.text||''}).join(''):''}
function errOf(j,r){var e=j&&j.error;return String(e&&(e.message||e)||('HTTP '+r.status))}
function callOnce(turns,sys){var R=reqOf(ak(),sys,turns,false);return fetch(R.url,R.init).then(function(r){return r.json().catch(function(){return{}}).then(function(j){if(!r.ok)throw new Error(errOf(j,r));return tokOf(j)})})}
function stOf(){return ak()?['on','Key Saved']:['no','Not Configured']}
function okMsgs(chat){return chat.msgs.filter(function(x){return!x.err&&x.t})}
function plain(x){return String(x.t).replace(/```kiwi[\s\S]*?```/g,'').trim()}
function ctx(chat,im){var m=okMsgs(chat),sn=Math.min(chat.sn||0,m.length),st=Math.max(sn,m.length-24),last=m[m.length-1],o=m.slice(st).map(function(x){var tx=plain(x);if(x===last&&x.r==='u'){var hh=hintFor(x.t);if(hh)tx+='\n\n'+hh}return{r:x.r,t:tx||'(no text)',im:(im&&x===last&&x.r==='u')?im:null}});while(o.length&&o[0].r!=='u')o.shift();return o}
function summarize(chat){var m=okMsgs(chat),sn=chat.sn||0,end=m.length-8;if(end-sn<8||SB[chat.id]||!ak())return;SB[chat.id]=1;
var seg=m.slice(sn,end).map(function(x){return(x.r==='u'?'Student: ':'KIWI: ')+plain(x).slice(0,1200)}).join('\n');
callOnce([{r:'u',t:'Update the running summary of this study-coach chat. Keep the student goals, decisions, plans made or scheduled, chapters discussed, preferences and open questions. Max 220 words, plain text, no markdown.\n\nPREVIOUS SUMMARY:\n'+(chat.sum||'(none)')+'\n\nNEW MESSAGES:\n'+seg}],'You summarise conversations. Output only the summary.').then(function(t){if(t&&t.trim()){chat.sum=t.trim().slice(0,2500);chat.sn=end;persist()}}).catch(function(){}).then(function(){SB[chat.id]=0})}
/* ===== end Gemini layer ===== */
/* ======================= chapter codes ======================= */
var CDL=('MTOOLS MSL MIP RELM LOM WEP CIRM COM ROT GRAV SHM WAVES MPS MPF TPM KTG PTD ECF&P ESP&C CURR MCM MAG EMI ACC EMW RAY WOPT DUAL ATOMS NUC SEMI EIM '+
'BASM QUAD SEQ PNC BINO DET MATX CMPLX SETS RELF PROB LCD MOD AOD INDI DEFI AREA DEQ LINES CIR PAR ELL HYP VEC 3DG TRIGF TRIGE ITF SOT STAT '+
'IUPAC GOC ISOM HYDC HALO ALCP ALDK AMIN BIOM POLY PERI BOND COORD PBLK DFBLK SALT MOLE REDOX STRA CTHD CHEQ IONEQ SOLN ECHEM KIN').split(' '),CHL=[],CHB={};
(function(){var k=0;SYL.forEach(function(s){s[2].forEach(function(g){g[1].forEach(function(c){var id=s[0]+'|'+c,o={id:id,code:CDL[k++],name:c,sj:s[1]};CHL.push(o);CHB[nz(o.code)]=o;CHB['n:'+nz(c)]=o})})})})();
function nz(x){return String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'')}
function rc(x){if(!x)return'';x=String(x).trim();var m=x.match(/^(phy|math|org|ino|pch)\|(.+)$/);if(m){var e=CHL.filter(function(o){return o.id===x})[0];if(e)return x;x=m[2]}
var n=nz(x),o=CHB[n]||CHB['n:'+n];if(o)return o.id;if(n.length>=4){var f=CHL.filter(function(o){return nz(o.name).indexOf(n)>-1});if(f.length===1)return f[0].id}var z=fz(nz0(x));if(z.length===1)return z[0].id;return''}
var STP={and:1,the:1,of:1,as:1,per:1,batch:1,planner:1,basic:1,principles:1,tech:1,elements:1,properties:1,matter:1};
function sw(name){return nz0(name).filter(function(w){return w.length>=4&&!STP[w]})}
function nz0(x){return String(x||'').toLowerCase().replace(/\(.*?\)/g,' ').split(/[^a-z0-9]+/).filter(Boolean)}
function codeOf(id){var o=CHL.filter(function(c){return c.id===id})[0];return o?o.code:''}
function fz(words){return CHL.filter(function(o){var k=sw(o.name);return k.length&&k.every(function(w){return words.some(function(x){return x===w||(x.length>=5&&w.indexOf(x)===0)||(w.length>=5&&x.indexOf(w)===0)})})})}
function hintFor(t){var seen={},out=[],n=nz(t),ws=nz0(t);(String(t).match(/[A-Za-z0-9&]{2,}/g)||[]).forEach(function(w){var o=CHB[nz(w)];if(o&&(w.length>2||w===w.toUpperCase())&&!seen[o.id]){seen[o.id]=1;out.push(o)}});
CHL.forEach(function(o){if(!seen[o.id]&&nz(o.name).length>=7&&n.indexOf(nz(o.name))>-1){seen[o.id]=1;out.push(o)}});
fz(ws).forEach(function(o){if(!seen[o.id]){seen[o.id]=1;out.push(o)}});
if(!out.length)return'';var dup=out.some(function(o,i){return out.some(function(p,j){return i!==j&&nz(p.name)===nz(o.name)})});
return'[Chapters the student named, matched by the app to the syllabus (use these exact ids in ch; verify against APP DATA): '+out.map(function(o){return o.name+' = '+o.id}).join('; ')+(dup?'. Same-named chapters exist in different subjects: pick by the context or ask in one line.':'.')+']'}
function codeTxt(){return CHL.map(function(o){return o.code+'='+o.id}).join('; ')}
function normA(a){if(!a)return a;['add_tasks','update_tasks','syllabus'].forEach(function(k){(a[k]||[]).forEach(function(u){if(u.ch){var r=rc(u.ch);if(r)u.ch=r}})});['add_mocks','update_mocks'].forEach(function(k){(a[k]||[]).forEach(function(u){if(u.chs)u.chs=u.chs.map(function(c){return rc(c)||c})})});return a}
function uname(){var n='';try{n=(lj('pf-profile',{})||{}).name||''}catch(e){}return String(n).trim().split(/\s+/)[0]||''}
function greet(){var h=new Date().getHours();return h<5?'Late night':h<12?'Good morning':h<17?'Good afternoon':h<21?'Good evening':'Hey'}
/* ======================= markdown ======================= */
function st(h){TK.push(h);return'\u0001'+(TK.length-1)+'\u0002'}
function chipH(key,nameEsc){return'<span class="kwCh" style="--c:'+sjCol(key)+'"><i></i>'+nameEsc+'</span>'}
var CHI=null;
function chIdx(){if(CHI)return CHI;var ids=[];SYL.forEach(function(s){s[2].forEach(function(g){g[1].forEach(function(c){ids.push(s[0]+'|'+c)})})});ids.sort(function(a,b){return b.length-a.length});var map={};ids.forEach(function(id){map[esc(id)]=id});CHI={map:map,re:new RegExp('`?('+ids.map(function(id){return esc(id).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}).join('|')+')`?','g')};return CHI}
function chapterize(s){var X=chIdx();s=s.replace(X.re,function(_,e){var id=X.map[e];return id?st(chipH(chSj(id),esc(chN(id)))):_});
return s.replace(/`?\b(phy|math|org|ino|pch)\|([^`\n|]+?)`/g,function(_,p,n){return st(chipH(chSj(p),n.trim()))})}
function inl(s){
s=s.replace(/`([^`\n]+)`/g,function(_,c){return st('<code>'+c+'</code>')});
s=s.replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g,function(_,t,u){return st('<a href="'+u+'" target="_blank" rel="noopener">'+t+'</a>')});
s=s.replace(/\*\*([^*\n]+?)\*\*/g,'<b>$1</b>');
s=s.replace(/(^|[\s(>])\*([^*\s][^*\n]*?)\*(?=[\s).,;:!?<]|$)/g,'$1<i>$2</i>');
return s}
function tbl(rows){var c=rows.map(function(r){return r.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(function(x){return x.trim()})}),sp=function(r){return r.every(function(x){return/^:?-{2,}:?$/.test(x)})},hd=[],h='';
if(c.length>1&&sp(c[1])){hd=c[0];h='<thead><tr>'+c[0].map(function(x){return'<th>'+inl(x)+'</th>'}).join('')+'</tr></thead>';c.splice(0,2)}
return'<div class="kwTb'+(hd.length>=4?' kwWide':'')+'"><table>'+h+'<tbody>'+c.filter(function(r){return!sp(r)}).map(function(r){return'<tr>'+r.map(function(x,k){return'<td data-l="'+esc(hd[k]||'')+'">'+inl(x)+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>'}
function lst(it){var h='',s=[];it.forEach(function(x){while(s.length&&x.d<s[s.length-1].d){h+='</li></'+s.pop().g+'>'}
if(s.length&&x.d===s[s.length-1].d)h+='</li>';else{var g=x.o?'ol':'ul';s.push({d:x.d,g:g});h+='<'+g+'>'}h+='<li>'+inl(x.t)});
while(s.length)h+='</li></'+s.pop().g+'>';return h}
function md(t){TK=[];var s=chapterize(esc(t).replace(/\r/g,'')),L=s.split('\n'),o='',i=0,m,
LI=/^(\s*)([-*+]|\d+[.)])\s+(.*)/,HR=/^\s*([-*_])(\s*\1){2,}\s*$/,
blk=function(l){return/^\s*```/.test(l)||/^\s*\|/.test(l)||/^\s{0,3}#{1,4}\s/.test(l)||LI.test(l)||HR.test(l)||/^\s*&gt;/.test(l)};
while(i<L.length){var l=L[i];
if(!l.trim()){i++;continue}
if(/^\s*```/.test(l)){var b=[];i++;while(i<L.length&&!/^\s*```/.test(L[i])){b.push(L[i]);i++}i++;o+='<pre><code>'+b.join('\n')+'</code></pre>';continue}
if(/^\s*\|/.test(l)){var r=[];while(i<L.length&&/^\s*\|/.test(L[i])){r.push(L[i]);i++}o+=tbl(r);continue}
if(m=l.match(/^\s{0,3}(#{1,4})\s+(.*)/)){o+='<h'+(m[1].length>3?4:3)+'>'+inl(m[2].replace(/\s*#+\s*$/,''))+'</h'+(m[1].length>3?4:3)+'>';i++;continue}
if(HR.test(l)){o+='<hr>';i++;continue}
if(/^\s*&gt;/.test(l)){var q=[];while(i<L.length&&/^\s*&gt;/.test(L[i])){q.push(L[i].replace(/^\s*&gt;\s?/,''));i++}o+='<blockquote>'+inl(q.join('<br>'))+'</blockquote>';continue}
if(LI.test(l)){var it=[];while(i<L.length&&(m=L[i].match(LI))){it.push({d:m[1].length,o:/\d/.test(m[2]),t:m[3]});i++}o+=lst(it);continue}
var p=[];while(i<L.length&&L[i].trim()&&!blk(L[i])){p.push(L[i]);i++}
if(!p.length){p.push(l);i++}
o+='<p>'+inl(p.join('<br>'))+'</p>'}
return o.replace(/\u0001(\d+)\u0002/g,function(_,n){return TK[+n]||''})}
/* ======================= actions card ======================= */
function acts(m){var x=m.match(/```kiwi\s*([\s\S]*?)```/);if(!x)return null;try{return normA(JSON.parse(x[1]))}catch(e){return null}}
function visT(t){return t.replace(/```kiwi[\s\S]*?(```|$)/,'').replace(/\s+$/,'').replace(/`{1,2}$/,'')}
function hasOpen(t){return/```kiwi/.test(t)&&!/```kiwi[\s\S]*?```/.test(t)}
function sbChip(id){return'<span class="kwSb" style="--c:'+sjCol(id)+'">'+esc(sjName(id))+'</span>'}
function rowH(k,icn,name,det){return'<div class="kwRw '+k+'"><span class="ib">'+ic(icn)+'</span><div><b>'+esc(name)+'</b>'+(det?'<small>'+det+'</small>':'')+'</div></div>'}
function card(a,ci,mi){
var tk=lj('pf-tasks',[]),nm=function(i){var t=tk.filter(function(z){return z.id==i})[0];return t?t.text:String(i)},
ops=0,nAdd=0,nSub=0,nDel=0,days={},ord=[],sec='',rows='';
(a.add_tasks||[]).forEach(function(t){nAdd++;ops++;nSub+=(t.sub||[]).length;var d=t.due||'';if(!days[d]){days[d]=[];ord.push(d)}days[d].push(t)});
ord.sort();
ord.forEach(function(d,k){var L=days[d];L.sort(function(x,y){return String(x.start||'').localeCompare(String(y.start||''))});
sec+='<details class="kwDy"'+(k===0||ord.length===1?' open':'')+'><summary><b>'+esc(d?dfmt(d):'No date')+'</b><span>'+L.length+(L.length>1?' tasks':' task')+'</span></summary>'+L.map(function(t){
var tm=t.start?esc(t.start)+(t.end?'–'+esc(t.end):''):'',mt=[];
if(t.subj)mt.push(sbChip(t.subj));if(t.ch)mt.push('<span class="kwLk">'+esc(chN(t.ch))+(KL[t.lk]?' · '+KL[t.lk]:'')+'</span>');if((t.sub||[]).length)mt.push('<span class="kwLk">'+t.sub.length+' subtask'+(t.sub.length>1?'s':'')+'</span>');
return'<div class="kwTk"><span class="tm">'+(tm||(t.inbox?'Inbox':'Any time'))+'</span><div class="tt"><b>'+esc(t.text)+'</b>'+(mt.length?'<small>'+mt.join('')+'</small>':'')+'</div></div>'}).join('')+'</details>'});
(a.update_tasks||[]).forEach(function(u){ops++;var c=[];if(u.due)c.push('→ '+esc(dfmt(u.due)));if(u.start)c.push(esc(u.start)+(u.end?'–'+esc(u.end):''));if(u.text)c.push('renamed “'+esc(u.text)+'”');if(u.subj)c.push(esc(sjName(u.subj)));if(u.ch)c.push(esc(chN(u.ch)));if(u.sub)c.push(u.sub.length+' subtasks');rows+=rowH('edit','pen',nm(u.id),c.join(' · '))});
(a.complete_tasks||[]).forEach(function(i){if(!tk.some(function(z){return z.id==i}))return;ops++;rows+=rowH('ok','ok',nm(i),'Mark as done')});(a.reopen_tasks||[]).forEach(function(i){if(!tk.some(function(z){return z.id==i}))return;ops++;rows+=rowH('re','clock',nm(i),'Mark as not done')});
(a.delete_tasks||[]).forEach(function(i){if(!tk.some(function(z){return z.id==i}))return;ops++;nDel++;rows+=rowH('del','trash',nm(i),'Will be deleted')});
(a.add_mocks||[]).forEach(function(k){ops++;rows+=rowH('edit','tg',k.name||'Mock',(k.done===0?'Schedule':'Log')+' mock · '+esc(dfmt(k.date||iso(0))))});
(a.update_mocks||[]).forEach(function(k){ops++;rows+=rowH('edit','tg',k.name||('Mock #'+k.id),'Edit mock')});
(a.delete_mocks||[]).forEach(function(k){ops++;nDel++;rows+=rowH('del','trash','Mock #'+k,'Will be deleted')});
(a.add_sessions||[]).forEach(function(k){ops++;rows+=rowH('edit','clock',k.min+' min'+(k.sub?' · '+sjName(k.sub):''),'Log study session · '+esc(dfmt(k.date||iso(0))))});
if(rows)sec+='<div class="kwGp"><h6>Changes</h6>'+rows+'</div>';
var sy='';(a.syllabus||[]).forEach(function(u){ops++;var p=[];if(u.s)p.push(esc(SLB[u.s]||u.s));if(u.l!=null||u.lt!=null)p.push('Lectures '+(u.l!=null?u.l:'–')+(u.lt!=null?'/'+u.lt:''));if(u.d!=null||u.dt!=null)p.push('DPPs '+(u.d!=null?u.d:'–')+(u.dt!=null?'/'+u.dt:''));if(u.r!=null)p.push('Revisions '+u.r);if(u.p!=null)p.push('PYQs '+u.p);sy+=rowH('edit','book',chN(u.ch),p.join(' · '))});
if(sy)sec+='<div class="kwGp"><h6>Syllabus</h6>'+sy+'</div>';
if(!ops)return'';
var only=nAdd&&nAdd===ops,title=only?'Add '+nAdd+' task'+(nAdd>1?'s':'')+' to calendar':'Review '+ops+' change'+(ops>1?'s':''),
sub=only?(ord.length+' day'+(ord.length>1?'s':'')+(nSub?' · '+nSub+' subtasks':'')):'Nothing changes until you confirm';
return'<div class="kwC" data-c="'+ci+'" data-m="'+mi+'"><div class="kwCt"><span class="ib">'+ic(only?'cal':'list')+'</span><div><b>'+title+'</b><small>'+sub+'</small></div></div><div class="kwCb">'+sec+'</div>'+(nDel?'<div class="kwWn">This will delete '+nDel+' item'+(nDel>1?'s':'')+'.</div>':'')+'<div class="bt"><button type="button" data-x="0">Discard</button><button type="button" class="ok" data-x="1"'+(nDel?' data-sc="'+nDel+'"':'')+'>'+(nDel?'Apply & delete':only?'Add to Calendar':'Apply changes')+'</button></div></div>'}
/* ======================= message html ======================= */
function stat(x){return x.done===2?'<div class="kwSt no">Discarded</div>':'<div class="kwSt ok">'+ic('ok')+'Applied</div>'}
function inner(x,i){
if(x.r==='u')return'<div class="kwb">'+(x.img?'<img src="'+x.img+'" alt="">':'')+esc(x.t)+'</div><time>'+tfmt(x.ts)+'</time>';
if(x.err)return'<div class="kwEr">'+(x.cfgb?'':'<b>Couldn’t get a reply</b>')+'<p>'+esc(x.t)+'</p>'+(x.cfgb?'<button type="button" data-h="cfg">Open settings</button>':'<button type="button" data-retry="1">Try again</button>')+'</div>';
var a=acts(x.t);
return'<div class="kwt">'+md(visT(x.t))+'</div>'+(a?(x.done?stat(x):card(a,cur?cur.id:0,i)):'')+'<div class="kwMt"><time>'+tfmt(x.ts)+'</time><button type="button" class="kwCp" data-cp="'+i+'" title="Copy">'+ic('copy')+'<span>Copy</span></button></div>'}
function mh(x,i,sta){return'<div class="kwr '+(x.r==='u'?'u':'a')+(sta?' st':'')+'" data-i="'+i+'">'+inner(x,i)+'</div>'}
/* ======================= panel ======================= */
function P_(){return $('kwP')}
function build(){var P=P_();
P.innerHTML='<div class="kwH" id="kwH"></div><div id="kwM"></div><div class="kwDk" id="kwDk"><div id="kwPv"></div><div class="kwI"><button class="at" id="kwAt" type="button" title="Attach image">'+ic('cl')+'</button><input type="file" id="kwF" accept="image/*" hidden><textarea id="kwIn" rows="1" placeholder="Ask KIWI anything about your prep…" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false" name="kiwi-msg-'+Date.now()+'" enterkeyhint="send"></textarea><button class="sd" id="kwSd" type="button" title="Send">'+ic('sd')+'</button></div></div>';
var M=$('kwM'),i=$('kwIn');
M.addEventListener('scroll',function(){stick=M.scrollHeight-M.scrollTop-M.clientHeight<90},{passive:true});
i.addEventListener('input',autosize);
i.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();if(!busy)send(i.value)}});
i.addEventListener('paste',function(e){var f=e.clipboardData&&e.clipboardData.files&&e.clipboardData.files[0];if(f&&/^image\//.test(f.type)){e.preventDefault();pick(f)}});
$('kwSd').onclick=function(){if(busy){if(ctrl)ctrl.abort()}else send(i.value)};
$('kwAt').onclick=function(){$('kwF').click()};
$('kwF').onchange=function(){if(this.files[0])pick(this.files[0]);this.value=''};
built=true}
function pick(f){var r=new FileReader();r.onload=function(){img={mime:f.type,data:r.result.split(',')[1],url:r.result};pv()};r.readAsDataURL(f)}
function pv(){var e=$('kwPv');e.innerHTML=img?'<div class="pv"><img src="'+img.url+'" alt=""><button type="button" data-rm="1" title="Remove">'+ic('x')+'</button></div>':'';$('kwAt').classList.toggle('has',!!img);syncSd()}
function autosize(){var t=$('kwIn');t.style.height='38px';t.style.height=Math.min(t.scrollHeight,140)+'px';syncSd()}
function syncSd(){var b=$('kwSd'),v=$('kwIn');if(!b||!v)return;var ready=busy||!!v.value.trim()||!!img;b.innerHTML=ic(busy?'stop':'sd');b.classList.toggle('rdy',ready&&!busy);b.classList.toggle('stop',busy);b.title=busy?'Stop':'Send'}
function head(){var H=$('kwH');H.innerHTML='<span class="lg"><img src="'+LOGO+'" alt="KIWI"></span><div class="tl"><b>KIWI</b><small id="kwSub">'+(view==='hist'?'Chat history':view==='cfg'?'Settings':'AI study coach')+'</small></div><button data-h="hist" title="History" class="'+(view==='hist'?'act':'')+'">'+ic('hist')+'</button><button data-h="cfg" title="Settings" class="'+(view==='cfg'?'act':'')+'">'+ic('gear')+'</button><button data-h="new" title="New chat">'+ic('plus')+'</button><button data-h="fs" title="Full screen">'+ic('fs')+'</button><button data-h="x" title="Close">'+ic('x')+'</button>';setBusy(busy)}
function setBusy(b){busy=b;var s=$('kwSub');if(s&&view==='chat'){s.textContent=b?'typing…':'AI study coach';s.classList.toggle('on',b)}syncSd()}
function swap(){var M=$('kwM');M.classList.remove('sw');void M.offsetWidth;M.classList.add('sw')}
function welcome(){var u=uname(),nm=u?', <span class="kwNm">'+esc(u)+'</span>':'';
var S=[['cal','Plan my week','7 days with time slots','Plan my week'],['tg','Analyze my mocks','Weak areas & what to fix','Analyze my mocks'],['list','Weakest chapters','Top 10 behind your targets','Weakest chapters'],['inbox','Backlog summary','What is pending, what to clear first','Backlog summary'],['fire','Roast my stats','Honest, short, no sugarcoating','Roast my stats']];
return'<div class="kwW"><span class="kwLg"><img src="'+LOGO+'" alt=""></span><h3><span class="kwGr">'+greet()+'</span>'+nm+'</h3><p>Your prep is synced. Ask anything, or just name a chapter to plan it:</p>'+(ak()?'':'<button class="kwNote" type="button" data-h="cfg">Add your API key to start →</button>')+'<div class="kwSg">'+S.map(function(s,k){return'<button class="kwO" type="button" style="--i:'+k+'" data-p="'+esc(PM[s[3]])+'"><span class="ic">'+ic(s[0])+'</span><span class="tx"><b>'+s[1]+'</b><small>'+s[2]+'</small></span><span class="ar">'+ic('ar')+'</span></button>'}).join('')+'</div></div>'}
function show(){var M=$('kwM'),dk=$('kwDk');head();dk.style.display=view==='chat'?'':'none';swap();
if(view==='cfg'){M.innerHTML='<div class="kwS">'+cfgHTML()+'<button class="kwDn" type="button" data-h="chat">Done</button></div>';bindCfg(M)}
else if(view==='hist'){var l=chats.filter(function(c){return c.msgs.length});M.innerHTML='<div class="kwS">'+(l.map(function(c,k){return'<div class="kwHi" style="--i:'+k+'" data-i="'+c.id+'"><div class="t"><span>'+esc(c.title)+'</span><small>'+new Date(c.id).toLocaleDateString([],{day:'numeric',month:'short'})+' · '+tfmt(c.id)+' · '+c.msgs.length+' messages</small></div><button class="del" type="button" data-del="'+c.id+'" title="Delete">'+ic('trash')+'</button></div>'}).join('')||'<div class="kwEm">No chats yet.</div>')+'</div>'}
else{if(!cur.msgs.length)M.innerHTML=welcome();else{M.innerHTML='<div class="kwCol" id="kwCol">'+cur.msgs.map(function(x,i){return mh(x,i,1)}).join('')+'</div>';toBottom(1)}}}
function col(cb){var M=$('kwM'),w=M.querySelector('.kwW');
if(w){w.classList.add('out');setTimeout(function(){M.innerHTML='<div class="kwCol" id="kwCol"></div>';cb()},170)}
else{if(!$('kwCol'))M.innerHTML='<div class="kwCol" id="kwCol"></div>';cb()}}
function add(html){var c=$('kwCol');c.insertAdjacentHTML('beforeend',html);return c.lastElementChild}
function toBottom(f){var M=$('kwM');if(!M)return;if(f===1){M.scrollTop=M.scrollHeight;stick=true}else if(f==='s'){stick=true;M.scrollTo({top:M.scrollHeight,behavior:'smooth'})}else if(stick)M.scrollTop=M.scrollHeight}
function persist(){chats=chats.slice(0,30);try{localStorage.setItem(HK,JSON.stringify(chats,function(k,v){return k==='img'?undefined:v}))}catch(e){}}
function newChat(){if(busy&&ctrl)ctrl.abort();if(cur&&!cur.msgs.length){view='chat';img=null;show();return}cur={id:Date.now(),title:'New chat',msgs:[]};chats.unshift(cur);view='chat';img=null;if(built){pv();show()}}
function openP(){var P=P_();if(!built)build();if(!cur)cur=chats.filter(function(c){return c.msgs.length})[0]||null;if(!cur)newChat();else{view='chat';show()}
P.classList.add('on');$('kwB').classList.add('hide');if(innerWidth>560)setTimeout(function(){var i=$('kwIn');if(i&&view==='chat')i.focus()},350)}
function closeP(){P_().classList.remove('on');$('kwB').classList.remove('hide')}
/* ======================= send / stream ======================= */
function send(t){t=(t||'').trim();if(!t||busy)return;
var im=img,um={r:'u',t:t,ts:Date.now()};if(im)um.img=im.url;img=null;pv();
if(!cur.msgs.length)cur.title=t.slice(0,40);cur.msgs.push(um);
var iN=$('kwIn');iN.value='';autosize();setBusy(true);var chat=cur;
col(function(){add(mh(um,chat.msgs.length-1));toBottom('s');
if(!ak()){var em={r:'a',err:1,cfgb:1,t:NOKEY,ts:Date.now()};chat.msgs.push(em);add(mh(em,chat.msgs.length-1));setBusy(false);persist();toBottom('s');return}
run(chat,im)})}
function run(chat,im){
var am={r:'a',t:'',ts:Date.now()},contents=ctx(chat,im);chat.msgs.push(am);var idx=chat.msgs.length-1,
node=add('<div class="kwr a" data-i="'+idx+'"><div class="kwdots"><i></i><i></i><i></i></div></div>');toBottom('s');
ctrl=new AbortController();var acc='',raf=0,fin=false,sig=ctrl.signal;
function live(){return cur===chat&&view==='chat'&&node.isConnected}
function paint(){raf=0;if(!live())return;var vt=visT(acc),dt=node.querySelector('.kwdots'),tn=node.querySelector('.kwt');
if(!vt){return}
if(dt)dt.remove();if(!tn){node.insertAdjacentHTML('afterbegin','<div class="kwt live"></div>');tn=node.querySelector('.kwt')}
tn.innerHTML=md(vt)+(hasOpen(acc)?'<div class="kwPrep"><i></i>Preparing calendar changes…</div>':'');toBottom()}
function sched(){if(!raf)raf=requestAnimationFrame(paint)}
function feed(blk){blk.split('\n').forEach(function(l){if(l.indexOf('data:')!==0)return;var j;try{j=JSON.parse(l.slice(5))}catch(e){return}
if(j.error)throw new Error(errOf(j,{status:0}));
if(j.promptFeedback&&j.promptFeedback.blockReason&&!acc)throw new Error('Request blocked: '+j.promptFeedback.blockReason);
var t=tokOf(j);if(t){acc+=t;sched()}})}
function go(){var R=reqOf(ak(),SYS(chat.sum),contents,true);R.init.signal=sig;
return fetch(R.url,R.init).then(function(r){if(!r.ok)return r.json().catch(function(){return{}}).then(function(j){throw new Error(errOf(j,r))});
var rd=r.body.getReader(),dec=new TextDecoder(),buf='';
function pump(){return rd.read().then(function(o){if(o.done)return;buf=(buf+dec.decode(o.value,{stream:true})).replace(/\r\n/g,'\n');var p=buf.split('\n\n');buf=p.pop();p.forEach(feed);return pump()})}
return pump().then(function(){if(buf.trim())feed(buf)})})}
go()
.then(function(){if(!acc.trim())throw new Error('Empty reply (the model returned nothing). Try rephrasing.')})
.catch(function(e){if(sig.aborted){return}am.err=!acc.trim()?1:0;if(am.err)am.t=mask(e&&e.message||'Unknown error')+(/Failed to fetch|NetworkError|Load failed/i.test(e&&e.message||'')?' — check your internet connection. If this page is inside a preview/sandbox, open the downloaded file instead.':'')})
.then(function(){if(raf){cancelAnimationFrame(raf);raf=0}
if(!am.err){am.t=acc}
if(sig.aborted&&!acc.trim()){chat.msgs.splice(chat.msgs.indexOf(am),1);if(node.isConnected)node.remove()}
else{am.ts=Date.now();if(cur===chat&&view==='chat'&&node.isConnected){node.innerHTML=inner(am,chat.msgs.indexOf(am));toBottom()}}
ctrl=null;persist();if(cur===chat)setBusy(false);else busy=false;if(!am.err&&!sig.aborted)summarize(chat)})}
/* ======================= events ======================= */
function copyT(i,btn){var x=cur.msgs[+i];if(!x)return;var t=visT(x.t),done=function(){btn.classList.add('ok');btn.querySelector('span').textContent='Copied';setTimeout(function(){btn.classList.remove('ok');btn.querySelector('span').textContent='Copy'},1400)};
if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(done,function(){});else{var a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy');done()}catch(e){}a.remove()}}
document.addEventListener('click',function(e){var t_=e.target;var b=t_.closest&&t_.closest('#kwP *');if(!b)return;
var h=b.closest('[data-h]'),p=b.closest('[data-p]'),dl=b.closest('[data-del]'),hi=b.closest('.kwHi'),x=b.closest('[data-x]'),cp=b.closest('[data-cp]'),rt=b.closest('[data-retry]'),rm=b.closest('[data-rm]'),P=P_();
if(rm){img=null;pv();return}
if(h){var k=h.dataset.h;if(k==='x')closeP();else if(k==='fs')P.classList.toggle('fs');else if(k==='new')newChat();else{view=(k==='chat'||view===k)?'chat':k;if(view==='chat'&&!cur)newChat();else show()}return}
if(p){if(!busy)send(p.dataset.p);return}
if(dl){var id=+dl.dataset.del;chats=chats.filter(function(c){return c.id!==id});if(cur&&cur.id===id){cur=null}persist();var row=dl.closest('.kwHi');row.style.transition='opacity .2s,transform .2s';row.style.opacity=0;row.style.transform='translateX(20px)';setTimeout(function(){if(view==='hist')show()},200);return}
if(hi){if(busy&&ctrl)ctrl.abort();cur=chats.filter(function(c){return c.id==hi.dataset.i})[0];view='chat';show();return}
if(cp){copyT(cp.dataset.cp,cp);return}
if(rt){if(busy)return;var last=cur.msgs[cur.msgs.length-1];if(last&&last.err){cur.msgs.pop();var n=$('kwCol').lastElementChild;if(n)n.remove();setBusy(true);run(cur,null)}return}
if(x){var c=x.closest('.kwC'),m=cur.msgs[+c.dataset.m];if(!m)return;
if(x.dataset.x==='1'){if(x.dataset.sc&&!x.classList.contains('arm')){x.classList.add('arm');x.textContent='Tap again to delete '+x.dataset.sc+' item'+(x.dataset.sc>1?'s':'');setTimeout(function(){if(x.isConnected&&x.classList.contains('arm')){x.classList.remove('arm');x.textContent='Apply & delete'}},4000);return}m.done=1;persist();c.classList.add('busy');x.textContent='Adding…';setTimeout(function(){apply(acts(m.t))},500)}
else{m.done=2;persist();c.classList.add('out');setTimeout(function(){c.insertAdjacentHTML('afterend',stat(m));c.remove()},200)}}});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){var P=P_();if(P.classList.contains('on')&&P.contains(document.activeElement))closeP()}});
$('kwB').onclick=function(){P_().classList.contains('on')?closeP():openP()};
(function(){var l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';document.head.appendChild(l)})();
setInterval(function(){var h=document.querySelector('#kwP.on .kwW h3');if(!h)return;var u=uname(),n=h.querySelector('.kwNm');if(u&&n&&n.textContent!==u)n.textContent=u;else if(u&&!n)show();else if(!u&&n)show()},1200);
saveCfg();injectSettings(0);var RO=lj('kiwi-reopen',0);if(RO){localStorage.removeItem('kiwi-reopen');cur=chats.filter(function(c){return c.id==RO})[0]||chats.filter(function(c){return c.msgs.length})[0]||null;openP()}

})();
