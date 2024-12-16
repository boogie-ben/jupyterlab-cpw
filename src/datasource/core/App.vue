<template>
  <div class="ds-container">
    <div class="ds-header">
      <div>数据集</div>
      <t-button
        shape="square"
        variant="text"
        style="margin-left: auto;"
        :loading="loading"
        title="刷新数据集"
        @click="getData"
      >
        <template #icon><RefreshIcon /></template>
      </t-button>
      <t-button
        shape="square"
        variant="text"
        :theme="queue.length ? 'primary' : 'default'"
      >
        <template #icon><ArrowUpDown1Icon /></template>
      </t-button>
    </div>

    <div class="ds-list">
      <template
        v-for="cate in data"
        :key="cate.id"
      >
        <div
          class="ds-cate"
          @click="toggleExpand(cate.id)"
        >
          <ChevronRightIcon
            class="ds-cate-icon"
            :expanded="expanded[cate.id]"
          />
          <div
            class="ds-cate-label"
            :title="cate.name"
          >
            {{ cate.name }}
          </div>
        </div>

        <template v-if="expanded[cate.id]">
          <div
            v-for="file in cate.files"
            :key="file.key"
            class="ds-file"
          >
            <div class="ds-file-label">{{ file.filename }}</div>
            <t-button
              size="small"
              shape="square"
              variant="text"
              :loading="queueMap[file.key]"
              style="margin-left: auto;"
              @click="addTask(file)"
            >
              <template #icon><Download1Icon /></template>
            </t-button>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, shallowRef } from 'vue'
import { reqDatasources } from './api'
import { MessagePlugin, Button as TButton } from 'tdesign-vue-next'
import { ArrowUpDown1Icon, ChevronRightIcon, RefreshIcon, Download1Icon } from 'tdesign-icons-vue-next'

const data = shallowRef<Datasource[]>([])
const loading = ref(false)

const queue = computed(() => window.__DS_DATA.queue.value)
const queueMap = computed(() => {
  const ids: Record<string, boolean> = {}
  window.__DS_DATA.queue.value.forEach(task => { ids[task.key] = true })
  return ids
})

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

const expanded = ref<Record<number, boolean>>({})
const toggleExpand = (id: number) => {
  if (expanded.value[id]) delete expanded.value[id]
  else expanded.value[id] = true
}

// todo 文件名也有可能是带/路径的，后面还是得改成解析path
const addTask = ({ key, filename }: DataFile) => {
  window.dispatchEvent(new CustomEvent('datasource-add-task', { detail: { key, filename } }))
}
</script>
