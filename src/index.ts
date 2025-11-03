import { Router } from '@core/router'
import { initGlobalSandbox } from '@core/Sandbox/sandbox'

new Router()
initGlobalSandbox()
new Router().init()