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

}