/* Nome padrão da aba principal */
const SHEET_ALUNAS = "Alunas";

/* Token de upgrade seguro */
const SECURITY_TOKEN = "Bmc082849$";

/* HÍBRIDO → TRUE = exercícios vêm do Firebase */
const HYBRID_EXERCISES = true;

const SCRIPT_URL = ScriptApp.getService().getUrl();

const COL_FREE_ENABLED = 25; // Z
const COL_FREE_ENFASES = 26; // AA
const COL_FREE_UNTIL   = 27; // AB
const COL_ACESSO_PERSONAL   = 28; // AC
const COL_TREINOS_SEMANA    = 29; // AD
const COL_AUSENCIA_ATIVA    = 30; // AE
const COL_AUSENCIA_INICIO   = 31; // AF
const COL_DATA_NASCIMENTO   = 32; // AG

/**
 * ✅ HEADER OFICIAL (corrigido)
 * Inclui DiaPrograma ANTES do Device/Session para não conflitar.
 */
const HEADER_ALUNAS = [
  "ID","Nome","Email","Telefone","SenhaHash","Produto","DataCompra","LicencaAtiva",
  "Nivel","CicloDuracao","DataInicio","LinkPlanilha","Enfase","Fase","DiaCiclo",
  "Pontuacao","AnamneseJSON","TokenReset","TokenExpira","DiaPrograma",
  "DeviceId","SessionToken","SessionExpira",
  "DataInicioPrograma","UltimaAtividade", "FreeEnabled" , "FreeEnfases", "FreeUntil", "acesso_personal",
  "TreinosSemana","AusenciaAtiva","AusenciaInicio","DataNascimento"
];

// índices (0-based) para leitura rápida
const COL_DIA_PROGRAMA   = 19; // col 20 (1-based)
const COL_DEVICE_ID      = 20; // col 21
const COL_SESSION_TOKEN  = 21; // col 22
const COL_SESSION_EXP    = 22; // col 23
const COL_DATA_INICIO_PROGRAMA = 23; // col 24
const COL_ULTIMA_ATIVIDADE     = 24; // col 25
