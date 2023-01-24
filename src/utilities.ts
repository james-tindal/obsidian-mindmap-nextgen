
export const dontPanic =
<F extends (...args: any) => any>(f: F, message?: string) =>
(...args: Parameters<F>) =>
{
  try { return f(...args) }
  catch (error) {
    if (message)
      console.error(message, error)
    else
      console.error(error)
  }
}
