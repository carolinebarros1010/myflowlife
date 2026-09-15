import React, { useEffect, useState } from 'react';
import './consulta-completa.css';

type Registro = Record<string, unknown>;
type ApiConsulta = {
  carregarCaso: (id: string) => Promise<Registro>;
  listarVitimasCaso: (id: string) => Promise<Registro[]>;
  historicoCaso: (id: string) => Promise<Registro[]>;
  listarFotos: (id: string) => Promise<Registro[]>;
};

function expandir(registro: Registro): Registro {
  return Object.fromEntries(Object.entries(registro).map(([chave, valor]) => {
    if (typeof valor === 'string' && /(?:_json|Json)$/.test(chave)) {
      try { return [chave, JSON.parse(valor)]; } catch { /* Preserva conteúdo original. */ }
    }
    return [chave, valor];
  }));
}

function Campos({ valor, rotulos }: { valor: unknown; rotulos: Record<string, string> }): React.ReactNode {
  if (valor === null || valor === undefined || valor === '') return <span>Não informado</span>;
  if (typeof valor === 'boolean') return <span>{valor ? 'Sim' : 'Não'}</span>;
  if (Array.isArray(valor)) return valor.length ? <ol>{valor.map((item, indice) => <li key={indice}><Campos valor={item} rotulos={rotulos} /></li>)}</ol> : <span>Nenhum registro</span>;
  if (typeof valor === 'object') return <dl>{Object.entries(expandir(valor as Registro)).map(([chave, item]) => <div key={chave}><dt>{rotulos[chave] || chave.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ')}</dt><dd><Campos valor={item} rotulos={rotulos} /></dd></div>)}</dl>;
  return <span>{String(valor)}</span>;
}

export default function ConsultaCompleta({ idCaso, api, rotulos }: { idCaso: string; api: ApiConsulta; rotulos: Record<string, string> }) {
  const [dados, setDados] = useState<Registro | null>(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [revisao, setRevisao] = useState(0);
  useEffect(() => {
    let ativo = true;
    setCarregando(true); setDados(null); setErro('');
    Promise.all([api.carregarCaso(idCaso), api.listarVitimasCaso(idCaso), api.historicoCaso(idCaso), api.listarFotos(idCaso)])
      .then(([caso, vitimas, historico, fotos]) => {
        if (!caso) throw new Error('Caso não encontrado.');
        if (ativo) setDados({ caso, vitimas, historico, fotos });
      }).catch((falha: Error) => { if (ativo) setErro(falha.message || 'Não foi possível carregar a consulta completa.'); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [idCaso, api, revisao]);
  return <section className="consulta-completa painel">
    <div className="consulta-completa-acoes"><button onClick={() => setRevisao(valor => valor + 1)} disabled={carregando}>Atualizar informações</button><button onClick={() => window.print()} disabled={!dados || carregando || Boolean(erro)}>Imprimir / salvar relatório em PDF</button></div>
    <h2>Consulta completa do talão</h2>
    <p>Cadastro, vítimas, respostas, análises, desfecho, histórico e referências das fotos disponíveis no banco consultado.</p>
    {carregando && <p role="status">Carregando informações atualizadas…</p>}
    {erro && <p role="alert">{erro}</p>}
    {dados && <Campos valor={dados} rotulos={rotulos} />}
  </section>;
}
