<template>
  <div id="app">
    <input type="text" @input="addItem" @change="addItem"v-model="text" maxlength="44" size="44">
    <ul>
      <li> UF/Estado: {{ nfe.uf }} </li>
      <li> Ano: {{ nfe.ano }} </li>
      <li> Mês: {{ nfe.mes }} </li>
      <li> CNPJ: {{ nfe.cnpj }} </li>
      <li> Modelo Documento: {{ nfe.modelo }} </li>
      <li> Serie: {{ nfe.serie }} </li>
      <li> Numero da NF-e: {{ nfe.numero }} </li>
      <li> Tipo Emissao: {{ nfe.tipoEmissao }} </li>
      <li> Codigo Numerico: {{ nfe.codigoNumerico }} </li>
      <li> Digito Verificador: {{ nfe.digitoVerificador }} </li>
    </ul>
  </div>
</template>

<script>
import { ChaveAcessoHelper } from './classes/ChaveAcessoHelper';
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
    }
  }
}
</script>
