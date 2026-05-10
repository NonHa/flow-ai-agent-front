<script setup lang="ts">
import { ref } from 'vue'
import FlowDiagram from './components/FlowDiagram.vue'
import AiChatPanelNormal from './components/AiChatPanelNormal.vue'
import type { GraphStats } from './api/chat'

type FlowDiagramExpose = {
  getGraphStats: () => GraphStats
}

const flowRef = ref<FlowDiagramExpose | null>(null)

const getGraphStats = (): GraphStats => {
  if (!flowRef.value) {
    return { nodeCount: 0, edgeCount: 0, ready: false }
  }
  return flowRef.value.getGraphStats()
}
</script>

<template>
  <main class="app-shell">
    <section class="content-layout">
      <FlowDiagram ref="flowRef" />
      <AiChatPanelNormal :get-graph-stats="getGraphStats" />
    </section>
  </main>
</template>
