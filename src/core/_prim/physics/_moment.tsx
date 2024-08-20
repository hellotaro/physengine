import { Vector3 } from "../../../util/vector";
import PhysicsGame, { CollisionCube, CollisionCustom, CollisionShapeMeta, CollisionShapeType, CollisionSphere, ObjectPhysicsInfo } from "../physicsGame";

export function getInertia(shape: CollisionShapeType, objPhysInfo :ObjectPhysicsInfo, shapeMeta: CollisionShapeMeta, physicsGame: PhysicsGame) {
    const inertiaRatio = physicsGame.settings.rotateRatio.inertiaRatio
    
    let vec = new Vector3()
    switch(shape) {
        case "sphere":
            vec = getSphereInertia(objPhysInfo, shapeMeta as CollisionSphere)
            break
        case "cube":
            vec = getCubeInertia(objPhysInfo, shapeMeta as CollisionCube)
            break
        case "custom":
            vec = getCustomInertia(objPhysInfo, shapeMeta as CollisionCustom)
            break
    }

    vec = vec.mul(inertiaRatio)

    return vec
}

function getSphereInertia(objPhysInfo :ObjectPhysicsInfo, sphereInfo: CollisionSphere) {
    const weight = objPhysInfo.weight
    const obj = objPhysInfo.object
    
    let vec = new Vector3()
    if(obj) {
        const scale = obj.getObjectScale()
        const radius = scale.x * sphereInfo.radius

        const inertia = 2 / 5 * weight * radius * radius
        vec = new Vector3(inertia, inertia, inertia)
    }

    return vec
}

function getCubeInertia(objPhysInfo :ObjectPhysicsInfo, cubeInfo: CollisionCube) {
    const weight = objPhysInfo.weight
    const obj = objPhysInfo.object

    let vec = new Vector3()
    if(obj) {
        const scale = obj.getObjectScale()
        const cx = scale.x / 2
        const cy = scale.y / 2
        const cz = scale.z / 2

        vec = new Vector3(
            (cy * cy + cz * cz) * weight / 3,
            (cz * cz + cx * cx) * weight / 3,
            (cx * cx + cy * cy) * weight / 3,
        )
    }

    return vec
}

function getCustomInertia(objPhysInfo :ObjectPhysicsInfo, customInfo: CollisionCustom) {
    const vec = new Vector3(1,1,1).mul(0.1)

    return vec
}

