const ESTADOS = {
  '12': 'Acre', '27': 'Alagoas', '13': 'Amazonas', '16': 'Amapá',
  '29': 'Bahia', '23': 'Ceará', '53': 'Distrito Federal',
  '32': 'Espírito Santo', '52': 'Goiás', '21': 'Maranhão',
  '31': 'Minas Gerais', '50': 'Mato Grosso do Sul', '51': 'Mato Grosso',
  '15': 'Pará', '25': 'Paraíba', '26': 'Pernambuco', '22': 'Piauí',
  '41': 'Paraná', '33': 'Rio de Janeiro', '24': 'Rio Grande do Norte',
  '11': 'Rondônia', '14': 'Roraima', '43': 'Rio Grande do Sul',
  '42': 'Santa Catarina', '28': 'Sergipe', '35': 'São Paulo',
  '17': 'Tocantins',
};

const TIPOS_EMISSAO = {
  '1': 'Normal', '2': 'Form Seg', '3': 'SCAN',
  '4': 'EPEC', '5': 'FSDA', '6': 'SVCAN', '7': 'SVCRS',
};

const MODELOS = {
  '55': 'NF-e', '57': 'CT-e', '65': 'NFC-e',
};

// Segment definitions: [start, end, key, label]
export const SEGMENTS = [
  [0, 2, 'uf', 'UF/Estado'],
  [2, 4, 'ano', 'Ano/Mês'],
  [4, 6, 'mes', 'Ano/Mês'],
  [6, 20, 'cnpj', 'CNPJ'],
  [20, 22, 'modelo', 'Modelo'],
  [22, 25, 'serie', 'Série'],
  [25, 34, 'numero', 'Número'],
  [34, 35, 'tipoEmissao', 'Tipo Emissão'],
  [35, 43, 'codigoNumerico', 'Cód. Numérico'],
  [43, 44, 'digitoVerificador', 'Dígito Verif.'],
];

export function sanitizeInput(raw) {
  return raw.replace(/\D/g, '');
}

export function parseChave(chave) {
  if (chave.length !== 44) return null;
  return {
    chave,
    uf: chave.substring(0, 2),
    ano: chave.substring(2, 4),
    mes: chave.substring(4, 6),
    cnpj: chave.substring(6, 20),
    modelo: chave.substring(20, 22),
    serie: chave.substring(22, 25),
    numero: chave.substring(25, 34),
    tipoEmissao: chave.substring(34, 35),
    codigoNumerico: chave.substring(35, 43),
    digitoVerificador: chave.substring(43, 44),
  };
}

export function calcularDigitoVerificador(chave) {
  const multiplicadores = [2, 3, 4, 5, 6, 7, 8, 9];
  let soma = 0;
  let i = 42;
  while (i >= 0) {
    for (let m = 0; m < multiplicadores.length && i >= 0; m++) {
      soma += Number(chave[i]) * multiplicadores[m];
      i--;
    }
  }
  const resto = soma % 11;
  return resto <= 1 ? 0 : 11 - resto;
}

export function validarDigito(chave) {
  if (chave.length !== 44) return null;
  const esperado = Number(chave[43]);
  const calculado = calcularDigitoVerificador(chave);
  return { valido: esperado === calculado, calculado, esperado };
}

export function getUfDescricao(codigo) {
  return ESTADOS[codigo] || 'Desconhecida';
}

export function getTipoEmissaoDescricao(codigo) {
  return TIPOS_EMISSAO[codigo] || 'Desconhecido';
}

export function getModeloDescricao(codigo) {
  return MODELOS[codigo] || 'Desconhecido';
}

export function formatarCnpj(cnpj) {
  if (cnpj.length !== 14) return cnpj;
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}
