export default class Emitter {
  listeners: { [name: string]: Function[] }

  constructor() {
    this.listeners = {}
  }

  on(name: string, listener: Function, options = { once: false }) {
    const listeners = this.listeners[name] = this.listeners[name] || []
    if (listeners.includes(listener)) { return /*console.warn(`listener is already registered`)*/ }
    /* if once is insert middleware that removes listener after call */
    if (options.once) {
      listener = (...args) => {
        const result = listener(...args)
        this.off(name, listener)
        return result
      }
    }
    listeners.push(listener)
  }

  off(name: string, listener: Function) {
    const listeners = this.listeners[name]
    if (!listeners) { return /*console.warn(`no listeners for name '${name}'`)*/ }
    const index = listeners.indexOf(listener)
    if (index === -1) { return /*console.warn(`listener is not registered`)*/ }
    listeners.splice(index, 1)
    if (listeners.length < 1) {
      delete this.listeners[name]
    }
  }

  emit(name: string, ...data: any) {
    const listeners = this.listeners[name]
    if (!listeners) { return /*console.warn(`no listeners for name '${name}'`)*/ }
    for (const listener of listeners) {
      return listener(...data)
    }
  }

  hasListeners(name: string) {
    const listeners = this.listeners[name]
    return listeners ? listeners.length : false
  }

}
