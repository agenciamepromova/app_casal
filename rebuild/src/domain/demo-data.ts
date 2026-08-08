import type { AppState } from "./types";

const iso=(daysAgo:number)=>{const d=new Date();d.setDate(d.getDate()-daysAgo);return d.toISOString().slice(0,10)};
export const demoState:AppState={
  version:2,session:false,onboarded:true,demo:true,user:{name:"Nikson",email:"nikson@demo.local",theme:"dark"},household:{name:"Nikson & Brenda",activeId:"demo-household"},
  accounts:[
    {id:"nubank",name:"Nubank do casal",kind:"Conta corrente",openingBalanceCents:645000,color:"#9b72ff",active:true},
    {id:"inter",name:"Banco Inter",kind:"Conta digital",openingBalanceCents:328000,color:"#f29a42",active:true},
    {id:"reserva",name:"Reserva conjunta",kind:"Investimento",openingBalanceCents:1850000,color:"#69c69b",active:true},
  ],
  categories:[
    {id:"salario",name:"Salário",type:"income",icon:"↗",color:"#69c69b",active:true},{id:"freelas",name:"Projetos",type:"income",icon:"✦",color:"#e3b64b",active:true},
    {id:"moradia",name:"Moradia",type:"expense",icon:"⌂",color:"#a879e8",active:true},{id:"alimentacao",name:"Alimentação",type:"expense",icon:"◉",color:"#ef8e68",active:true},
    {id:"transporte",name:"Transporte",type:"expense",icon:"◆",color:"#66a8df",active:true},{id:"lazer",name:"Lazer",type:"expense",icon:"♡",color:"#e67ca0",active:true},{id:"saude",name:"Saúde",type:"expense",icon:"+",color:"#68c6b8",active:true},
  ],
  transactions:[
    {id:"t1",type:"income",amountCents:720000,description:"Gestão de tráfego — Cliente A",date:iso(1),accountId:"nubank",categoryId:"freelas",owner:"Nikson",notes:"Contrato mensal"},
    {id:"t2",type:"income",amountCents:480000,description:"Salário Brenda",date:iso(2),accountId:"inter",categoryId:"salario",owner:"Brenda"},
    {id:"t3",type:"expense",amountCents:48670,description:"Mercado da semana",date:iso(3),accountId:"nubank",categoryId:"alimentacao",owner:"Brenda"},
    {id:"t4",type:"expense",amountCents:22000,description:"Combustível",date:iso(4),accountId:"inter",categoryId:"transporte",owner:"Nikson"},
    {id:"t5",type:"expense",amountCents:17890,description:"Jantar do casal",date:iso(6),accountId:"nubank",categoryId:"lazer",owner:"Casal"},
    {id:"t6",type:"expense",amountCents:185000,description:"Aluguel",date:iso(8),accountId:"inter",categoryId:"moradia",owner:"Casal",recurring:true},
    {id:"t7",type:"expense",amountCents:11990,description:"Internet residencial",date:iso(9),accountId:"nubank",categoryId:"moradia",owner:"Nikson",recurring:true},
  ],
  projects:[{id:"p1",name:"Campanha de lançamento",client:"Cliente demonstrativo",status:"active",expectedRevenueCents:800000,startDate:new Date().toISOString().slice(0,10)}],
  goals:[
    {id:"g1",name:"Nossa casa",description:"Entrada para o primeiro imóvel do casal.",targetCents:12000000,currentCents:2750000,dueDate:"2029-12-01",icon:"⌂",contributions:[{name:"Nikson",amountCents:1450000},{name:"Brenda",amountCents:1300000}]},
    {id:"g2",name:"Viagem especial",description:"Uma experiência marcante para viver a dois.",targetCents:3000000,currentCents:850000,dueDate:"2027-07-01",icon:"✈",contributions:[{name:"Nikson",amountCents:450000},{name:"Brenda",amountCents:400000}]},
    {id:"g3",name:"Reserva de emergência",description:"Segurança para seis meses de despesas.",targetCents:3600000,currentCents:2100000,dueDate:"2027-02-01",icon:"◈",contributions:[{name:"Nikson",amountCents:1100000},{name:"Brenda",amountCents:1000000}]},
  ],
  members:[{id:"m1",name:"Nikson Rodrigues",email:"nikson@demo.local",role:"owner",status:"active",initials:"NR"},{id:"m2",name:"Brenda Rodrigues",email:"brenda@demo.local",role:"member",status:"active",initials:"BR"}],
  invites:[]
};
export const freshState=()=>structuredClone(demoState);
