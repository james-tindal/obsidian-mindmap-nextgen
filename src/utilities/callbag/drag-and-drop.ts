
import { flatMap, fromEvent, map, pipe, preventDefault, scan, takeUntil } from 'src/utilities/callbag'

export const dragAndDrop = (target: Node) => pipe(
  fromEvent(target, 'mousedown'),
  preventDefault,
  map(eventCoordinates),
  flatMap(start => pipe(
    mousemove,
    takeUntil(mouseup),
    map(eventCoordinates),
    map(current => ({
      start,
      current,
      changeFromStart: coordinateDifference(start, current),
      changeFromPrevious: { x: 0, y: 0 }
    })),
    scan((previous, current) => ({
      ...current,
      changeFromPrevious: coordinateDifference(previous.changeFromStart, current.changeFromStart)
    }))
  ))
)

const mousemove = fromEvent(window, 'mousemove')
const mouseup = fromEvent(window, 'mouseup')

interface Coordinates {
  x: number
  y: number
}
const coordinateDifference = (a: Coordinates, b: Coordinates) =>
  ({ x: a.x - b.x, y: a.y - b.y })

const eventCoordinates = (e: MouseEvent) =>
  ({ x: e.clientX, y: e.clientY })
