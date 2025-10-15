<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Editor } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'

interface Props {
  modelValue?: object | null
  placeholder?: string
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: '在此撰写文章内容…',
  editable: true
})

const emit = defineEmits<{
  'update:modelValue': [value: object]
}>()

const isReady = ref(false)
const textColor = ref('#111827')
let cleanupSelectionHandlers: (() => void) | null = null

const sanitizeUrl = (value: string): string | null => {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  if (trimmed.startsWith('#') || trimmed.startsWith('/')) {
    return trimmed
  }
  try {
    const url = new URL(trimmed)
    if (['http:', 'https:', 'mailto:'].includes(url.protocol)) {
      return url.toString()
    }
  } catch {
    return null
  }
  return null
}

const editor = useEditor({
  editable: props.editable,
  content: props.modelValue ?? {
    type: 'doc',
    content: [
      {
        type: 'paragraph'
      }
    ]
  },
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3]
      }
    }),
    Underline,
    TextStyle,
    Color,
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: {
        rel: 'noopener noreferrer',
        target: '_blank'
      }
    }),
    Image.configure({
      allowBase64: false
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph']
    }),
    Table.configure({
      resizable: true
    }),
    TableRow,
    TableCell,
    TableHeader,
    Placeholder.configure({
      placeholder: () => props.placeholder
    })
  ],
  onUpdate({ editor }) {
    const json = editor.getJSON()
    emit('update:modelValue', json)
  }
})

onMounted(() => {
  isReady.value = true
})

onBeforeUnmount(() => {
  cleanupSelectionHandlers?.()
  editor.value?.destroy()
})

const bindSelectionHandlers = (instance: Editor) => {
  const updateState = () => {
    const attrs = instance.getAttributes('textStyle') ?? {}
    const color =
      typeof attrs === 'object' && attrs !== null && 'color' in attrs
        ? (attrs as Record<string, unknown>).color
        : undefined
    textColor.value = typeof color === 'string' && color ? color : '#111827'
  }
  instance.on('selectionUpdate', updateState)
  instance.on('transaction', updateState)
  updateState()

  cleanupSelectionHandlers = () => {
    instance.off('selectionUpdate', updateState)
    instance.off('transaction', updateState)
    cleanupSelectionHandlers = null
  }
}

watch(editor, (instance) => {
  cleanupSelectionHandlers?.()
  if (instance) {
    bindSelectionHandlers(instance)
  }
})

watch(
  () => props.modelValue,
  (value) => {
    if (!editor.value) {
      return
    }

    const current = editor.value.getJSON()
    if (JSON.stringify(current) === JSON.stringify(value)) {
      return
    }

    editor.value.commands.setContent(value ?? {
      type: 'doc',
      content: [{ type: 'paragraph' }]
    }, false)
  }
)

watch(
  () => props.editable,
  (value) => {
    editor.value?.setEditable(value)
  }
)

const toggle = (command: () => boolean) => {
  if (editor.value && props.editable) {
    const executed = command()
    if (executed) {
      editor.value.commands.focus()
    }
  }
}

const setHeading = (level: 1 | 2 | 3) => {
  toggle(() => editor.value!.chain().focus().toggleHeading({ level }).run())
}

const setList = (type: 'bulletList' | 'orderedList') => {
  if (type === 'bulletList') {
    toggle(() => editor.value!.chain().focus().toggleBulletList().run())
    return
  }
  toggle(() => editor.value!.chain().focus().toggleOrderedList().run())
}

const clearFormatting = () => {
  toggle(() => editor.value!.chain().focus().unsetAllMarks().clearNodes().unsetTextAlign().run())
}

const applyTextAlign = (value: 'left' | 'center' | 'right' | 'justify') => {
  toggle(() => editor.value!.chain().focus().setTextAlign(value).run())
}

const unsetLink = () => {
  toggle(() => editor.value!.chain().focus().unsetLink().run())
}

const promptForLink = () => {
  if (!editor.value || !props.editable || !import.meta.client) {
    return
  }
  const previous = editor.value.getAttributes('link').href as string | undefined
  const next = window.prompt('请输入链接地址（留空移除链接）', previous ?? 'https://')
  if (next === null) {
    return
  }
  const sanitized = sanitizeUrl(next)
  if (!sanitized) {
    unsetLink()
    return
  }
  toggle(() => editor.value!.chain().focus().setLink({ href: sanitized }).run())
}

const insertImage = () => {
  if (!editor.value || !props.editable || !import.meta.client) {
    return
  }
  const url = window.prompt('请输入图片地址（仅支持 http/https）')
  if (!url) {
    return
  }
  const sanitized = sanitizeUrl(url)
  if (!sanitized || !/^https?:/.test(sanitized)) {
    window.alert('图片地址无效，只支持 http 或 https 链接。')
    return
  }
  toggle(() => editor.value!.chain().focus().setImage({ src: sanitized }).run())
}

const insertTable = () => {
  toggle(() => editor.value!.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())
}

const addTableRow = () => {
  toggle(() => editor.value!.chain().focus().addRowAfter().run())
}

const addTableColumn = () => {
  toggle(() => editor.value!.chain().focus().addColumnAfter().run())
}

const deleteTable = () => {
  toggle(() => editor.value!.chain().focus().deleteTable().run())
}

const applyColor = (event: Event) => {
  if (!editor.value || !props.editable) {
    return
  }
  const target = event.target as HTMLInputElement | null
  if (!target) {
    return
  }
  textColor.value = target.value
  toggle(() => editor.value!.chain().focus().setColor(target.value).run())
}

const clearColor = () => {
  if (!editor.value || !props.editable) {
    return
  }
  textColor.value = '#111827'
  toggle(() => editor.value!.chain().focus().unsetColor().run())
}
</script>

<template>
  <div v-if="isReady && editor" class="rte">
    <div v-if="props.editable" class="rte__toolbar">
      <div class="rte__group">
        <button
          type="button"
          class="rte__button"
          :aria-pressed="editor.isActive('bold')"
          :disabled="!props.editable"
          @click="toggle(() => editor.chain().focus().toggleBold().run())"
        >
          <span>B</span>
        </button>
        <button
          type="button"
          class="rte__button"
          :aria-pressed="editor.isActive('italic')"
          :disabled="!props.editable"
          @click="toggle(() => editor.chain().focus().toggleItalic().run())"
        >
          <span>I</span>
        </button>
        <button
          type="button"
          class="rte__button"
          :aria-pressed="editor.isActive('underline')"
          :disabled="!props.editable"
          @click="toggle(() => editor.chain().focus().toggleUnderline().run())"
        >
          <span>U</span>
        </button>
      </div>

      <div class="rte__group">
        <button
          type="button"
          class="rte__button"
          :aria-pressed="editor.isActive('heading', { level: 2 })"
          :disabled="!props.editable"
          @click="setHeading(2)"
        >
          H2
        </button>
        <button
          type="button"
          class="rte__button"
          :aria-pressed="editor.isActive('heading', { level: 3 })"
          :disabled="!props.editable"
          @click="setHeading(3)"
        >
          H3
        </button>
        <button
          type="button"
          class="rte__button"
          :aria-pressed="editor.isActive('bulletList')"
          :disabled="!props.editable"
          @click="setList('bulletList')"
        >
          • 列表
        </button>
        <button
          type="button"
          class="rte__button"
          :aria-pressed="editor.isActive('orderedList')"
          :disabled="!props.editable"
          @click="setList('orderedList')"
        >
          1. 列表
        </button>
      </div>

      <div class="rte__group">
        <button
          type="button"
          class="rte__button"
          :aria-pressed="editor.isActive({ textAlign: 'left' })"
          :disabled="!props.editable"
          @click="applyTextAlign('left')"
        >
          居左
        </button>
        <button
          type="button"
          class="rte__button"
          :aria-pressed="editor.isActive({ textAlign: 'center' })"
          :disabled="!props.editable"
          @click="applyTextAlign('center')"
        >
          居中
        </button>
        <button
          type="button"
          class="rte__button"
          :aria-pressed="editor.isActive({ textAlign: 'right' })"
          :disabled="!props.editable"
          @click="applyTextAlign('right')"
        >
          居右
        </button>
        <button
          type="button"
          class="rte__button"
          :aria-pressed="editor.isActive({ textAlign: 'justify' })"
          :disabled="!props.editable"
          @click="applyTextAlign('justify')"
        >
          两端
        </button>
      </div>

      <div class="rte__group">
        <label class="rte__color">
          <span>颜色</span>
          <input
            :value="textColor"
            type="color"
            :disabled="!props.editable"
            @input="applyColor"
          >
        </label>
        <button
          type="button"
          class="rte__button"
          :disabled="!props.editable"
          @click="clearColor"
        >
          重置颜色
        </button>
      </div>

      <div class="rte__group">
        <button
          type="button"
          class="rte__button"
          :aria-pressed="editor.isActive('link')"
          :disabled="!props.editable"
          @click="promptForLink"
        >
          链接
        </button>
        <button
          type="button"
          class="rte__button"
          :disabled="!props.editable"
          @click="unsetLink"
        >
          移除链接
        </button>
        <button
          type="button"
          class="rte__button"
          :disabled="!props.editable"
          @click="insertImage"
        >
          图片
        </button>
      </div>

      <div class="rte__group">
        <button
          type="button"
          class="rte__button"
          :disabled="!props.editable"
          @click="insertTable"
        >
          插入表格
        </button>
        <button
          type="button"
          class="rte__button"
          :disabled="!props.editable || !editor.isActive('table')"
          @click="addTableRow"
        >
          新增行
        </button>
        <button
          type="button"
          class="rte__button"
          :disabled="!props.editable || !editor.isActive('table')"
          @click="addTableColumn"
        >
          新增列
        </button>
        <button
          type="button"
          class="rte__button"
          :disabled="!props.editable || !editor.isActive('table')"
          @click="deleteTable"
        >
          删除表格
        </button>
      </div>

      <div class="rte__group">
        <button
          type="button"
          class="rte__button"
          :disabled="!props.editable"
          @click="clearFormatting"
        >
          清除格式
        </button>
      </div>
    </div>
    <EditorContent :editor="editor" class="rte__content" />
  </div>
  <div v-else class="rte__placeholder">
    正在加载编辑器…
  </div>
</template>

<style scoped>
.rte {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
}

.rte__toolbar {
  border-bottom: 1px solid #e5e7eb;
  padding: 8px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  background-color: #f9fafb;
}

.rte__group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rte__button {
  appearance: none;
  border: 1px solid transparent;
  background-color: #f3f4f6;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 13px;
  cursor: pointer;
  color: #374151;
}

.rte__button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.rte__button:hover {
  background-color: #e5e7eb;
}

.rte__button[aria-pressed='true'] {
  background-color: #111827;
  color: #ffffff;
}

.rte__color {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #374151;
}

.rte__color input {
  appearance: none;
  width: 32px;
  height: 32px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0;
  background: none;
  cursor: pointer;
}

.rte__color input:disabled {
  cursor: not-allowed;
}

.rte__content {
  min-height: 220px;
  padding: 16px;
  line-height: 1.7;
  color: #111827;
}

.rte__content :deep(p) {
  margin: 12px 0;
}

.rte__content :deep(h2) {
  font-size: 20px;
  font-weight: 600;
  margin: 20px 0 12px;
}

.rte__content :deep(h3) {
  font-size: 18px;
  font-weight: 600;
  margin: 18px 0 10px;
}

.rte__content :deep(ul),
.rte__content :deep(ol) {
  padding-left: 20px;
  margin: 12px 0;
}

.rte__content :deep(blockquote) {
  border-left: 3px solid #d1d5db;
  padding-left: 12px;
  color: #6b7280;
  margin: 16px 0;
}

.rte__content :deep(a) {
  color: #2563eb;
  text-decoration: underline;
}

.rte__content :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 12px 0;
  border-radius: 6px;
}

.rte__content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: 14px;
}

.rte__content :deep(th),
.rte__content :deep(td) {
  border: 1px solid #e5e7eb;
  padding: 8px;
  text-align: left;
}

.rte__placeholder {
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  padding: 16px;
  color: #6b7280;
  font-size: 14px;
  text-align: center;
}
</style>
