"use client";
import { createContext, useContext, useState } from "react";
import { useDemo } from "@/features/demo/demo-store";

const Context = createContext<{projectId:string;setProjectId:(id:string)=>void}>({ projectId: "", setProjectId: () => {} });
export function ContextProvider({ children }: { children: React.ReactNode }) {
  const [projectId, setProjectId] = useState("");
  const {state}=useDemo();
  const validProjectId=state.projects.some(item=>item.id===projectId)?projectId:"";
  return <Context.Provider value={{ projectId:validProjectId, setProjectId }}>{children}</Context.Provider>;
}
export const useFinancialContext = () => useContext(Context);
export function ContextFilter() {
  const { state } = useDemo();
  const { projectId, setProjectId } = useFinancialContext();
  const normalize=(name:string)=>name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  const missing=["Casa","Açaí","Marketing"].filter(name=>!state.projects.some(project=>normalize(project.name)===normalize(name)));
  return <label className="context-filter">Contexto<select aria-label="Contexto" value={projectId} onChange={event => setProjectId(event.target.value)}><option value="">Tudo</option>{state.projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}{missing.map(name=><option key={name} disabled>{name} • cadastre em Mais → Projetos</option>)}</select><small>Usa os projetos existentes. Sem projeto continua sem contexto.</small></label>;
}
