<template>
  <div class="min-h-screen">
    <!-- 头部 -->
    <header class="sticky top-0 z-50 bg-[#0f172a]/95 backdrop-blur-sm border-b border-white/10">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-3xl">🤖</span>
            <div>
              <h1 class="text-xl font-bold">AI中转站导航</h1>
              <p class="text-xs text-gray-400">对比价格 · 选择最优 · 省钱省心</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-400">收录 {{ relays.length }} 个中转站</span>
            <button @click="showSubmit = true" class="btn-primary text-sm">
              + 提交中转站
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="max-w-7xl mx-auto px-4 py-8">
      <!-- 搜索和筛选 -->
      <div class="mb-8">
        <div class="flex flex-col md:flex-row gap-4 mb-6">
          <div class="flex-1">
            <input
              v-model="search"
              type="text"
              placeholder="搜索中转站名称、模型..."
              class="search-input"
            />
          </div>
          <div class="flex gap-2">
            <select v-model="region" class="search-input w-auto">
              <option value="all">全部地区</option>
              <option value="china">国内</option>
              <option value="global">海外</option>
            </select>
            <select v-model="sortBy" class="search-input w-auto">
              <option value="rating">按评分</option>
              <option value="price">按价格</option>
              <option value="speed">按速度</option>
            </select>
          </div>
        </div>

        <!-- 快速筛选标签 -->
        <div class="flex flex-wrap gap-2">
          <button
            v-for="cat in modelCategories"
            :key="cat.id"
            @click="selectedCategory = cat.id"
            :class="[
              'px-4 py-2 rounded-full text-sm transition-all',
              selectedCategory === cat.id
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            ]"
          >
            {{ cat.icon }} {{ cat.name }}
          </button>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold text-blue-400">{{ relays.length }}</div>
          <div class="text-sm text-gray-400">收录中转站</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold text-green-400">{{ cheapestPrice }}</div>
          <div class="text-sm text-gray-400">最低价格 (¥/1M)</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold text-yellow-400">{{ avgRating }}</div>
          <div class="text-sm text-gray-400">平均评分</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold text-purple-400">{{ totalModels }}</div>
          <div class="text-sm text-gray-400">支持模型</div>
        </div>
      </div>

      <!-- 中转站列表 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="relay in filteredRelays"
          :key="relay.id"
          class="card p-6 cursor-pointer"
          @click="selectedRelay = relay"
        >
          <!-- 头部 -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <span class="text-3xl">{{ relay.logo }}</span>
              <div>
                <h3 class="font-semibold text-lg">{{ relay.name }}</h3>
                <a :href="relay.url" target="_blank" class="text-xs text-blue-400 hover:underline">
                  {{ relay.url }}
                </a>
              </div>
            </div>
            <span :class="['badge', relay.region === 'china' ? 'badge-green' : 'badge-blue']">
              {{ relay.region === 'china' ? '🇨🇳 国内' : '🌐 海外' }}
            </span>
          </div>

          <!-- 描述 -->
          <p class="text-sm text-gray-400 mb-4">{{ relay.description }}</p>

          <!-- 评分和速度 -->
          <div class="flex items-center gap-4 mb-4">
            <div class="flex items-center gap-1">
              <span class="rating">⭐</span>
              <span class="font-semibold">{{ relay.rating }}</span>
              <span class="text-xs text-gray-400">({{ relay.reviews }})</span>
            </div>
            <div class="flex items-center gap-1">
              <span>{{ speedLevels[relay.speed]?.icon }}</span>
              <span class="text-sm" :style="{ color: speedLevels[relay.speed]?.color }">
                {{ speedLevels[relay.speed]?.label }}
              </span>
            </div>
          </div>

          <!-- 支持模型 -->
          <div class="flex flex-wrap gap-1 mb-4">
            <span
              v-for="model in relay.models.slice(0, 3)"
              :key="model"
              class="badge badge-blue text-xs"
            >
              {{ model }}
            </span>
            <span v-if="relay.models.length > 3" class="badge badge-blue text-xs">
              +{{ relay.models.length - 3 }}
            </span>
          </div>

          <!-- 价格示例 -->
          <div class="border-t border-white/10 pt-4">
            <div class="text-xs text-gray-400 mb-2">参考价格</div>
            <div class="grid grid-cols-2 gap-2">
              <div v-for="(price, model) in Object.entries(relay.pricing).slice(0, 2)" :key="model[0]">
                <div class="text-xs text-gray-500">{{ model[0] }}</div>
                <div class="price text-sm">
                  {{ model[1].input }} {{ model[1].unit.replace('/1M tokens', '') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredRelays.length === 0" class="text-center py-16">
        <div class="text-4xl mb-4">🔍</div>
        <div class="text-gray-400">没有找到匹配的中转站</div>
        <button @click="resetFilters" class="btn-primary mt-4">重置筛选</button>
      </div>
    </main>

    <!-- 详情弹窗 -->
    <div v-if="selectedRelay" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" @click.self="selectedRelay = null">
      <div class="bg-[#1e293b] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div class="flex justify-between items-start mb-6">
          <div class="flex items-center gap-3">
            <span class="text-4xl">{{ selectedRelay.logo }}</span>
            <div>
              <h2 class="text-2xl font-bold">{{ selectedRelay.name }}</h2>
              <a :href="selectedRelay.url" target="_blank" class="text-blue-400 hover:underline">
                {{ selectedRelay.url }}
              </a>
            </div>
          </div>
          <button @click="selectedRelay = null" class="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        <p class="text-gray-300 mb-6">{{ selectedRelay.description }}</p>

        <!-- 详细价格表 -->
        <h3 class="font-semibold mb-4">💰 价格详情</h3>
        <div class="table-container mb-6">
          <table>
            <thead>
              <tr>
                <th>模型</th>
                <th>输入价格</th>
                <th>输出价格</th>
                <th>单位</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(price, model) in selectedRelay.pricing" :key="model">
                <td class="font-medium">{{ model }}</td>
                <td class="price">{{ price.input }}</td>
                <td class="price">{{ price.output }}</td>
                <td class="text-gray-400 text-sm">{{ price.unit }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 优缺点 -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 class="font-semibold mb-2 text-green-400">✅ 优点</h3>
            <ul class="space-y-1">
              <li v-for="pro in selectedRelay.pros" :key="pro" class="text-sm text-gray-300">
                • {{ pro }}
              </li>
            </ul>
          </div>
          <div>
            <h3 class="font-semibold mb-2 text-red-400">❌ 缺点</h3>
            <ul class="space-y-1">
              <li v-for="con in selectedRelay.cons" :key="con" class="text-sm text-gray-300">
                • {{ con }}
              </li>
            </ul>
          </div>
        </div>

        <!-- 支付方式 -->
        <h3 class="font-semibold mb-2">💳 支付方式</h3>
        <div class="flex flex-wrap gap-2 mb-6">
          <span v-for="method in selectedRelay.payment" :key="method" class="badge badge-green">
            {{ method }}
          </span>
        </div>

        <!-- 特性 -->
        <h3 class="font-semibold mb-2">✨ 特性</h3>
        <div class="flex flex-wrap gap-2">
          <span v-for="feature in selectedRelay.features" :key="feature" class="badge badge-blue">
            {{ feature }}
          </span>
        </div>
      </div>
    </div>

    <!-- 提交弹窗 -->
    <div v-if="showSubmit" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" @click.self="showSubmit = false">
      <div class="bg-[#1e293b] rounded-2xl max-w-md w-full p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">提交新中转站</h2>
          <button @click="showSubmit = false" class="text-gray-400 hover:text-white text-2xl">×</button>
        </div>
        <p class="text-gray-400 text-sm mb-4">
          如果你知道其他好用的AI中转站，欢迎提交！
        </p>
        <div class="space-y-4">
          <input type="text" placeholder="中转站名称" class="search-input" />
          <input type="url" placeholder="网址" class="search-input" />
          <textarea placeholder="简介" class="search-input h-24 resize-none"></textarea>
          <button class="btn-primary w-full">提交</button>
        </div>
      </div>
    </div>

    <!-- 底部 -->
    <footer class="border-t border-white/10 mt-16 py-8">
      <div class="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
        <p>AI中转站导航 - 帮你找到最合适的AI API服务</p>
        <p class="mt-2">数据仅供参考，价格可能随时变动</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { relays, modelCategories, speedLevels } from './data/relays.js'

const search = ref('')
const region = ref('all')
const sortBy = ref('rating')
const selectedCategory = ref('all')
const selectedRelay = ref(null)
const showSubmit = ref(false)

// 筛选后的中转站
const filteredRelays = computed(() => {
  let result = [...relays]

  // 搜索筛选
  if (search.value) {
    const query = search.value.toLowerCase()
    result = result.filter(r =>
      r.name.toLowerCase().includes(query) ||
      r.description.toLowerCase().includes(query) ||
      r.models.some(m => m.toLowerCase().includes(query))
    )
  }

  // 地区筛选
  if (region.value !== 'all') {
    result = result.filter(r => r.region === region.value)
  }

  // 模型分类筛选
  if (selectedCategory.value !== 'all') {
    const categoryMap = {
      gpt: ['gpt', 'openai'],
      claude: ['claude', 'anthropic'],
      llama: ['llama', 'meta'],
      qwen: ['qwen', 'tongyi', '通义'],
      deepseek: ['deepseek', '深度'],
      glm: ['glm', 'chatglm', '智谱'],
      yi: ['yi', '零一'],
    }
    const keywords = categoryMap[selectedCategory.value] || []
    result = result.filter(r =>
      r.models.some(m => keywords.some(k => m.toLowerCase().includes(k)))
    )
  }

  // 排序
  if (sortBy.value === 'rating') {
    result.sort((a, b) => b.rating - a.rating)
  } else if (sortBy.value === 'price') {
    result.sort((a, b) => {
      const aPrice = Object.values(a.pricing)[0]?.input || 0
      const bPrice = Object.values(b.pricing)[0]?.input || 0
      return aPrice - bPrice
    })
  }

  return result
})

// 统计数据
const cheapestPrice = computed(() => {
  let min = Infinity
  relays.forEach(r => {
    Object.values(r.pricing).forEach(p => {
      if (p.input < min) min = p.input
    })
  })
  return min.toFixed(2)
})

const avgRating = computed(() => {
  const sum = relays.reduce((acc, r) => acc + r.rating, 0)
  return (sum / relays.length).toFixed(1)
})

const totalModels = computed(() => {
  const models = new Set()
  relays.forEach(r => r.models.forEach(m => models.add(m)))
  return models.size
})

// 重置筛选
const resetFilters = () => {
  search.value = ''
  region.value = 'all'
  sortBy.value = 'rating'
  selectedCategory.value = 'all'
}
</script>
