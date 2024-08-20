import {Vector3} from "./vector"

export class Matrix4 {
    m00: number
    m01: number
    m02: number
    m03: number
    m10: number
    m11: number
    m12: number
    m13: number
    m20: number
    m21: number
    m22: number
    m23: number
    m30: number
    m31: number
    m32: number
    m33: number
    
    constructor(
        m00: number=1, m01: number=0, m02: number=0, m03: number=0,
        m10: number=0, m11: number=1, m12: number=0, m13: number=0,
        m20: number=0, m21: number=0, m22: number=1, m23: number=0,
        m30: number=0, m31: number=0, m32: number=0, m33: number=1
        ) {
        this.m00 = m00
        this.m01 = m01
        this.m02 = m02
        this.m03 = m03
        this.m10 = m10
        this.m11 = m11
        this.m12 = m12
        this.m13 = m13
        this.m20 = m20
        this.m21 = m21
        this.m22 = m22
        this.m23 = m23
        this.m30 = m30
        this.m31 = m31
        this.m32 = m32
        this.m33 = m33
    }

    Add(mat: Matrix4) {
        return new Matrix4(
            this.m00 + mat.m00, this.m01 + mat.m01, this.m02 + mat.m02, this.m03 + mat.m03,
            this.m10 + mat.m10, this.m11 + mat.m11, this.m12 + mat.m12, this.m13 + mat.m13,
            this.m20 + mat.m20, this.m21 + mat.m21, this.m22 + mat.m22, this.m23 + mat.m23,
            this.m30 + mat.m30, this.m31 + mat.m31, this.m32 + mat.m32, this.m33 + mat.m33 
        )
    }
    
    Sub(mat: Matrix4) {
        return new Matrix4(
            this.m00 - mat.m00, this.m01 - mat.m01, this.m02 - mat.m02, this.m03 - mat.m03,
            this.m10 - mat.m10, this.m11 - mat.m11, this.m12 - mat.m12, this.m13 - mat.m13,
            this.m20 - mat.m20, this.m21 - mat.m21, this.m22 - mat.m22, this.m23 - mat.m23,
            this.m30 - mat.m30, this.m31 - mat.m31, this.m32 - mat.m32, this.m33 - mat.m33 
        )
    }

    Mul(mat: Matrix4) {
        return new Matrix4(
            // raw-0
            this.m00 * mat.m00 + this.m01 * mat.m10 + this.m02 * mat.m20 + this.m03 * mat.m30,
            this.m00 * mat.m01 + this.m01 * mat.m11 + this.m02 * mat.m21 + this.m03 * mat.m31,
            this.m00 * mat.m02 + this.m01 * mat.m12 + this.m02 * mat.m22 + this.m03 * mat.m32,
            this.m00 * mat.m03 + this.m01 * mat.m13 + this.m02 * mat.m23 + this.m03 * mat.m33,
            // raw-1
            this.m10 * mat.m00 + this.m11 * mat.m10 + this.m12 * mat.m20 + this.m13 * mat.m30,
            this.m10 * mat.m01 + this.m11 * mat.m11 + this.m12 * mat.m21 + this.m13 * mat.m31,
            this.m10 * mat.m02 + this.m11 * mat.m12 + this.m12 * mat.m22 + this.m13 * mat.m32,
            this.m10 * mat.m03 + this.m11 * mat.m13 + this.m12 * mat.m23 + this.m13 * mat.m33,
            // raw-2
            this.m20 * mat.m00 + this.m21 * mat.m10 + this.m22 * mat.m20 + this.m23 * mat.m30,
            this.m20 * mat.m01 + this.m21 * mat.m11 + this.m22 * mat.m21 + this.m23 * mat.m31,
            this.m20 * mat.m02 + this.m21 * mat.m12 + this.m22 * mat.m22 + this.m23 * mat.m32,
            this.m20 * mat.m03 + this.m21 * mat.m13 + this.m22 * mat.m23 + this.m23 * mat.m33,
            // raw-3
            this.m30 * mat.m00 + this.m31 * mat.m10 + this.m32 * mat.m20 + this.m33 * mat.m30,
            this.m30 * mat.m01 + this.m31 * mat.m11 + this.m32 * mat.m21 + this.m33 * mat.m31,
            this.m30 * mat.m02 + this.m31 * mat.m12 + this.m32 * mat.m22 + this.m33 * mat.m32,
            this.m30 * mat.m03 + this.m31 * mat.m13 + this.m32 * mat.m23 + this.m33 * mat.m33,
        )
    }

    MulVec3(vec: Vector3) {
        return new Vector3(
            this.m00 * vec.x + this.m01 * vec.y + this.m02 * vec.z + this.m03 * vec.w,
            this.m10 * vec.x + this.m11 * vec.y + this.m12 * vec.z + this.m13 * vec.w,
            this.m20 * vec.x + this.m21 * vec.y + this.m22 * vec.z + this.m23 * vec.w
        )
    }

    unit() {
        this.m00 = 1
        this.m01 = 0
        this.m02 = 0
        this.m03 = 0
        this.m10 = 0
        this.m11 = 1
        this.m12 = 0
        this.m13 = 0
        this.m20 = 0
        this.m21 = 0
        this.m22 = 1
        this.m23 = 0
        this.m30 = 0
        this.m31 = 0
        this.m32 = 0
        this.m33 = 1
        return this
    }

    move(vec: Vector3) {
        this.m00 = 1
        this.m01 = 0
        this.m02 = 0
        this.m03 = vec.x
        this.m10 = 0
        this.m11 = 1
        this.m12 = 0
        this.m13 = vec.y
        this.m20 = 0
        this.m21 = 0
        this.m22 = 1
        this.m23 = vec.z
        this.m30 = 0
        this.m31 = 0
        this.m32 = 0
        this.m33 = 1
        return this
    }

    scale(vec: Vector3) {
        this.m00 = vec.x
        this.m01 = 0
        this.m02 = 0
        this.m03 = 0
        this.m10 = 0
        this.m11 = vec.y
        this.m12 = 0
        this.m13 = 0
        this.m20 = 0
        this.m21 = 0
        this.m22 = vec.z
        this.m23 = 0
        this.m30 = 0
        this.m31 = 0
        this.m32 = 0
        this.m33 = 1
        return this
    }

    rotate(rot: Vector3, isRadian = true) {
        const matYZ = (new Matrix4).rotateYZ(rot.x, isRadian)
        const matZX = (new Matrix4).rotateZX(rot.y, isRadian)
        const matXY = (new Matrix4).rotateXY(rot.z, isRadian)
        //const rotMat = matZX.Mul(matYZ).Mul(matXY)

        //const rotMat = matXY.Mul(matYZ).Mul(matZX)
        //const rotMat = matYZ.Mul(matXY).Mul(matZX)
        //const rotMat = matXY.Mul(matZX).Mul(matYZ)
        //const rotMat = matZX.Mul(matXY).Mul(matYZ)
        //const rotMat = matZX.Mul(matYZ).Mul(matXY)
        const rotMat = matYZ.Mul(matZX).Mul(matXY)
        
        return rotMat
    }

    rotateXY(radian: number, isRadian = true) {
        if(!isRadian) radian = Math.PI * (radian / 180)

        const c = Math.cos(radian)
        const s = Math.sin(radian)
        this.m00 = c
        this.m01 = -s
        this.m02 = 0
        this.m03 = 0
        this.m10 = s
        this.m11 = c
        this.m12 = 0
        this.m13 = 0
        this.m20 = 0
        this.m21 = 0
        this.m22 = 1
        this.m23 = 0
        this.m30 = 0
        this.m31 = 0
        this.m32 = 0
        this.m33 = 1
        return this
    }

    rotateYZ(radian: number, isRadian = true) {
        if(!isRadian) radian = Math.PI * (radian / 180)
                
        const c = Math.cos(radian)
        const s = Math.sin(radian)
        this.m00 = 1
        this.m01 = 0
        this.m02 = 0
        this.m03 = 0
        this.m10 = 0
        this.m11 = c
        this.m12 = -s
        this.m13 = 0
        this.m20 = 0
        this.m21 = s
        this.m22 = c
        this.m23 = 0
        this.m30 = 0
        this.m31 = 0
        this.m32 = 0
        this.m33 = 1
        return this
    }

    rotateZX(radian: number, isRadian = true) {
        if(!isRadian) radian = Math.PI * (radian / 180)
        
        radian = -radian
        
        const c = Math.cos(radian)
        const s = Math.sin(radian)
        this.m00 = c
        this.m01 = 0
        this.m02 = -s
        this.m03 = 0
        this.m10 = 0
        this.m11 = 1
        this.m12 = 0
        this.m13 = 0
        this.m20 = s
        this.m21 = 0
        this.m22 = c
        this.m23 = 0
        this.m30 = 0
        this.m31 = 0
        this.m32 = 0
        this.m33 = 1
        return this
    }

}
