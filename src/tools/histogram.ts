// BT.601 luma coefficients — consistent with value-map.ts and notan.ts
export function computeLumaHistogram(data: ImageData): Uint32Array {
  const buckets = new Uint32Array(256)
  for (let i = 0; i < data.data.length; i += 4) {
    if (data.data[i + 3] < 128) continue
    const luma = Math.round(
      0.299 * data.data[i] +
      0.587 * data.data[i + 1] +
      0.114 * data.data[i + 2],
    )
    buckets[luma]++
  }
  return buckets
}
