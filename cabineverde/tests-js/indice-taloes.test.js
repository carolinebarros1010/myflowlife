import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function extrair(source, start, end) {
  const i = source.indexOf(start);
  const j = source.indexOf(end, i);
  if (i < 0 || j < 0) throw new Error('trecho não encontrado');
  return source.slice(i, j);
}

test('índice: insert inicial e update sem duplicidade', () => {
  const source = fs.readFileSync(new URL('../GAS/Code.gs', import.meta.url), 'utf8');
  const bloco = extrair(source, 'var ABA_INDICE_TALOES', 'function encontrarPrimeiraLinhaVaziaRelatorio');
  const idxRows = [
    ['hashOperacional','idCaso','talaoNormalizado','talaoOriginal','nomeNormalizado','telefoneNormalizado','dataOperacional','nomeAba','linha','status','criadoEm','atualizadoEm','origem','observacaoAuditoria']
  ];
  const sheets = {
    INDICE_TALOES: {
      getRange: (r,c,n,m)=>({
        setValues: (vals)=> { for(let x=0;x<n;x++) idxRows[r-1+x]=vals[x]; },
        getDisplayValues: ()=> [idxRows[0]],
        getValues: ()=> idxRows.slice(r-1,r-1+n)
      }),
      setFrozenRows: ()=>{},
      getLastRow: ()=> idxRows.length
    }
  };
  const planilha = { getSheetByName:(n)=>sheets[n]||null, insertSheet:(n)=>(sheets[n]=sheets.INDICE_TALOES), getSheets:()=>[] };
  const ctx = {
    SpreadsheetApp:{ openById:()=>planilha, getActiveSpreadsheet:()=>({}) },
    ID_PLANILHA_TALAO_190:'x',
    PRIMEIRA_LINHA_DADOS_TALAO: 11,
    Utilities:{ DigestAlgorithm:{SHA_256:'SHA_256'}, Charset:{UTF_8:'UTF_8'}, computeDigest:()=>[1,2,3]},
    Session:{ getScriptTimeZone:()=> 'Etc/UTC' },
    formatarDataHora:()=> '2026-05-18 10:00:00',
    registrarLogAuditoria_:()=>{},
    limparTexto:(v)=>v==null?'':String(v).trim(),
    normalizarTextoAssinatura_:(v)=> (v==null?'':String(v).trim().toLowerCase()),
    normalizarDataRelatorio_:(v)=> String(v).slice(0,10),
    normalizarTelefoneRelatorio_:(v)=> String(v||'').replace(/\D/g,''),
    normalizarDocumentoRelatorio_:(v)=> String(v||'').replace(/[^0-9A-Za-z]/g,'').toUpperCase()
  };
  vm.createContext(ctx);
  vm.runInContext(bloco, ctx);

  const hash = ctx.gerarHashOperacionalTalao_({ nomeCompletoDesaparecido:'A', telefoneSolicitante:'11', talaoPMESP:'190A' }, '2026-05-18');
  ctx.atualizarIndiceTaloes_({ hashOperacional:hash, idCaso:'C1', talaoNormalizado:'190A', nomeAba:'18MAI26', linhaRelatorio:11, dataOperacional:'2026-05-18' });
  assert.equal(idxRows.length, 2);
  const hit = ctx.localizarCasoPorIndiceTaloes_({ idCaso:'C1' });
  assert.equal(hit.encontrado, true);
  ctx.atualizarIndiceTaloes_({ linhaIndice:hit.linhaIndice, hashOperacional:hash, idCaso:'C1', talaoNormalizado:'190A', nomeAba:'18MAI26', linhaRelatorio:12, dataOperacional:'2026-05-18' });
  assert.equal(idxRows.length, 2);
  assert.equal(idxRows[1][8], 12);
});
