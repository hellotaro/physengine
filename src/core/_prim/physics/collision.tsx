import PhysicsGame, {CollisionAction, ActionTypePriority, PhysRangeCube, GamePhysicsInfo, ObjectPhysicsInfo} from "../physicsGame"
import {checkSphereToSphere, actionBetweenSphereToSphere} from "./sphereToSphere"
import { checkSphereToCube, actionBetweenSphereToCube } from "./sphereToCube"
import { checkCubeToCube, actionBetweenCubeToCube } from "./cubeToCube"
import { checkSphereToCustom, actionBetweenSphereToCustom } from "./sphereToCustom"
import { checkCubeToCustom, actionBetweenCubeToCustom } from "./cubeToCustom"
import { actionBetweenCustomToCustom, checkCustomToCustom } from "./customToCustom"

const swapPhysInfo = (objPhysInfo1: ObjectPhysicsInfo, objPhysInfo2: ObjectPhysicsInfo) => {
    let tmp = objPhysInfo1
    objPhysInfo1 = objPhysInfo2
    objPhysInfo2 = tmp
    return [objPhysInfo1, objPhysInfo2]
}

export function checkAllObjectPhysics(physicGame: PhysicsGame, cubes: PhysRangeCube[]|null = null) {
    let physIndexesInCube = []
    for(let idx = 0; idx < physicGame.objPhysInfos.length; idx++) physIndexesInCube.push(idx)
    if(cubes !== null) physIndexesInCube = physicGame.getPhysInfoIdxInCube(cubes)
    
    for(let idx1 of physIndexesInCube) {
        const needCheckPhysIndexes = physicGame.getNeedCheckPhysInfos(idx1, cubes)
        for(let idx2 of needCheckPhysIndexes) {
            if(idx1 >= idx2) continue

            let objPhysInfo1 = physicGame.objPhysInfos[idx1]
            let objPhysInfo2 = physicGame.objPhysInfos[idx2]
            if(!objPhysInfo1.enabled || !objPhysInfo2.enabled) continue

            const shapes = [objPhysInfo1.shape.type, objPhysInfo2.shape.type]
            if(shapes[0] == "sphere" && shapes[1] == "sphere") {
                checkSphereToSphere(objPhysInfo1, objPhysInfo2, physicGame)
            }
            if(shapes[0] == "cube" && shapes[1]== "cube") {
                checkCubeToCube(objPhysInfo1, objPhysInfo2, physicGame)
            }
            if(shapes[0] == "custom" && shapes[1]== "custom") {
                checkCustomToCustom(objPhysInfo1, objPhysInfo2, physicGame)
            }
            if(shapes.indexOf("sphere") >= 0 && shapes.indexOf("cube") >= 0) {
                if(shapes[0] == "cube" && shapes[1] == "sphere") [objPhysInfo1, objPhysInfo2] = swapPhysInfo(objPhysInfo1, objPhysInfo2)
                checkSphereToCube(objPhysInfo1, objPhysInfo2, physicGame)
            }
            if(shapes.indexOf("sphere") >= 0 && shapes.indexOf("custom") >= 0) {
                if(shapes[0] == "custom" && shapes[1] == "sphere") [objPhysInfo1, objPhysInfo2] = swapPhysInfo(objPhysInfo1, objPhysInfo2)
                checkSphereToCustom(objPhysInfo1, objPhysInfo2, physicGame)
            }
            if(shapes.indexOf("cube") >= 0 && shapes.indexOf("custom") >= 0) {
                if(shapes[0] == "custom" && shapes[1] == "cube") [objPhysInfo1, objPhysInfo2] = swapPhysInfo(objPhysInfo1, objPhysInfo2)
                    checkCubeToCustom(objPhysInfo1, objPhysInfo2, physicGame)
            }
        }
    }
}

export function actionAllObjectPhysics(physicGame: PhysicsGame) {
    for(let idx1=0;idx1<physicGame.objPhysInfos.length;idx1++) {
        const collidedObjPhysInfos = physicGame.objPhysInfos[idx1].collisionObjPhysInfos
        for(let idx2=0;idx2<collidedObjPhysInfos.length;idx2++) {
            let objPhysInfo1 = physicGame.objPhysInfos[idx1]
            let objPhysInfo2 = collidedObjPhysInfos[idx2]

            if(objPhysInfo2.applied) continue

            const _actions1 = objPhysInfo1.actions
            const _actions2 = objPhysInfo2.actions

            let actions1: CollisionAction[] = []
            let actions2: CollisionAction[] = []
            for(let actionType of ActionTypePriority) {
                actions1 = actions1.concat(_actions1.filter((action) => action.type == actionType))
                actions2 = actions2.concat(_actions2.filter((action) => action.type == actionType))
            }

            let isActionDone = false
            for(let aidx1=0;aidx1<actions1.length;aidx1++) {
                for(let aidx2=0;aidx2<actions2.length;aidx2++) {
                    const action1 = actions1[aidx1]
                    const action2 = actions2[aidx2]
                    for(let actionType of ActionTypePriority) {
                        let isSkip = false
                        if(actionType == "pullby") {
                            const actionMeta1 = action1.meta
                            const actionMeta2 = action2.meta
                            if(actionMeta1 && actionMeta2) {
                                if(actionMeta1.pullType != actionMeta2.targetPullType || actionMeta1.targetPullType != actionMeta2.pullType) {
                                    isSkip = true
                                }
                            }
                        }

                        if(isSkip) continue

                        if(action1.type == actionType && action2.type == actionType) {
                            const shapes = [objPhysInfo1.shape.type, objPhysInfo2.shape.type]

                            if(objPhysInfo1.shape.type =="sphere" && objPhysInfo2.shape.type =="sphere") {
                                actionBetweenSphereToSphere(actionType,objPhysInfo1,objPhysInfo2, physicGame.moveDir, physicGame)
                            }
                            if(objPhysInfo1.shape.type =="cube" && objPhysInfo2.shape.type =="cube") {
                                actionBetweenCubeToCube(actionType,objPhysInfo1,objPhysInfo2,physicGame.moveDir, physicGame)
                            }
                            if(objPhysInfo1.shape.type =="custom" && objPhysInfo2.shape.type =="custom") {
                                actionBetweenCustomToCustom(actionType,objPhysInfo1,objPhysInfo2,physicGame.moveDir, physicGame)
                            }
                            if(shapes.indexOf("sphere") >= 0 && shapes.indexOf("cube") >= 0) {
                                if(shapes[0] == "cube" && shapes[1] == "sphere") [objPhysInfo1, objPhysInfo2] = swapPhysInfo(objPhysInfo1, objPhysInfo2)
                                actionBetweenSphereToCube(actionType, objPhysInfo1, objPhysInfo2, physicGame.moveDir, physicGame)
                            }
                            if(shapes.indexOf("sphere") >= 0 && shapes.indexOf("custom") >= 0) {
                                if(shapes[0] == "custom" && shapes[1] == "sphere") [objPhysInfo1, objPhysInfo2] = swapPhysInfo(objPhysInfo1, objPhysInfo2)
                                actionBetweenSphereToCustom(actionType, objPhysInfo1, objPhysInfo2, physicGame.moveDir, physicGame)
                            }
                            if(shapes.indexOf("cube") >= 0 && shapes.indexOf("custom") >= 0) {
                                if(shapes[0] == "custom" && shapes[1] == "cube") [objPhysInfo1, objPhysInfo2] = swapPhysInfo(objPhysInfo1, objPhysInfo2)
                                    actionBetweenCubeToCustom(actionType, objPhysInfo1, objPhysInfo2, physicGame.moveDir, physicGame)
                            }
                            isActionDone = true
                        }
                    }
                }
            }
        }
        
        physicGame.objPhysInfos[idx1].applied = true
    }
}


