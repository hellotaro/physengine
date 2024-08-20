import { Vector3 } from "../../../util/vector"
import PhysicsGame, {ObjectPhysicsInfo, CollisionSphere, CollisionActionType, MoveDirType} from "../physicsGame"
import { Sphere, getShape } from "./_shape"

export function checkSphereToSphere(objPhysInfo1: ObjectPhysicsInfo, objPhysInfo2: ObjectPhysicsInfo, physicsGame: PhysicsGame): boolean {
    const obj1 = physicsGame.getObjectByPhysInfo(objPhysInfo1)
    const obj2 = physicsGame.getObjectByPhysInfo(objPhysInfo2)
    const shape1 = getShape(objPhysInfo1, physicsGame) as Sphere
    const shape2 = getShape(objPhysInfo2, physicsGame) as Sphere

    let isCollided = false
    if(obj1 && obj2) {
        const pos1 = shape1.pos
        const center1 = shape1.center
        const radius1 = shape1.radius
        const pos2 = shape2.pos
        const center2 = shape2.center
        const radius2 = shape2.radius
        
        let distVec = center2.sub(center1)
        distVec = physicsGame._restrictPlane(distVec, physicsGame.moveDir)
        isCollided = distVec.length() < radius1 + radius2
        if(isCollided) {
            objPhysInfo1.collisionObjPhysInfos.push(objPhysInfo2)
            objPhysInfo2.collisionObjPhysInfos.push(objPhysInfo1)
        }
    }
    
    return isCollided
}
export function actionBetweenSphereToSphere(actionType: CollisionActionType, objPhysInfo1: ObjectPhysicsInfo, objPhysInfo2: ObjectPhysicsInfo, moveDir: MoveDirType, physicsGame: PhysicsGame) {
    let POS_RATIO = physicsGame.settings.posRatio.sphereToSphere
    const DELTA_TIME = physicsGame.settings.timeRatio.deltaTime

    const obj1 = physicsGame.getObjectByPhysInfo(objPhysInfo1)
    const obj2 = physicsGame.getObjectByPhysInfo(objPhysInfo2)
    const shape1 = getShape(objPhysInfo1, physicsGame) as Sphere
    const shape2 = getShape(objPhysInfo2, physicsGame) as Sphere

    if(obj1 && obj2) {
        const pos1 = shape1.pos
        const center1 = shape1.center
        const radius1 = shape1.radius
        const weight1 = objPhysInfo1.weight > 0 ? objPhysInfo1.weight : 1
        const velocity1 = objPhysInfo1.velocity
        const rotation1 = objPhysInfo1.rotation
        const inertia1 = objPhysInfo1.inertia
        const reflectCoef1 = objPhysInfo1.reflectCoef
        const staticFricCoef1 = objPhysInfo1.staticFricCoef
        const dynamicFricCoef1 = objPhysInfo1.dynamicFricCoef
        const pos2 = shape2.pos
        const center2 = shape2.center
        const radius2 = shape2.radius
        const weight2 = objPhysInfo2.weight > 0 ? objPhysInfo2.weight : 1
        const velocity2 = objPhysInfo2.velocity
        const rotation2 = objPhysInfo2.rotation
        const inertia2 = objPhysInfo2.inertia
        const reflectCoef2 = objPhysInfo2.reflectCoef
        const staticFricCoef2 = objPhysInfo2.staticFricCoef
        const dynamicFricCoef2 = objPhysInfo2.dynamicFricCoef
        const reflectCoef = (reflectCoef1 + reflectCoef2) / 2
        const staticFricCoef = (staticFricCoef1 + staticFricCoef2) / 2
        const dynamicFricCoef = (dynamicFricCoef1 + dynamicFricCoef2) / 2

        let posVec = center2.sub(center1)

        if(actionType == "pull" || actionType == "pullby") POS_RATIO = 0.9

        posVec = physicsGame._restrictPlane(posVec, moveDir)
        const posNV = posVec.normal()

        const posRatio = (1 - posVec.length() / (radius1 + radius2)) * POS_RATIO

        let ratio1 = -posRatio*(weight2/(weight1+weight2))
        let ratio2 = posRatio*(weight1/(weight1+weight2))

        if(objPhysInfo1.fixed && !objPhysInfo2.fixed) {
            ratio1 = 0
            ratio2 = 1 * posRatio * POS_RATIO
        }
        if(!objPhysInfo1.fixed && objPhysInfo2.fixed) {
            ratio1 = -1 * posRatio * POS_RATIO
            ratio2 = 0
        }
        if(objPhysInfo1.fixed && objPhysInfo2.fixed) {
            ratio1 = 0
            ratio2 = 0
        }

        if(actionType == "pull" || actionType == "pullby") {
            ratio1 = -ratio1
            ratio2 = -ratio2
        }

        const posVec1 = posVec.mul(ratio1)
        const posVec2 = posVec.mul(ratio2)

        const vel1 = velocity1.inner(posNV)
        const vel2 = velocity2.inner(posNV)
        let newVertVel1 = ( -vel1 + vel2 )*( 1 + reflectCoef )/( weight1 / weight2 + 1 ) + vel1
        let newVertVel2 = ( -vel2 + vel1 )*( 1 + reflectCoef )/( weight2 / weight1 + 1 ) + vel2
        if(objPhysInfo1.fixed && !objPhysInfo2.fixed) {
            newVertVel2 = newVertVel2 - newVertVel1
            newVertVel1 = 0
        }
        if(!objPhysInfo1.fixed && objPhysInfo2.fixed) {
            newVertVel1 = newVertVel1 - newVertVel2
            newVertVel2 = 0
        }
        if(objPhysInfo1.fixed && objPhysInfo2.fixed) {
            newVertVel1 = 0
            newVertVel2 = 0
        }

        const collisionPos = center1.add(posNV.mul(radius1))
        const vertVec1 = posNV.mul(vel1)
        const vertVec2 = posNV.mul(vel2)
        const slipVec1 = velocity1.sub(vertVec1)
        const slipVec2 = velocity2.sub(vertVec2)
        const reflectVec1 = posNV.mul(newVertVel1)
        const reflectVec2 = posNV.mul(newVertVel2)
        let newVelocity1  = slipVec1.add(reflectVec1)
        let newVelocity2  = slipVec2.add(reflectVec2)
        if(physicsGame.colAcType == "posRot" || physicsGame.colAcType == "posRotSlip") {
            const rotVec1 = rotation1.outer(collisionPos.sub(pos1))
            const rotVec2 = rotation2.outer(collisionPos.sub(pos2))

            let newRotation1 = rotation1
            let newRotation2 = rotation2
            const colDiffVel = velocity2.sub(velocity1)
            const colDiffVec = posNV.mul(colDiffVel.inner(posNV))
            const colPosDistInfo1 = pos1.lineDistVec(collisionPos, collisionPos.add(colDiffVel))
            const colPosDistInfo2 = pos2.lineDistVec(collisionPos, collisionPos.add(colDiffVel.mul(-1)))
            newRotation1 = colPosDistInfo1.distVec.outer(colDiffVec.mul(-1)).mul(DELTA_TIME).divEach(inertia1)
            newRotation2 = colPosDistInfo2.distVec.outer(colDiffVec).mul(DELTA_TIME).divEach(inertia2)

            if(physicsGame.colAcType == "posRotSlip") {
                const staticFricCriteria = staticFricCoef * (vertVec1.length() + vertVec2.length())
                const fricForce = slipVec1.sub(slipVec2).length()

                const colDiffVel = velocity2.sub(velocity1)
                const colPosDistInfo1 = center1.lineDistVec(collisionPos, collisionPos.add(colDiffVel))
                const colPosDistInfo2 = center2.lineDistVec(collisionPos, collisionPos.add(colDiffVel.mul(-1)))
                if(fricForce < staticFricCriteria) {
                    const decRatio = fricForce / staticFricCriteria
                    const fricRotation1 = colPosDistInfo1.distVec.outer(slipVec1.mul(decRatio)).divEach(inertia1)
                    const fricRotation2 = colPosDistInfo2.distVec.outer(slipVec2.mul(decRatio)).divEach(inertia2)
                    newRotation1 = fricRotation1
                    newRotation2 = fricRotation2
                    const fricVelocity1  = newRotation1.outer(collisionPos.sub(pos1)).add(reflectVec1)
                    const fricVelocity2  = newRotation2.outer(collisionPos.sub(pos2)).add(reflectVec2)
                    newVelocity1 = fricVelocity1
                    newVelocity2 = fricVelocity2
                } else {
                    const subSlipVec1 = slipVec1.mul(dynamicFricCoef)
                    const subSlipVec2 = slipVec2.mul(dynamicFricCoef)
                    const fricRotation1 = colPosDistInfo1.distVec.outer(subSlipVec1).divEach(inertia1)
                    const fricRotation2 = colPosDistInfo2.distVec.outer(subSlipVec2).divEach(inertia2)
                    newRotation1 = newRotation1.add(fricRotation1)
                    newRotation2 = newRotation2.add(fricRotation2)
                    newVelocity1 = newVelocity1.sub(subSlipVec1)
                    newVelocity2 = newVelocity2.sub(subSlipVec2)
                }
            }

            if(objPhysInfo1.fixed) {
                newVelocity1 = new Vector3()
                newRotation1 = rotation1
            }
            if(objPhysInfo2.fixed) {
                newVelocity2 = new Vector3()
                newRotation2 = rotation2
            }
            
            objPhysInfo1.rotation = newRotation1
            objPhysInfo2.rotation = newRotation2
        }

        const newPosition1 = pos1.add(posVec1)
        const newPosition2 = pos2.add(posVec2)

        objPhysInfo1.posMoveVec = posVec1
        objPhysInfo2.posMoveVec = posVec2
        objPhysInfo1.velocity = newVelocity1
        objPhysInfo2.velocity = newVelocity2

        obj1.setObjectPosition(newPosition1)
        obj2.setObjectPosition(newPosition2)
    }
}

