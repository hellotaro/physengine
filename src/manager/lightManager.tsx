import {get} from "../util/api"
import * as THREE from 'three'
import LightObject from "../object/resource/lightObject"
import { copyObject } from "../util/misc"
import ScenarioManager from "./scenarioManager"

class LightManager {
    private static _instance: LightManager|undefined

    public static getInstance(): LightManager {
        if(this._instance === undefined) this._instance = new LightManager()
        return this._instance
    }

    lights: LightObject[]
    originDefs: any
    addLightDefs: any[]

    private constructor() {
        this.lights = []
        this.originDefs = []
        this.addLightDefs = []
    }

    async loadSceneLight(url: string, addScene: any) {
        const lightDefs = await get(url)
        this.originDefs = lightDefs
        await this._loadSceneLight(lightDefs, addScene)
    }

    _loadSceneLight(lightDefs: any, addScene: any) {
        const lights = this.loadLights(lightDefs)
        lights.map((light) => {addScene(light.light)})
        this.lights = lights
    }
    loadLights(lightDefs: any): LightObject[] {
        const lights = lightDefs.map((def:any) => this.loadLight(def))
        return lights
    }
    loadLight(lightDef: any): LightObject {
        const light = new LightObject()
        light.init(lightDef)
        return light
    }

    async update(sc: ScenarioManager, addScene: any) {
        this.refreshLightDefs(sc, addScene)
    }

    addLight(lightDef: any) {
        this.addLightDefs.push(lightDef)
    }
    refreshLightDefs(sc: ScenarioManager, addScene: any) {
        const lights = this.loadLights(this.addLightDefs)
        lights.map((light) => {addScene(light.light)})
        this.lights= this.lights.concat(lights)
        this.addLightDefs = []
    }
    removeLight(name: string) {
        this.lights = this.lights.filter((light) => light.name !== name)
    }

    getOriginLightDefs() {
        return this.originDefs
    }
    getOriginLightDefByName(lightName: string, newLightName: string) {
        for(let def of this.originDefs) {
            if(def.name == lightName) {
                const newDef = copyObject(def)
                newDef.name = newLightName
                return newDef
            }
        }
        console.warn("[LightManager] getOriginObjectDefByName - no object: " + lightName)
        return null
    }

    searchLight(name: string): LightObject|null {
        for(let idx=0;idx<this.lights.length;idx++) {
            if(this.lights[idx].name == name) return this.lights[idx]
        }
        return null
    }
}

export default LightManager
