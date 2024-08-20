import * as THREE from 'three'
import {get} from "../util/api"

import ObjectManager from "./objectManager"
import LightManager from "./lightManager"
import CameraManager from "./cameraManager"

import { GamePhysicsInfo } from "../core/_prim/physicsGame"

import TestPhysics from '../core/test/testPhysics'

type SceneMeta = {
    size: {width: number, height: number}
    renderer: THREE.WebGLRenderer
}

export type MoveDirType = "xyz"|"xy"|"yz"|"zx"


class ScenarioManager {
    private static _instance: ScenarioManager|undefined

    public static getInstance(scene: THREE.Scene, sceneMeta: SceneMeta): ScenarioManager {
        if(this._instance === undefined) this._instance = new ScenarioManager(scene, sceneMeta)
        return this._instance
    }
    public static getExistInstance() {
        return this._instance
    }

    objectManager: ObjectManager
    lightManager: LightManager
    cameraManager: CameraManager
    scene: any
    sceneMeta: SceneMeta
    timeframe: number

    _physics: GamePhysicsInfo
    
    gameSettings: any
    game: any

    private constructor(scene: THREE.Scene, sceneMeta: SceneMeta) {
        this.objectManager = ObjectManager.getInstance()
        this.lightManager = LightManager.getInstance()
        this.cameraManager = CameraManager.getInstance()
        this._physics = {}
        this.scene = null
        this.scene = scene
        this.sceneMeta = sceneMeta
        this.timeframe = 0

        this.addScene = this.addScene.bind(this)
    }

    setScene(scene: THREE.Scene, sceneMeta: SceneMeta) {
        this.scene = scene
        this.sceneMeta = sceneMeta
    }

    async loadScenario(url: string, sceneMeta: SceneMeta) {
        this.sceneMeta = sceneMeta
        this.clearScene()
        let scenarioDef = await get(url)

        const dimension = scenarioDef.dimension
        const clearColor = scenarioDef.clearColor
        const game = scenarioDef.game
        const physics = scenarioDef.physics
        const cameraSet = scenarioDef.camerapath
        const objSet = scenarioDef.objectpath
        const lightSet = scenarioDef.lightpath
        let isCache = true
        if(scenarioDef.isCache !== undefined) isCache = scenarioDef.isCache
        let isObjectHide = false
        if(scenarioDef.isObjectHide !== undefined) isObjectHide = scenarioDef.isObjectHide
        
        let gameSettings = null
        if(game) {
            gameSettings = game.settings
        }

        if(physics !== undefined) this._physics = physics

        if(clearColor !== undefined) {
            const renderer = sceneMeta.renderer
            renderer.setClearColor(clearColor, 1)
        }
        
        // game
        await this.genAssets(cameraSet, objSet, lightSet, this.sceneMeta, isCache, isObjectHide)
        await this.genGame(game, gameSettings)
    }
    applyJsonObj(originDef: any, partDef: any) {
        if(partDef instanceof Object) {
            for(const key in partDef) {
                if(key in originDef) {
                    originDef[key] = this.applyJsonObj(originDef[key], partDef[key])
                } else {
                    originDef[key] = partDef[key]
                }
            }
        } else {
            return partDef
        }

        return originDef
    }

    async genAssets(cameraSet: string, objSet: string, lightSet: string, sceneMeta: SceneMeta, isObjectCache = true, isObjectHide: boolean = false) {
        const camMeta = {
            size: sceneMeta.size,
        }
        await this.cameraManager.loadSceneCamera(cameraSet, this.addScene, camMeta)
        await this.lightManager.loadSceneLight(lightSet, this.addScene)
        if(isObjectCache) {
            await this.cacheRefreshObjects(objSet, isObjectHide)
        } else {
            await this.rawLoadObjects(objSet, isObjectHide)
        }
    }

    async rawLoadObjects(objSet: string, isObjectHide: boolean) {
        await this.objectManager.loadSceneObject(objSet, this.addScene, isObjectHide)
    }

    async cacheRefreshObjects(objSet: string, isObjectHide: boolean) {
        // cache objects
        await this.objectManager.loadSceneObject(objSet, this.addScene, isObjectHide)
        this.clearScene()
        // reload object (from cache)
        await this.objectManager._loadSceneObject(this.objectManager.getOriginObjectDefs(), this.addScene)
    }

    async genGame(gameDef: any, gameSettings: any) {
        const gameType = gameDef.type
        let game = null

        const gameDict: any = {
            "test-physics": new TestPhysics(),
        }

        if(gameType in gameDict) {
            game = gameDict[gameType]
            const assetMapping = gameSettings.assetMapping
            
            await game.initGame(this, assetMapping)
        }

        this.game = game
    }

    async update(camera: THREE.Camera) {        
        // game update
        if(this.game) {
            await this.game.update(this)
        }

        // camera update
        this.cameraManager.update(this)

        // light update
        this.lightManager.update(this, this.addScene)

        // objects update
        await this.objectManager.update(this, this.addScene)

        this.timeframe += 1
    }

    addScene(obj: any) {
        this.scene.add(obj)
    }

    getActiveCamera() {
        return this.cameraManager.getActiveCamera()
    }

    clearScene() {
        const objects = this.objectManager.objects
        for(let obj of objects) {
            const _obj = obj.object
            if(_obj) {
                _obj.traverse((o:any) => {
                    if(o.material?.type != undefined) {
                        o.material.dispose()
                    }
                })
            }
            this.scene.remove(_obj)
        }
        this.objectManager.objects = []
    }
    clearLightScene() {
        const lights = this.lightManager.lights
        for(let light of lights) {
            const _light = light.light
            this.scene.remove(_light)
        }
        this.lightManager.lights = []
    }
    removeObject(name: string) {
        const objects = this.objectManager.objects
        for(let oidx=0;oidx<objects.length;oidx++) {
            const obj = objects[oidx]
            if(obj.name == name) {
                obj.remove()
                this.scene.remove(obj.object)
            }
        }
        this.objectManager.removeObjectByName(name)
    }
    removeLight(name: string) {
        const lights = this.lightManager.lights
        for(let lidx=0;lidx<lights.length;lidx++) {
            const light = lights[lidx]
            if(light.name == name) {
                const _light = light.light
                if(_light) {
                    this.scene.remove(_light)
                }
                this.lightManager.removeLight(name)
            }
        }
    }
}

export default ScenarioManager
