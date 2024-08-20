import { Vector3 } from "../../util/vector"
import {GameObject, GameInfo} from "../../object/object"
import ScenarioManager from "../../manager/scenarioManager"
import ObjectManager from "../../manager/objectManager"
import {checkAllObjectPhysics, actionAllObjectPhysics} from "./physics/collision"
import { BoundaryInfo, getBoundary } from "./physics/_boundary"
import { getInertia } from "./physics/_moment"
import TurnGame from "./turnGame"

export type MoveDirType = "xyz"|"xy"|"yz"|"zx"
export type CollideActionType = "pos"|"posRot"|"posRotSlip"

type PhysicsEngineSettings = {
    posRatio: {
        sphereToSphere: number
        sphereToCube: number
        cubeToCube: number
    }
    timeRatio: {
        deltaTime: number
    }
    rotateRatio: {
        inertiaRatio: number
    }
    staticFricCoef: number
    dynamicFricCoef: number
    reflectCoef: number
    gravity: null|Vector3
    forceFields: ForceField[]
}

export type CollisionShapeType = "none"|"sphere"|"cube"|"custom"
export type CollisionShapeMeta = CollisionSphere|CollisionCube|CollisionCustom
export type CollisionSphere = {
    offset: number[]
    radius: number
}
export type CollisionCube = {
    offset: number[]
    size: number[]
}
export type CollisionCustom = {
    offset: number[]
}
export type CollisionShape = {
    type: CollisionShapeType
    meta: CollisionShapeMeta
}
export type CollisionActionType = "none"|"push"|"pull"|"pullby"
export const ActionTypePriority = ["pullby","push","pull","none"]
type CollisionActionPullby = {
    pullType: string
    targetPullType: string
}
export type CollisionAction = {
    type: CollisionActionType
    meta?: CollisionActionPullby
}
export type ObjectPhysicsInfo = {
    enabled: boolean
    applied: boolean
    fixed: boolean
    isGroup: boolean
    isChild: boolean
    weight: number
    inertia: Vector3
    velocity: Vector3
    rotation: Vector3
    posMoveVec: Vector3
    staticFricCoef: number
    dynamicFricCoef: number
    reflectCoef: number
    objectName: string
    object: null|GameObject
    shape: CollisionShape
    actions: CollisionAction[]
    collisionObjPhysInfos: ObjectPhysicsInfo[]
}
type ForceFieldType = "push"|"pull"
type ForceFieldShape = "sphere"|"ellipse"|"cylinder"
type ForceField = {
    type: ForceFieldType
    shape: ForceFieldShape
    shapeMeta: any
    strength: number
}
export type GamePhysicsInfo = {
    moveDir?: MoveDirType
    colAcType?: CollideActionType
    forceFields?: ForceField[]
    gravity?: number[]
    staticFricCoef?: number
    dynamicFricCoef?: number
    reflectCoef?: number
    inertiaRatio?: number
}
type PhysBoundaryInfo = {
    physInfoIndex: number
    boundary: BoundaryInfo
}
export type PhysRangeCube = {
    center: Vector3
    size: Vector3
}

class PhysicsGame extends TurnGame {
    settings: PhysicsEngineSettings
    moveDir: MoveDirType
    colAcType: CollideActionType
    objPhysInfos: ObjectPhysicsInfo[]
    _sortIndex: {
        x: PhysBoundaryInfo[]
        y: PhysBoundaryInfo[]
        z: PhysBoundaryInfo[]
    }

    constructor(moveDir: MoveDirType = "xyz", colAcType: CollideActionType = "posRot") {
        super()

        this.settings = {
            posRatio: {
                sphereToSphere: 1.0,
                sphereToCube: 1.0,
                cubeToCube: 1.0,
            },
            rotateRatio: {
                inertiaRatio: 1.0,
            },
            timeRatio: {
                deltaTime: 0.1,
            },
            gravity: null,
            forceFields: [],
            staticFricCoef: 0.02,
            dynamicFricCoef: 0.01,
            reflectCoef: 1.0,
        }
        this.moveDir = moveDir
        this.colAcType = colAcType
        this.objPhysInfos = []
        this._sortIndex = { x: [], y: [], z: [] }
    }

    reInit(moveDir: MoveDirType, colAcType: CollideActionType = this.colAcType) {
        this.moveDir = moveDir
        this.colAcType = colAcType
    }

    deleteGameResources() {}

    initPhysInfo(sc: ScenarioManager, assetMapping: any) {
        const om = sc.objectManager
        this.setGamePhys(sc)
        for(let object of om.objects) {
            this.addPhysInfo(object.objDef, object, false)
        }
        this.updateSortPhysInfoIndex()
    }
    
    setGamePhys(sc: ScenarioManager) {
        if(sc._physics.moveDir !== undefined && sc._physics.colAcType == undefined) {
            this.reInit(sc._physics.moveDir)
        }
        if(sc._physics.moveDir !== undefined && sc._physics.colAcType !== undefined) {
            this.reInit(sc._physics.moveDir, sc._physics.colAcType)
        }
        if(sc._physics.gravity !== undefined) {
            const _gv = sc._physics.gravity
            const gravity = new Vector3(_gv[0],_gv[1],_gv[2])
            this.setGravity(gravity)
        }
        if(sc._physics.forceFields !== undefined) {
            this.setForceFields(sc._physics.forceFields)
        }
        if(sc._physics.reflectCoef !== undefined) this.settings.reflectCoef = sc._physics.reflectCoef
        if(sc._physics.staticFricCoef !== undefined) this.settings.staticFricCoef = sc._physics.staticFricCoef
        if(sc._physics.dynamicFricCoef !== undefined) this.settings.dynamicFricCoef = sc._physics.dynamicFricCoef
        if(sc._physics.inertiaRatio !== undefined) this.settings.rotateRatio.inertiaRatio = sc._physics.inertiaRatio
    }

    async update(sc: ScenarioManager, rangeCubes: PhysRangeCube[]|null = null) {
        this.clearObjPhysInfo()
        
        this.applyForceFields(sc)
        this.applyGravity(sc)
        this.applyObjectMove(sc)

        this.updateSortPhysInfoIndex()

        checkAllObjectPhysics(this, rangeCubes)
        actionAllObjectPhysics(this)
    }

    clearObjPhysInfo() {
        // clear previous frame info
        for(let idx1=0;idx1<this.objPhysInfos.length;idx1++) {
            this.objPhysInfos[idx1].applied = false
            this.objPhysInfos[idx1].collisionObjPhysInfos = []
        }
    }
    addPhysInfo(objDef: any, object: null|GameObject, isSortUpdate: boolean = true) {        
        let enabled = true
        let fixed = false
        let isGroup = false
        let isChild = false
        let weight = 1
        let inertia = new Vector3(0.1,0.1,0.1)
        let staticFricCoef = this.settings.staticFricCoef
        let dynamicFricCoef = this.settings.dynamicFricCoef
        let reflectCoef = this.settings.reflectCoef
        let posMoveVec = new Vector3()
        let velocity = new Vector3()
        let rotation = new Vector3()
        let shapeDef: CollisionShape = {
            type: "sphere",
            meta: {
                offset: [0,0,0.1],
                radius: 1,
            }
        }
        let actionDef: CollisionAction[] = [{
            type: "push"
        }]
        const physicsInfo = objDef.physics
        if(physicsInfo) {
            shapeDef = physicsInfo.shape
            actionDef = physicsInfo.actions
            if(physicsInfo.fixed) fixed = physicsInfo.fixed
            if(physicsInfo.weight) weight = physicsInfo.weight
            if(physicsInfo.velocity) velocity = new Vector3(physicsInfo.velocity[0],physicsInfo.velocity[1],physicsInfo.velocity[2])
            if(physicsInfo.rotation) rotation = new Vector3(physicsInfo.rotation[0],physicsInfo.rotation[1],physicsInfo.rotation[2])
            if(physicsInfo.reflectCoef !== undefined) reflectCoef = physicsInfo.reflectCoef
            if(physicsInfo.dynamicFricCoef !== undefined) dynamicFricCoef = physicsInfo.dynamicFricCoef
        } else {
            enabled = false
            fixed = true
        }

        // group
        if(objDef.group !== undefined) {
            isGroup = true
        }

        const objPhysInfo = {
            enabled,
            applied: false,
            fixed,
            isGroup,
            isChild,
            inertia,
            weight,
            posMoveVec,
            velocity,
            rotation,
            staticFricCoef,
            dynamicFricCoef,
            reflectCoef,
            objectName: objDef.name,
            object,
            shape: shapeDef,
            actions: actionDef,
            collisionObjPhysInfos: []
        }
        if(physicsInfo) {
            shapeDef = physicsInfo.shape
            inertia = getInertia(shapeDef.type, objPhysInfo, shapeDef.meta, this)
            objPhysInfo.inertia = inertia
        }
        
        this.objPhysInfos.push(objPhysInfo)

        if(object !== null) {
            this.addSortPhysInfoIndex(objPhysInfo, object, this.objPhysInfos.length-1)
            if(isSortUpdate) this.updateSortPhysInfoIndex()
        }
    }
    removePhysInfoByObjName(name: string) {
        const newPhysInfo = []
        for(let physInfo of this.objPhysInfos) {
            if(physInfo.objectName !== name) newPhysInfo.push(physInfo)
        }
        this.objPhysInfos = newPhysInfo
    }
    clearPhysInfo() {
        this.objPhysInfos = []
    }

    getPhysInfoWithSet(physInfo: ObjectPhysicsInfo) {
        const om:ObjectManager = ObjectManager.getInstance()
        if(physInfo.object === null) {
            const object = om.searchObjectByName(physInfo.objectName)
            if(object !== null) {
                physInfo.object = object
                const shapeDef = physInfo.shape
                const inertia = getInertia(shapeDef.type, physInfo, shapeDef.meta, this)
                physInfo.inertia = inertia
                const physIndex = this.searchPhysicsInfoIndexByName(physInfo.objectName)
                this.addSortPhysInfoIndex(physInfo, object, physIndex)
            }
        }
        return physInfo
    }

    getObjectByPhysInfo(physInfo: ObjectPhysicsInfo) {
        physInfo = this.getPhysInfoWithSet(physInfo)
        return physInfo.object
    }

    searchPhysicsInfoByName(name: string) {
        for(let pi of this.objPhysInfos) {
            if(pi.objectName == name) return pi
        }
        return null
    }
    searchPhysicsInfoIndexByName(name: string) {
        for(let pidx = 0; pidx < this.objPhysInfos.length; pidx++) {
            const pi = this.objPhysInfos[pidx]
            if(pi.objectName == name) return pidx
        }
        return -1
    }
    updatePhysicsInfoByName(name: string, physInfo: ObjectPhysicsInfo) {
        for(let pidx = 0; pidx < this.objPhysInfos.length; pidx++) {
            const pi = this.objPhysInfos[pidx]
            if(pi.objectName == name) {
                this.objPhysInfos[pidx] = physInfo
                return true
            }
        }
        return false
    }
    isCollideByNames(name1: string, name2: string) {
        const physInfo = this.searchPhysicsInfoByName(name1)
        if(physInfo !== null) {
            for(let pi of physInfo.collisionObjPhysInfos) {
                if(pi.objectName == name2) return true
            }
        }
        return false
    }

    addSortPhysInfoIndex(objPhysInfo: ObjectPhysicsInfo, object: GameObject, physInfoIndex: number) {
        const boundary = getBoundary(object, objPhysInfo)
        if(boundary !== null) {
            const boundaryInfo = {
                physInfoIndex,
                boundary,
            }

            this._sortIndex.x.push(boundaryInfo)
            this._sortIndex.y.push(boundaryInfo)
            this._sortIndex.z.push(boundaryInfo)
        }
    }
    updateSortPhysInfoIndex() {
        const boundaryInfos = []
        for(let pidx = 0; pidx < this.objPhysInfos.length; pidx++) {
            const physInfo = this.getPhysInfoWithSet(this.objPhysInfos[pidx])
            const object = physInfo.object
            if(object !== null) {
                const boundary = getBoundary(object, physInfo)
                if(boundary !== null) {
                    const boundaryInfo = {
                        physInfoIndex: pidx,
                        boundary,
                    }
                    boundaryInfos.push(boundaryInfo)
                }
                
            }
        }

        this._sortIndex.x = boundaryInfos.slice().sort((a,b) => a.boundary.x[0] - b.boundary.x[0])
        this._sortIndex.y = boundaryInfos.slice().sort((a,b) => a.boundary.y[0] - b.boundary.y[0])
        this._sortIndex.z = boundaryInfos.slice().sort((a,b) => a.boundary.z[0] - b.boundary.z[0])
    }
    getNeedCheckPhysInfos(physObjIndex: number, cubes: PhysRangeCube[]|null) {
        if(!this.objPhysInfos[physObjIndex].enabled) {
            return []
        }
        // skip parent of group
        if(this.objPhysInfos[physObjIndex].isGroup && !this.objPhysInfos[physObjIndex].isChild) {
            return []
        }

        let physIndexesInCube: number[] = []
        for(let idx = 0; idx < this.objPhysInfos.length; idx++) physIndexesInCube.push(idx)
        if(cubes !== null) physIndexesInCube = this.getPhysInfoIdxInCube(cubes)

        let physInfo = null
        for(let pi of this._sortIndex.x) {
            if(physObjIndex == pi.physInfoIndex) {
                physInfo = pi
                break
            }
        }

        let physIndex: number[] = []
        if(physInfo !== null) {
            const isFixed = this.objPhysInfos[physInfo.physInfoIndex].fixed
            const boundary = physInfo.boundary
            let _physBoundaryX = this._sortIndex.x.
                filter((bi) => this.objPhysInfos[bi.physInfoIndex].enabled && bi.physInfoIndex != physObjIndex
                    && (!isFixed || !this.objPhysInfos[bi.physInfoIndex].fixed))
            let physBoundaryX: number[] = []
            for(const bi of _physBoundaryX) {
                if(bi.boundary.x[1] >= boundary.x[0]) {
                    if(bi.boundary.x[0] <= boundary.x[1]) {
                        physBoundaryX.push(bi.physInfoIndex)
                    } else {
                        break
                    }
                }
            }
            let _physBoundaryY = this._sortIndex.y
                .filter((bi) => this.objPhysInfos[bi.physInfoIndex].enabled && bi.physInfoIndex != physObjIndex
                    && (!isFixed || !this.objPhysInfos[bi.physInfoIndex].fixed))
            let physBoundaryY: number[] = []
            for(const bi of _physBoundaryY) {
                if(bi.boundary.y[1] >= boundary.y[0]) {
                    if(bi.boundary.y[0] <= boundary.y[1]) {
                        physBoundaryY.push(bi.physInfoIndex)
                    } else {
                        break
                    }
                }
            }
            let _physBoundaryZ = this._sortIndex.z
                .filter((bi) => this.objPhysInfos[bi.physInfoIndex].enabled && bi.physInfoIndex != physObjIndex
                    && (!isFixed || !this.objPhysInfos[bi.physInfoIndex].fixed))
            let physBoundaryZ: number[] = []
            for(const bi of _physBoundaryZ) {
                if(bi.boundary.z[1] >= boundary.z[0]) {
                    if(bi.boundary.z[0] <= boundary.z[1]) {
                        physBoundaryZ.push(bi.physInfoIndex)
                    } else {
                        break
                    }
                }
            }
            
            for(let pidx = 0; pidx < this.objPhysInfos.length; pidx++) {
                physIndex.push(pidx)
            }
            physIndex = physIndex.filter((pidx) => physBoundaryX.find((ppidx) => pidx == ppidx) !== undefined)
            physIndex = physIndex.filter((pidx) => physBoundaryY.find((ppidx) => pidx == ppidx) !== undefined)
            physIndex = physIndex.filter((pidx) => physBoundaryZ.find((ppidx) => pidx == ppidx) !== undefined)
        }

        physIndex = physIndex.filter((x) => physIndexesInCube.indexOf(x) >= 0)
        return physIndex
    }

    getPhysInfoIdxInCube(cubes: PhysRangeCube[]) {
        let resPhysInfoIdxs: number[] = []

        for(const cube of cubes) {
            const center = cube.center
            const size = cube.size

            const rangeX = [center.x - size.x/2, center.x + size.x/2]
            const rangeY = [center.y - size.y/2, center.y + size.y/2]
            const rangeZ = [center.z - size.z/2, center.z + size.z/2]

            let cubePhysInfoIdxs: number[] = []
            for(let pidx = 0; pidx < this.objPhysInfos.length; pidx++) {
                const physInfo = this.getPhysInfoWithSet(this.objPhysInfos[pidx])
                const object = physInfo.object
                if(object !== null) {
                    const pos = object.getObjectPosition()
                    if(
                        rangeX[0] <= pos.x && pos.x < rangeX[1] &&
                        rangeY[0] <= pos.y && pos.y < rangeY[1] &&
                        rangeZ[0] <= pos.z && pos.z < rangeZ[1]
                    ) {
                        cubePhysInfoIdxs.push(pidx)
                    }
                }
            }
            resPhysInfoIdxs = resPhysInfoIdxs.concat(cubePhysInfoIdxs)
        }
        
        // remove duplication
        resPhysInfoIdxs = resPhysInfoIdxs.filter((value, idx) => resPhysInfoIdxs.indexOf(value) == idx)
        // sort index (ok?)
        resPhysInfoIdxs.sort()
        
        return resPhysInfoIdxs
    }

    _restrictPlane(vec3: Vector3, moveDir: MoveDirType) {
        if(moveDir == "xy") vec3.z = 0
        if(moveDir == "yz") vec3.x = 0
        if(moveDir == "zx") vec3.y = 0
        return vec3
    }

    setGravity(vec: Vector3) {
        this.settings.gravity = vec
    }
    setForceFields(forceFields: ForceField[]) {
        this.settings.forceFields = forceFields
    }
    disableGravity() {
        this.settings.gravity = null
    }
    applyGravity(sc: ScenarioManager) {
        const om = sc.objectManager
        for(let pi of this.objPhysInfos) {
            // skip child of group
            if(pi.isGroup && pi.isChild) {
                continue
            }
            const obj = om.searchObjectByName(pi.objectName)
            if(obj !== null && this.settings.gravity !== null) {
                if(!pi.fixed) {
                    pi.velocity = pi.velocity.add(this.settings.gravity)
                }
            }
        }
    }
    applyForceFields(sc: ScenarioManager) {
        const om = sc.objectManager
        for(let pi of this.objPhysInfos) {
            // skip child of group
            if(pi.isGroup && pi.isChild) {
                continue
            }
            const obj = om.searchObjectByName(pi.objectName)
            if(obj !== null) {
                for(let forceField of this.settings.forceFields) {
                    const forceType = forceField.type
                    const shape = forceField.shape
                    const shapeMeta = forceField.shapeMeta
                    const strength = forceField.strength
                    switch(shape) {
                        case "sphere":
                            const _center = shapeMeta.center
                            const center = new Vector3(_center[0],_center[1],_center[2])
                            const radius = shapeMeta.radius
                            const diffVec = center.sub(obj.getObjectPosition())
                            if(diffVec.length() < radius) {
                                if(!pi.fixed) {
                                    if(forceType == "push") pi.velocity = pi.velocity.add(diffVec.mul(-1).normal().mul(strength))
                                    if(forceType == "pull") pi.velocity = pi.velocity.add(diffVec.normal().mul(strength))
                                }
                            }
                            break
                    }
                }
            }
        }
    }
    applyObjectMove(sc: ScenarioManager) {
        const om = sc.objectManager
        const groupParents = []
        for(let pi of this.objPhysInfos) {
            if(pi.isGroup) {
                if(!pi.isChild) {
                    groupParents.push(pi)
                }
            } else {
                const obj = om.searchObjectByName(pi.objectName)
                if(obj) {
                    obj.setObjectPosition(obj.getObjectPosition().add(pi.velocity))
                    obj.setObjectRotation(obj.getObjectRotation().add(pi.rotation))
                }
            }
        }
    }
}

export default PhysicsGame
