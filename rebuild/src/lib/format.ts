export const brl=(cents:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(cents/100);
export const dateBR=(date:string)=>new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR");
export const monthLabel=()=>new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric"}).format(new Date());
export const todaySP=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
export const uid=()=>typeof crypto!=="undefined"&&crypto.randomUUID?crypto.randomUUID():"00000000-0000-4000-8000-"+Math.random().toString(16).slice(2).padEnd(12,"0").slice(0,12);
