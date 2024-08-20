import { Vector3 } from "../../../util/vector"
import { Matrix4 } from "../../../util/matrix"
import PhysicsGame, {ObjectPhysicsInfo, CollisionSphere, CollisionCube, CollisionActionType, MoveDirType} from "../physicsGame"
import { Sphere, Cube, getShape } from "./_shape"


export function checkSphereToCube(objSpherePhysInfo: ObjectPhysicsInfo, objCubePhysInfo: ObjectPhysicsInfo, physicsGame: PhysicsGame): boolean {
    const obj1 = physicsGame.getObjectByPhysInfo(objSpherePhysInfo)
    const obj2 = physicsGame.getObjectByPhysInfo(objCubePhysInfo)
    const shape1 = getShape(objSpherePhysInfo, physicsGame) as Sphere
    const shape2 = getShape(objCubePhysInfo, physicsGame) as Cube

    let isCollided = false
    if(obj1 && obj2 && shape1 && shape2) {
        const pos1 = shape1.pos
        const center1 = shape1.center
        const radius1 = shape1.radius
        const pos2 = shape2.pos
        const vers2 = shape2.vers
        const lineIdxs = shape2.lineIndex
        const faceIdxs = shape2.faceIndex
        
        let allBelow = true
        for(const idx of faceIdxs) {
            const planePosVec = vers2[idx[0]]
            const planeVec1 = vers2[idx[1]].sub(vers2[idx[0]])
            const planeVec2 = vers2[idx[2]].sub(vers2[idx[0]])
            const distInfo = center1.planeDistVec(planePosVec, planeVec1, planeVec2)
            if(distInfo.isStrictAbove && distInfo.distance < radius1) {
                isCollided = true
            }
            allBelow = allBelow && distInfo.isBelow
        }
        if(allBelow) isCollided = true

        if(!isCollided) {
            for(const idx of lineIdxs) {
                const p0 = vers2[idx[0]]
                const p1 = vers2[idx[1]]
                const distInfo = center1.lineDistVec(p0,p1)
                if(distInfo.isOn && distInfo.distance < radius1) {
                    isCollided = true
                    break
                }
            }
        }
        
        if(!isCollided) {
            for(const ver of vers2) {
                const distance = center1.sub(ver).length()
                if(distance < radius1) {
                    isCollided = true
                    break
                }
            }
        }

        if(isCollided) {
            objSpherePhysInfo.collisionObjPhysInfos.push(objCubePhysInfo)
            objCubePhysInfo.collisionObjPhysInfos.push(objSpherePhysInfo)
        }
    }

    return isCollided
}

export function actionBetweenSphereToCube(actionType: CollisionActionType, objSpherePhysInfo: ObjectPhysicsInfo, objCubePhysInfo: ObjectPhysicsInfo, moveDir: MoveDirType, physicsGame: PhysicsGame) {
    const POS_RATIO = physicsGame.settings.posRatio.sphereToCube
    const DELTA_TIME = physicsGame.settings.timeRatio.deltaTime

    const obj1 = physicsGame.getObjectByPhysInfo(objSpherePhysInfo)
    const obj2 = physicsGame.getObjectByPhysInfo(objCubePhysInfo)
    const shape1 = getShape(objSpherePhysInfo, physicsGame) as Sphere
    const shape2 = getShape(objCubePhysInfo, physicsGame) as Cube

    if(obj1 && obj2) {
        const pos1 = shape1.pos
        const center1 = shape1.center
        const radius1 = shape1.radius
        const weight1 = objSpherePhysInfo.weight > 0 ? objSpherePhysInfo.weight : 1
        const velocity1 = objSpherePhysInfo.velocity
        const rotation1 = objSpherePhysInfo.rotation
        const inertia1 = objSpherePhysInfo.inertia
        const reflectCoef1 = objSpherePhysInfo.reflectCoef
        const dynamicFricCoef1 = objSpherePhysInfo.dynamicFricCoef
        const staticFricCoef1 = objSpherePhysInfo.staticFricCoef
        const pos2 = shape2.pos
        const vers2 = shape2.vers
        const size2 = shape2.size
        const lineIdxs = shape2.lineIndex
        const faceIdxs = shape2.faceIndex
        const weight2 = objCubePhysInfo.weight > 0 ? objCubePhysInfo.weight : 1
        const velocity2 = objCubePhysInfo.velocity
        const rotation2 = objCubePhysInfo.rotation
        const inertia2 = objCubePhysInfo.inertia
        const reflectCoef2 = objCubePhysInfo.reflectCoef
        const dynamicFricCoef2 = objCubePhysInfo.dynamicFricCoef
        const staticFricCoef2 = objCubePhysInfo.staticFricCoef
        const reflectCoef = (reflectCoef1 + reflectCoef2) / 2
        const staticFricCoef = (staticFricCoef1 + staticFricCoef2) / 2
        const dynamicFricCoef = (dynamicFricCoef1 + dynamicFricCoef2) / 2

        let isCollided = false
        let posVec = new Vector3()
        let _colPoses:Vector3[] = []
        let allBelow = true
        const distInfos = []
        for(const idx of faceIdxs) {
            const planePosVec = vers2[idx[0]]
            const planeVec1 = vers2[idx[1]].sub(vers2[idx[0]])
            const planeVec2 = vers2[idx[2]].sub(vers2[idx[0]])
            const distInfo = pos1.planeDistVec(planePosVec, planeVec1, planeVec2)
            if(distInfo.isStrictAbove && distInfo.distance < radius1) {
                posVec = posVec.add(distInfo.distVec.normal().mul(radius1 - distInfo.distance))
                _colPoses.push(distInfo.start)
                isCollided = true
            }
            allBelow = allBelow && distInfo.isBelow
            distInfos.push(distInfo)
        }
        if(allBelow) {
            distInfos.sort((a,b) => Math.abs(a.distance) - Math.abs(b.distance))
            const nearestDistInfo = distInfos[0]
            posVec = nearestDistInfo.distVec.normal().mul(radius1 - nearestDistInfo.distance)
            _colPoses = [nearestDistInfo.start]
            isCollided = true
        }

        if(!isCollided) {
            for(const idx of lineIdxs) {
                const p0 = vers2[idx[0]]
                const p1 = vers2[idx[1]]
                const distInfo = pos1.lineDistVec(p0,p1)
                if(distInfo.isOn && distInfo.distance < radius1) {
                    posVec = posVec.add(distInfo.distVec.normal().mul(radius1 - distInfo.distance))
                    _colPoses.push(distInfo.start)
                    isCollided = true
                    break
                }
            }
        }

        if(!isCollided) {
            for(const ver of vers2) {
                const dirVec = pos1.sub(ver)
                if(dirVec.length() < radius1) {
                    posVec = posVec.add(dirVec.normal().mul(radius1 - dirVec.length()))
                    _colPoses.push(dirVec)
                    isCollided = true
                    break
                }
            }
        }

        if(_colPoses.length > 0) posVec = posVec.mul(1/_colPoses.length)
        let collisionPos = new Vector3()
        for(const pos of _colPoses) {
            collisionPos = collisionPos.add(pos.mul(1/_colPoses.length))
        }

        posVec = physicsGame._restrictPlane(posVec, moveDir)
        const posNV = posVec.normal()
        
        let ratio1 = POS_RATIO * (weight2 / (weight1 + weight2))
        let ratio2 = -POS_RATIO * (weight1 / (weight1 + weight2))

        if(objSpherePhysInfo.fixed && !objCubePhysInfo.fixed) {
            ratio1 = 0 * POS_RATIO
            ratio2 = -1 * POS_RATIO
        }
        if(!objSpherePhysInfo.fixed && objCubePhysInfo.fixed) {
            ratio1 = 1 * POS_RATIO
            ratio2 = 0 * POS_RATIO
        }
        if(objSpherePhysInfo.fixed && objCubePhysInfo.fixed) {
            ratio1 = 0
            ratio2 = 0
        }

        const posVec1 = posVec.mul(ratio1)
        const posVec2 = posVec.mul(ratio2)

        const vel1 = velocity1.inner(posNV)
        const vel2 = velocity2.inner(posNV)
        let newVertVel1 = ( -vel1 + vel2 )*( 1 + reflectCoef )/( weight1 / weight2 + 1 ) + vel1
        let newVertVel2 = ( -vel2 + vel1 )*( 1 + reflectCoef )/( weight2 / weight1 + 1 ) + vel2
        
        if(objSpherePhysInfo.fixed && !objCubePhysInfo.fixed) {
            newVertVel2 = newVertVel2 - newVertVel1
            newVertVel1 = 0
        }
        if(!objSpherePhysInfo.fixed && objCubePhysInfo.fixed) {
            newVertVel1 = newVertVel1 - newVertVel2
            newVertVel2 = 0
        }
        if(objSpherePhysInfo.fixed && objCubePhysInfo.fixed) {
            newVertVel1 = 0
            newVertVel2 = 0
        }
        
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
                const colPosDistInfo1 = pos1.lineDistVec(collisionPos, collisionPos.add(colDiffVel))
                const colPosDistInfo2 = pos2.lineDistVec(collisionPos, collisionPos.add(colDiffVel.mul(-1)))
                if(fricForce < staticFricCriteria) {
                    const decRatio = fricForce / staticFricCriteria
                    const fricRotation1 = colPosDistInfo1.distVec.outer(slipVec1.mul(decRatio)).divEach(inertia1)
                    const fricRotation2 = colPosDistInfo2.distVec.outer(slipVec2.mul(decRatio)).divEach(inertia2)
                    newRotation1 = newRotation1.add(fricRotation1)
                    newRotation2 = newRotation2.add(fricRotation2)
                    const rotVelocity1  = newRotation1.outer(collisionPos.sub(pos1))
                    const rotVelocity2  = newRotation2.outer(collisionPos.sub(pos2))
                    const fricVelocity1 = rotVelocity1.add(reflectVec1)
                    const fricVelocity2 = rotVelocity2.add(reflectVec2)
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
            
            if(objSpherePhysInfo.fixed) {
                newVelocity1 = new Vector3()
                newRotation1 = rotation1
            }
            if(objCubePhysInfo.fixed) {
                newVelocity2 = new Vector3()
                newRotation2 = rotation2
            }

            objSpherePhysInfo.rotation = newRotation1
            objCubePhysInfo.rotation = newRotation2
        }

        const newPosition1 = pos1.add(posVec1)
        const newPosition2 = pos2.add(posVec2)

        objSpherePhysInfo.posMoveVec = posVec1
        objCubePhysInfo.posMoveVec = posVec2
        objSpherePhysInfo.velocity = newVelocity1
        objCubePhysInfo.velocity = newVelocity2

        obj1.setObjectPosition(newPosition1)
        obj2.setObjectPosition(newPosition2)
    }
}


