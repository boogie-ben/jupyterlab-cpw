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
        :theme="queue.length ? 'success' : 'default'"
        title="查看下载队列"
        @click="visible = true"
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
            :title="fileInfo(file)"
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

    <t-dialog
      v-model:visible="visible"
      header="下载队列"
      attach="body"
      :close-on-esc-keydown="false"
      :close-on-overlay-click="false"
      width="70%"
      top="8vh"
      :dialog-style="{ height: '80vh', border: 'none', overflow: 'hidden' }"
      dialog-class-name="full-content-dialog"
      :footer="false"
    >
      <div style="height: 100%; padding-right: 12px; min-width: 500px">
        <t-base-table
          row-key="key"
          :data="queue"
          height="100%"
          size="small"
          :columns="(columns as any)"
        >
          <template #actions="{ rowIndex }">
            <LoadingIcon
              v-if="queue[rowIndex].downloading"
              style="font-size: 16px; cursor: pointer;"
            />
            <CloseIcon
              v-else
              style="font-size: 16px; color: var(--td-error-color); cursor: pointer;"
              @click="delTask(rowIndex)"
            />
          </template>
        </t-base-table>
      </div>
    </t-dialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, shallowRef } from 'vue'
import { reqDatasources } from './api'
import {
  MessagePlugin,
  Button as TButton,
  BaseTable as TBaseTable,
  Dialog as TDialog,
  type TableProps,
} from 'tdesign-vue-next'
import { ArrowUpDown1Icon, ChevronRightIcon, RefreshIcon, Download1Icon, LoadingIcon, CloseIcon } from 'tdesign-icons-vue-next'

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
const addTask = (file: DataFile) => {
  window.dispatchEvent(new CustomEvent('datasource-add-task', { detail: file }))
}

const fileInfo = (file: DataFile) => `文件名：${file.filename}\n大小：${file.size_str}\n类型：${file.type}`

const visible = ref(false)
const columns: TableProps['columns'] = [
  { title: '文件名', colKey: 'filename', ellipsis: true },
  { title: '下载至目录', colKey: 'relateDir', ellipsis: true },
  { title: '大小', colKey: 'sizeStr', width: 150, align: 'center' },
  { title: '操作', cell: 'actions', width: 100, align: 'center' },
]
const delTask = (idx: number) => {
  if (!idx) return
  queue.value.splice(idx, 1)
}
</script>
