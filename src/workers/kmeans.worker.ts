type RGB3 = [number, number, number]

function sqDist(a: RGB3, b: RGB3): number {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
}

function nearestIdx(pixel: RGB3, centroids: RGB3[]): number {
  let best = 0, bestD = Infinity
  for (let i = 0; i < centroids.length; i++) {
    const d = sqDist(pixel, centroids[i])
    if (d < bestD) { bestD = d; best = i }
  }
  return best
}

// k-means++ seeding — picks centroids with probability ∝ squared distance from nearest existing
function seed(pixels: RGB3[], k: number): RGB3[] {
  const centroids: RGB3[] = [pixels[Math.floor(Math.random() * pixels.length)]]
  while (centroids.length < k) {
    const dists = pixels.map(p => {
      let min = Infinity
      for (const c of centroids) { const d = sqDist(p, c); if (d < min) min = d }
      return min
    })
    const total = dists.reduce((a, b) => a + b, 0)
    let r = Math.random() * total
    for (let i = 0; i < dists.length; i++) {
      r -= dists[i]
      if (r <= 0) { centroids.push(pixels[i]); break }
    }
    if (centroids.length < k) centroids.push(pixels[pixels.length - 1])
  }
  return centroids
}

function kmeans(pixels: RGB3[], k: number, maxIter = 20): { centroids: RGB3[]; sizes: number[] } {
  let centroids = seed(pixels, k)
  const assignments = new Int32Array(pixels.length)

  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false
    for (let i = 0; i < pixels.length; i++) {
      const a = nearestIdx(pixels[i], centroids)
      if (a !== assignments[i]) { assignments[i] = a; changed = true }
    }
    if (!changed) break

    const sums: [number, number, number][] = Array.from({ length: k }, () => [0, 0, 0])
    const counts = new Int32Array(k)
    for (let i = 0; i < pixels.length; i++) {
      const a = assignments[i]
      sums[a][0] += pixels[i][0]
      sums[a][1] += pixels[i][1]
      sums[a][2] += pixels[i][2]
      counts[a]++
    }
    for (let j = 0; j < k; j++) {
      if (counts[j] > 0) {
        centroids[j] = [sums[j][0] / counts[j], sums[j][1] / counts[j], sums[j][2] / counts[j]]
      }
    }
  }

  // Final assignment for size calculation
  const counts = new Int32Array(k)
  for (let i = 0; i < pixels.length; i++) counts[nearestIdx(pixels[i], centroids)]++

  return {
    centroids,
    sizes: Array.from(counts).map(c => c / pixels.length),
  }
}

self.onmessage = (e: MessageEvent<{ buffer: ArrayBuffer; width: number; height: number; k: number }>) => {
  const { buffer, width, height, k } = e.data
  const data = new Uint8ClampedArray(buffer)

  // Sample every 4th pixel to keep computation fast on large images
  const pixels: RGB3[] = []
  const step = 4
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4
      if (data[i + 3] < 128) continue // skip transparent
      pixels.push([data[i], data[i + 1], data[i + 2]])
    }
  }

  const { centroids, sizes } = kmeans(pixels, Math.min(k, pixels.length))

  // Sort by cluster size descending
  const order = sizes.map((s, i) => ({ s, i })).sort((a, b) => b.s - a.s)
  const colors = order.map(o => ({
    r: Math.round(centroids[o.i][0]),
    g: Math.round(centroids[o.i][1]),
    b: Math.round(centroids[o.i][2]),
  }))
  const sortedSizes = order.map(o => o.s)

  self.postMessage({ colors, sizes: sortedSizes })
}
