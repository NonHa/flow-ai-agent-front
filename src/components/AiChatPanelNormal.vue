<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { requestChat } from '../api/chat'

type GraphStats = {
  nodeCount: number
  edgeCount: number
  ready: boolean
}

type QaItem = {
  qaId: string
  question: string
  answer: string
}

type ChatApiResponse =
  | {
      answer?: string
      content?: string
    }
  | string

const props = defineProps<{
  getGraphStats: () => GraphStats
}>()

const chatBodyRef = ref<HTMLDivElement | null>(null)
const chatInput = ref<string>('')
const isReplying = ref<boolean>(false)
const currentChatId = ref<string>(`chat-${Date.now()}`)
const qaList = ref<QaItem[]>([])

const scrollChatToBottom = async (): Promise<void> => {
  await nextTick()
  if (chatBodyRef.value) {
    chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
  }
}

const getAnswerText = (response: ChatApiResponse): string => {
  if (typeof response === 'string') return response
  return response?.answer || response?.content || '未返回有效回答内容'
}

const sendMessage = async (): Promise<void> => {
  const content = chatInput.value.trim()
  if (!content || isReplying.value) return

  const qaId = `qa-${Date.now()}`
  qaList.value.push({
    qaId,
    question: content,
    answer: '',
  })
  chatInput.value = ''
  isReplying.value = true
  await scrollChatToBottom()

  const stats = props.getGraphStats()
  if (!stats.ready) {
    const qaItem = qaList.value.find((item) => item.qaId === qaId)
    if (qaItem) {
      qaItem.answer = '当前流程图尚未初始化，请稍后再试。'
    }
    isReplying.value = false
    await scrollChatToBottom()
    return
  }

  try {
    const response = await requestChat({
      chatId: currentChatId.value,
      message: content,
      graphStats: stats,
    })
    const qaItem = qaList.value.find((item) => item.qaId === qaId)
    if (qaItem) {
      qaItem.answer = getAnswerText(response.data)
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : '请稍后重试'
    const qaItem = qaList.value.find((item) => item.qaId === qaId)
    if (qaItem) {
      qaItem.answer = `请求失败：${errorMessage}`
    }
  } finally {
    isReplying.value = false
    await scrollChatToBottom()
  }
}
</script>

<template>
  <aside class="chat-panel">
    <header class="chat-header">
      <h2>AI 对话助手</h2>
      <span>{{ isReplying ? '思考中...' : '在线' }}</span>
    </header>

    <div ref="chatBodyRef" class="chat-body">
      <div class="qa-intro">
        当前为普通问答请求模式（非 SSE）。请输入问题，我会以问答形式返回结果。
      </div>
      <div
        v-for="qa in qaList"
        :key="qa.qaId"
        class="qa-card"
      >
        <div class="qa-row question">
          <span class="label">问</span>
          <p>{{ qa.question }}</p>
        </div>
        <div class="qa-row answer">
          <span class="label">答</span>
          <p>{{ qa.answer || (isReplying ? '正在生成回答...' : ' ') }}</p>
        </div>
      </div>
    </div>

    <footer class="chat-input-area">
      <textarea
        v-model="chatInput"
        placeholder="输入你的问题，比如：帮我优化当前流程节点设计"
        @keydown.enter.exact.prevent="sendMessage"
      />
      <button type="button" :disabled="isReplying" @click="sendMessage">发送</button>
    </footer>
  </aside>
</template>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 680px;
  min-width: 320px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
}

.chat-header h2 {
  margin: 0;
  font-size: 16px;
}

.chat-header span {
  font-size: 12px;
  color: #6b7280;
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f9fafb;
}

.qa-intro {
  font-size: 13px;
  color: #6b7280;
  background: #ffffff;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  padding: 10px;
}

.qa-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 12px;
}

.qa-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.qa-row + .qa-row {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}

.qa-row .label {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex: 0 0 auto;
}

.qa-row p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  color: #111827;
}

.qa-row.question .label {
  color: #ffffff;
  background: #2563eb;
}

.qa-row.answer .label {
  color: #ffffff;
  background: #10b981;
}

.chat-input-area {
  border-top: 1px solid #e5e7eb;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-input-area textarea {
  width: 100%;
  min-height: 72px;
  resize: vertical;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px;
  font-family: inherit;
  font-size: 14px;
}

.chat-input-area button {
  align-self: flex-end;
  border: none;
  background: #2563eb;
  color: #fff;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
}

.chat-input-area button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
