import ScenarioManager from "../../manager/scenarioManager"
import { Matrix4 } from "../../util/matrix"
import {Vector3} from "../../util/vector"
import * as THREE from 'three'

type CameraType = "perspective"|"orthographic"
type CameraMotionType = "none"|"anim"
type RotatePlane = "xy"|"yz"|"zx"
type CameraDefType = {
    name: string
    type: CameraType
    fov?: number
    near?: number
    far?: number
    left?: number
    right?: number
    top?: number
    bottom?: number
    pos: number[]
    lookAtPos: number[]
    up?: number[]
    motion?: {
        type: CameraMotionType
        translate?: number[]
        rotate?: {
            plane: RotatePlane
            angle: number
        }
    }
    lookAtMeta?: {
        motion?: {
            type: CameraMotionType
            translate?: number[]
            rotate?: {
                plane: RotatePlane
                angle: number
            }
        }
    }
}
type PlaneType = {
    x: Vector3
    y: Vector3
    n: Vector3
}
type THREECameraType = THREE.PerspectiveCamera|THREE.OrthographicCamera

class CameraObject {
    camDef: CameraDefType
    name: string
    camera: THREECameraType
    _curPos: Vector3
    _curLookAt: Vector3
    _curUp: Vector3
    _size: number[]
    _aspect: number
    _timeframe: number

    moveMatrix: Matrix4
    lookAtMoveMatrix: Matrix4

    constructor() {
        this.name = "[none]"
        this.camera = new THREE.PerspectiveCamera()
        this.camDef = {
            name: "[none]",
            type: "perspective",
            fov: 75,
            near: 0.1,
            far: 100,
            pos: [0,5,0],
            lookAtPos: [0,0,0],
            up: [0,1,0]
        }
        this._curPos = new Vector3()
        this._curLookAt = new Vector3()
        this._curUp = new Vector3(0,1,0)
        this._size = [1920,1080]
        this._aspect = (this._size[0]/this._size[1])
        this._timeframe = 0

        this.moveMatrix = new Matrix4()
        this.lookAtMoveMatrix = new Matrix4()
    }

    init(camDef: CameraDefType, camMeta: any) {
        this.camDef = camDef
        this.name = camDef.name
        if(camMeta.size) {
            this._aspect = camMeta.size.width/camMeta.size.height
            this._size = [camMeta.size.width,camMeta.size.height]
        }
        let camLookAtPos = new Vector3(camDef.lookAtPos[0],camDef.lookAtPos[1],camDef.lookAtPos[2])
        let camUpVec = new Vector3(0,1,0)
        if(camDef.up) {
            camUpVec = new Vector3(camDef.up[0],camDef.up[1],camDef.up[2])
        }
        const camera = this._getTHREECamera(camDef, camMeta)
        this.camera = camera
        this.getObjectPosition()
        this.setCameraLookAt(camLookAtPos)
        this.setCameraUp(camUpVec)
        
        const camMotion = camDef.motion
        if(camMotion) {
            const camMotionType = camMotion.type
            switch(camMotionType) {
                case "anim":
                    const camPosTranslate = camMotion.translate
                    const camPosRotate = camMotion.rotate
                    if(camPosTranslate) {
                        const transVec = new Vector3(camPosTranslate[0],camPosTranslate[1],camPosTranslate[2])
                        this.transMoveMatrix(transVec)
                    }
                    if(camPosRotate) {
                        const plane = camPosRotate.plane
                        const radian = Math.PI * 2 * (camPosRotate.angle / 360)
                        this.rotateMoveMatrix(plane, radian)
                    }
                    break
            }
        }
        const lookAtMeta = camDef.lookAtMeta
        if(lookAtMeta) {
            const lookAtMotion = lookAtMeta.motion
            if(lookAtMotion) {
                const camLookAtMotionType = lookAtMotion.type
                switch(camLookAtMotionType) {
                    case "anim":
                        const camPosTranslate = lookAtMotion.translate
                        const camPosRotate = lookAtMotion.rotate
                        if(camPosTranslate) {
                            const transVec = new Vector3(camPosTranslate[0],camPosTranslate[1],camPosTranslate[2])
                            this.transLookAtMoveMatrix(transVec)
                        }
                        if(camPosRotate) {
                            const plane = camPosRotate.plane
                            const radian = Math.PI * 2 * (camPosRotate.angle / 360)
                            this.rotateLookAtMoveMatrix(plane, radian)
                        }
                        break
                }
            }
        }
        this._timeframe = 0
    }

    async update(sc: ScenarioManager) {
        // position
        let posVec = this.getObjectPosition()
        posVec = this.moveMatrix.MulVec3(posVec)
        this.setObjectPosition(posVec)
        // lookAt pos
        posVec = this._curLookAt
        posVec = this.lookAtMoveMatrix.MulVec3(posVec)
        this.setCameraLookAt(posVec)

        this._timeframe += 1
    }

    _getTHREECamera(camDef: any, camMeta: any): THREECameraType {
        let camera: THREECameraType = new THREE.PerspectiveCamera()
        const name = camDef.name
        const camType: CameraType = camDef.type
        const size = camMeta.size

        if(camType == "perspective") {
            camera = new THREE.PerspectiveCamera(camDef.fov,size.width/size.height,camDef.near,camDef.far)
            const pos = camDef.pos
            const lookAtPos = camDef.lookAtPos
            camera.position.x = pos[0]
            camera.position.y = pos[1]
            camera.position.z = pos[2]
            camera.lookAt(new THREE.Vector3(lookAtPos[0],lookAtPos[1],lookAtPos[2]))
        }
        if(camType == "orthographic") {
            camera = new THREE.OrthographicCamera(
                camDef.left * size.width/2, camDef.right * size.width/2,
                camDef.top * size.height/2, camDef.bottom * size.height/2,
                camDef.near, camDef.far)
            const pos = camDef.pos
            const lookAtPos = camDef.lookAtPos
            camera.position.x = pos[0]
            camera.position.y = pos[1]
            camera.position.z = pos[2]
            camera.lookAt(new THREE.Vector3(lookAtPos[0],lookAtPos[1],lookAtPos[2]))
        }

        return camera
    }

    getObjectPosition(): Vector3 {
        this._curPos = new Vector3(this.camera.position.x,this.camera.position.y,this.camera.position.z)
        return this._curPos
    }
    setObjectPosition(vec: Vector3) {
        this._curPos = vec
        this.camera.position.x = vec.x
        this.camera.position.y = vec.y
        this.camera.position.z = vec.z
    }
    getCameraLookAt(): Vector3 {
        return this._curLookAt
    }
    setCameraLookAt(vec: Vector3) {
        if(this._curLookAt.sub(vec).length() > 0) {
            this._curLookAt = vec
            this.camera.lookAt(new THREE.Vector3(vec.x,vec.y,vec.z))
        }
    }
    getCameraUp(): Vector3 {
        this._curUp = new Vector3(this.camera.up.x,this.camera.up.y,this.camera.up.z).normal()
        return this._curUp
    }
    setCameraUp(vec: Vector3) {
        this._curUp = vec
        this.camera.up.set(vec.x,vec.y,vec.z)
    }

    getVerticalPlane(): PlaneType {
        const dirVec = this.getCameraLookAt().sub(this.getObjectPosition()).normal()
        const upVec = this.getCameraUp()
        let verXVec = dirVec.outer(upVec).normal()
        if(verXVec.length() == 0) verXVec = new Vector3(upVec.y, upVec.z, upVec.x)
        const verYVec = dirVec.outer(verXVec).normal()
        return {
            x: verXVec,
            y: verYVec,
            n: dirVec,
        }
    }
    getPerspectivePlane(distance: number, meta: any = null): PlaneType {
        const verPlane = this.getVerticalPlane()
        let perPlane = {
            x: new Vector3(),
            y: new Vector3(),
            n: new Vector3(),
        }
        if(this.camDef.fov) {
            const fov = this.camDef.fov
            const yLen = distance * Math.tan(Math.PI*(fov/2/180))
            const xLen = yLen * this._aspect
            perPlane = {
                x: verPlane.x.mul(xLen),
                y: verPlane.y.mul(yLen),
                n: verPlane.n
            }
        } else if(this.camDef.top && this.camDef.right && this.camDef.bottom && this.camDef.left) {
            if(meta && meta.size) {
                const displaySize = meta.size
                const cameraSize = [this.camDef.right-this.camDef.left, this.camDef.top-this.camDef.bottom]

                perPlane = {
                    x: verPlane.x.mul(cameraSize[0] * displaySize.width * distance * 0.03),
                    y: verPlane.y.mul(cameraSize[1] * displaySize.height * distance * 0.03),
                    n: verPlane.n
                }
            }
        }
        
        return perPlane
    }
    getPPlanePos(PPlane: PlaneType, dispPos: number[]): Vector3 {
        const dispRatio = [2*dispPos[0]/this._size[0]-1, -(-2*dispPos[1]/this._size[1]+1)]
        const pos = PPlane.x.mul(dispRatio[0]).add(PPlane.y.mul(dispRatio[1]))
        return pos
    }


    clearMoveMatrix() {
        this.moveMatrix = new Matrix4()
    }
    transMoveMatrix(vec: Vector3) {
        const transPos = (new Matrix4()).move(vec)
        this.moveMatrix = transPos.Mul(this.moveMatrix)
    }
    rotateMoveMatrix(plane: string, radian: number) {
        let rotPos = new Matrix4()
        if(plane == "xy") {
            rotPos = (new Matrix4()).rotateXY(radian)
        }
        if(plane == "yz") {
            rotPos = (new Matrix4()).rotateYZ(radian)
        }
        if(plane == "zx") {
            rotPos = (new Matrix4()).rotateZX(radian)
        }
        this.moveMatrix = rotPos.Mul(this.moveMatrix)
    }

    clearLookAtMoveMatrix() {
        this.lookAtMoveMatrix = new Matrix4()
    }
    transLookAtMoveMatrix(vec: Vector3) {
        const transPos = (new Matrix4()).move(vec)
        this.lookAtMoveMatrix = transPos.Mul(this.lookAtMoveMatrix)
    }
    rotateLookAtMoveMatrix(plane: string, radian: number) {
        let rotPos = new Matrix4()
        if(plane == "xy") {
            rotPos = (new Matrix4()).rotateXY(radian)
        }
        if(plane == "yz") {
            rotPos = (new Matrix4()).rotateYZ(radian)
        }
        if(plane == "zx") {
            rotPos = (new Matrix4()).rotateZX(radian)
        }
        this.lookAtMoveMatrix = rotPos.Mul(this.lookAtMoveMatrix)
    }
}

export default CameraObject
