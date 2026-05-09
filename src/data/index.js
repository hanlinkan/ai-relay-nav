// AI中转站数据 - 同步自 aibijia.org
export const fetchProducts = async () => {
  try {
    const res = await fetch('https://data.aibijia.org/products.json')
    const data = await res.json()
    
    // 处理数据，添加统计信息
    const products = data.products.map(product => {
      const offers = product.offers.map(offer => ({
        id: `${offer.platform_name}-${offer.source_title}`,
        platform: offer.platform_name,
        storeName: offer.source_store_name,
        title: offer.source_title,
        price: offer.price,
        currency: offer.currency,
        status: offer.status, // in_stock, low_stock, out_of_stock
        url: offer.url,
        updatedAt: offer.updated_at,
        tags: offer.display_tags || []
      }))
      
      // 按价格排序，只显示有库存的
      const inStock = offers.filter(o => o.status === 'in_stock')
      const lowStock = offers.filter(o => o.status === 'low_stock')
      const allAvailable = [...inStock, ...lowStock]
      
      const sorted = allAvailable.sort((a, b) => a.price - b.price)
      const cheapest = sorted[0]
      const mostExpensive = sorted[sorted.length - 1]
      
      return {
        slug: product.slug,
        name: product.name,
        summary: product.summary,
        category: product.category,
        updatedAt: product.updated_at,
        offers: sorted,
        totalOffers: offers.length,
        availableCount: allAvailable.length,
        stats: {
          cheapest: cheapest?.price || null,
          cheapestPlatform: cheapest?.platform || null,
          mostExpensive: mostExpensive?.price || null,
          avgPrice: allAvailable.length > 0 
            ? Math.round(allAvailable.reduce((sum, o) => sum + o.price, 0) / allAvailable.length * 100) / 100
            : null
        }
      }
    })
    
    return {
      site: data.site,
      products,
      updatedAt: data.site.updated_at
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    return null
  }
}

// 获取所有平台列表
export const getPlatforms = (products) => {
  const platforms = new Set()
  products.forEach(p => {
    p.offers.forEach(o => platforms.add(o.platform))
  })
  return [...platforms].sort()
}
