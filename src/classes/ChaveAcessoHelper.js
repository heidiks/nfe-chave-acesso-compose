export class ChaveAcessoHelper {
    constructor(chNFe) {
        this.chNFe = chNFe;
        this.uf= chNFe.substring(0, 2),
        this.ano= chNFe.substring(2, 4),
        this.mes= chNFe.substring(4, 6),
        this.cnpj= chNFe.substring(6, 20),
        this.modelo= chNFe.substring(20, 22),
        this.serie= chNFe.substring(22, 25),
        this.numero= chNFe.substring(25, 34),
        this.tipoEmissao= chNFe.substring(34, 35),
        this.codigoNumerico= chNFe.substring(35, 43),
        this.digitoVerificador= chNFe.substring(43, 44)
    }

    static calculaDv(chaveAcesso) {
      let charArray = chaveAcesso;
      let multiplicadores = new Array(2,3,4,5,6,7,8,9);
      let i = 42;
      let soma = 0;
      while (i >= 0) {
        for (let m=0; m < multiplicadores.length && i>=0; m++) {
          soma+= charArray[i] * multiplicadores[m];
          i--;
        }
      }
      let resto = soma % 11;
      if (resto == '0' || resto == '1') {
        return 0;
      } else {
        return (11 - resto);
      }
    }

    toString() {
      return this.uf + this.ano + this.mes + this.cnpj + this.modelo + this.serie + this.numero + this.tipoEmissao + this.codigoNumerico + this.digitoVerificador;
    }

}

export class ConveterUtil {

    static getUFDesc(codigoUF) {
        let estados = [
            {codigo: "12", descricao: "ACRE" }, 
            {codigo: "27", descricao: "ALAGOAS"},
            {codigo: "13", descricao: "AMAZONAS"},
            {codigo: "16", descricao: "AMAPÁ"},
            {codigo: "23", descricao: "BAHIA"},
            {codigo: "29", descricao: "CEARÁ"},
            {codigo: "53", descricao: "DISTRITO FEDERAL"},
            {codigo: "32", descricao: "ESPIRITO SANTO"},
            {codigo: "52", descricao: "GOIÁS"},
            {codigo: "21", descricao: "MARANHÃO"},
            {codigo: "31", descricao: "MINAS GERAIS"},
            {codigo: "50", descricao: "MATO GROSSO DO SUL"},
            {codigo: "51", descricao: "MATO GROSSO"},
            {codigo: "15", descricao: "PARÁ"},
            {codigo: "25", descricao: "PARAÍBA"},
            {codigo: "26", descricao: "PERNAMBUCO"},
            {codigo: "22", descricao: "PIAUÍ"},
            {codigo: "41", descricao: "PARANÁ"},
            {codigo: "33", descricao: "RIO DE JANEIRO"},
            {codigo: "24", descricao: "RIO GRANDE DO NORTE"},
            {codigo: "11", descricao: "RONDÔNIA"},
            {codigo: "14", descricao: "RORAIMA"},
            {codigo: "43", descricao: "RIO GRANDE DO SUL"},
            {codigo: "42", descricao: "SANTA CATARINA"},
            {codigo: "28", descricao: "SERGIPE"},
            {codigo: "35", descricao: "SÃO PAULO"},
            {codigo: "17", descricao: "TOCANTINS"}
        ];
        let filtered = estados.filter(uf => codigoUF === uf.codigo);
        return `${codigoUF} (${filtered[0].descricao})`;
    }

    static getTpEmisList() {
        return [
            {codigo: "1", descricao: "Normal" }, 
            {codigo: "2", descricao: "Form Seg"},
            {codigo: "3", descricao: "SCAN"},
            {codigo: "4", descricao: "EPEC"},
            {codigo: "5", descricao: "FSDA"},
            {codigo: "6", descricao: "SVCAN"},
            {codigo: "7", descricao: "SVCRS"}
        ];
    }

    static getTpEmisDesc(tpEmis) {
        let tpEmisList = this.getTpEmisList();
        let filtered = tpEmisList.filter(tipo => tpEmis === tipo.codigo);
        if(filtered == null) { return "TP [" + tpEmis + "] desconhecido"; }
        return `${tpEmis} (${filtered[0].descricao})`;
    }


    static getTpEmisListDesc() {
        let result = "";
        let tpEmisList = this.getTpEmisList();
        tpEmisList.forEach(tpEmis => result += `${tpEmis.codigo} = ${tpEmis.descricao} / `);
        return result;
    }

    static getModeloDocumento(modelo) {
      switch (modelo) {
        case '55':
          return 'NF-e'
        case '57':
          return 'CT-e'
        case '65':
          return 'NFC-e'
        default:
          return 'Modelo desconhecido'

      }
    }
}
