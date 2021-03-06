/**
 * Node 6 does not have entries or values and need to be shimmed for NgEngine
 */
import 'core-js/fn/object/entries'
import 'core-js/fn/object/values'

import { merge } from 'lodash'

// const ConfigurationProxyHandler = {
//   get (target, key) {
//     if (target.has && target.has(key)) {
//       const value = target.immutable === true ? Object.freeze(target.get(key)) : target.get(key)
//       return new Proxy(value, ConfigurationProxyHandler)
//     }
//     else {
//       return target.immutable === true ? Object.freeze(target[key]) : target[key]
//     }
//   }
// }

export class NgEngineConfig { // extends Map {

  private map: Map<any, any>

  public immutable: boolean
  public env: {}

  constructor (configTree = { }, processEnv: { APP_ENV?: string} = { }) {
    // super()
    const config = NgEngineConfig.buildConfig(configTree, processEnv.APP_ENV || 'development')
    const configEntries = Object.entries(NgEngineConfig.flattenTree(config))

    this.map = new Map(configEntries)

    this.validateConfig(config)

    this.immutable = false
    this.env = processEnv

    return this
    // return new Proxy(this, ConfigurationProxyHandler)
  }

  /**
   * Flattens configuration tree
   */
  static flattenTree (tree = { }) {
    const toReturn = { }

    Object.entries(tree).forEach(([ k, v ]) => {
      if (typeof v === 'object' && v !== null) {
        const flatObject = NgEngineConfig.flattenTree(v)
        Object.keys(flatObject).forEach(flatKey => {
          toReturn[`${k}.${flatKey}`] = flatObject[flatKey]
        })
      }
      toReturn[k] = v
    })
    return toReturn
  }

  /**
   * Copy and merge the provided configuration into a new object, decorated with
   * necessary default and environment-specific values.
   */
  static buildConfig (initialConfig: {environment?: Object } = { }, appEnv?) {
    // const root = path.resolve(path.dirname(require.main.filename))
    // const temp = path.resolve(root, '.tmp')
    const envConfig = initialConfig && initialConfig.environment
      // && initialConfig.environment[appEnv]

    const configTemplate = {
      main: {
        packs: [ ],
        paths: {
          root: ''
        },
        freezeConfig: true,
        createPaths: true
      },
      // log: { }
    }

    const mergedConfig = merge(configTemplate, initialConfig, (envConfig || { }))
    // Fixes issue with mergedConfig as null
    if (mergedConfig) {
      mergedConfig.env = appEnv
    }

    return mergedConfig
  }

  /**
   * set on config (key, value)
   */
  set (key: string, value: any): Map<any, any> {
    if (this.immutable === true) {
      // throw new IllegalAccessError('Cannot set properties directly on config. Use .set(key, value) (immutable)')
    }
    return this.map.set(key, value)
  }

  /**
   * get from config by key
   */
  get (key): any {
    return this.map.get(key)
  }

  /**
   * has config key
   */
  has(key): boolean {
    return this.map.has(key)
  }

  /**
   * get entries from config
   */
  entries(): IterableIterator<[any , any]> {
    return this.map.entries()
  }

  /**
   * Merge tree into this configuration. Return overwritten keys
   */
  merge (configTree) {
    const configEntries = Object.entries(NgEngineConfig.flattenTree(configTree))
    return configEntries.map(([ key, value ]) => {
      const hasKey = this.has(key)
      this.set(key, value)

      return { hasKey, key }
    })
  }

  /**
   * Prevent changes to the app configuration
   */
  freeze (): void {
    this.immutable = true
  }

  /**
   * Allow changes to the app configuration
   */
  unfreeze (): void {
    this.immutable = false
  }

  /**
   * Validate the structure and prerequisites of the configuration object. Throw
   * an Error if invalid; invalid configurations are unrecoverable and require
   * that the programmer fix them.
   */
  validateConfig (config) {
    // const result = joi.validate(config, schemas.config)
    // if (result.error) {
    //   throw new ValidationError('Project Configuration Error', result.error.details)
    // }
  }
}
