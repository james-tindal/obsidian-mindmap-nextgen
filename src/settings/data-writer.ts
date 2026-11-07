// Serialize writes of the whole data.json. Settings, layout and folding states
// share this queue so an older write cannot finish last and overwrite new data.
export function dataWriter<T>(write: (data: T) => Promise<void>, onError: (error: unknown) => void) {
  let pending = Promise.resolve()
  return (data: T) => {
    const snapshot = JSON.parse(JSON.stringify(data)) as T
    pending = pending.then(() => write(snapshot)).catch(onError)
    return pending
  }
}
