/* ============================================================
   MALEFLOW • CONFIG FINAL — ABA "Alunos"
   Alinhado com as colunas reais do Google Sheets (35 colunas)
============================================================ */

/* Nome padrão da aba principal */
const SHEET_ALUNAS = "Alunos";

/* Token de upgrade seguro (use no doPost para rotas administrativas) */
const SECURITY_TOKEN = "Bmc082849$";

/* HÍBRIDO → TRUE = exercícios vêm do Firebase */
const HYBRID_EXERCISES = true;

const SCRIPT_URL = ScriptApp.getService().getUrl();

/**
 * ✅ HEADER OFICIAL (35 colunas) — ORDEM REAL
 * Índices 0..34
 */
const HEADER_ALUNAS = [
  "ID","Nome","Email","Telefone","SenhaHash","Produto","DataCompra","LicencaAtiva",
  "Nivel","CicloDuracao","DataInicio","LinkPlanilha","Enfase","Fase","DiaCiclo",
  "Pontuacao","AnamneseJSON","TokenReset","TokenExpira","PerfilHormonal",
  "CicloStartDateManual","DiaPrograma","DeviceId","SessionToken","SessionExpira",
  "DataInicioPrograma","UltimaAtividade","FreeEnabled","FreeEnfases","FreeUntil",
  "acesso_personal","TreinosSemana","AusenciaAtiva","AusenciaInicio","DataNascimento"
];

/* ============================================================
   ÍNDICES (0-based) — use sempre estes no código
============================================================ */

// Identidade / Login
const COL_ID            = 0;
const COL_NOME          = 1;
const COL_EMAIL         = 2;
const COL_TELEFONE      = 3;
const COL_SENHA_HASH    = 4;

// Produto / compra
const COL_PRODUTO       = 5;
const COL_DATA_COMPRA   = 6;
const COL_LICENCA_ATIVA = 7;

// Nível / ciclo
const COL_NIVEL         = 8;
const COL_CICLO_DURACAO = 9;
const COL_DATA_INICIO   = 10;
const COL_LINK_PLANILHA = 11;
const COL_ENFASE        = 12;
const COL_FASE          = 13;
const COL_DIA_CICLO     = 14;

// Anamnese
const COL_PONTUACAO     = 15;
const COL_ANAMNESE_JSON = 16;

// Reset senha ✅ (você estava sem esses nomes)
const COL_TOKEN_RESET   = 17;
const COL_TOKEN_EXPIRA  = 18;

// Legados (desativados no MaleFlow mas existem na planilha)
const COLUNA_PERFIL_HORMONAL    = 19; // PerfilHormonal
const COL_CICLO_DEFINIDO_MANUAL = 20; // CicloStartDateManual

// Programa / sessão / device
const COL_DIA_PROGRAMA   = 21;
const COL_DEVICE_ID      = 22;
const COL_SESSION_TOKEN  = 23;
const COL_SESSION_EXP    = 24;

// Datas de atividade
const COL_DATA_INICIO_PROGRAMA = 25;
const COL_ULTIMA_ATIVIDADE     = 26;

// Free / acesso
const COL_FREE_ENABLED   = 27;
const COL_FREE_ENFASES   = 28;
const COL_FREE_UNTIL     = 29;
const COL_ACESSO_PERSONAL = 30;

const COL_TREINOS_SEMANA  = 31;
const COL_AUSENCIA_ATIVA  = 32;
const COL_AUSENCIA_INICIO = 33;

const COL_DATA_NASCIMENTO = 34;
