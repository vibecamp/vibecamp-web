import { act, renderHook, waitFor } from '@testing-library/react'
import type React from 'react'

import useForm, { fieldToProps } from '../useForm'

type SimpleForm = { name: string, age: number }

function makeInit(overrides: Partial<{
    initial: SimpleForm
    validators: Parameters<typeof useForm<SimpleForm>>[0]['validators']
    submit: Parameters<typeof useForm<SimpleForm>>[0]['submit']
}> = {}) {
    return {
        initial: overrides.initial ?? { name: '', age: 0 },
        validators: overrides.validators ?? {},
        submit: overrides.submit ?? jest.fn().mockResolvedValue(undefined),
    }
}

describe('useForm', () => {
    describe('initial state', () => {
        it('exposes fields populated from initial values', () => {
            const { result } = renderHook(() => useForm(makeInit({ initial: { name: 'a', age: 5 } })))
            expect(result.current.fields.name.value).toBe('a')
            expect(result.current.fields.age.value).toBe(5)
            expect(result.current.values).toEqual({ name: 'a', age: 5 })
        })

        it('starts with dirty=false and submitting=false', () => {
            const { result } = renderHook(() => useForm(makeInit()))
            expect(result.current.dirty).toBe(false)
            expect(result.current.submitting).toBe(false)
        })

        it('reports no errors before validation is activated', () => {
            const { result } = renderHook(() => useForm(makeInit({
                initial: { name: '', age: 0 },
                validators: { name: v => v === '' ? 'required' : undefined }
            })))
            expect(result.current.fields.name.error).toBeUndefined()
        })
    })

    describe('field.set', () => {
        it('updates the field value and marks the form dirty', () => {
            const { result } = renderHook(() => useForm(makeInit()))

            act(() => result.current.fields.name.set('Alice'))

            expect(result.current.fields.name.value).toBe('Alice')
            expect(result.current.values.name).toBe('Alice')
            expect(result.current.dirty).toBe(true)
        })

        it('does not change identity of fields whose values did not change', () => {
            const { result } = renderHook(() => useForm(makeInit()))
            const ageBefore = result.current.fields.age

            act(() => result.current.fields.name.set('Alice'))

            expect(result.current.fields.age).toBe(ageBefore)
        })

        it('produces a fresh field object only for the changed field', () => {
            const { result } = renderHook(() => useForm(makeInit()))
            const nameBefore = result.current.fields.name

            act(() => result.current.fields.name.set('Alice'))

            expect(result.current.fields.name).not.toBe(nameBefore)
            expect(result.current.fields.name.value).toBe('Alice')
        })

        it('is a no-op when called with the current value', () => {
            const { result } = renderHook(() => useForm(makeInit({ initial: { name: 'x', age: 0 } })))
            const before = result.current.fields.name

            act(() => result.current.fields.name.set('x'))

            // identity preserved (no state update happened)
            expect(result.current.fields.name).toBe(before)
            expect(result.current.dirty).toBe(false)
        })
    })

    describe('validation', () => {
        it('returns no error until activateValidation is called', () => {
            const { result } = renderHook(() => useForm(makeInit({
                validators: { name: v => v === '' ? 'required' : undefined }
            })))
            expect(result.current.fields.name.error).toBeUndefined()

            act(() => result.current.fields.name.activateValidation())

            expect(result.current.fields.name.error).toBe('required')
        })

        it('clears error once value satisfies the validator', () => {
            const { result } = renderHook(() => useForm(makeInit({
                validators: { name: v => v === '' ? 'required' : undefined }
            })))

            act(() => result.current.fields.name.activateValidation())
            expect(result.current.fields.name.error).toBe('required')

            act(() => result.current.fields.name.set('hi'))
            expect(result.current.fields.name.error).toBeUndefined()
        })

        it('passes full state to validator (cross-field validation)', () => {
            const validator = jest.fn((v: number, state: SimpleForm) =>
                state.name === '' && v > 0 ? 'name required when age > 0' : undefined
            )
            const { result } = renderHook(() => useForm(makeInit({
                initial: { name: '', age: 0 },
                validators: { age: validator }
            })))

            act(() => result.current.fields.age.activateValidation())
            act(() => result.current.fields.age.set(5))

            expect(result.current.fields.age.error).toBe('name required when age > 0')

            act(() => result.current.fields.name.set('Alice'))
            expect(result.current.fields.age.error).toBeUndefined()
        })

        it('activateValidation is idempotent', () => {
            const { result } = renderHook(() => useForm(makeInit({
                validators: { name: v => v === '' ? 'required' : undefined }
            })))

            act(() => result.current.fields.name.activateValidation())
            const after1 = result.current.fields.name

            act(() => result.current.fields.name.activateValidation())

            // No state change -> field identity preserved
            expect(result.current.fields.name).toBe(after1)
        })
    })

    describe('callback identity', () => {
        it('keeps set/activateValidation stable across unrelated re-renders', () => {
            const { result } = renderHook(() => useForm(makeInit()))
            const setBefore = result.current.fields.age.set
            const activateBefore = result.current.fields.age.activateValidation

            act(() => result.current.fields.name.set('a'))
            act(() => result.current.fields.name.set('ab'))

            expect(result.current.fields.age.set).toBe(setBefore)
            expect(result.current.fields.age.activateValidation).toBe(activateBefore)
        })

        it('field passed to fieldToProps yields equivalent props on unchanged field', () => {
            const { result } = renderHook(() => useForm(makeInit()))
            const propsBefore = fieldToProps(result.current.fields.age)

            act(() => result.current.fields.name.set('Alice'))

            const propsAfter = fieldToProps(result.current.fields.age)
            expect(propsAfter.value).toBe(propsBefore.value)
            expect(propsAfter.onChange).toBe(propsBefore.onChange)
            expect(propsAfter.onBlur).toBe(propsBefore.onBlur)
            expect(propsAfter.error).toBe(propsBefore.error)
        })
    })

    describe('handleSubmit', () => {
        it('calls submit with current values', async () => {
            const submit = jest.fn().mockResolvedValue(undefined)
            const { result } = renderHook(() => useForm(makeInit({
                initial: { name: 'a', age: 1 },
                submit
            })))

            act(() => result.current.handleSubmit())

            await waitFor(() => expect(submit).toHaveBeenCalled())
            expect(submit.mock.calls[0]![0]).toEqual({ name: 'a', age: 1 })
        })

        it('calls preventDefault on the synthetic event', () => {
            const { result } = renderHook(() => useForm(makeInit()))
            const preventDefault = jest.fn()

            act(() => result.current.handleSubmit({ preventDefault } as unknown as React.FormEvent<HTMLFormElement>))

            expect(preventDefault).toHaveBeenCalled()
        })

        it('skips submit when an active validator reports an error', async () => {
            const submit = jest.fn().mockResolvedValue(undefined)
            const { result } = renderHook(() => useForm(makeInit({
                validators: { name: v => v === '' ? 'required' : undefined },
                submit
            })))

            act(() => result.current.fields.name.activateValidation())

            await act(async () => {
                result.current.handleSubmit()
            })

            expect(result.current.submitting).toBe(false)
            expect(submit).not.toHaveBeenCalled()
        })

        it('toggles submitting=true while in-flight and back to false on resolve', async () => {
            let resolveSubmit: ((v: undefined) => void) | undefined
            const submit = jest.fn(() => new Promise<undefined>(r => { resolveSubmit = r }))

            const { result } = renderHook(() => useForm(makeInit({ submit })))

            act(() => result.current.handleSubmit())

            await waitFor(() => expect(result.current.submitting).toBe(true))

            await act(async () => {
                resolveSubmit!(undefined)
            })

            await waitFor(() => expect(result.current.submitting).toBe(false))
        })
    })

    describe('reset', () => {
        it('resets values to initial and clears dirty', () => {
            const { result } = renderHook(() => useForm(makeInit({ initial: { name: 'orig', age: 0 } })))

            act(() => result.current.fields.name.set('changed'))
            expect(result.current.dirty).toBe(true)

            act(() => result.current.reset())

            expect(result.current.values).toEqual({ name: 'orig', age: 0 })
            expect(result.current.dirty).toBe(false)
        })

        it('accepts an explicit replacement state', () => {
            const { result } = renderHook(() => useForm(makeInit({ initial: { name: 'orig', age: 0 } })))

            act(() => result.current.reset({ name: 'override', age: 99 }))

            expect(result.current.values).toEqual({ name: 'override', age: 99 })
        })
    })
})
