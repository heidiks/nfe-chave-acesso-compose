<template>
   <div class="md-layout">
      <div class="md-layout-item"></div>
      <div class="md-layout-item">
        </br>
        </br>
        </br>
         <md-card  md-align="center">
            <div id="app">
               <md-card-header >
                  <md-field md-clearable>
                     <label>Chave de Acesso</label>
                     <md-input type="number" v-model="text" @input="addItem" @change="addItem"  maxlength="44" size="44"></md-input>
                  </md-field>
               </md-card-header>
               <md-card-content>
                  <md-table>
                     <md-table-row>
                        <md-table-head>Descrição</md-table-head>
                        <md-table-head>Valor</md-table-head>
                     </md-table-row>
                     <md-table-row>
                        <md-table-cell>UF/Estado</md-table-cell>
                        <md-table-cell>{{ getUFDesc(nfe.uf) }}</md-table-cell>
                     </md-table-row>
                     <md-table-row>
                        <md-table-cell>Ano</md-table-cell>
                        <md-table-cell>{{ nfe.ano }}</md-table-cell>
                     </md-table-row>
                     <md-table-row>
                        <md-table-cell>Mês</md-table-cell>
                        <md-table-cell>{{ nfe.mes }}</md-table-cell>
                     </md-table-row>
                     <md-table-row>
                        <md-table-cell>CNPJ</md-table-cell>
                        <md-table-cell>{{ nfe.cnpj }}</md-table-cell>
                     </md-table-row>
                     <md-table-row>
                        <md-table-cell>Modelo Documento</md-table-cell>
                        <md-table-cell>{{ nfe.modelo }}</md-table-cell>
                     </md-table-row>
                     <md-table-row>
                        <md-table-cell>Série</md-table-cell>
                        <md-table-cell>{{ nfe.serie }}</md-table-cell>
                     </md-table-row>
                     <md-table-row>
                        <md-table-cell>Numero da NF-e</md-table-cell>
                        <md-table-cell>{{ nfe.numero }}</md-table-cell>
                     </md-table-row>
                     <md-table-row>
                        <md-tooltip md-direction="top">{{ this.getTpEmisListDesc() }}</md-tooltip>
                        <md-table-cell>Tipo Emissão</md-table-cell>
                        <md-table-cell>{{ getTpEmisDesc(nfe.tipoEmissao) }}</md-table-cell>
                     </md-table-row>
                     <md-table-row>
                        <md-table-cell>Código Numérico</md-table-cell>
                        <md-table-cell>{{ nfe.codigoNumerico }}</md-table-cell>
                     </md-table-row>
                     <md-table-row>
                        <md-table-cell>Dígito Verificador</md-table-cell>
                        <md-table-cell>{{ nfe.digitoVerificador }}</md-table-cell>
                     </md-table-row>
                  </md-table>
               </md-card-content>
               <md-card-actions>
                  <md-button class="md-raised md-primary" @click="clear">Limpar</md-button>
               </md-card-actions>
            </div>
         </md-card>
      </div>
      <div class="md-layout-item"></div>
   </div>
</template>


<script>
import { ChaveAcessoHelper, ConveterUtil } from './classes/ChaveAcessoHelper';
export default {
  name: 'app',
  data () {
    return {
      text: '',
      list: [{text: 'Welcome to Your Vue.js App'}],
      nfe: {
        chNFe: '',
        uf: '',
        ano: '',
        mes: '',
        cnpj: '',
        tipoDocumento: '',
        serie: '',
        numero: '',
        tipoEmissao: '',
        codigoNumerico: '',
        digitoVerificador: ''
      }
    }
  },
    methods: {
    addItem() {
      this.nfe = new ChaveAcessoHelper(this.text);
    },
    clear() {
      this.text = "";
      this.nfe = "";
    },
    getUFDesc(uf) {
      if(uf)
        return ConveterUtil.getUFDesc(uf);
    },
    getTpEmisDesc(tpEmis) {
      if(tpEmis)
        return ConveterUtil.getTpEmisDesc(tpEmis);
    },
    getTpEmisListDesc() {
      return ConveterUtil.getTpEmisListDesc();
    }
  }
}
</script>
