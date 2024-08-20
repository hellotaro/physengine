import { GameObject } from "../../../object/object"
import { ObjectPhysicsInfo } from "../physicsGame"
import { Cube, Custom, getShapeWithObj, Sphere } from "./_shape"

export type BoundaryInfo = {
    x: number[]
    y: number[]
    z: number[]
}

export function getBoundary(obj: GameObject, physInfo: ObjectPhysicsInfo) {
    const shapeInfo = physInfo.shape
    switch(shapeInfo.type) {
        case "sphere":
            return getSphereBoundary(obj, physInfo)
        case "cube":
            return getCubeBoundary(obj, physInfo)
        case "custom":
            return getCustomBoundary(obj, physInfo)
    }
    return null
}

function getSphereBoundary(obj: GameObject, physInfo: ObjectPhysicsInfo): BoundaryInfo {
    const sphere1 = getShapeWithObj(physInfo, obj) as Sphere
    const pos1 = sphere1.pos
    const center1 = sphere1.center
    const radius1 = sphere1.radius

    return {
        x: [center1.x - radius1, center1.x + radius1],
        y: [center1.y - radius1, center1.y + radius1],
        z: [center1.z - radius1, center1.z + radius1],
    }
}

function getCubeBoundary(obj: GameObject, physInfo: ObjectPhysicsInfo): BoundaryInfo {
    const cube = getShapeWithObj(physInfo, obj) as Cube
    const pos = cube.pos
    const vers = cube.vers
    const lineIdxs = cube.lineIndex
    const faceIdxs = cube.faceIndex

    const versX = vers.slice().sort((a,b) => a.x - b.x)
    const versY = vers.slice().sort((a,b) => a.y - b.y)
    const versZ = vers.slice().sort((a,b) => a.z - b.z)

    return {
        x: [versX[0].x,versX[versX.length-1].x],
        y: [versY[0].y,versY[versY.length-1].y],
        z: [versZ[0].z,versZ[versZ.length-1].z],
    }
}

function getCustomBoundary(obj: GameObject, physInfo: ObjectPhysicsInfo): BoundaryInfo {
    const custom = getShapeWithObj(physInfo, obj) as Custom
    const vers = custom.vers

    const versX = vers.slice().sort((a,b) => a.x - b.x)
    const versY = vers.slice().sort((a,b) => a.y - b.y)
    const versZ = vers.slice().sort((a,b) => a.z - b.z)

    return {
        x: [versX[0].x,versX[versX.length-1].x],
        y: [versY[0].y,versY[versY.length-1].y],
        z: [versZ[0].z,versZ[versZ.length-1].z],
    }
}
