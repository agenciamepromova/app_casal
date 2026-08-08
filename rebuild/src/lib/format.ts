export const brl=(cents:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(cents/100);
export const dateBR=(date:string)=>new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR");
export const monthLabel=()=>new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric"}).format(new Date());
export const uid=()=>`${Date.now()}-${Math.random().toString(16).slice(2)}`;
