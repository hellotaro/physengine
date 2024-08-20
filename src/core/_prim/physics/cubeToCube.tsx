import { GameObject } from "../../../object/object"
import { Matrix4 } from "../../../util/matrix"
import { Vector3 } from "../../../util/vector"
import PhysicsGame, {ObjectPhysicsInfo, CollisionCube, CollisionActionType, MoveDirType} from "../physicsGame"
import { Cube, getShape } from "./_shape"

export function checkCubeToCube(objPhysInfo1: ObjectPhysicsInfo, objPhysInfo2: ObjectPhysicsInfo, physicsGame: PhysicsGame): boolean {
    let res = false
    res = res || _checkCubeToCube(objPhysInfo1, objPhysInfo2, physicsGame)
    res = res || _checkCubeToCube(objPhysInfo2, objPhysInfo1, physicsGame)
    return res
}

function _checkCubeToCube(objPhysInfo1: ObjectPhysicsInfo, objPhysInfo2: ObjectPhysicsInfo, physicsGame: PhysicsGame): boolean {
    const obj1 = physicsGame.getObjectByPhysInfo(objPhysInfo1)
    const obj2 = physicsGame.getObjectByPhysInfo(objPhysInfo2)
    const shape1 = getShape(objPhysInfo1, physicsGame) as Cube
    const shape2 = getShape(objPhysInfo2, physicsGame) as Cube

    let isCollided = false
    if(obj1 && obj2 && shape1 && shape2) {
        const pos1 = shape1.pos
        const vers1 = shape1.vers
        const lineIdxs1 = shape1.lineIndex
        const faceIdxs1 = shape1.faceIndex
        const pos2 = shape2.pos
        const vers2 = shape2.vers
        const lineIdxs2 = shape2.lineIndex
        const faceIdxs2 = shape2.faceIndex
        
        for(const ver of vers1) {
            let allBelow = true
            for(const idx of faceIdxs2) {
                const planePosVec = vers2[idx[0]]
                const planeVec1 = vers2[idx[1]].sub(vers2[idx[0]])
                const planeVec2 = vers2[idx[2]].sub(vers2[idx[0]])
                const distInfo = ver.planeDistVec(planePosVec, planeVec1, planeVec2)
                allBelow = allBelow && distInfo.isBelow
            }

            if(allBelow) isCollided = true
        }
        /*
        if(!isCollided) {
            for(const lidx of lineIdxs1) {
                if(isCollided) break

                for(const fidx of faceIdxs2) {
                    if(isCollided) break

                    const v1 = vers1[lidx[0]]
                    const v2 = vers1[lidx[1]]
                    const planePosVec = vers2[fidx[0]]
                    const planeVec1 = vers2[fidx[1]].sub(vers2[fidx[0]])
                    const planeVec2 = vers2[fidx[2]].sub(vers2[fidx[0]])
                    const distInfo1 = v1.planeDistVec(planePosVec, planeVec1, planeVec2)
                    const distInfo2 = v2.planeDistVec(planePosVec, planeVec1, planeVec2)
                
                    if(distInfo1.distance * distInfo2.distance <= 0) {
                        const v1Ratio = Math.abs(distInfo1.distance) / (Math.abs(distInfo1.distance) + Math.abs(distInfo2.distance))
                        const colPos = v1.add((v2.sub(v1).mul(v1Ratio)))
                        const colDistInfo = colPos.planeDistVec(planePosVec, planeVec1, planeVec2)
                        if((colDistInfo.isStrictAbove || colDistInfo.isStrictBelow) && colDistInfo.distance < v2.sub(v1).length() * 0.00001) {
                            isCollided = true
                        }
                    }
                }
            }
        }
        */

        if(isCollided) {
            objPhysInfo1.collisionObjPhysInfos.push(objPhysInfo2)
            objPhysInfo2.collisionObjPhysInfos.push(objPhysInfo1)
        }
    }

    return isCollided
}

export function actionBetweenCubeToCube(actionType: CollisionActionType, objPhysInfo1: ObjectPhysicsInfo, objPhysInfo2: ObjectPhysicsInfo, moveDir: MoveDirType, physicsGame: PhysicsGame) {
    _actionBetweenCubeToCube(actionType, objPhysInfo1, objPhysInfo2, moveDir, physicsGame)
    _actionBetweenCubeToCube(actionType, objPhysInfo2, objPhysInfo1, moveDir, physicsGame)
}

function _actionBetweenCubeToCube(actionType: CollisionActionType, objPhysInfo1: ObjectPhysicsInfo, objPhysInfo2: ObjectPhysicsInfo, moveDir: MoveDirType, physicsGame: PhysicsGame) {
    const POS_RATIO = physicsGame.settings.posRatio.cubeToCube
    const DELTA_TIME = physicsGame.settings.timeRatio.deltaTime

    const obj1 = physicsGame.getObjectByPhysInfo(objPhysInfo1)
    const obj2 = physicsGame.getObjectByPhysInfo(objPhysInfo2)
    const shape1 = getShape(objPhysInfo1, physicsGame) as Cube
    const shape2 = getShape(objPhysInfo2, physicsGame) as Cube


    let isCollided = false
    if(obj1 && obj2 && shape1 && shape2) {
        const pos1 = shape1.pos
        const vers1 = shape1.vers
        const lineIdxs1 = shape1.lineIndex
        const faceIdxs1 = shape1.faceIndex
        const weight1 = objPhysInfo1.weight > 0 ? objPhysInfo1.weight : 1
        const velocity1 = objPhysInfo1.velocity
        const rotation1 = objPhysInfo1.rotation
        const inertia1 = objPhysInfo1.inertia
        const reflectCoef1 = objPhysInfo1.reflectCoef
        const dynamicFricCoef1 = objPhysInfo1.dynamicFricCoef
        const staticFricCoef1 = objPhysInfo1.staticFricCoef
        const pos2 = shape2.pos
        const vers2 = shape2.vers
        const lineIdxs2 = shape2.lineIndex
        const faceIdxs2 = shape2.faceIndex
        const weight2 = objPhysInfo2.weight > 0 ? objPhysInfo2.weight : 1
        const velocity2 = objPhysInfo2.velocity
        const rotation2 = objPhysInfo2.rotation
        const inertia2 = objPhysInfo2.inertia
        const reflectCoef2 = objPhysInfo2.reflectCoef
        const dynamicFricCoef2 = objPhysInfo2.dynamicFricCoef
        const staticFricCoef2 = objPhysInfo2.staticFricCoef
        const reflectCoef = (reflectCoef1 + reflectCoef2) / 2
        const dynamicFricCoef = (dynamicFricCoef1 + dynamicFricCoef2) / 2
        const staticFricCoef = (staticFricCoef1 + staticFricCoef2) / 2

        const dirVec = pos2.sub(pos1)
        
        let posVec = new Vector3()
        let _colPoses: Vector3[]|null = null
        let collisionPos: Vector3|null = null
        for(const ver of vers1) {
            let allBelow = true
            const distInfos = []
            const scoreVals = []
            for(const idx of faceIdxs2) {
                const planePosVec = vers2[idx[0]]
                const planeVec1 = vers2[idx[1]].sub(vers2[idx[0]])
                const planeVec2 = vers2[idx[2]].sub(vers2[idx[0]])
                const distInfo = ver.planeDistVec(planePosVec, planeVec1, planeVec2)
                allBelow = allBelow && distInfo.isBelow
                distInfos.push(distInfo)
                
                const innerValue = distInfo.distVec.normal().inner(dirVec.normal())
                const scoreValue = innerValue + distInfo.distance
                scoreVals.push(scoreValue)
            }

            if(allBelow) isCollided = true
            
            if(allBelow) {
                const sScoreVals = scoreVals.slice().sort((a,b) => -(a - b))
                let _scoreInfos = []
                for(let didx = 0; didx < scoreVals.length; didx++) {
                    if(scoreVals[didx] == sScoreVals[0]) {
                        const di = distInfos[didx]
                        _scoreInfos.push(di)
                    }
                }

                const nearestDistInfo = {
                    start: new Vector3(),
                    distance: 0,
                    distVec: new Vector3(),
                    nearestPos: new Vector3(),
                    isStrictAbove: false,
                    isStrictBelow: false,
                    isAbove: false,
                    isBelow: false,
                }
                for(const distInfo of _scoreInfos) {
                    nearestDistInfo.start = nearestDistInfo.start.add(distInfo.start.mul(1 / _scoreInfos.length))
                    nearestDistInfo.distance = nearestDistInfo.distance + (distInfo.distance * (1 / _scoreInfos.length))
                    nearestDistInfo.distVec = nearestDistInfo.distVec.add(distInfo.distVec.mul(1 / _scoreInfos.length))
                    nearestDistInfo.nearestPos = nearestDistInfo.nearestPos.add(distInfo.nearestPos.mul(1 / _scoreInfos.length))
                    nearestDistInfo.isStrictAbove = nearestDistInfo.isStrictAbove || distInfo.isStrictAbove
                    nearestDistInfo.isStrictBelow = nearestDistInfo.isStrictBelow || distInfo.isStrictBelow
                    nearestDistInfo.isAbove = nearestDistInfo.isAbove || distInfo.isAbove
                    nearestDistInfo.isBelow = nearestDistInfo.isBelow || distInfo.isBelow
                }

                if(_colPoses == null) _colPoses = []
                _colPoses.push(nearestDistInfo.nearestPos)

                posVec = posVec.add(nearestDistInfo.distVec.normal().mul(nearestDistInfo.distance))
            }
        }
        if(_colPoses !== null) {
            collisionPos = new Vector3()
            for(const pos of _colPoses) {
                collisionPos = collisionPos?.add(pos.mul(1 / _colPoses.length))
            }
        }
        /*
        if(!isCollided) {
            for(const lidx of lineIdxs1) {
                for(const fidx of faceIdxs2) {
                    const v1 = vers1[lidx[0]]
                    const v2 = vers1[lidx[1]]
                    const planePosVec = vers2[fidx[0]]
                    const planeVec1 = vers2[fidx[1]].sub(vers2[fidx[0]])
                    const planeVec2 = vers2[fidx[2]].sub(vers2[fidx[0]])
                    const normalVec = planeVec1.outer(planeVec2)
                    const distInfo1 = v1.planeDistVec(planePosVec, planeVec1, planeVec2)
                    const distInfo2 = v2.planeDistVec(planePosVec, planeVec1, planeVec2)
                
                    if(distInfo1.distance * distInfo2.distance <= 0) {
                        const v1Ratio = Math.abs(distInfo1.distance) / (Math.abs(distInfo1.distance) + Math.abs(distInfo2.distance))
                        const colPos = v1.add((v2.sub(v1).mul(v1Ratio)))
                        const colDistInfo = colPos.planeDistVec(planePosVec, planeVec1, planeVec2)
                        if((colDistInfo.isStrictAbove || colDistInfo.isStrictBelow) && colDistInfo.distance < v2.sub(v1).length() * 0.00001) {
                            isCollided = true

                            if(_colPoses === null) _colPoses = []
                            _colPoses.push(colPos)
                        }
                    }
                }
            }
            if(_colPoses !== null) {
                collisionPos = new Vector3()
                for(const pos of _colPoses) {
                    collisionPos = collisionPos?.add(pos.mul(1 / _colPoses.length))
                }
            }

            // change!!!
            if(collisionPos !== null) {
                let distances = []
                let normals = []
                for(const fidx of faceIdxs2) {
                    const planePosVec = vers2[fidx[0]]
                    const planeVec1 = vers2[fidx[1]].sub(vers2[fidx[0]])
                    const planeVec2 = vers2[fidx[2]].sub(vers2[fidx[0]])
                    const normalVec = planeVec1.outer(planeVec2)
                    const distInfo = collisionPos.planeDistVec(planePosVec, planeVec1, planeVec2)
                    distances.push(distInfo.distance)
                    normals.push(normalVec)
                }
                const minDist = distances.sort()[0]
                const minIdx = distances.indexOf(minDist)
                const normal = normals[minIdx]
                posVec = normal.mul(minDist)
            }
        }
        */

        posVec = physicsGame._restrictPlane(posVec, moveDir)
        const posNV = posVec.normal()

        let ratio1 = POS_RATIO * (weight2 / (weight1 + weight2))
        let ratio2 = -POS_RATIO * (weight1 / (weight1 + weight2))
        if(objPhysInfo1.fixed && !objPhysInfo2.fixed) {
            ratio1 = 0 * POS_RATIO
            ratio2 = -1 * POS_RATIO
        }
        if(!objPhysInfo1.fixed && objPhysInfo2.fixed) {
            ratio1 = 1 * POS_RATIO
            ratio2 = -0 * POS_RATIO
        }
        if(objPhysInfo1.fixed && objPhysInfo2.fixed) {
            ratio1 = 0
            ratio2 = 0
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

        const vertVec1 = posNV.mul(vel1)
        const vertVec2 = posNV.mul(vel2)
        const slipVec1 = velocity1.sub(vertVec1)
        const slipVec2 = velocity2.sub(vertVec2)
        const reflectVec1 = posNV.mul(newVertVel1)
        const reflectVec2 = posNV.mul(newVertVel2)
        let newVelocity1  = slipVec1.add(reflectVec1)
        let newVelocity2  = slipVec2.add(reflectVec2)

        if(physicsGame.colAcType == "posRot" || physicsGame.colAcType == "posRotSlip") {
            if(collisionPos !== null) {
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
