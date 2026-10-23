"use client";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
export function Modal({open,title,subtitle,onClose,children}:{open:boolean;title:string;subtitle?:string;onClose:()=>void;children:React.ReactNode}){
  const titleId=useId(),descriptionId=useId(),dialog=useRef<HTMLElement>(null),dirty=useRef(false),close=useRef(onClose);
  useEffect(()=>{close.current=onClose},[onClose]);
  function requestClose(){if(dialog.current?.querySelector("button:disabled"))return;if(!dirty.current||confirm("Descartar as alterações não salvas?")){dirty.current=false;close.current()}}
  useEffect(()=>{
    if(!open)return;dirty.current=false;
    const previous=document.activeElement as HTMLElement|null,element=dialog.current;
    function askClose(){if(element?.querySelector("button:disabled"))return;if(!dirty.current||confirm("Descartar as alterações não salvas?")){dirty.current=false;close.current()}}
    const beforeUnload=(event:BeforeUnloadEvent)=>{if(dirty.current){event.preventDefault();event.returnValue=""}};
    const keydown=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){event.preventDefault();askClose()}
      if(event.key==="Tab"&&element){
        const nodes=Array.from(element.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary')).filter(node=>node.getClientRects().length);
        const first=nodes[0],last=nodes[nodes.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
      }
    };
    const timer=window.setTimeout(()=>{(element?.querySelector("[autofocus]")??element?.querySelector("input")??element?.querySelector("button"))?.scrollIntoView({block:"nearest"});(element?.querySelector("input")??element?.querySelector("button"))?.focus()},0);
    element?.addEventListener("request-close",askClose);document.addEventListener("keydown",keydown);window.addEventListener("beforeunload",beforeUnload);document.body.style.overflow="hidden";
    return()=>{window.clearTimeout(timer);element?.removeEventListener("request-close",askClose);document.removeEventListener("keydown",keydown);window.removeEventListener("beforeunload",beforeUnload);document.body.style.overflow="";previous?.focus()};
  },[open]);
  if(!open)return null;
  return <div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)requestClose()}}><section ref={dialog} className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={subtitle?descriptionId:undefined} onChangeCapture={()=>{dirty.current=true}} onClickCapture={event=>{const target=(event.target as HTMLElement).closest("button,a");if(target?.tagName==="BUTTON"&&target.textContent?.trim()==="Cancelar"){event.preventDefault();event.stopPropagation();requestClose();return}if(target?.tagName==="A"&&dirty.current&&!confirm("Sair e descartar as alterações não salvas?")){event.preventDefault();event.stopPropagation()}if(target?.getAttribute("type")==="button"&&target.getAttribute("aria-pressed")!==null)dirty.current=true}}><header><div><h2 id={titleId}>{title}</h2>{subtitle?<p id={descriptionId}>{subtitle}</p>:null}</div><button type="button" className="icon-button" onClick={requestClose} aria-label="Fechar janela"><X/></button></header>{children}</section></div>
}