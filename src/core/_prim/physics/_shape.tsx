import { GameObject, THREEObjectType } from "../../../object/object"
import { Matrix4 } from "../../../util/matrix"
import { Vector3 } from "../../../util/vector"
import PhysicsGame, { CollisionCube, CollisionCustom, CollisionShape, CollisionShapeMeta, CollisionSphere, ObjectPhysicsInfo } from "../physicsGame"

export type Sphere = {
    pos: Vector3
    center: Vector3
    radius: number
}
export type Cube = {
    pos: Vector3
    vers: Vector3[]
    size: Vector3
    lineIndex: number[][]
    faceIndex: number[][]
}
export type Custom = {
    pos: Vector3
    vers: Vector3[]
    lineIndex: number[][]
    faceIndex: number[][]
}

export function getShape(objPhysInfo: ObjectPhysicsInfo, physicsGame: PhysicsGame) {
    const obj = physicsGame.getObjectByPhysInfo(objPhysInfo)
    return getShapeWithObj(objPhysInfo, obj)
}

export function getShapeWithObj(objPhysInfo: ObjectPhysicsInfo, obj: GameObject|null) {
    const shapeType = objPhysInfo.shape.type
    const shapeMeta = objPhysInfo.shape.meta
    let res = null
    if(obj !== null) {
        switch(shapeType) {
            case "none":
                break
            case "sphere":
                res = getSphere(obj, shapeMeta as CollisionSphere)
                break
            case "cube":
                res = getCube(obj, shapeMeta as CollisionCube)
                break
            case "custom":
                res = getCustom(obj, shapeMeta as CollisionCustom)
                break
        }
    }
    
    return res
}

function getSphere(obj: GameObject, sphereInfo: CollisionSphere): Sphere {
    const pos = obj.getObjectPosition()
    const scale = obj.getObjectScale()
    const _of = sphereInfo.offset
    const offset = new Vector3(_of[0],_of[1],_of[2])
    const radius = sphereInfo.radius * scale.x
    const center = pos.add(offset)

    return {pos, center, radius}
}

function getCube(obj: GameObject, cubeInfo: CollisionCube): Cube {
    const pos = obj.getObjectPosition()
    const rot = obj.getObjectRotation()
    let scale = obj.getObjectScale()
    const _o = cubeInfo.offset
    const _s = cubeInfo.size
    const offset = new Vector3(_o[0],_o[1],_o[2])
    const size = new Vector3(_s[0],_s[1],_s[2])

    const mat = (new Matrix4()).rotate(rot).Mul((new Matrix4()).scale(scale))

    let localVers = [
        new Vector3(-size.x/2,size.y/2,-size.z/2),
        new Vector3(-size.x/2,size.y/2,size.z/2),
        new Vector3(size.x/2,size.y/2,size.z/2),
        new Vector3(size.x/2,size.y/2,-size.z/2),
        new Vector3(-size.x/2,-size.y/2,-size.z/2),
        new Vector3(-size.x/2,-size.y/2,size.z/2),
        new Vector3(size.x/2,-size.y/2,size.z/2),
        new Vector3(size.x/2,-size.y/2,-size.z/2),
    ]
    localVers = localVers.map((ver) => mat.MulVec3(ver))
    const vers = localVers.map((ver) => new Vector3(ver.x+pos.x+offset.x,ver.y+pos.y+offset.y,ver.z+pos.z+offset.z))

    const lineIndex = [
        [0,1],
        [1,2],
        [2,3],
        [3,0],
        [0,4],
        [1,5],
        [2,6],
        [3,7],
        [7,6],
        [6,5],
        [5,4],
        [4,7],
    ]
    const faceIndex = [
        [0,1,2],
        [0,2,3],
        [0,4,5],
        [0,5,1],
        [1,5,6],
        [1,6,2],
        [2,6,7],
        [2,7,3],
        [3,7,4],
        [3,4,0],
        [4,6,5],
        [4,7,6],
    ]

    return { pos, vers, lineIndex, faceIndex, size }
}

function getCustom(obj: GameObject, customInfo: CollisionCustom): Custom {    
    const getFaceInfos = (obj: THREEObjectType, indexOffset: number, offsetMat: Matrix4) => {
        let vers:Vector3[] = []
        let lineIndex:number[][] = []
        let faceIndex:number[][] = []

        const pos = new Vector3().initTHREEVec(obj.position)
        const rotEuler = obj.rotation
        let rot = new Vector3(rotEuler.x, rotEuler.y, rotEuler.z)
        let scale = new Vector3().initTHREEVec(obj.scale)

        const mat = (new Matrix4()).move(pos)
            .Mul((new Matrix4()).rotate(rot))
            .Mul((new Matrix4()).scale(scale))

        const objType = obj.type
        if(objType == "Group") {
            const children = obj.children
            for(const child of children) {
                const childInfo = getFaceInfos(child, vers.length, mat)
                vers = vers.concat(childInfo.vers)
                lineIndex = lineIndex.concat(childInfo.lineIndex)
                faceIndex = faceIndex.concat(childInfo.faceIndex)
            }
        } else {
            const localRot = obj.rotation
            const localMat = (new Matrix4())
                .Mul((new Matrix4()).move(new Vector3().initTHREEVec(obj.position)))
                .Mul((new Matrix4()).rotate(new Vector3(localRot.x,localRot.y,localRot.z)))
                .Mul((new Matrix4()).scale(new Vector3().initTHREEVec(obj.scale)))
            // @ts-ignore
            const verArray: number[] = obj.geometry.attributes.position.array
            let localVers: Vector3[] = []
            for(let idx = 0; idx * 3 < verArray.length; idx++) {
                localVers.push(new Vector3(verArray[idx*3],verArray[idx*3+1],verArray[idx*3+2]))
            }
            vers = localVers.map((ver) => offsetMat.Mul(localMat).MulVec3(ver))

            // @ts-ignore
            const indexArray: number[] = obj.geometry.index.array
            for(let idx = 0; idx * 3 < indexArray.length; idx++) {
                lineIndex = lineIndex.concat([
                    [indexArray[idx*3]+indexOffset,indexArray[idx*3+1]+indexOffset],
                    [indexArray[idx*3+1]+indexOffset,indexArray[idx*3+2]+indexOffset],
                    [indexArray[idx*3+2]+indexOffset,indexArray[idx*3]+indexOffset],
                ])
                faceIndex.push([indexArray[idx*3]+indexOffset,indexArray[idx*3+1]+indexOffset,indexArray[idx*3+2]+indexOffset])
            }
        }
        lineIndex = lineIndex.filter((val) => lineIndex.findIndex((_val) => (_val[0] == val[0] && _val[1] == val[1]) || (_val[0] == val[1] && _val[1] == val[0])))

        return {vers, lineIndex, faceIndex}
    }
    
    const _o = customInfo.offset
    const offset = new Vector3(_o[0],_o[1],_o[2])

    const mat = (new Matrix4()).move(offset)
    const objFaceInfo = getFaceInfos(obj.object, 0, mat)

    const pos = obj.getObjectPosition()
    const vers = objFaceInfo.vers
    const lineIndex = objFaceInfo.lineIndex
    const faceIndex = objFaceInfo.faceIndex
    
    return { pos, vers, lineIndex, faceIndex }
}
