export type LargeObject = { [key: string]: number }

export function generateLargeObject(size: number): LargeObject {
  const largeObject: LargeObject = {}

  for (let i = 0; i < size; i++) {
    const key = `key${i}`
    const value = Math.random()
    largeObject[key] = value
  }

  return largeObject
}

export type LargeNumberArrayObject = { numbers: number[] }

export function generateLargeNumberArrayObject(count: number): LargeNumberArrayObject {
  const numbers = new Array(count).fill(1)
  return { numbers }
}
