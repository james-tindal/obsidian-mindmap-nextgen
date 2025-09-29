import { Source } from 'callbag'
import { consumeSource, createSource } from 'callbag-toolkit'

export const completeWhen = (trigger: Source<unknown>) => <T>(subject: Source<T>): Source<T> =>
  createSource(({ complete, ...rest }) => {
    const subjectConsumption = consumeSource(subject, {
      complete() {
        triggerConsumption.stop()
        subjectConsumption.stop()
      },
      ...rest
    })
    const triggerConsumption = consumeSource(trigger, {
      next() {
        triggerConsumption.stop()
        subjectConsumption.stop()
        complete()
      },
      complete() {
        triggerConsumption.stop()
      }
    })
    return () => {
      triggerConsumption.stop()
      subjectConsumption.stop()
    }
  })
