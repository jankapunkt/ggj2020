import { Routes } from '../../api/routes/Routes'
import { Router } from '../../api/routes/Router'
import '../../ui/loading/loading.html'

const _defaultTarget = 'main-render-target'
const _defaultLabel = ''
Object.keys(Routes).forEach(key => {
  const route = Routes[key]
console.log('load route', route)

  Router.route(route.path(), {
    triggersEnter: route.triggersEnter && route.triggersEnter(),
    name: key,
    whileWaiting () {
      console.log('waiting')
      this.render(route.target || _defaultTarget, 'loading', { title: route.label() })
    },
    waitOn () {
      console.log('waint on', route)
      return route.load()
    },
    action (params, queryParams) {
      console.log('action')
      if (!Template[route.template]) {
        console.warn('[CaroRouter]: skipping yet undefined template', route.template)
        document.title = `${_defaultLabel}${route.label()}`
        return
      }

      const data = route.data || {}
      data.params = params
      data.queryParams = queryParams

      const label = typeof route.label === 'function'
        ? route.label()
        : route.label
      document.title = `${_defaultLabel}${label}`

      try {
        this.render(route.target || _defaultTarget, route.template, data)
      } catch (e) {
        console.error(e)
        if (typeof onError === 'function') {
          onError(e)
        }
      }
    }
  })
})