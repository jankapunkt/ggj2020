/**
 * ---------------------------------------------------------
 * CONFIGURATIONS
 * ---------------------------------------------------------
 */

export const cam1990 = display => ({
  canvas: display,
  resolution: 320,
  focalLength: 0.8,
  canvasScale: 0.125,
  range: 6,
  isMobile: false
})

export const cam2020 = display => ({
  canvas: display,
  resolution: 1024,
  focalLength: 0.8,
  canvasScale: 1,
  range: 14,
  isMobile: false
})

export const playerConfig = {
  x: 15.3,
  y: -1.2,
  health: 100,
  direction: Math.PI * 0.3,
  defaultSpeed: 2.5,
  runFactor: 2.8,
  sounds: [ {
    id: 'walk',
    url: '/assets/audio/steps.mp3'
  }, {
    id: 'run',
    url: '/assets/audio/steps_run.ogg'
  }, {
    id: 'paint',
    url: '/assets/audio/magic.mp3'
  } ]
}

