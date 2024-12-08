<template>
  <div class="cpw-cfg">
    <div class="cpw-cfg-name">{{ activeCell.name }}</div>

    <div class="cpw-cfg-tabs">
      <div
        v-for="v, k in tabs"
        :key="k"
        class="cpw-cfg-tab-item"
        :active="tab === k"
        @click="tab = k"
      >
        {{ v }}
      </div>
    </div>

    <t-form
      v-if="tab === 'params'"
      label-align="top"
      :data="syncParams"
      class="cpw-cfg-content"
      style="--td-comp-margin-xxl: var(--td-line-height-body-small); --td-comp-paddingLR-xl: 0px;"
    >
      <div
        v-if="!syncParams.length"
        style="text-align: center;"
      >
        组件无参数
      </div>

      <template
        v-for="param,i in syncParams"
        :key="param.name"
      >
        <t-form-item v-if="param.type === 'bool'">
          <div style="flex: 1; width: 0; display: flex; align-items: center;">
            <t-checkbox
              v-model="(param.value as boolean)"
              @change="valueChange"
            />
            <div style="flex: 1; width: 0;"><FormLabel :param="param" /></div>
          </div>
        </t-form-item>

        <t-form-item
          v-else
          :name="`${i}.value`"
          :rules="[{ validator: () => paramValidator(param), message: '请输入合法值', type: 'error', trigger: 'change' }]"
        >
          <!-- todo label后的question图标显示desc -->
          <template #label><FormLabel :param="param" /></template>
          <t-input
            v-if="param.type === 'str'"
            v-model="(param.value as string)"
            clearable
            style="width: 100%;"
            @change="valueChange"
          />
          <t-select
            v-else-if="param.type === 'opt'"
            v-model="(param.value as string)"
            filterable
            :options="param.options"
            clearable
            style="width: 100%;"
            @change="valueChange"
          />
          <t-input-number
            v-else-if="param.type === 'num'"
            v-model="(param.value as number)"
            theme="column"
            style="width: 100%;"
            @change="valueChange"
          />
        </t-form-item>
      </template>
    </t-form>

    <div
      v-else-if="tab === 'incomes'"
      class="cpw-cfg-content"
    >
      输入显示
    </div>

    <div
      v-else-if="tab === 'outgos'"
      class="cpw-cfg-content"
    >
      输出显示
    </div>

    <div class="cpw-cfg-footer">
      <t-button
        content="编辑组件"
        variant="text"
        theme="primary"
        block
        @click="edit"
      />
    </div>
  </div>
</template>

<script lang="tsx" setup>
import { ref } from 'vue'
import { paramValidator } from './utils'
import {
  Button as TButton,
  FormItem as TFormItem,
  Form as TForm,
  Input as TInput,
  InputNumber as TInputNumber,
  Checkbox as TCheckbox,
  Select as TSelect,
  Tooltip as TTooltip,
} from 'tdesign-vue-next'
import { btnIcons } from '../utils'
import { useThrottleFn } from '@vueuse/core'

const props = defineProps<{ activeCell: CPW.Cell }>()

const tabs = { params: '参数', incomes: '输入', outgos: '输出' }
const tab = ref<keyof typeof tabs>('params')

const edit = () => {
  ''
}

const syncParams = ref<CPW.CellParam[]>(JSON.parse(JSON.stringify(props.activeCell.params)))

const FormLabel = ({ param }: { param: CPW.CellParam }) => {
  return <div style="display: flex; align-items: center; column-gap: 4px;">
    <div class="ellipsis-1">{ param.name }</div>
    { param.type !== 'bool' && !param.required && <div style="flex-shrink: 0; color: var(--td-text-color-secondary);">(可选)</div> }
    {
      param.desc && <TTooltip content={param.desc} placement="top">
        <div style="flex-shrink: 0; color: var(--td-brand-color); width: 16px; height: 16px; line-height: 0;" v-html={btnIcons.help} />
      </TTooltip>
    }
  </div>
}

interface Emits {
  (e: 'paramsChanged', params: CPW.CellParam[]): void
}
const emit = defineEmits<Emits>()
const valueChange = useThrottleFn(
  () => emit('paramsChanged', syncParams.value.map(p => ({ ...p }))),
  100,
  true,
)

// todo 对话框更新config时，重新执行
</script>
