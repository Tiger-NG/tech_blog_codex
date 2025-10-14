<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'

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
  editor.value?.destroy()
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

const toggle = (command: () => void) => {
  if (editor.value && props.editable) {
    command()
    editor.value.commands.focus()
  }
}
</script>

<template>
  <div v-if="isReady && editor" class="rte">
    <div class="rte__toolbar">
      <button
        type="button"
        class="rte__button"
        :aria-pressed="editor.isActive('bold')"
        @click="toggle(() => editor.chain().toggleBold().run())"
      >
        <span>B</span>
      </button>
      <button
        type="button"
        class="rte__button"
        :aria-pressed="editor.isActive('italic')"
        @click="toggle(() => editor.chain().toggleItalic().run())"
      >
        <span>I</span>
      </button>
      <button
        type="button"
        class="rte__button"
        :aria-pressed="editor.isActive('underline')"
        @click="toggle(() => editor.chain().toggleUnderline().run())"
      >
        <span>U</span>
      </button>
      <button
        type="button"
        class="rte__button"
        :aria-pressed="editor.isActive('heading', { level: 2 })"
        @click="toggle(() => editor.chain().toggleHeading({ level: 2 }).run())"
      >
        H2
      </button>
      <button
        type="button"
        class="rte__button"
        :aria-pressed="editor.isActive('heading', { level: 3 })"
        @click="toggle(() => editor.chain().toggleHeading({ level: 3 }).run())"
      >
        H3
      </button>
      <button
        type="button"
        class="rte__button"
        :aria-pressed="editor.isActive('bulletList')"
        @click="toggle(() => editor.chain().toggleBulletList().run())"
      >
        • List
      </button>
      <button
        type="button"
        class="rte__button"
        :aria-pressed="editor.isActive('orderedList')"
        @click="toggle(() => editor.chain().toggleOrderedList().run())"
      >
        1. List
      </button>
      <button
        type="button"
        class="rte__button"
        @click="toggle(() => editor.chain().unsetAllMarks().clearNodes().run())"
      >
        清除
      </button>
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
  gap: 6px;
  flex-wrap: wrap;
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

.rte__button:hover {
  background-color: #e5e7eb;
}

.rte__button[aria-pressed='true'] {
  background-color: #111827;
  color: #ffffff;
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

.rte__placeholder {
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  padding: 16px;
  color: #6b7280;
  font-size: 14px;
  text-align: center;
}
</style>
