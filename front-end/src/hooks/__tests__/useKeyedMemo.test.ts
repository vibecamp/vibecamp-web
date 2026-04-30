import { act, renderHook } from '@testing-library/react'
import { useState } from 'react'

import useKeyedMemo from '../useKeyedMemo'

type Inputs = Record<string, readonly unknown[]>

// Wrapper hook that lets a test drive both the inputs and observe the compute
// invocations. Each render uses the latest `inputs` from useState; `compute`
// is a jest.fn we can assert against.
function useTestKeyedMemo(initial: Inputs, compute: (key: string, deps: readonly unknown[]) => unknown) {
    const [inputs, setInputs] = useState<Inputs>(initial)
    const result = useKeyedMemo(inputs, compute)
    return { inputs, setInputs, result }
}

describe('useKeyedMemo', () => {
    it('returns one value per input key', () => {
        const compute = jest.fn((key: string, [n]: readonly unknown[]) => `${key}:${n}`)
        const { result } = renderHook(() => useTestKeyedMemo({ a: [1], b: [2] }, compute))

        expect(result.current.result).toEqual({ a: 'a:1', b: 'b:2' })
    })

    it('only recomputes entries whose deps changed', () => {
        const compute = jest.fn((key: string, [n]: readonly unknown[]) => ({ key, n }))
        const { result, rerender } = renderHook(
            ({ inputs }: { inputs: Inputs }) => useKeyedMemo(inputs, compute),
            { initialProps: { inputs: { a: [1], b: [2] } as Inputs } }
        )

        const first = result.current
        expect(compute).toHaveBeenCalledTimes(2)

        rerender({ inputs: { a: [1], b: [99] } })

        expect(compute).toHaveBeenCalledTimes(3) // only `b` recomputed
        expect(result.current.a).toBe(first.a) // identity preserved
        expect(result.current.b).not.toBe(first.b)
        expect(result.current.b).toEqual({ key: 'b', n: 99 })
    })

    it('preserves identity across renders when no deps change', () => {
        const compute = jest.fn((key: string, [n]: readonly unknown[]) => ({ key, n }))
        const { result, rerender } = renderHook(
            ({ inputs }: { inputs: Inputs }) => useKeyedMemo(inputs, compute),
            { initialProps: { inputs: { a: [1], b: [2] } as Inputs } }
        )

        const first = result.current
        rerender({ inputs: { a: [1], b: [2] } })

        expect(compute).toHaveBeenCalledTimes(2) // no extra calls
        expect(result.current).not.toBe(first) // outer object is fresh each render
        expect(result.current.a).toBe(first.a)
        expect(result.current.b).toBe(first.b)
    })

    it('treats new dep arrays with same contents as equal', () => {
        const compute = jest.fn((_key: string, [n]: readonly unknown[]) => n)
        const { rerender } = renderHook(
            ({ inputs }: { inputs: Inputs }) => useKeyedMemo(inputs, compute),
            { initialProps: { inputs: { a: [1, 'x'] } as Inputs } }
        )

        rerender({ inputs: { a: [1, 'x'] } })
        rerender({ inputs: { a: [1, 'x'] } })

        expect(compute).toHaveBeenCalledTimes(1)
    })

    it('recomputes when dep array length changes', () => {
        const compute = jest.fn((_key: string, deps: readonly unknown[]) => deps.length)
        const { result, rerender } = renderHook(
            ({ inputs }: { inputs: Inputs }) => useKeyedMemo(inputs, compute),
            { initialProps: { inputs: { a: [1] } as Inputs } }
        )

        expect(result.current.a).toBe(1)
        rerender({ inputs: { a: [1, 2] } })
        expect(result.current.a).toBe(2)
        expect(compute).toHaveBeenCalledTimes(2)
    })

    it('uses Object.is for dep comparison (NaN equals NaN)', () => {
        const compute = jest.fn((_key: string, [n]: readonly unknown[]) => n)
        const { rerender } = renderHook(
            ({ inputs }: { inputs: Inputs }) => useKeyedMemo(inputs, compute),
            { initialProps: { inputs: { a: [NaN] } as Inputs } }
        )

        rerender({ inputs: { a: [NaN] } })
        expect(compute).toHaveBeenCalledTimes(1)
    })

    it('uses Object.is for dep comparison (-0 differs from +0)', () => {
        const compute = jest.fn((_key: string, [n]: readonly unknown[]) => n)
        const { rerender } = renderHook(
            ({ inputs }: { inputs: Inputs }) => useKeyedMemo(inputs, compute),
            { initialProps: { inputs: { a: [0] } as Inputs } }
        )

        rerender({ inputs: { a: [-0] } })
        expect(compute).toHaveBeenCalledTimes(2)
    })

    it('drops cache entries for keys that disappear', () => {
        const compute = jest.fn((key: string, [n]: readonly unknown[]) => `${key}:${n}`)
        const { result, rerender } = renderHook(
            ({ inputs }: { inputs: Inputs }) => useKeyedMemo(inputs, compute),
            { initialProps: { inputs: { a: [1], b: [2] } as Inputs } }
        )

        const firstA = result.current.a
        rerender({ inputs: { a: [1] } }) // drop b
        expect(result.current).toEqual({ a: 'a:1' })
        expect(result.current.a).toBe(firstA) // a still cached

        rerender({ inputs: { a: [1], b: [2] } }) // re-add b with same deps as before
        expect(compute).toHaveBeenCalledTimes(3) // b had to be recomputed because its cache entry was dropped
        expect(result.current.a).toBe(firstA)
    })

    it('computes new entries for newly added keys', () => {
        const compute = jest.fn((key: string, [n]: readonly unknown[]) => `${key}:${n}`)
        const { result, rerender } = renderHook(
            ({ inputs }: { inputs: Inputs }) => useKeyedMemo(inputs, compute),
            { initialProps: { inputs: { a: [1] } as Inputs } }
        )

        rerender({ inputs: { a: [1], b: [2] } })

        expect(result.current).toEqual({ a: 'a:1', b: 'b:2' })
        expect(compute).toHaveBeenCalledTimes(2)
    })

    it('survives a key being removed and re-added in same render', () => {
        const compute = jest.fn((key: string, [n]: readonly unknown[]) => `${key}:${n}`)
        const { result, rerender } = renderHook(
            ({ inputs }: { inputs: Inputs }) => useKeyedMemo(inputs, compute),
            { initialProps: { inputs: { a: [1] } as Inputs } }
        )

        rerender({ inputs: { b: [2] } }) // a removed, b added
        expect(result.current).toEqual({ b: 'b:2' })
        rerender({ inputs: { a: [1] } }) // a back, b gone — a must be recomputed
        expect(result.current).toEqual({ a: 'a:1' })
        expect(compute).toHaveBeenCalledTimes(3)
    })

    it('treats objects with same contents but different identity as different deps', () => {
        const compute = jest.fn((_key: string, [obj]: readonly unknown[]) => obj)
        const { rerender } = renderHook(
            ({ inputs }: { inputs: Inputs }) => useKeyedMemo(inputs, compute),
            { initialProps: { inputs: { a: [{ x: 1 }] } as Inputs } }
        )

        rerender({ inputs: { a: [{ x: 1 }] } })
        expect(compute).toHaveBeenCalledTimes(2)
    })

    it('handles state-driven input updates inside the same hook', () => {
        const compute = jest.fn((key: string, [n]: readonly unknown[]) => `${key}:${n}`)
        const { result } = renderHook(() =>
            useTestKeyedMemo({ a: [1], b: [2] }, compute)
        )

        const before = result.current.result
        act(() => {
            result.current.setInputs(prev => ({ ...prev, a: [42] }))
        })

        expect(result.current.result.a).toBe('a:42')
        expect(result.current.result.b).toBe(before.b)
        expect(compute).toHaveBeenCalledTimes(3)
    })
})
