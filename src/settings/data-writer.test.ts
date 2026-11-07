import { expect, it, vi } from 'vitest'
import { dataWriter } from './data-writer'

it('serializes immutable snapshots of settings, layout and folding changes', async () => {
  let release!: () => void
  const firstWrite = new Promise<void>(resolve => { release = resolve })
  const write = vi.fn().mockImplementationOnce(() => firstWrite).mockResolvedValue(undefined)
  const save = dataWriter(write, vi.fn())
  const data = { settings: { rememberFolding: false }, layout: [], foldingStates: {} }
  save(data)
  data.settings.rememberFolding = true
  const lastWrite = save(data)
  await Promise.resolve()
  expect(write).toHaveBeenCalledTimes(1)
  expect(write.mock.calls[0][0].settings.rememberFolding).toBe(false)
  release()
  await lastWrite
  expect(write.mock.calls[1][0].settings.rememberFolding).toBe(true)
})

it('reports a failed save and allows later saves to proceed', async () => {
  const error = new Error('disk unavailable')
  const write = vi.fn().mockRejectedValueOnce(error).mockResolvedValue(undefined)
  const onError = vi.fn()
  const save = dataWriter(write, onError)
  save({ value: 1 })
  await save({ value: 2 })
  expect(onError).toHaveBeenCalledWith(error)
  expect(write).toHaveBeenCalledTimes(2)
})
