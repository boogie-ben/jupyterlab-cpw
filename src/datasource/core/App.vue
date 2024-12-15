<template>
  <div class="ds-container">
    <div>12</div>
  </div>
</template>

<script lang="ts" setup>
import { ref, shallowRef } from 'vue'
import { reqDatasources } from './api'
import { MessagePlugin } from 'tdesign-vue-next'
const data = shallowRef<Datasource[]>([])
const loading = ref(false)

const getData = async () => {
  loading.value = true
  try {
    const { results } = await reqDatasources()
    data.value = results
  } catch (err: any) {
    MessagePlugin.error(err.message)
  }
  loading.value = false
}
getData()
</script>
