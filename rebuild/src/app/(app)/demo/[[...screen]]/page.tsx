import { notFound } from "next/navigation";
import Dashboard from "../../dashboard/page";
import Transactions from "../../movimentacoes/page";
import Agenda from "../../agenda/page";
import More from "../../mais/page";
import Accounts from "../../contas/page";
import Categories from "../../categorias/page";
import Projects from "../../projetos/page";
import Goals from "../../metas/page";
import Space from "../../nosso-espaco/page";
import Settings from "../../configuracoes/page";
import CardDemo from "../../cartao-demo/page";
import AcaiDemo from "../../acai-demo/page";
const pages:Record<string,React.ComponentType>={dashboard:Dashboard,movimentacoes:Transactions,agenda:Agenda,mais:More,contas:Accounts,categorias:Categories,projetos:Projects,metas:Goals,"nosso-espaco":Space,configuracoes:Settings,"cartao-demo":CardDemo,"acai-demo":AcaiDemo};
export default async function PublicDemo({params}:{params:Promise<{screen?:string[]}>}) {
  const {screen}=await params;
  const Page=pages[screen?.[0]??"dashboard"];
  if(!Page||(screen?.length??0)>1)notFound();
  return <Page/>;
}
