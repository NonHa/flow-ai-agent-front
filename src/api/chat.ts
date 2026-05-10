import { apiGet, createSseConnection, type ApiResponse } from './http'

export interface GraphStats {
  nodeCount: number
  edgeCount: number
  ready: boolean
}

type StreamChatArgs = {
  chatId: string
  message: string
  graphStats: GraphStats
  onStart?: () => void
  onDelta?: (delta: string) => void
  onDone?: () => void
  onError?: (error: Error) => void
}

export const streamChat = ({
  chatId,
  message,
  graphStats,
  onStart,
  onDelta,
  onDone,
  onError,
}: StreamChatArgs) => {
  const connection = createSseConnection({
    url: '/ai/chat',
    params: {
      chatId,
      message,
      nodeCount: graphStats.nodeCount,
      edgeCount: graphStats.edgeCount,
    },
    onOpen: () => {
      onStart?.()
    },
    onMessage: (rawData) => {
      if (!rawData) return
      if (rawData === '[DONE]') {
        onDone?.()
        connection.close()
        return
      }

      try {
        const payload = JSON.parse(rawData) as {
          type?: string
          content?: string
        }
        if (payload.type === 'done') {
          onDone?.()
          connection.close()
          return
        }
        if (payload.type === 'delta') {
          onDelta?.(payload.content || '')
          return
        }
        if (payload.content) {
          onDelta?.(payload.content)
        }
      } catch {
        onDelta?.(rawData)
      }
    },
    onError: () => {
      onError?.(new Error('SSE 连接异常，请检查后端服务'))
    },
  })

  return connection
}

type RequestChatArgs = {
  chatId: string
  message: string
  graphStats: GraphStats
}

export interface ChatAnswerData {
  answer?: string
  content?: string
}

export const requestChat = async ({
  chatId,
  message,
  graphStats,
}: RequestChatArgs): Promise<ApiResponse<ChatAnswerData>> => {
  const response = await apiGet<ChatAnswerData>('/ai/chat', {
    params: {
      chatId,
      message,
      nodeCount: graphStats.nodeCount,
      edgeCount: graphStats.edgeCount,
    },
  })

  return response
}
