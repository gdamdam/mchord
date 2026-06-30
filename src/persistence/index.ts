/** Public surface of the persistence module. */
export { createDefaultScene } from './defaults'
export { sanitizeScene, migrateScene } from './scene'
export {
  type SavedScene,
  listScenes,
  saveScene,
  loadScene,
  deleteScene,
  exportSceneJSON,
  importSceneJSON,
} from './storage'
