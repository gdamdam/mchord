/** Public surface of the persistence module. */
export { createDefaultScene } from './defaults'
export { sanitizeScene, migrateScene } from './scene'
export {
  type SavedScene,
  type AutosavedScene,
  listScenes,
  saveScene,
  loadScene,
  deleteScene,
  exportSceneJSON,
  importSceneJSON,
  loadAutosavedScene,
  saveAutosavedScene,
} from './storage'
