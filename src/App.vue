<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <h1 class="text-3xl font-bold text-gray-900">🔍 AI中转站导航</h1>
        <p class="mt-2 text-gray-600">数据同步自 aibijia.org · 一键比价，帮你找便宜Token</p>
        <p v-if="data" class="mt-1 text-sm text-gray-400">
          最后更新: {{ formatTime(data.updatedAt) }} · 共 {{ totalOffers }} 条报价
        </p>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      <p class="mt-4 text-gray-500">加载数据中...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="max-w-7xl mx-auto px-4 py-20 text-center">
      <p class="text-red-500">❌ {{ error }}</p>
      <button @click="loadData" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        重试
      </button>
    </div>

    <!-- Main Content -->
    <main v-else-if="data" class="max-w-7xl mx-auto px-4 py-8">
      <!-- 产品卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div 
          v-for="product in data.products" 
          :key="product.slug"
          class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
          :class="{ 'ring-2 ring-blue-500': selectedProduct === product.slug }"
          @click="selectedProduct = product.slug"
        >
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-xl font-bold text-gray-900">{{ product.name }}</h2>
                <p class="text-sm text-gray-500 mt-1">{{ product.summary }}</p>
              </div>
              <div class="text-right">
                <span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  {{ product.availableCount }} 个报价
                </span>
              </div>
            </div>
            
            <div class="grid grid-cols-3 gap-4 text-center">
              <div class="bg-blue-50 rounded-lg p-3">
                <div class="text-2xl font-bold text-blue-600">
                  ¥{{ product.stats.cheapest }}
                </div>
                <div class="text-xs text-gray-500 mt-1">最低价</div>
                <div class="text-xs text-gray-400">{{ product.stats.cheapestPlatform }}</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="text-2xl font-bold text-gray-600">
                  ¥{{ product.stats.avgPrice }}
                </div>
                <div class="text-xs text-gray-500 mt-1">平均价</div>
              </div>
              <div class="bg-red-50 rounded-lg p-3">
                <div class="text-2xl font-bold text-red-600">
                  ¥{{ product.stats.mostExpensive }}
                </div>
                <div class="text-xs text-gray-500 mt-1">最高价</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 选中产品的详细报价 -->
      <div v-if="selectedProductData" class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="px-6 py-4 bg-gray-50 border-b">
          <h3 class="text-lg font-bold text-gray-900">
            {{ selectedProductData.name }} - 全部报价
          </h3>
          <p class="text-sm text-gray-500 mt-1">
            按价格排序，共 {{ selectedProductData.offers.length }} 条可用报价
          </p>
        </div>
        
        <!-- 筛选 -->
        <div class="px-6 py-3 border-b flex flex-wrap gap-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索平台或商品..."
            class="px-3 py-2 border rounded-lg text-sm w-64"
          />
          <select v-model="statusFilter" class="px-3 py-2 border rounded-lg text-sm">
            <option value="all">全部状态</option>
            <option value="in_stock">有货</option>
            <option value="low_stock">库存紧张</option>
          </select>
          <select v-model="platformFilter" class="px-3 py-2 border rounded-lg text-sm">
            <option value="">全部平台</option>
            <option v-for="p in platforms" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
        
        <!-- 报价表格 -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">排名</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">平台</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">价格</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">标签</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr 
                v-for="(offer, index) in filteredOffers" 
                :key="offer.id"
                :class="{ 'bg-green-50': index === 0 }"
              >
                <td class="px-6 py-4">
                  <span 
                    class="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
                    :class="{
                      'bg-yellow-100 text-yellow-800': index === 0,
                      'bg-gray-100 text-gray-600': index > 0
                    }"
                  >
                    {{ index + 1 }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm font-medium text-gray-900">{{ offer.platform }}</div>
                  <div class="text-xs text-gray-500">{{ offer.storeName }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900 max-w-xs truncate">{{ offer.title }}</div>
                </td>
                <td class="px-6 py-4">
                  <div 
                    class="text-lg font-bold"
                    :class="{
                      'text-green-600': index === 0,
                      'text-gray-900': index > 0
                    }"
                  >
                    ¥{{ offer.price }}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span 
                    class="inline-block px-2 py-1 text-xs rounded-full"
                    :class="{
                      'bg-green-100 text-green-800': offer.status === 'in_stock',
                      'bg-yellow-100 text-yellow-800': offer.status === 'low_stock'
                    }"
                  >
                    {{ offer.status === 'in_stock' ? '有货' : '库存紧张' }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-1">
                    <span 
                      v-for="tag in offer.tags" 
                      :key="tag"
                      class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <a 
                    :href="offer.url" 
                    target="_blank" 
                    class="text-blue-500 hover:text-blue-700 text-sm font-medium"
                  >
                    购买 →
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div v-if="filteredOffers.length === 0" class="px-6 py-8 text-center text-gray-500">
          没有找到匹配的报价
        </div>
      </div>

      <!-- 数据来源说明 -->
      <div class="mt-8 text-center text-sm text-gray-400">
        <p>数据来源：<a href="https://aibijia.org" target="_blank" class="text-blue-400 hover:underline">aibijia.org</a></p>
        <p class="mt-1">价格数据仅供参考，实际价格以各平台为准</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchProducts, getPlatforms } from './data'

const loading = ref(true)
const error = ref(null)
const data = ref(null)
const selectedProduct = ref('chatgpt')
const searchQuery = ref('')
const statusFilter = ref('all')
const platformFilter = ref('')

const loadData = async () => {
  loading.value = true
  error.value = null
  
  try {
    const result = await fetchProducts()
    if (result) {
      data.value = result
      // 默认选中第一个产品
      if (result.products.length > 0) {
        selectedProduct.value = result.products[0].slug
      }
    } else {
      error.value = '获取数据失败，请稍后重试'
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const selectedProductData = computed(() => {
  if (!data.value) return null
  return data.value.products.find(p => p.slug === selectedProduct.value)
})

const platforms = computed(() => {
  if (!selectedProductData.value) return []
  return [...new Set(selectedProductData.value.offers.map(o => o.platform))].sort()
})

const filteredOffers = computed(() => {
  if (!selectedProductData.value) return []
  
  let offers = [...selectedProductData.value.offers]
  
  // 状态筛选
  if (statusFilter.value !== 'all') {
    offers = offers.filter(o => o.status === statusFilter.value)
  }
  
  // 平台筛选
  if (platformFilter.value) {
    offers = offers.filter(o => o.platform === platformFilter.value)
  }
  
  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    offers = offers.filter(o => 
      o.platform.toLowerCase().includes(query) ||
      o.storeName.toLowerCase().includes(query) ||
      o.title.toLowerCase().includes(query)
    )
  }
  
  return offers
})

const totalOffers = computed(() => {
  if (!data.value) return 0
  return data.value.products.reduce((sum, p) => sum + p.totalOffers, 0)
})

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(loadData)
</script>
