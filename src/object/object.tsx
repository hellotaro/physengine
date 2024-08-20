import {copyObject} from "../util/misc"
import {Vector3} from "../util/vector"
import * as THREE from 'three'

import ScenarioManager from "../manager/scenarioManager"
import { GeometryType, getMesh } from "../util/mesh"

export type ObjectGeometryType = "[none]"|"primitive"
type PrimitiveType = "plane"|"box"|"sphere"|"cone"|"torus"|"cylinder"|"capsule"|"dodeca"
export type THREEObjectType = THREE.Object3D
type PlayerDef = {
    camera: string
}
export type GameInfo = {
}
type ObjectInfo<GameInfoT = GameInfo> = {
    role: (null|string),
    player: (null|PlayerDef)
    followTo: string
    gameInfo: GameInfoT
}

export type GameObject<T extends GameInfo = GameInfo> = Object<T>

type MaterialType = "basic"|"lambert"|"phong"|"toon"|"standard"

class Object<GameInfoT extends GameInfo = GameInfo> {
    object: THREEObjectType
    objDef: any
    name: string
    parentName: null|string
    geometryType: ObjectGeometryType
    geometryArg: string
    materialSettings: any
    initPos: Vector3
    initRot: Vector3
    initScale: Vector3
    followObjects: any
    info: ObjectInfo<GameInfoT>
    _timeframe: number
    isTimeframeEnable: boolean
    _curDef: any
    _curPos: Vector3
    _curRot: Vector3
    _curScale: Vector3
    propAnimation: (def:any, timeframe:number) => void

    constructor(objDef: any = null) {
        this.objDef = objDef
        this.object = new THREE.Object3D()
        this.name = "[none]"
        this.parentName = null
        this.geometryType = "[none]"
        this.geometryArg = "[none]"
        this.materialSettings = null
        this.initPos = new Vector3()
        this.initRot = new Vector3()
        this.initScale = new Vector3(1,1,1)
        this.followObjects = []
        this.info = {
            role: null,
            gameInfo: {} as GameInfoT,
            player: null,
            followTo: "",
        }
        this._timeframe = 0
        this.isTimeframeEnable = true
        this._curPos = new Vector3()
        this._curRot = new Vector3()
        this._curScale = new Vector3(1,1,1)
        this.propAnimation = (def, timeframe) => {}
    }

    async init(def: any) {
        const objName = def.name
        this.name = objName
        const geometryType = def.type
        const geometryArg = def.arg
        const objInitPos = def.initPos
        const objInitRot = def.initRot
        let objInitScale = def.initScale
        const objDetail = def.object
        const objSprite = def.sprite
        const objPhysics = def.physics
        const materialSettings = def.material
        materialSettings.name = objName
        const objLight = def.light
        const objBone = def.bone
        const objFollowTo = def.followTo
        const objMeta = {
            object: objDetail,
            sprite: objSprite,
            physics: objPhysics,
        }
        if(def.parentName) this.parentName = def.parentName
        
        //
        // THREE object
        const object = await this._getTHREEObject(objName, geometryType, geometryArg, materialSettings, objMeta)
        if(object.traverse !== undefined) {
            if(objLight && objLight.receive) {
                object.traverse((child:any)=>{
                    if(child.isMesh){
                        child.receiveShadow = true
                    }
                })
            } else {
                object.traverse((child:any)=>{
                    if(child.isMesh){
                        child.castShadow = true
                        child.receiveShadow = true
                    }
                })
            }
        }
        
        this.object = object

        //
        // object(this)
        let initPos = new Vector3(objInitPos[0],objInitPos[1],objInitPos[2])
        const initRot = new Vector3(
            (objInitRot[0] / 360) * 2 * Math.PI,
            (objInitRot[1] / 360) * 2 * Math.PI,
            (objInitRot[2] / 360) * 2 * Math.PI
        )
        if(objInitScale) {
            let initScale = new Vector3(1,1,1)
            if(objInitScale == "display_fit") {
                const sc = ScenarioManager.getExistInstance()
                if(sc) {
                    const dispSize = sc.sceneMeta.size
                    const camera = sc.getActiveCamera()
                    const planeCenter = camera.getCameraLookAt()
                    const distance = camera.getObjectPosition().sub(planeCenter).length()
                    const perPlane = sc.getActiveCamera().getPerspectivePlane(distance, sc.sceneMeta)
                    const pPlaneCorner = sc.getActiveCamera().getPPlanePos(perPlane, [dispSize.width,dispSize.height])
                    const planeX = pPlaneCorner.inner(perPlane.x.normal())
                    const planeY = pPlaneCorner.inner(perPlane.y.normal())
                    initScale = new Vector3(planeX,planeY,1)
                }
                
            } else  {
                initScale = new Vector3(objInitScale[0],objInitScale[1],objInitScale[2])
            }
            this.setObjectScale(initScale)
        }
        this.setObjectPosition(initPos)
        this.setObjectRotation(initRot)

    }

    applyDef(def: any) {
        this._curDef = copyObject(def)
        const objName = def.name
        const geometryType = def.type
        const geometryArg = def.arg
        const objInitPos = def.initPos
        const objInitRot = def.initRot
        const objInitScale = def.initScale
        const objDetail = def.object
        const materialSettings = def.material
        materialSettings.name = objName
        const objLight = def.light
        const objFollowTo = def.followTo
        const objMeta = {
            object: objDetail,
        }

        this.name = objName
        this.geometryType = geometryType
        this.geometryArg = geometryArg
        this.materialSettings = materialSettings
        const initPos = new Vector3(objInitPos[0],objInitPos[1],objInitPos[2])
        const initRot = new Vector3(
            (objInitRot[0] / 360) * 2 * Math.PI,
            (objInitRot[1] / 360) * 2 * Math.PI,
            (objInitRot[2] / 360) * 2 * Math.PI
        )
        this.initPos = initPos
        this.initRot = initRot
        // info(additional)
        if(def.role) {
            this.info.role = def.role
        }
        if(this.info.role == "player") {
            this.info.player = def.player
        }
        if(def.followTo) {
            this.info.followTo = objFollowTo
        }
        if(def.gameInfo) {
            this.info.gameInfo = copyObject(def.gameInfo)
        }
        // current attrs
        if(def._curPos) {
            const curPos = def._curPos
            this._curPos = new Vector3(curPos[0],curPos[1],curPos[2])
        }
        if(def._curRot) {
            const curRot = def._curRot
            this._curRot = new Vector3(
                (curRot[0] / 360) * 2 * Math.PI,
                (curRot[1] / 360) * 2 * Math.PI,
                (curRot[2] / 360) * 2 * Math.PI
            )
        }
        // prop animation (warning! code injection)
        if(def.propAnim) {
            const propAnimFuncCode = def.propAnim.func
            this.propAnimation = (def: any, timeframe: number) => {
                eval(propAnimFuncCode)
            }
        }
    }

    update() {
        this.propAnimation(this._curDef, this._timeframe)

        this.setObjectPosition(this._curPos)
        this.setObjectRotation(this._curRot)
        this.setObjectScale(this._curScale)
        
        if(this.isTimeframeEnable) {
            this._timeframe += 1
        }
    }

    remove() {
        this.object.traverse((o:any) => {
            if(o.material) o.material.dispose()
            if(o.geometry) o.geometry.dispose()
            /*
            if(o.material?.type != undefined) {
                o.material.dispose()
            }
            */
        })
    }

    getObjectPosition(): Vector3 {
        this._curPos =  new Vector3(this.object.position.x,this.object.position.y,this.object.position.z)
        return new Vector3(this._curPos.x,this._curPos.y,this._curPos.z)
    }
    setObjectPosition(vec: Vector3) {
        if(this._curPos.sub(vec).length() == 0) return
        
        this._curPos = vec
        this.object.position.x = vec.x
        this.object.position.y = vec.y
        this.object.position.z = vec.z
    }

    getObjectRotation(): Vector3 {
        this._curRot = new Vector3(this.object.rotation.x,this.object.rotation.y,this.object.rotation.z)
        return new Vector3(this._curRot.x,this._curRot.y,this._curRot.z)
    }
    setObjectRotation(vec: Vector3) {
        if(this._curRot.sub(vec).length() == 0) return
        
        this._curRot = vec
        this.object.rotation.x = vec.x
        this.object.rotation.y = vec.y
        this.object.rotation.z = vec.z
    }

    getObjectScale(): Vector3 {
        this._curScale =  new Vector3(this.object.scale.x,this.object.scale.y,this.object.scale.z)
        return new Vector3(this._curScale.x,this._curScale.y,this._curScale.z)
    }
    setObjectScale(vec: Vector3) {
        if(this._curScale.sub(vec).length() == 0) return
        
        this._curScale = vec
        this.object.scale.x = vec.x
        this.object.scale.y = vec.y
        this.object.scale.z = vec.z
    }

    addFollowObject(object: any) {
        this.followObjects.push(object)
    }

    updateMaterialColor(color: string) {
        let obj: any = this.object
        this.object.traverse((obj:any) => {
            if(obj?.material?.type != undefined) {
                obj.material.color.set(color)
            }
        })
    }

    async _getTHREEObject(objName: string, geometryType: ObjectGeometryType, geometryArg: string, materialSettings: any, objMeta: any) {
        // material
        let material: any = this.genMaterial(materialSettings)

        let object: THREE.Object3D = new THREE.Object3D()
        if (geometryType == "primitive") {
            const primGeometry = geometryArg as PrimitiveType
            object = await this._genPrim3dObjModel(primGeometry, material, objMeta)
        }

        return object
    }

    async _genPrim3dObjModel(primtype: PrimitiveType, material: any, meta: any = null) {
        let object = null
        if(primtype == "box") {
            const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
            object = new THREE.Mesh(boxGeometry, material)
        }
        if(primtype == "plane") {
            let planeX = 3
            let planeY = 3
            let splitX = null
            let splitY = null
            if(meta && meta.object) {
                planeX = meta.object.planeSize[0]
                planeY = meta.object.planeSize[1]
                if(meta.object.planeSplit) {
                    splitX = meta.object.planeSplit[0]
                    splitY = meta.object.planeSplit[1]
                }
            }
            let planeGeometry = new THREE.PlaneGeometry(planeX, planeY)
            if(splitX !== null && splitY !== null) {
                planeGeometry = new THREE.PlaneGeometry(planeX, planeY, splitX, splitY)
            }
            object = new THREE.Mesh(planeGeometry, material)
        }
        if(primtype == "sphere") {
            const sphereGeometry = new THREE.SphereGeometry(1)
            object = new THREE.Mesh(sphereGeometry, material)
        }
        if(primtype == "cone") {
            const sphereGeometry = new THREE.ConeGeometry(0.5,2,32)
            object = new THREE.Mesh(sphereGeometry, material)
        }
        if(primtype == "cylinder") {
            let radius = 0.5
            let length = 1
            if(meta && meta.object) {
                radius = meta.object.radius
                length = meta.object.length
            }
            const sphereGeometry = new THREE.CylinderGeometry(radius,radius,length,32)
            object = new THREE.Mesh(sphereGeometry, material)
        }
        if(primtype == "capsule") {
            let radius = 0.5
            let length = 1
            if(meta && meta.object) {
                radius = meta.object.radius
                length = meta.object.length
            }
            const sphereGeometry = new THREE.CapsuleGeometry(radius, length, 8, 16)
            object = new THREE.Mesh(sphereGeometry, material)
        }
        if(primtype == "torus") {
            const sphereGeometry = new THREE.TorusGeometry(1,0.1,16,32)
            object = new THREE.Mesh(sphereGeometry, material)
        }
        if(primtype == "dodeca") {
            const sphereGeometry = new THREE.DodecahedronGeometry(1,0)
            object = new THREE.Mesh(sphereGeometry, material)
        }
        if(object == null) {
            let objectInfo = {}
            if(meta.object) objectInfo = meta.object
            object = getMesh(primtype as GeometryType, objectInfo, material)
        }
        if(object == null) {
            object = new THREE.Mesh()
        }

        return object
    }


    async genMaterial(matSettings: any) {
        let material:any = null
        const mattype: MaterialType = matSettings.type
        const settings = matSettings.settings
        let THREESettings: any = {}
        if(settings) {
            if(settings.color) THREESettings.color = settings.color
            if(settings.size) THREESettings.size = settings.size
            if(settings.opacity) {
                THREESettings.opacity = settings.opacity
            }
        }
        
        if(mattype == "basic") {
            material = new THREE.MeshBasicMaterial(THREESettings)
        }
        if(mattype == "lambert") {
            material = new THREE.MeshLambertMaterial(THREESettings)
        }
        if(mattype == "phong") {
            material = new THREE.MeshPhongMaterial(THREESettings)
        }
        if(mattype == "toon") {
            material = new THREE.MeshToonMaterial(THREESettings)
        }
        if(mattype == "standard") {
            material = new THREE.MeshStandardMaterial(THREESettings)
            for(const key in THREESettings) {
                let value = THREESettings[key]
                if(key == "color") continue
                if(key == "emissive") value = new THREE.Color(value)
                material[key] = value
            }
            material.needsUpdate = true
        }
    }
}

export default Object
