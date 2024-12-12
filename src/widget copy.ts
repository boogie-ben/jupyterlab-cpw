import type { CommandRegistry } from '@lumino/commands'
import { Widget } from '@lumino/widgets'
import { type DocumentRegistry, ABCWidgetFactory, DocumentWidget } from '@jupyterlab/docregistry'
import { OutputArea, OutputAreaModel } from '@jupyterlab/outputarea'
import { standardRendererFactories, RenderMimeRegistry } from '@jupyterlab/rendermime'
// import { renderCPW } from './core/index'
import { showErrorMessage } from '@jupyterlab/apputils'
// import { CodeEditor/* , CodeEditorWrapper  */ } from '@jupyterlab/codeeditor'
// import { CodeMirrorEditor, EditorLanguageRegistry/* , ybinding  */ } from '@jupyterlab/codemirror'
// import { YFile } from '@jupyter/ydoc'
// import { EditorState } from '@codemirror/state'
// import { EditorView, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, rectangularSelection, crosshairCursor, highlightActiveLine, keymap } from '@codemirror/view'
// import {} from '@codemirror/language'
// import {} from '@codemirror/commands'
// import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
// import { closeBrackets, autocompletion, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
// import { lintKeymap } from '@codemirror/lint'
import * as view from '@codemirror/view'
import * as state from '@codemirror/state'
import * as language from '@codemirror/language'
import * as commands from '@codemirror/commands'
// import * as search from '@codemirror/search'
// import * as autocomplete from '@codemirror/autocomplete'
import * as lint from '@codemirror/lint'
import { python } from '@codemirror/lang-python'

const rendermime = new RenderMimeRegistry({ initialFactories: standardRendererFactories })

const basicSetup = (() => [
  // view.lineNumbers(),
  view.highlightActiveLineGutter(),
  view.highlightSpecialChars(),
  view.drawSelection(),
  view.dropCursor(),
  commands.history(),
  language.foldGutter(),
  state.EditorState.allowMultipleSelections.of(true),
  language.indentOnInput(),
  language.syntaxHighlighting(language.defaultHighlightStyle, { fallback: true }),
  language.bracketMatching(),
  // autocomplete.closeBrackets(),
  // autocomplete.autocompletion(),
  view.rectangularSelection(),
  view.crosshairCursor(),
  // view.highlightActiveLine(),
  // search.highlightSelectionMatches(),
  view.keymap.of([
    // ...autocomplete.closeBracketsKeymap,
    ...commands.defaultKeymap,
    // ...search.searchKeymap,
    ...commands.historyKeymap,
    ...language.foldKeymap,
    // ...autocomplete.completionKeymap,
    ...lint.lintKeymap,
  ]),
])()

const dispatchEvent: CPW.DispatchEvent = (id, payload) => {
  window.dispatchEvent(new CustomEvent(`cpw-event-${id}`, { detail: payload }))
}

const defaultFileContent: CPW.FileSchema = {
  cells: [],
}

class CPWWidget extends Widget {
  private _commands: CommandRegistry
  private _context: DocumentRegistry.Context

  get session () {
    return this._context.sessionContext.session
  }

  constructor (options: { commands: CommandRegistry, context: DocumentRegistry.Context }) {
    super()
    this._commands = options.commands
    this._context = options.context

    this._context.ready.then(() => {
      const content = this._context.model.toString()
      if (!content) {
        this._context.model.fromString(JSON.stringify(defaultFileContent)) // 画布对象
        this.save()
      }
      // console.log(this)
      window.addEventListener(`cpw-action-${this.id}`, this)
      // renderCPW(this.node, this.id, this._context.model.toString())
      // const languages = new EditorLanguageRegistry()

      // EditorLanguageRegistry.getDefaultLanguages()
      //   .filter(language => ['python'].includes(language.name.toLowerCase()))
      //   .forEach(language => { languages.addLanguage(language) })

      // const edModel = new CodeEditor.Model({ mimeType: 'text/x-python', sharedModel: new YFile() })
      // const ed = new CodeMirrorEditor({
      //   host: this.node,
      //   model: edModel,
      //   languages,
      //   // extensions: [ybinding({ ytext: edModel.sharedModel.ysource })],
      // })
      // console.log(333, ed)

      const v = new view.EditorView({
        extensions: [basicSetup, python()],
        parent: this.node,
      })

      console.log(v)

      // const sharedModel = new YFile()
      // const model = new CodeEditor.Model({ sharedModel })
      // const factory = (options: CodeEditor.IOptions) => {
      //   console.log(111, options)
      //   options.extensions = [
      //     ...(options.extensions ?? []),
      //     ybinding({ ytext: sharedModel.ysource }),
      //   ]
      //   return new CodeMirrorEditor(options)
      // }
      // const ed = new CodeEditorWrapper({ factory, model })
      // console.log(222, ed)
    })
  }

  handleEvent (e: CustomEvent<CPW.ActionPayload<CPW.ActionType>>) {
    this[e.detail.type]?.(e.detail.data as any)
  }

  async run (payload: CPW.ActionPayloadData['run']) {
    if (this.session?.kernel?.status !== 'idle') return showErrorMessage('运行失败', '内核非空闲状态')

    const { cells } = payload
    const len = cells.length

    // 每一次运行都确保执行一次import IPython
    const future = this.session.kernel.requestExecute({ code: 'import IPython' })
    await future.done

    // todo 错误时中断执行

    for (let i = 0; i < len; i++) {
      // todo 中断内核时打断循环, 并重置未执行节点状态
      const { id, code } = cells[i]
      dispatchEvent(this.id, { type: 'cellStatus', data: { id, status: 'running' } })
      const outputArea = new OutputArea({
        model: new OutputAreaModel(),
        maxNumberOutputs: 50, // 50和notebook的默认值一致
        rendermime,
      })
      outputArea.future = this.session.kernel.requestExecute({ code })
      await outputArea.future.done
      const outputs = outputArea.model.toJSON()
      dispatchEvent(this.id, { type: 'cellOutputs', data: { id, outputs, node: outputArea.node } })
      const isErr = !!outputs.find(output => output.output_type === 'error')
      dispatchEvent(this.id, { type: 'cellStatus', data: { id, status: isErr ? 'error' : 'done' } })
      console.log('done')

      /**
        const future = this.session.kernel.requestExecute({ code })

        如果直接使用outputArea处理事件的话很方便
          const outputArea = new OutputArea({ model: new OutputAreaModel(), rendermime })
          outputArea.future = future
          await outputArea.future.done
          outputArea.node就是输出渲染

        如果outputArea不需要处理事件，只需要渲染，则给model传入初始的outputs值
          const outputs: nbformat.IOutput[] = []
          const outputArea = new OutputArea({ model: new OutputAreaModel({ values: outputs }), rendermime })

        如果需要获取outputs的话可以使用
          outputArea.model.toJSON() 获取outputs数组

        如果暂时不需要outputArea的话，则需要手动监听消息进行收集outputs
          const outputs: nbformat.IOutput[] = []
          future.onIOPub = msg => {
            console.log(id, msg)
            const msgType = msg.header.msg_type
            switch (msg.header.msg_type) {
            // todo 消息类型update_display_data
            case 'execute_result':
            case 'display_data':
            case 'stream':
            case 'error':
              outputs.push({ ...msg.content, output_type: msgType })
            }
          }
       */
    }
  }

  kernelResert () {
    // todo 打断正在执行的run循环
    this.session?.kernel?.restart()
  }

  kernelInterrupt () {
    // todo 打断正在执行的run循环
    this.session?.kernel?.interrupt()
  }

  kernelStatus () {
    dispatchEvent(this.id, { type: 'kernelStatus', data: { status: this.session?.kernel?.status || 'unknown' } })
  }

  change (payload: CPW.ActionPayloadData['change']) {
    const { content } = payload
    this._context.model.fromString(content)
  }

  renderOutputs (payload: CPW.ActionPayloadData['renderOutputs']) {
    const { id, outputs } = payload
    const outputArea = new OutputArea({ model: new OutputAreaModel({ values: outputs }), maxNumberOutputs: 50, rendermime })
    dispatchEvent(this.id, { type: 'cellOutputs', data: { id, outputs, node: outputArea.node } })
  }

  save () {
    this._commands.execute('docmanager:save')
  }

  exportIpynb () {
    // todo 流水线导出为notebook
  }

  dispose () {
    window.removeEventListener(`cpw-action-${this.id}`, this, false)
    dispatchEvent(this.id, { type: 'dispose', data: null })
    super.dispose()
  }
}

export class CPWDocumentWidget extends DocumentWidget<CPWWidget> {
  constructor (options: DocumentWidget.IOptions<CPWWidget, DocumentRegistry.IModel>) {
    super(options)
    this.toolbar.dispose() // 不要默认的toolbar
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace, no-unused-vars
namespace CPWFactory {
  export interface ICPWFactoryOptions
    extends DocumentRegistry.IWidgetFactoryOptions {
    commands: CommandRegistry;
  }
}

// eslint-disable-next-line no-redeclare
export class CPWFactory extends ABCWidgetFactory<CPWDocumentWidget, DocumentRegistry.IModel> {
  constructor (options: CPWFactory.ICPWFactoryOptions) {
    super(options)
    this._commands = options.commands
  }

  protected createNewWidget (context: DocumentRegistry.Context): CPWDocumentWidget {
    return new CPWDocumentWidget({
      context,
      content: new CPWWidget({ commands: this._commands, context }),
    })
  }

  private _commands: CommandRegistry
}
