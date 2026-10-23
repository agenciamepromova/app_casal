import {it,expect} from "vitest";
import {demoState} from "./demo-data";
import {clearPublicDemo} from "./demo-reset";
it("recusa reinicialização fora da demo isolada, mesmo sem conexão",()=>{expect(()=>clearPublicDemo(demoState,false,false)).toThrow();expect(()=>clearPublicDemo(demoState,true,true)).toThrow()});
it("zera apenas registros fictícios e saldos iniciais sem mutar estado anterior",()=>{const original=structuredClone(demoState);const cleared=clearPublicDemo(original,true,false);expect(cleared.transactions).toEqual([]);expect(cleared.commitments).toEqual([]);expect(cleared.goals).toEqual([]);expect(cleared.accounts.every(item=>item.openingBalanceCents===0)).toBe(true);expect(cleared.categories).toEqual(original.categories);expect(cleared.projects).toEqual(original.projects);expect(original).toEqual(demoState)});
