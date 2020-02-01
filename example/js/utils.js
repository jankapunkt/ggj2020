import Engine from '../../engine/src/CanvasBuffer.js'
const CanvasBuffer = Engine.CanvasBuffer

function getRandom (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getTextMetric (text, font) {
  let metrics = {}
  const metricsBuffer = new CanvasBuffer({})
  metricsBuffer.pre((ctx) => {
    // set font and measure width
    ctx.font = font
    metrics = ctx.measureText(text)
  })
  return metrics
}

function getMapDataFromText (text, fontSize) {
  const font = `${fontSize}px monospace`
  const metrics = getTextMetric(text, font)
  const width = Math.round(metrics.width)
  const height = fontSize
  const textBuffer = new CanvasBuffer({ width, height })

  textBuffer.pre((ctx) => {
    // set font and measure width
    ctx.font = font
    ctx.fillStyle = 'white'
    ctx.fillText(text, 0, height)
  })

  const imageData = textBuffer.ctx.getImageData(0, 0, width, height)
  const dataMap = []

  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[ i ]
    const g = imageData.data[ i + 1 ]
    const b = imageData.data[ i + 2 ]
    const a = imageData.data[ i + 3 ]
    const value = (r + g + b + a) / (255 * 4)
    dataMap.push(value > 0 ? 1 : 0)
  }

  return { data: dataMap, width, height }
}

export default { getRandom, getMapDataFromText, getTextMetric }
