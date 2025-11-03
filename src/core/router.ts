import { attachGlobalRoutesListener } from "./Router/attachRouteListeners";
import { navigate } from "./Router/navigation";

export class Router {
  init() {
    attachGlobalRoutesListener(navigate);
    console.log("🚀 Router initialized");
  }
}
