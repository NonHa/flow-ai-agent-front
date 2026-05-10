<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import LogicFlow from '@logicflow/core'
import { Control, DndPanel, MiniMap, Snapshot } from '@logicflow/extension'
import '@logicflow/core/es/index.css'
import '@logicflow/extension/lib/style/index.css'
import type { GraphStats } from '../api/chat'

LogicFlow.use(DndPanel)
LogicFlow.use(Control)
LogicFlow.use(MiniMap)
LogicFlow.use(Snapshot)

const containerRef = ref<HTMLDivElement | null>(null)
let lfInstance: LogicFlow | null = null

const defaultGraphData = {
  nodes: [
    { id: 'start-node', type: 'circle', x: 180, y: 200, text: '开始' },
    { id: 'task-node', type: 'rect', x: 360, y: 200, text: '处理任务' },
    { id: 'end-node', type: 'diamond', x: 560, y: 200, text: '结束?' },
  ],
  edges: [
    {
      id: 'edge-start-task',
      type: 'polyline',
      sourceNodeId: 'start-node',
      targetNodeId: 'task-node',
      text: '下一步',
    },
    {
      id: 'edge-task-end',
      type: 'polyline',
      sourceNodeId: 'task-node',
      targetNodeId: 'end-node',
      text: '判断',
    },
  ],
}

const initDndPanel = () => {
  const dndPanel = (lfInstance?.extension as { dndPanel?: { setPatternItems: (items: unknown[]) => void } })?.dndPanel
  if (!dndPanel) return
  const panelItems = [
    { type: 'rect', text: '矩形节点', label: '矩形' },
    { type: 'circle', text: '圆形节点', label: '圆形' },
    { type: 'diamond', text: '菱形节点', label: '菱形' },
  ]
  dndPanel.setPatternItems(panelItems)
}

const resetGraph = () => {
  if (!lfInstance) return
  lfInstance.render(defaultGraphData)
}

const exportGraph = () => {
  if (!lfInstance) return
  const data = lfInstance.getGraphData()
  const dataString = JSON.stringify(data, null, 2)
  console.log('LogicFlow graph data:\n', dataString)
  window.alert('已在控制台输出当前流程 JSON 数据')
}

const getGraphStats = (): GraphStats => {
  if (!lfInstance) return { nodeCount: 0, edgeCount: 0, ready: false }
  const graph = lfInstance.getGraphData() as {
    nodes?: unknown[]
    edges?: unknown[]
  }
  return {
    nodeCount: graph.nodes?.length ?? 0,
    edgeCount: graph.edges?.length ?? 0,
    ready: true,
  }
}

defineExpose({ getGraphStats })

onMounted(() => {
  if (!containerRef.value) return

  lfInstance = new LogicFlow({
    container: containerRef.value,
    grid: true,
    keyboard: { enabled: true },
  })

  lfInstance.render(defaultGraphData)
  lfInstance.translateCenter()
  initDndPanel()
})

onBeforeUnmount(() => {
  lfInstance = null
})
</script>

<template>
  <section class="flow-wrapper">
    <header class="toolbar">
      <h1>LogicFlow + Vue3 示例</h1>
      <div class="actions">
        <button type="button" @click="resetGraph">重置示例流程</button>
        <button type="button" @click="exportGraph">导出 JSON</button>
      </div>
    </header>
    <section ref="containerRef" class="flow-container" />
  </section>
</template>

<style scoped>
.flow-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.toolbar h1 {
  margin: 0;
  font-size: 20px;
}

.actions {
  display: flex;
  gap: 8px;
}

.actions button {
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.actions button:hover {
  background: #f9fafb;
}

.flow-container {
  flex: 1;
  min-height: 680px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}
</style>
