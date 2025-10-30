import { attachRoutesListeners } from "./Router/attachRouteListeners"
import { gatherRoutes } from "./Router/gatherRoutes"
import { navigate } from "./Router/navigation"

export class Router {
  init() {
    const routes = gatherRoutes()
    attachRoutesListeners(routes, navigate)
    console.log('Router initialized')
  }
}

