const state={view:'enterprise',task:'all',zoom:1,start:new Date(2026,5,28),end:new Date(2026,7,1),calendarMonth:new Date(2026,5,1),pickStart:null,pickEnd:null,loading:false,sort:{users:'desc',tasks:'desc'}};
let loadingTimer;
const fmt=n=>n.toLocaleString('en-US');
const dateText=d=>`${d.getFullYear()}/${d.getMonth()+1}/${String(d.getDate()).padStart(2,'0')}`;
const addDays=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
const daily=(count,base,seed)=>Array.from({length:count},(_,i)=>Math.max(12,Math.round(base+Math.sin((i+seed)*1.9)*41+Math.sin((i+seed)*.53)*36+Math.cos((i+seed)*2.8)*27)));
const data={enterprise:{users:daily(90,230,4),tasks:daily(90,215,12)},rd:{users:daily(90,220,4),started:daily(90,120,1),done:daily(90,150,5),coded:daily(90,110,11),produced:daily(90,215,8),submitted:daily(90,145,7),merged:daily(90,105,13)},ai:{users:daily(90,240,10),started:daily(90,140,6),done:daily(90,165,9),coded:daily(90,115,15),produced:daily(90,240,11),submitted:daily(90,152,17),merged:daily(90,120,19)}};
const spaces=[['Meego',15234],['Lark',12345],['研发效能',11100],['前端基础',10213],['代码平台',9234],['AI应用平台',9145],['质量工程',8234],['客户交付',186],['客户成功',186],['数据基础',132],['平台架构',119]];
const taskSpaces=[['Meego',15234],['Lark',12345],['研发效能',11100],['前端基础',10213],['代码平台',9234],['客户交付',8234],['质量工程',8234],['AI应用平台',9145],['数据基础',920],['客户成功',186]];
const icon=(name)=>`<img src="./assets/${name}" alt="">`;
const info=()=>icon('imgInfo-0e10f.svg');
function selectedSeries(){return data[state.view]||data.rd}
function lineChart(series,labels,colors,height=205){
  const rangeDays=Math.max(1,Math.min(90,Math.round((state.end-state.start)/86400000)+1));
  const visible=series.map(values=>values.slice(0,rangeDays));
  const legend=labels.length>1?`<div class="chart-legend">${labels.map((label,i)=>`<span><i style="background:${colors[i]}"></i>${label}</span>`).join('')}</div>`:'';
  return `<div class="chart-viewport" data-series="${visible.map(values=>values.join(',')).join('|')}" data-labels="${labels.join('|')}" data-colors="${colors.join('|')}" data-height="${height}" title="上下滚动缩放；左右滑动或拖拽平移"></div>${legend}`;
}
function renderChart(view){
  const series=view.dataset.series.split('|').map(row=>row.split(',').map(Number));
  const labels=view.dataset.labels.split('|'),colors=view.dataset.colors.split('|');
  const height=Number(view.dataset.height),width=Math.max(320,Math.round(view.clientWidth*state.zoom));
  const left=32,top=9,bottom=30,plotH=height-top-bottom,max=Math.max(400,...series.flat()),count=series[0].length;
  const grid=[0,100,200,300,400].map(value=>{
    const y=top+plotH-(value/max)*plotH;
    return `<line x1="${left}" x2="${width-2}" y1="${y}" y2="${y}" stroke="#e8e9eb" stroke-dasharray="2 3"/><text x="0" y="${y+4}" fill="#8f959e" font-size="10">${value}</text>`;
  }).join('');
  const paths=series.map((values,j)=>`<polyline fill="none" stroke="${colors[j]}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" points="${values.map((v,i)=>`${left+i*(width-left-12)/Math.max(1,count-1)},${top+plotH-(v/max)*plotH}`).join(' ')}"/>`).join('');
  const tickCount=Math.min(count,Math.max(2,Math.min(8,Math.floor(width/90))));
  const ticks=Array.from({length:tickCount},(_,i)=>{
    const x=left+i*(width-left-12)/Math.max(1,tickCount-1);
    const d=addDays(state.start,Math.round(i*(count-1)/Math.max(1,tickCount-1)));
    const anchor=i===0?'start':i===tickCount-1?'end':'middle';
    return `<text x="${i===tickCount-1?width-2:x}" y="${height-8}" text-anchor="${anchor}" fill="#8f959e" font-size="10">${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}</text>`;
  }).join('');
  view.innerHTML=`<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${labels.join('、')}趋势图">${grid}${paths}${ticks}<rect class="chart-hit" x="${left}" y="0" width="${width-left}" height="${top+plotH}" fill="transparent"/></svg>`;
}
function metricCard(title,value,series,color,change){return `<div class="card metric-card"><div class="metric-label">${title} ${info()}</div><div class="metric-value">${fmt(value)} <small class="change-label">${change||''}</small></div>${lineChart([series],[title],[color])}</div>`}
function barCard(title,key,color,rows){const sorted=[...rows].sort((a,b)=>state.sort[key]==='desc'?b[1]-a[1]:a[1]-b[1]);const max=Math.max(...sorted.map(x=>x[1]));return `<div class="card bar-card"><div class="bar-head"><span class="card-title">${title} ${info()}</span><div class="sort-switch"><button data-sort="${key}:asc" class="${state.sort[key]==='asc'?'selected':''}" title="从低到高" aria-label="从低到高排序" aria-pressed="${state.sort[key]==='asc'}"><img src="./assets/imgIconSorPositiveorderOutlined-326b9.svg" alt=""></button><button data-sort="${key}:desc" class="${state.sort[key]==='desc'?'selected':''}" title="从高到低" aria-label="从高到低排序" aria-pressed="${state.sort[key]==='desc'}"><img class="descending-icon" src="./assets/imgIconSorPositiveorderOutlined1-01ec3.svg" alt=""></button></div></div><div class="bars-scroll">${sorted.map(([name,value])=>`<div class="bar-row"><span class="bar-name">${name}</span><span class="bar-track"><span class="bar-fill" style="display:block;width:${Math.max(8,value/max*100)}%;background:${color}"></span></span><span class="bar-number">${fmt(value)}</span></div>`).join('')}</div></div>`}
function enterprise(){return `<section><h2 class="section-title">使用概况 ${info()}</h2><div class="card-grid">${metricCard('活跃用户数',15231,data.enterprise.users,'#0da89d','<span class="up">↗ 20%</span> 较上一周期')}${metricCard('发起任务数',4286,data.enterprise.tasks,'#6b72ff','较上一周期持平')}</div></section><div class="section-gap"></div><section><h2 class="section-title">项目空间使用情况 <button id="download-report">${icon('imgDownload-a11da.svg')}下载明细</button></h2><div class="card-grid">${barCard('活跃用户数','users','#07998f',spaces)}${barCard('发起任务数','tasks','#8188fb',taskSpaces)}</div></section>`}
function smallMetric(title,value,detail,positive=false){return `<div class="card"><div class="metric-label">${title} ${info()}</div><div class="metric-value">${value}</div><small class="change-label">${positive?detail.replace(/^(↗\s*[\d.]+%)/,'<span class="up">$1</span>'):detail}</small></div>`}
function trend(title,series,labels,colors){return `<div class="card trend-card"><div class="metric-label">${title} ${info()}</div>${lineChart(series,labels,colors,205)}</div>`}
function spaceReport(){const d=selectedSeries(),factor=state.task==='all'?1:state.task==='member'?.67:.33,adj=n=>fmt(Math.round(n*factor)),isAi=state.view==='ai';return `<section><div class="card metric-card" style="height:348px"><div class="metric-label">活跃用户数 ${info()}</div><div class="metric-value">${isAi?'12,846':'15,231'} <small class="change-label"><span class="up">↗ 20%</span> 较上一周期</small></div>${lineChart([d.users],['活跃用户数'],['#0da89d'])}</div></section><div class="task-tabs"><button data-task="all" class="${state.task==='all'?'active':''}">全部任务</button><button data-task="member" class="${state.task==='member'?'active':''}">成员任务</button><button data-task="sandbox" class="${state.task==='sandbox'?'active':''}">沙箱任务</button></div><section><h2 class="section-title">CodeM 任务情况 ${info()}</h2><div class="triple space-metric">${smallMetric('发起任务数',adj(isAi?3894:15231),'↗ 12.6% 较上一周期',true)}${smallMetric('完成任务数',adj(isAi?492:608),'完成率 86.4%')}${smallMetric('代码产出任务数',adj(isAi?380:447),'代码产出占比 73.5%')}</div>${trend('任务趋势',[d.started,d.done,d.coded],['发起任务数','完成任务数','代码产出任务数'],['#4875ff','#33c983','#9b72ff'])}</section><section><h2 class="section-title">CodeM 代码贡献 ${info()}</h2><div class="triple space-metric">${smallMetric('产出代码行数',adj(isAi?10842:15231),'↗ 12.6% 较上一周期',true)}${smallMetric('已提交代码行数',adj(isAi?485:608),'提交率 86.4%')}${smallMetric('已合入代码行数',adj(isAi?347:447),'代码采纳率 73.5%')}</div>${trend('任务趋势',[d.produced,d.submitted,d.merged],['产出代码行数','已提交代码行数','已合入代码行数'],['#4875ff','#33c983','#9b72ff'])}</section>`}
function emptyState(message){
  return `<div class="empty-state"><img src="./assets/no-permission-illustration.png" alt=""><p>${message}</p></div>`;
}
function render(){
  const isSpace=state.view!=='enterprise', isAi=state.view==='ai';
  document.querySelector('#space-header').classList.toggle('hidden',!isSpace);
  document.querySelector('#space-subnav').classList.toggle('hidden',!isSpace);
  document.querySelector('#report-title').textContent=isAi?'用量分析':isSpace?'数据报表':'企业数据报表';
  document.querySelector('#space-subnav .selected').textContent=isAi?'用量分析':'数据报表';
  document.querySelector('#report-description').textContent=isSpace?'当前空间内 CodeM 的使用、任务完成与代码采用情况。':'企业内 CodeM 的整体使用规模和各项目空间的使用分布。';
  document.querySelector('#date-trigger').classList.toggle('hidden',isAi);
  document.querySelector('#space-name').textContent=isAi?'AI 应用平台':'研发效能';
  const logo=document.querySelector('#space-logo');logo.textContent=isAi?'L':'M';logo.style.background=isAi?'#3dbc2f':'#fa8500';
  document.querySelector('#report-body').innerHTML=isAi?emptyState('暂无权限查看，如需使用请联系企业管理员'):state.loading?emptyState('数据加载中...'):isSpace?spaceReport():enterprise();
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view));
  attachCharts();
}
function showTooltip(e,text,i){
  tooltip??=Object.assign(document.createElement('div'),{className:'chart-tooltip'});
  if(!tooltip.isConnected)document.body.appendChild(tooltip);
  const d=addDays(state.start,i);
  tooltip.innerHTML=`<strong>${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}</strong><br>${text}`;
  tooltip.style.left=Math.min(innerWidth-160,e.clientX+12)+'px';tooltip.style.top=Math.max(8,e.clientY-65)+'px';
}
let tooltip;
function hideTooltip(){tooltip?.remove()}
function attachCharts(){
  document.querySelectorAll('.chart-viewport').forEach(view=>{
    renderChart(view);
    let down=false,startX=0,startScroll=0;
    view.addEventListener('pointerdown',e=>{if(e.button!==0)return;down=true;startX=e.clientX;startScroll=view.scrollLeft;view.classList.add('dragging');view.setPointerCapture(e.pointerId)});
    view.addEventListener('pointermove',e=>{
      if(down)view.scrollLeft=startScroll-(e.clientX-startX);
      const hit=e.target.closest?.('.chart-hit');if(!hit)return;
      const rect=hit.getBoundingClientRect(),series=view.dataset.series.split('|').map(s=>s.split(',').map(Number));
      const i=Math.min(series[0].length-1,Math.max(0,Math.round((e.clientX-rect.left)/rect.width*(series[0].length-1))));
      showTooltip(e,view.dataset.labels.split('|').map((l,j)=>`${l} ${series[j][i]}`).join('<br>'),i);
    });
    const stopDrag=()=>{down=false;view.classList.remove('dragging')};
    view.addEventListener('pointerup',stopDrag);
    view.addEventListener('pointercancel',stopDrag);
    view.addEventListener('pointerleave',hideTooltip);
    view.addEventListener('wheel',e=>{
      if(Math.abs(e.deltaX)>Math.abs(e.deltaY) && !(e.ctrlKey||e.metaKey||e.shiftKey))return;
      e.preventDefault();hideTooltip();
      const relative=(view.scrollLeft+e.clientX-view.getBoundingClientRect().left)/view.scrollWidth;
      const direction=e.deltaY||e.deltaX;
      if(!direction)return;
      state.zoom=Math.max(1,Math.min(4,+(state.zoom*(direction<0?1.12:1/1.12)).toFixed(2)));
      document.querySelectorAll('.chart-viewport').forEach(chart=>{
        const ratio=chart.scrollWidth>chart.clientWidth?chart.scrollLeft/(chart.scrollWidth-chart.clientWidth):0;
        renderChart(chart);
        chart.scrollLeft=chart===view?Math.max(0,relative*chart.scrollWidth-(e.clientX-chart.getBoundingClientRect().left)):ratio*(chart.scrollWidth-chart.clientWidth);
      });
    },{passive:false});
  });
}
const monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function renderCalendar(){
  const months=[state.calendarMonth,new Date(state.calendarMonth.getFullYear(),state.calendarMonth.getMonth()+1,1)];
  document.querySelector('#calendar-months').innerHTML=months.map((month,idx)=>{
    const y=month.getFullYear(),m=month.getMonth(),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
    const monthOptions=monthNames.map((name,i)=>`<option value="${i}" ${i===m?'selected':''}>${name}</option>`).join('');
    const yearOptions=Array.from({length:9},(_,i)=>2023+i).map(year=>`<option value="${year}" ${year===y?'selected':''}>${year}</option>`).join('');
    const leading=Array.from({length:first},(_,i)=>{const d=new Date(y,m,-first+i+1);return `<span class="day other">${d.getDate()}</span>`}).join('');
    const dates=Array.from({length:days},(_,i)=>{
      const d=new Date(y,m,i+1),start=state.pickStart||state.start,end=state.pickStart?(state.pickEnd||state.pickStart):state.end;
      const endpoint=+d===+start||+d===+end,inside=d>start&&d<end;
      return `<button class="day ${endpoint?'endpoint':inside?'in-range':''}" data-date="${y}-${m+1}-${i+1}">${i+1}</button>`;
    }).join('');
    const trailingCount=(7-(first+days)%7)%7;
    const trailing=Array.from({length:trailingCount},(_,i)=>`<span class="day other">${i+1}</span>`).join('');
    return `<div class="month"><div class="month-header"><button class="month-arrow" data-month="-1" ${idx?'aria-hidden="true" tabindex="-1" style="visibility:hidden"':''}>‹</button><div class="month-selects"><select data-calendar-month="${idx}" aria-label="月份">${monthOptions}</select><select data-calendar-year="${idx}" aria-label="年份">${yearOptions}</select></div><button class="month-arrow" data-month="1" ${!idx?'aria-hidden="true" tabindex="-1" style="visibility:hidden"':''}>›</button></div><div class="day-grid">${['Su','Mo','Tu','We','Th','Fr','Sa'].map(w=>`<span class="weekday">${w}</span>`).join('')}${leading}${dates}${trailing}</div></div>`;
  }).join('');
}
function positionCalendar(){
  const trigger=document.querySelector('#date-trigger').getBoundingClientRect(),popover=document.querySelector('.calendar-popover');
  popover.style.left=Math.max(8,Math.min(innerWidth-488-8,trigger.right-488))+'px';
  popover.style.top=Math.min(innerHeight-358,trigger.bottom+4)+'px';
}
function closeCalendar(){document.querySelector('#calendar-overlay').classList.add('hidden');state.pickStart=null;state.pickEnd=null}
function applyDateRange(start,end){
  state.start=start;state.end=end;
  document.querySelector('#date-label').textContent=`${dateText(start)}-${dateText(end)}`;
  closeCalendar();render();
}
document.addEventListener('click',e=>{
  const v=e.target.closest('[data-view]');
  if(v){
    clearTimeout(loadingTimer);state.view=v.dataset.view;state.task='all';state.loading=state.view==='rd';closeCalendar();render();
    if(state.loading)loadingTimer=setTimeout(()=>{if(state.view==='rd'){state.loading=false;render()}},1000);
    return;
  }
  const t=e.target.closest('[data-task]');if(t){state.task=t.dataset.task;render();return}
  const s=e.target.closest('[data-sort]');if(s){const [key,val]=s.dataset.sort.split(':');state.sort[key]=val;render();return}
  if(e.target.closest('#date-trigger')){
    state.pickStart=null;state.pickEnd=null;state.calendarMonth=new Date(state.start.getFullYear(),state.start.getMonth(),1);
    document.querySelector('#calendar-overlay').classList.remove('hidden');renderCalendar();positionCalendar();return;
  }
  if(e.target.id==='calendar-overlay'){closeCalendar();return}
  const month=e.target.closest('[data-month]');if(month){state.calendarMonth=new Date(state.calendarMonth.getFullYear(),state.calendarMonth.getMonth()+Number(month.dataset.month),1);renderCalendar();return}
  const day=e.target.closest('[data-date]');
  if(day){
    const [y,m,d]=day.dataset.date.split('-').map(Number),picked=new Date(y,m-1,d);
    if(!state.pickStart||state.pickEnd){state.pickStart=picked;state.pickEnd=null;renderCalendar()}
    else if(picked<state.pickStart)applyDateRange(picked,state.pickStart);
    else applyDateRange(state.pickStart,picked);
    return;
  }
  const preset=e.target.closest('[data-days]');if(preset){const end=new Date(2026,7,1);applyDateRange(addDays(end,-Number(preset.dataset.days)+1),end);return}
  if(e.target.closest('#download-report')){
    const csv=['空间,活跃用户数',...spaces.map(x=>x.join(','))].join('\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv'}));a.download='CodeM-空间使用情况.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }
});
document.addEventListener('change',e=>{
  const month=e.target.closest('[data-calendar-month]'),year=e.target.closest('[data-calendar-year]');
  if(!month&&!year)return;
  const idx=Number((month||year).dataset.calendarMonth??(month||year).dataset.calendarYear);
  const current=new Date(state.calendarMonth.getFullYear(),state.calendarMonth.getMonth()+idx,1);
  if(month)current.setMonth(Number(month.value));else current.setFullYear(Number(year.value));
  state.calendarMonth=new Date(current.getFullYear(),current.getMonth()-idx,1);renderCalendar();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCalendar()});
window.addEventListener('resize',()=>{if(!document.querySelector('#calendar-overlay').classList.contains('hidden'))positionCalendar();document.querySelectorAll('.chart-viewport').forEach(renderChart)});
render();
