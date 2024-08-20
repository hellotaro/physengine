import {get} from "../util/api"
import CameraObject from "../object/resource/cameraObject"
import ScenarioManager from "./scenarioManager"

class CameraManager {
    private static _instance: CameraManager|undefined

    public static getInstance(): CameraManager {
        if(this._instance === undefined) this._instance = new CameraManager()
        return this._instance
    }

    cameras: CameraObject[]
    activeIdx: number

    private constructor() {
        this.cameras = []
        this.activeIdx = 0
    }

    async update(sc: ScenarioManager) {
        for(const camera of this.cameras) {
            await camera.update(sc)
        }
    }

    async loadSceneCamera(url: string, addScene: any, camMeta: any) {
        const camDef = await get(url)
        const cameras = this.loadCameras(camDef, camMeta)
        for(let camera of cameras) {
            addScene(camera.camera)
        }
        this.cameras = cameras
    }
    loadCameras(camDef: any, camMeta: any): CameraObject[] {
        const cameras = camDef.map((def:any) => this.loadCamera(def, camMeta))
        return cameras
    }
    loadCamera(camDef: any, camMeta: any): CameraObject {
        const camObj = new CameraObject()
        camObj.init(camDef, camMeta)
        return camObj
    }
    
    getActiveCamera(): CameraObject {
        return this.cameras[this.activeIdx]
    }
    
    searchCamera(name: string): CameraObject|null {
        for(let idx=0;idx<this.cameras.length;idx++) {
            if(this.cameras[idx].name == name) return this.cameras[idx]
        }
        return null
    }
}

export default CameraManager
