#!/usr/bin/env python3
"""Estrutura a aba detalhada de localizações do relatório mensal legado."""
from __future__ import annotations

import argparse
import json
import re
import sqlite3
import unicodedata
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from pathlib import Path

NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}


def normalizar(valor: object) -> str:
    texto = unicodedata.normalize('NFKD', str(valor or ''))
    return ''.join(c for c in texto if not unicodedata.combining(c)).upper().strip()


def ler_aba(caminho: Path) -> list[dict[str, str]]:
    with zipfile.ZipFile(caminho) as arquivo:
        shared = []
        if 'xl/sharedStrings.xml' in arquivo.namelist():
            raiz = ET.fromstring(arquivo.read('xl/sharedStrings.xml'))
            shared = [''.join(no.text or '' for no in item.iter('{%s}t' % NS['m'])) for item in raiz.findall('m:si', NS)]
        raiz = ET.fromstring(arquivo.read('xl/worksheets/sheet1.xml'))
        linhas = {}
        for linha in raiz.findall('.//m:sheetData/m:row', NS):
            numero = int(linha.attrib['r']); valores = {}
            for celula in linha.findall('m:c', NS):
                referencia = celula.attrib.get('r', 'A1'); coluna = ''.join(c for c in referencia if c.isalpha())
                valor_no = celula.find('m:v', NS); valor = '' if valor_no is None else valor_no.text or ''
                if celula.attrib.get('t') == 's' and valor: valor = shared[int(valor)]
                valores[coluna] = valor
            linhas[numero] = valores
        cabecalho = linhas[56]
        return [{cabecalho.get(coluna, coluna): valores.get(coluna, '') for coluna in cabecalho} for numero, valores in sorted(linhas.items()) if numero >= 57 and valores.get('J')]


def data_excel(valor: str) -> str:
    try: return (datetime(1899, 12, 30) + timedelta(days=float(valor))).date().isoformat()
    except (TypeError, ValueError): return str(valor or '')


def idade(valor: str) -> str:
    encontrado = re.search(r'\d+', str(valor or ''))
    return encontrado.group(0) if encontrado else ''


def classificar(registro: dict[str, str]) -> tuple[str, str, str]:
    categoria = normalizar(registro.get('J', '')); texto = normalizar(' '.join(registro.get(chave, '') for chave in ('D', 'J', 'N', 'P')))
    if 'MORT' in categoria or 'OBITO' in texto: resultado = 'Localizado morto'
    elif 'PRES' in categoria or 'APREEND' in categoria: resultado = 'Localizado preso'
    else: resultado = 'Localizado vivo'
    if 'MURALHA' in categoria or 'CABINE' in categoria: recurso, exclusivo = 'Cabine Verde', 'Sim'
    elif 'VTR' in categoria or 'VIATURA' in categoria: recurso, exclusivo = 'Viatura', 'Não'
    elif 'VULTO' in categoria or 'IMPRENSA' in categoria: recurso, exclusivo = 'Outros', 'Não'
    else: recurso, exclusivo = 'Outros', 'Não'
    return resultado, recurso, exclusivo


def extrair(caminho: Path) -> list[dict[str, str]]:
    registros = []
    with zipfile.ZipFile(caminho) as arquivo:
        # Reutiliza a leitura da aba e preserva o número da linha pela segunda leitura simples.
        shared = []
        raiz_shared = ET.fromstring(arquivo.read('xl/sharedStrings.xml'))
        shared = [''.join(no.text or '' for no in item.iter('{%s}t' % NS['m'])) for item in raiz_shared.findall('m:si', NS)]
        raiz = ET.fromstring(arquivo.read('xl/worksheets/sheet1.xml'))
        for linha in raiz.findall('.//m:sheetData/m:row', NS):
            numero = int(linha.attrib['r'])
            if numero < 57: continue
            valores = {}
            for celula in linha.findall('m:c', NS):
                ref = celula.attrib.get('r', 'A1'); coluna = ''.join(c for c in ref if c.isalpha()); no = celula.find('m:v', NS); valor = '' if no is None else no.text or ''
                if celula.attrib.get('t') == 's' and valor: valor = shared[int(valor)]
                valores[coluna] = valor
            if not valores.get('J'): continue
            resultado, recurso, exclusivo = classificar(valores)
            nome = str(valores.get('M', '')).strip().lstrip('*- ').strip()
            registros.append({'linha_origem': str(numero), 'numero': str(valores.get('A', '')), 'data': data_excel(valores.get('B', '')), 'talao': str(valores.get('C', '')).strip(), 'nome': nome, 'idade': idade(valores.get('K', '')), 'sexo': str(valores.get('L', '')).strip(), 'resultado': resultado, 'recurso': recurso, 'exclusiva': exclusivo, 'categoria': str(valores.get('J', '')).strip(), 'como_encontrada': str(valores.get('N', '')).strip(), 'onde_encontrada': str(valores.get('O', '')).strip(), 'acoes_busca': str(valores.get('P', '')).strip(), 'autorizacao': str(valores.get('T', '')).strip(), 'recusa': str(valores.get('U', '')).strip(), 'incompleto': '1' if not nome or not valores.get('C') else '0'})
    return registros


def executar(caminho: Path, banco_path: Path, aplicar: bool) -> dict[str, int]:
    localizacoes = extrair(caminho); conexao = sqlite3.connect(banco_path); conexao.execute('CREATE TABLE IF NOT EXISTS localizacoes_legado (id INTEGER PRIMARY KEY AUTOINCREMENT, dados_json TEXT NOT NULL, origem_arquivo TEXT NOT NULL, linha_origem INTEGER NOT NULL, incompleto INTEGER NOT NULL DEFAULT 1, UNIQUE(origem_arquivo, linha_origem))')
    fonte = caminho.name; novos = 0; incompletos = 0
    for registro in localizacoes:
        incompletos += registro['incompleto'] == '1'
        if aplicar:
            cursor = conexao.execute('INSERT OR REPLACE INTO localizacoes_legado(dados_json,origem_arquivo,linha_origem,incompleto) VALUES (?,?,?,?)', (json.dumps(registro, ensure_ascii=False), fonte, int(registro['linha_origem']), int(registro['incompleto']))); novos += cursor.rowcount > 0
    if aplicar: conexao.commit()
    conexao.close(); return {'registros': len(localizacoes), 'incompletos': int(incompletos), 'gravados': int(novos)}


def main() -> None:
    parser = argparse.ArgumentParser(); parser.add_argument('xlsx', type=Path); parser.add_argument('--database', type=Path, default=Path('data/cabine-verde.sqlite')); parser.add_argument('--apply', action='store_true'); args = parser.parse_args(); print(json.dumps(executar(args.xlsx, args.database, args.apply), ensure_ascii=False, indent=2))


if __name__ == '__main__': main()
