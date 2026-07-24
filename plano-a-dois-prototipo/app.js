
const DEMO = {
  transactions: [
    {type:'entrada', description:'Gestão de tráfego — Cliente A', category:'Agência', owner:'Nikson', date:'18/07/2026', value:3000},
    {type:'saida', description:'Mercado da semana', category:'Alimentação', owner:'Brenda', date:'17/07/2026', value:486.70},
    {type:'entrada', description:'Criação de site', category:'Projetos', owner:'Nikson', date:'16/07/2026', value:1500},
    {type:'saida', description:'Combustível', category:'Transporte', owner:'Nikson', date:'16/07/2026', value:220},
    {type:'saida', description:'Jantar do casal', category:'Lazer', owner:'Casal', date:'14/07/2026', value:178.90},
    {type:'saida', description:'Internet residencial', category:'Moradia', owner:'Casal', date:'10/07/2026', value:119.90}
  ],
  events: [
    {title:'Reunião com cliente', date:'2026-07-20', time:'14:00', type:'Reunião'},
    {title:'Pagar fatura Nubank — R$ 1.280', date:'2026-07-21', time:'09:00', type:'Pagamento'},
    {title:'Conta de energia', date:'2026-07-22', time:'09:00', type:'Pagamento'},
    {title:'Separar R$ 800 para viagem', date:'2026-07-25', time:'10:00', type:'Meta'},
    {title:'Renovação de ferramenta', date:'2026-07-28', time:'09:00', type:'Pagamento'}
  ],
  goals: [
    {title:'Nossa casa', desc:'Entrada para o primeiro imóvel do casal.', current:27500, target:120000, image:'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1000&q=80'},
    {title:'Viagem especial', desc:'Uma experiência marcante para viver a dois.', current:8500, target:30000, image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80'},
    {title:'Reserva de emergência', desc:'Segurança para seis meses de despesas.', current:21000, target:36000, image:'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1000&q=80'},
    {title:'Canal do casal', desc:'Conteúdo sobre vida, propósito e finanças.', current:3200, target:10000, image:'https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=1000&q=80'}
  ]
};
let data = JSON.parse(localStorage.getItem('planoADoisData')) || structuredClone(DEMO);
let calendarDate = new Date(2026, 6, 1);

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const save = () => localStorage.setItem('planoADoisData', JSON.stringify(data));
const brl = n => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)}
function navigate(page){
  $$('.page').forEach(p=>p.classList.toggle('active',p.id===page));
  $$('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  const titles={home:'Bom dia, Nikson e Brenda',financas:'Finanças do casal',agenda:'Agenda inteligente',planos:'Sonhos e projetos',relatorios:'Relatório mensal'};
  $('#pageTitle').textContent=titles[page]||'Plano a Dois';
  window.scrollTo({top:0,behavior:'smooth'});
}
$$('[data-page]').forEach(b=>b.onclick=()=>navigate(b.dataset.page));
$$('[data-page-link]').forEach(b=>b.onclick=()=>navigate(b.dataset.pageLink));

$('#loginForm').addEventListener('submit',e=>{
  e.preventDefault();
  if($('#username').value==='adm' && $('#password').value==='Projeto@1234'){
    localStorage.setItem('planoADoisSession','1');
    $('#loginScreen').classList.add('hidden'); $('#app').classList.remove('hidden'); renderAll();
  }else toast('Usuário ou senha inválidos.');
});
$('#togglePassword').onclick=()=>{
  const i=$('#password'); i.type=i.type==='password'?'text':'password';
  $('#togglePassword').textContent=i.type==='password'?'Mostrar':'Ocultar';
};
$('#logoutBtn').onclick=()=>{localStorage.removeItem('planoADoisSession');location.reload()};
if(localStorage.getItem('planoADoisSession')==='1'){ $('#loginScreen').classList.add('hidden'); $('#app').classList.remove('hidden'); setTimeout(renderAll,0); }

function renderTransactions(){
  const filter=$('#transactionFilter').value;
  const rows=data.transactions.filter(x=>filter==='all'||x.type===filter).map(x=>`
    <tr><td>${x.description}</td><td>${x.category}</td><td>${x.owner}</td><td>${x.date}</td>
    <td class="${x.type==='entrada'?'positive':'negative'}">${x.type==='entrada'?'+':'−'} ${brl(x.value)}</td></tr>`).join('');
  $('#transactionTable').innerHTML=rows||'<tr><td colspan="5">Nenhuma movimentação encontrada.</td></tr>';
}
$('#transactionFilter').onchange=renderTransactions;
$('#openTransactionModal').onclick=()=>$('#transactionModal').showModal();
$('#mobileAdd').onclick=()=>$('#transactionModal').showModal();
$('#transactionForm').addEventListener('submit',e=>{
  e.preventDefault();
  data.transactions.unshift({type:$('#txType').value,description:$('#txDescription').value,category:$('#txCategory').value,owner:$('#txOwner').value,date:new Date().toLocaleDateString('pt-BR'),value:Number($('#txValue').value)});
  save(); renderTransactions(); $('#transactionModal').close(); e.target.reset(); toast('Movimentação registrada.');
});

function renderEvents(){
  const sorted=[...data.events].sort((a,b)=>a.date.localeCompare(b.date));
  $('#upcomingList').innerHTML=sorted.slice(0,4).map(ev=>{
    const d=new Date(ev.date+'T12:00:00');
    return `<div class="timeline-item"><div class="timeline-date">${String(d.getDate()).padStart(2,'0')} ${d.toLocaleDateString('pt-BR',{month:'short'}).replace('.','')}</div><div><strong>${ev.title}</strong><p>${ev.type} • ${ev.time}</p></div><span>›</span></div>`;
  }).join('');
  $('#agendaList').innerHTML=sorted.map(ev=>{
    const d=new Date(ev.date+'T12:00:00');
    return `<div class="event-item"><div class="date-box"><b>${String(d.getDate()).padStart(2,'0')}</b><span>${d.toLocaleDateString('pt-BR',{month:'short'}).replace('.','')}</span></div><div><strong>${ev.title}</strong><p>${ev.type} • ${ev.time}</p></div><span>›</span></div>`;
  }).join('');
  renderCalendar();
}
$('#openEventModal').onclick=()=>$('#eventModal').showModal();
$('#eventForm').addEventListener('submit',e=>{
  e.preventDefault();
  data.events.push({title:$('#eventTitle').value,date:$('#eventDate').value,time:$('#eventTime').value,type:$('#eventType').value});
  save(); renderEvents(); $('#eventModal').close(); e.target.reset(); toast('Compromisso criado.');
});
function renderCalendar(){
  const y=calendarDate.getFullYear(),m=calendarDate.getMonth();
  $('#calendarMonth').textContent=new Date(y,m,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  const first=new Date(y,m,1).getDay(), days=new Date(y,m+1,0).getDate(), prevDays=new Date(y,m,0).getDate();
  let html='';
  for(let i=first-1;i>=0;i--) html+=`<div class="day muted-day">${prevDays-i}</div>`;
  for(let d=1;d<=days;d++){
    const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const has=data.events.some(e=>e.date===iso);
    const today=iso==='2026-07-19';
    html+=`<div class="day ${has?'has-event':''} ${today?'today':''}">${d}</div>`;
  }
  while((html.match(/class="day/g)||[]).length%7!==0) html+=`<div class="day muted-day">${(html.match(/muted-day/g)||[]).length}</div>`;
  $('#calendarGrid').innerHTML=html;
}
$('#prevMonth').onclick=()=>{calendarDate.setMonth(calendarDate.getMonth()-1);renderCalendar()};
$('#nextMonth').onclick=()=>{calendarDate.setMonth(calendarDate.getMonth()+1);renderCalendar()};

function renderGoals(){
  $('#goalsGrid').innerHTML=data.goals.map(g=>{
    const pct=Math.min(100,Math.round(g.current/g.target*100));
    return `<article class="goal-card"><div class="goal-cover" style="background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.65)),url('${g.image}')"></div><div class="goal-body"><h3>${g.title}</h3><p>${g.desc}</p><div class="progress"><i style="width:${pct}%"></i></div><div class="goal-footer"><span>${brl(g.current)} guardados</span><strong>${pct}%</strong></div></div></article>`;
  }).join('');
}
$('#addGoalBtn').onclick=()=>{
  const title=prompt('Nome do novo plano:'); if(!title)return;
  data.goals.push({title,desc:'Novo objetivo do casal.',current:0,target:10000,image:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80'});
  save();renderGoals();toast('Novo plano criado.');
};
function renderReport(){
  const cats=[['Moradia',34],['Alimentação',27],['Transporte',14],['Lazer',13],['Outros',12]];
  $('#expenseBars').innerHTML=cats.map(c=>`<div class="bar-row"><span>${c[0]}</span><div class="bar-track"><div class="bar-fill" style="width:${c[1]}%"></div></div><strong>${c[1]}%</strong></div>`).join('');
}
function processAssistant(){
  const text=$('#assistantInput').value.trim(); if(!text)return;
  const valueMatch=text.match(/(?:r\$|rs)?\s*([\d.]+(?:,\d{1,2})?)/i);
  const value=valueMatch?Number(valueMatch[1].replace(/\./g,'').replace(',','.')):null;
  const lower=text.toLowerCase();
  let result='';
  if(/recebi|entrou|ganhei|vendi/.test(lower) && value){
    data.transactions.unshift({type:'entrada',description:text,category:'Entrada via Elo',owner:'Nikson',date:new Date().toLocaleDateString('pt-BR'),value});
    save();renderTransactions();result=`Entrada de <strong>${brl(value)}</strong> registrada.`;
  }else if(/paguei|gastei|comprei|despesa/.test(lower) && value){
    data.transactions.unshift({type:'saida',description:text,category:'Despesa via Elo',owner:'Casal',date:new Date().toLocaleDateString('pt-BR'),value});
    save();renderTransactions();result=`Despesa de <strong>${brl(value)}</strong> registrada.`;
  }else if(/lembre|fatura|reunião|reuniao|compromisso|vence/.test(lower)){
    const day=(text.match(/dia\s+(\d{1,2})/i)||[])[1]||'20';
    const date=`2026-07-${String(day).padStart(2,'0')}`;
    data.events.push({title:text,date,time:'09:00',type:/reuni/.test(lower)?'Reunião':'Lembrete'});
    save();renderEvents();result=`Lembrete criado para <strong>${day}/07/2026 às 09:00</strong>.`;
  }else result='Entendi a mensagem, mas preciso que você informe um valor ou uma data para registrar automaticamente.';
  $('#assistantResult').innerHTML=result;$('#assistantResult').classList.remove('hidden');$('#assistantInput').value='';
}
$('#processAssistant').onclick=processAssistant;
$('#voiceBtn').onclick=()=>{
  if(!('webkitSpeechRecognition' in window)){toast('Reconhecimento de voz não disponível neste navegador.');return}
  const r=new webkitSpeechRecognition();r.lang='pt-BR';r.onresult=e=>{$('#assistantInput').value=e.results[0][0].transcript};r.start();toast('Pode falar...');
};
$('#hideValues').onclick=()=>document.body.classList.toggle('values-hidden');
$('#resetDemo').onclick=()=>{if(confirm('Restaurar todos os dados de demonstração?')){data=structuredClone(DEMO);save();renderAll();toast('Dados restaurados.')}};
function renderAll(){renderTransactions();renderEvents();renderGoals();renderReport();}
