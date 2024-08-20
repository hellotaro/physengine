import * as THREE from 'three'

export class Vector3 {
    x: number
    y: number
    z: number
    w: number

    constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
        this.x = x
        this.y = y
        this.z = z
        this.w = w
    }
    initTHREEVec(vec: THREE.Vector3) {
        this.x = vec.x
        this.y = vec.y
        this.z = vec.z
        this.w = 1
        return this
    }

    getT(): THREE.Vector3 {
        const tv = new THREE.Vector3()
        tv.x = this.x
        tv.y = this.y
        tv.z = this.z
        return tv
    }

    setT(tv: THREE.Vector3) {
        this.x = tv.x
        this.y = tv.y
        this.z = tv.z
    }

    clone() {
        return new Vector3(this.x,this.y,this.z,this.w)
    }

    length(): number {
        const dd = this.x * this.x + this.y * this.y + this.z * this.z
        if(dd == 0) return 0
        return Math.sqrt(dd)
    }

    normal(): Vector3 {
        const vec3 = new Vector3(this.x, this.y, this.z)
        const len = vec3.length()
        if(len == 0) return new Vector3(0,0,0)
        vec3.x = vec3.x / len
        vec3.y = vec3.y / len
        vec3.z = vec3.z / len
        return vec3
    }

    toArray() {
        return [this.x, this.y, this.z]
    }

    add(vec3: Vector3): Vector3 {
        return new Vector3(
            this.x + vec3.x,
            this.y + vec3.y,
            this.z + vec3.z,
        )
    }
    
    sub(vec3: Vector3): Vector3 {
        return new Vector3(
            this.x - vec3.x,
            this.y - vec3.y,
            this.z - vec3.z,
        )
    }

    mul(ratio: number): Vector3 {
        return new Vector3(
            this.x * ratio,
            this.y * ratio,
            this.z * ratio,
        )
    }

    div(ratio: number): Vector3 {
        return new Vector3(
            this.x / ratio,
            this.y / ratio,
            this.z / ratio,
        )
    }

    divEach(vec: Vector3): Vector3 {
        return new Vector3(
            this.x / vec.x,
            this.y / vec.y,
            this.z / vec.z
        )
    }

    inner(vec3: Vector3): number {
        return this.x*vec3.x+this.y*vec3.y+this.z*vec3.z
    }

    outer(vec3: Vector3): Vector3 {
        return new Vector3(
            this.y * vec3.z - this.z * vec3.y,
            this.z * vec3.x - this.x * vec3.z,
            this.x * vec3.y - this.y * vec3.x
        )
    }

    lineDistVec(p0: Vector3, p1: Vector3) {
        const dirVec = this.sub(p0)
        const lineVec = p1.sub(p0)
        const innerVal = dirVec.inner(lineVec.normal())
        const nearestPos = p0.add(lineVec.normal().mul(innerVal))
        const distVec = this.sub(nearestPos)
        const ratio = innerVal / lineVec.length()
        const isOn = 0 <= ratio && ratio <= 1

        const lineDistInfo = {
            start: nearestPos,
            distance: distVec.length(),
            distVec,
            ratio,
            isOn,
        }
        return lineDistInfo
    }

    planeDistVec(p0: Vector3, p1: Vector3, p2: Vector3) {
        const dirVec = this.sub(p0)
        const dotVec = p1.outer(p2).normal()
        const innerVal = dirVec.inner(dotVec)
        const nearestPos = this.sub(dotVec.mul(innerVal))
        const pDirVec = nearestPos.sub(p0)
        
        const out01 = p1.outer(pDirVec)
        const out12 = (p2.sub(p1)).outer(pDirVec.sub(p1))
        const out20 = (p2.mul(-1)).outer(pDirVec.sub(p2))

        const in0112 = out01.inner(out12)
        const in0120 = out01.inner(out20)
        const in1220 = out12.inner(out20)
        const isOn = in0112 >= 0 && in0120 >= 0 && in1220 >= 0
        const isStrictAbove = isOn && (innerVal >= 0)
        const isStrictBelow = isOn && (innerVal <= 0)
        const isAbove = (innerVal >= 0)
        const isBelow = (innerVal <= 0)
        
        const planeDistInfo = {
            start: nearestPos,
            distance: innerVal,
            distVec: dotVec.mul(innerVal),
            nearestPos,
            isStrictAbove,
            isStrictBelow,
            isAbove,
            isBelow,
        }
        return planeDistInfo
    }

}
