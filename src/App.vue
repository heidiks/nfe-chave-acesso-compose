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
                  <div v-show="nfe.modelo && nfe.modelo.length == 2">
                      <md-chip class="md-primary">{{ getModeloDocumento(nfe.modelo) }}</md-chip>
                  </div>
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
                  <md-button class="md-raised md-accent" :disabled="this.text.length < 44" @click="validate">Validar dígito verificador</md-button>
                  <md-button class="md-raised md-primary" @click="clear">Limpar</md-button>
               </md-card-actions>
            </div>
            <md-snackbar :md-position="position" :md-duration="isInfinity ? Infinity : duration" :md-active.sync="showSnackbar" md-persistent>
              <span>{{ dvMessage }}</span>
              <md-button class="md-primary" @click="applyNewDv">{{snackButton}}</md-button>
            </md-snackbar>
         </md-card>
        <div v-if="history.length > 0">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <md-subheader style="font-weight: bold; color: blue;">Última{{ history.length > 1 ? 's' : '' }} {{history.length}} Chave{{ history.length > 1 ? 's' : '' }} Acessada{{ history.length > 1 ? 's' : '' }}</md-subheader>
            <md-button class="md-icon-button" @click="clearHistory">
              <md-icon>delete</md-icon>
            </md-button>
          </div>
          <md-list>
            <md-list-item v-for="(item, index) in history" :key="index" @click="loadFromHistory(item)" style="font-weight: bold; color: blue;">
              <md-icon>history</md-icon>{{ item.chNFe }}
            </md-list-item>
          </md-list>
        </div>

      </div>
     <div v-if="showAlert" style="position: fixed; bottom: 0; width: 100%; background-color: #ff9800; color: white; padding: 10px; text-align: center;">
       Em breve acesso apenas via: <a :href="url" target="_blank" style="color: white;">{{ url }}</a>
     </div>
      <div class="md-layout-item"></div>
   </div>
</template>


<script>
import {ChaveAcessoHelper, ConveterUtil} from './classes/ChaveAcessoHelper';

export default {
  name: 'app',
  data () {
    return {
      dvMessage: '',
      showSnackbar: false,
      snackButton: 'Fechar',
      position: 'center',
      duration: 8000,
      isInfinity: false,
      text: '',
      list: [{text: 'NFe/CTe chave acesso compose'}],
      history: [],
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
      },
      showAlert: true,
      url: 'https://heidiks.github.io/nfe-chave-acesso-compose'
    }
  },

  mounted() {
    this.history = this.loadHistory();
  },

  methods: {
    saveToHistory() {
      if (!this.text || this.text.length !== 44) {
        return;
      }
      const history = JSON.parse(localStorage.getItem('nfeHistory')) || [];
      const currentNfe = this.nfe;
      const existingIndex = history.findIndex(item => item.chNFe === currentNfe.chNFe);

      if (existingIndex !== -1) {
        history.splice(existingIndex, 1);
      }

      history.unshift(currentNfe);
      if (history.length > 5) {
        history.pop();
      }

      localStorage.setItem('nfeHistory', JSON.stringify(history));
      this.history = this.loadHistory();
    },

    loadFromHistory(item) {
      this.nfe = item;
      this.text = item.chNFe;
    },

    loadHistory() {
      return JSON.parse(localStorage.getItem('nfeHistory')) || [];
    },

    clearHistory() {
      localStorage.removeItem('nfeHistory');
      this.history = [];
    },

    addItem() {
      this.nfe = new ChaveAcessoHelper(this.text);
      this.saveToHistory();
    },

    clear() {
      this.text = "";
      this.nfe = "";
    },

    validate() {
      let digitoCalculado = ChaveAcessoHelper.calculaDv(this.text);

      if(digitoCalculado.toString() !== this.nfe.digitoVerificador) {
        this.dvMessage = "Dígito verificador inválido, o correto seria " + digitoCalculado.toString();
        this.showSnackbar = true;
        this.snackButton = "Aplicar"
      } else {
        this.dvMessage = "Dígito verificador válido!";
        this.showSnackbar = true;
        this.snackButton = "Fechar"
      }
    },

    applyNewDv() {
      this.nfe.digitoVerificador = ChaveAcessoHelper.calculaDv(this.text);
      this.text = this.nfe.toString();
      this.showSnackbar = false;
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
    },

    getModeloDocumento(modelo) {
      return ConveterUtil.getModeloDocumento(modelo);
    }
  }
}
</script>
