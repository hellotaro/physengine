import * as THREE from 'three'
import { Matrix4 } from './matrix'
import { Vector3 } from './vector'

export type GeometryType = "circle"|"polygon"|"pole"|"anglepole"|"pipe"|"anglepipe"|"funnel"|"spiral"

export function getMesh(type: GeometryType, option: any, material: any) {
    let mesh = null
    switch(type) {
        case "circle":
            mesh = getCircle(option, material)
            break
        case "polygon":
            mesh = getPolygon(option, material)
            break
        case "pole":
            mesh = getPole(option, material)
            break
        case "funnel":
            mesh = getFunnel(option, material)
            break
        case "anglepole":
            mesh = getAnglePole(option, material)
            break
        case "anglepipe":
            mesh = getAnglePipe(option, material)
            break
        case "pipe":
            mesh = getPipe(option, material)
            break
        case "spiral":
            mesh = getSpiral(option, material)
            break
    }
    return mesh
}

function getCircle(option: any, material: any) {
    let radius = 1.0
    let verNum = 3
    if(option.radius) radius = option.radius
    if(option.verNum) verNum = option.verNum

    let _vertices: number[] = []
    let faces: number[] = []
    for(let vidx = 0; vidx < verNum; vidx++) {
        const theta = vidx / verNum * Math.PI * 2
        const c = Math.cos(theta)
        const s = Math.sin(theta)
        _vertices = _vertices.concat([0, c * radius, s * radius])
    }
    _vertices = _vertices.concat([0,0,0])
    const vertices = new Float32Array(_vertices)

    for(let vidx = 0; vidx < verNum; vidx++) {
        faces = faces.concat([vidx,(vidx+1)%verNum,verNum])
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))
    geometry.setIndex(faces)
    geometry.computeVertexNormals()
    return new THREE.Mesh(geometry, material)
}

function getPolygon(option: any, material: any) {
    let vertices_ = [
        [0,1,0],
        [0.-0.5,0.5],
        [0,-0.5,-0.5]
    ]
    if(option.vertices) vertices_ = option.vertices

    let _vertices: number[] = []
    let faces: number[] = []
    for(let vidx = 0; vidx < vertices_.length; vidx++) {
        _vertices = _vertices.concat(vertices_[vidx])
    }
    const vertices = new Float32Array(_vertices)

    for(let vidx = 0; vidx < vertices_.length-2; vidx++) {
        faces = faces.concat([vidx,vidx+1,vidx+2])
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))
    geometry.setIndex(faces)
    geometry.computeVertexNormals()
    return new THREE.Mesh(geometry, material)
}

function getPole(option: any, material: any) {
    let radius = 1.0
    let height = 1.0
    let verNum = 3
    if(option.radius) radius = option.radius
    if(option.height) height = option.height
    if(option.verNum) verNum = option.verNum

    let _vertices: number[] = []
    let faces: number[] = []
    for(const h of [height/2,-height/2]) {
        for(let vidx = 0; vidx < verNum; vidx++) {
            const theta = vidx / verNum * Math.PI * 2
            const c = Math.cos(theta)
            const s = Math.sin(theta)
            _vertices = _vertices.concat([h, c * radius, s * radius])
        }
    }
    _vertices = _vertices.concat([height/2,0,0])
    _vertices = _vertices.concat([-height/2,0,0])
    const vertices = new Float32Array(_vertices)

    for(let vidx = 0; vidx < verNum; vidx++) {
        faces = faces.concat([vidx,vidx+verNum,(vidx+1)%verNum])
        faces = faces.concat([(vidx+1)%verNum,vidx+verNum,(vidx+1)%verNum+verNum])
    }
    for(let vidx = 0; vidx < verNum; vidx++) {
        faces = faces.concat([vidx,(vidx+1)%verNum,verNum*2])
        faces = faces.concat([(vidx+1)%verNum+verNum,vidx+verNum,verNum*2+1])
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))
    geometry.setIndex(faces)
    geometry.computeVertexNormals()
    return new THREE.Mesh(geometry, material)
}

function getAnglePole(option: any, material: any) {
    let radius = 1.0
    let height = 0.5
    let curvature = 2
    let ringNum = 1
    let angle = 90
    let verNum = 6
    let isEnd = true
    if(option.radius) radius = option.radius
    if(option.height) height = option.height
    if(option.curvature) curvature = option.curvature
    if(option.ringNum) ringNum = option.ringNum
    if(option.angle) angle = option.angle
    if(option.verNum) verNum = option.verNum
    if(option.isEnd) isEnd = option.isEnd

    let _vertices: number[] = []
    let faces: number[] = []
    for(const h of [height,0]) {
        for(let vidx = 0; vidx < verNum; vidx++) {
            const theta = vidx / verNum * Math.PI * 2
            const c = Math.cos(theta)
            const s = Math.sin(theta)
            _vertices = _vertices.concat([h, c * radius, s * radius])
        }
    }

    for(let aidx = 0; aidx < ringNum; aidx++) {
        const stepAngle = angle * (aidx + 1) / (ringNum + 1)
        const mat = new Matrix4().rotateXY(Math.PI * stepAngle / 180)
        let vers: Vector3[] = []
        for(let vidx = 0; vidx < verNum; vidx++) {
            const theta = vidx / verNum * Math.PI * 2
            const c = Math.cos(theta)
            const s = Math.sin(theta)
            vers.push(new Vector3(0, c * radius + curvature, s * radius))
        }
        for(let vidx = 0; vidx < vers.length; vidx++) {
            vers[vidx] = mat.MulVec3(vers[vidx])
        }
        for(let vidx = 0; vidx < vers.length; vidx++) {
            _vertices = _vertices.concat([vers[vidx].x,vers[vidx].y - curvature,vers[vidx].z])
        }
    }

    const mat = new Matrix4().rotateXY(Math.PI * (angle / 180))
    let vers: Vector3[] = []
    for(const h of [0,-height]) {
        for(let vidx = 0; vidx < verNum; vidx++) {
            const theta = vidx / verNum * Math.PI * 2
            const c = Math.cos(theta)
            const s = Math.sin(theta)
            vers.push(new Vector3(h, c * radius + curvature, s * radius))
        }
    }
    vers.push(new Vector3(-height, 0 + curvature, 0))
    for(let vidx = 0; vidx < vers.length; vidx++) {
        vers[vidx] = mat.MulVec3(vers[vidx])
    }
    for(let vidx = 0; vidx < vers.length; vidx++) {
        _vertices = _vertices.concat([vers[vidx].x,vers[vidx].y - curvature,vers[vidx].z])
    }
    _vertices = _vertices.concat([height, 0, 0])

    const vertices = new Float32Array(_vertices)

    for(let oidx = 0; oidx < 3 + ringNum; oidx++) {
        for(let vidx = 0; vidx < verNum; vidx++) {
            faces = faces.concat([vidx+oidx*verNum,vidx+(1+oidx)*verNum,(vidx+1)%verNum+oidx*verNum])
            faces = faces.concat([(vidx+1)%verNum+oidx*verNum,vidx+(1+oidx)*verNum,(vidx+1)%verNum+(1+oidx)*verNum])
        }
    }

    if(isEnd) {
        for(let vidx = 0; vidx < verNum; vidx++) {
            faces = faces.concat([vidx+0*verNum,(vidx+1)%verNum+0*verNum,(ringNum+4)*verNum+1])
            faces = faces.concat([(vidx+1)%verNum+(ringNum+3)*verNum,vidx+(ringNum+3)*verNum,(ringNum+4)*verNum])
        }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))
    geometry.setIndex(faces)
    geometry.computeVertexNormals()
    return new THREE.Mesh(geometry, material)
}

function getPipe(option: any, material: any) {
    let radiusInner = 0.5
    let radiusOuter = 1.0
    let height = 1.0
    let verNum = 3
    let isEnd = true
    if(option.radiusInner) radiusInner = option.radiusInner
    if(option.radiusInner) radiusOuter = option.radiusOuter
    if(option.height) height = option.height
    if(option.verNum) verNum = option.verNum
    if(option.isEnd) isEnd = option.isEnd

    let _vertices: number[] = []
    let faces: number[] = []
    for(const radius of [radiusInner, radiusOuter]) {
        for(const h of [height/2,-height/2]) {
            for(let vidx = 0; vidx < verNum; vidx++) {
                const theta = vidx / verNum * Math.PI * 2
                const c = Math.cos(theta)
                const s = Math.sin(theta)
                _vertices = _vertices.concat([h, c * radius, s * radius])
            }
        }
    }
    const vertices = new Float32Array(_vertices)

    for(let vidx = 0; vidx < verNum; vidx++) {
        faces = faces.concat([vidx+verNum,vidx,(vidx+1)%verNum])
        faces = faces.concat([vidx+verNum,(vidx+1)%verNum,(vidx+1)%verNum+verNum])
    }
    for(let vidx = 0; vidx < verNum; vidx++) {
        faces = faces.concat([vidx+2*verNum,vidx+verNum+2*verNum,(vidx+1)%verNum+2*verNum])
        faces = faces.concat([(vidx+1)%verNum+2*verNum,vidx+verNum+2*verNum,(vidx+1)%verNum+verNum+2*verNum])
    }
    if(isEnd) {
        for(let vidx = 0; vidx < verNum; vidx++) {
            faces = faces.concat([vidx,vidx+2*verNum,(vidx+1)%verNum])
            faces = faces.concat([(vidx+1)%verNum,vidx+2*verNum,((vidx+1)%verNum)+2*verNum])
        }
        for(let vidx = 0; vidx < verNum; vidx++) {
            faces = faces.concat([vidx+3*verNum,vidx+1*verNum,((vidx+1)%verNum)+1*verNum])
            faces = faces.concat([vidx+3*verNum,((vidx+1)%verNum)+1*verNum,((vidx+1)%verNum)+3*verNum])
        }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))
    geometry.setIndex(faces)
    geometry.computeVertexNormals()
    return new THREE.Mesh(geometry, material)
}

function getAnglePipe(option: any, material: any) {
    let radiusInner = 0.5
    let radiusOuter = 1.0
    let height = 0.5
    let curvature = 2
    let ringNum = 3
    let angle = 90
    let verNum = 6
    let isEnd = true
    if(option.radiusInner) radiusInner = option.radiusInner
    if(option.radiusInner) radiusOuter = option.radiusOuter
    if(option.height) height = option.height
    if(option.curvature) curvature = option.curvature
    if(option.ringNum) ringNum = option.ringNum
    if(option.angle) angle = option.angle
    if(option.verNum) verNum = option.verNum
    if(option.isEnd) isEnd = option.isEnd

    let _vertices: number[] = []
    let faces: number[] = []
    for(const h of [height,0]) {
        for(const radius of [radiusInner, radiusOuter]) {
            for(let vidx = 0; vidx < verNum; vidx++) {
                const theta = vidx / verNum * Math.PI * 2
                const c = Math.cos(theta)
                const s = Math.sin(theta)
                _vertices = _vertices.concat([h, c * radius, s * radius])
            }
        }
    }

    for(let aidx = 0; aidx < ringNum; aidx++) {
        const stepAngle = angle * (aidx + 1) / (ringNum + 1)
        const mat = new Matrix4().rotateXY(Math.PI * stepAngle / 180)
        let vers: Vector3[] = []
        for(const radius of [radiusInner, radiusOuter]) {
            for(let vidx = 0; vidx < verNum; vidx++) {
                const theta = vidx / verNum * Math.PI * 2
                const c = Math.cos(theta)
                const s = Math.sin(theta)
                vers.push(new Vector3(0, c * radius + curvature, s * radius))
            }
        }
        for(let vidx = 0; vidx < vers.length; vidx++) {
            vers[vidx] = mat.MulVec3(vers[vidx])
        }
        for(let vidx = 0; vidx < vers.length; vidx++) {
            _vertices = _vertices.concat([vers[vidx].x,vers[vidx].y - curvature,vers[vidx].z])
        }
    }

    const mat = new Matrix4().rotateXY(Math.PI * (angle / 180))
    let vers: Vector3[] = []
    for(const h of [0,-height]) {
        for(const radius of [radiusInner, radiusOuter]) {
            for(let vidx = 0; vidx < verNum; vidx++) {
                const theta = vidx / verNum * Math.PI * 2
                const c = Math.cos(theta)
                const s = Math.sin(theta)
                vers.push(new Vector3(h, c * radius + curvature, s * radius))
            }
        }
    }
    for(let vidx = 0; vidx < vers.length; vidx++) {
        vers[vidx] = mat.MulVec3(vers[vidx])
    }
    for(let vidx = 0; vidx < vers.length; vidx++) {
        _vertices = _vertices.concat([vers[vidx].x,vers[vidx].y - curvature,vers[vidx].z])
    }

    const vertices = new Float32Array(_vertices)

    for(let aidx = 0; aidx < 3 + ringNum; aidx++) {
        const oidx = aidx * 2
        for(let vidx = 0; vidx < verNum; vidx++) {
            faces = faces.concat([vidx+(2+oidx)*verNum,vidx+oidx*verNum,(vidx+1)%verNum+oidx*verNum])
            faces = faces.concat([vidx+(2+oidx)*verNum,(vidx+1)%verNum+oidx*verNum,(vidx+1)%verNum+(2+oidx)*verNum])
            faces = faces.concat([vidx+(1+oidx)*verNum,vidx+(3+oidx)*verNum,(vidx+1)%verNum+(3+oidx)*verNum])
            faces = faces.concat([vidx+(1+oidx)*verNum,(vidx+1)%verNum+(3+oidx)*verNum,(vidx+1)%verNum+(1+oidx)*verNum])
        }
    }

    if(isEnd) {
        for(let vidx = 0; vidx < verNum; vidx++) {
            faces = faces.concat([vidx+0*verNum,vidx+1*verNum,(vidx+1)%verNum+0*verNum])
            faces = faces.concat([(vidx+1)%verNum+0*verNum,vidx+1*verNum,(vidx+1)%verNum+1*verNum])
        }
        for(let vidx = 0; vidx < verNum; vidx++) {
            faces = faces.concat([vidx+((ringNum+3)*2+1)*verNum,vidx+((ringNum+3)*2+0)*verNum,(vidx+1)%verNum+((ringNum+3)*2+0)*verNum])
            faces = faces.concat([vidx+((ringNum+3)*2+1)*verNum,(vidx+1)%verNum+((ringNum+3)*2+0)*verNum,(vidx+1)%verNum+((ringNum+3)*2+1)*verNum])
        }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))
    geometry.setIndex(faces)
    geometry.computeVertexNormals()
    return new THREE.Mesh(geometry, material)
}

function getFunnel(option: any, material: any) {
    let radiusInner1 = 1.0
    let radiusOuter1 = 1.5
    let radiusInner2 = 0.5
    let radiusOuter2 = 1.0
    let height = 1.0
    let verNum = 3
    let isEnd = true
    if(option.radiusInner1) radiusInner1 = option.radiusInner1
    if(option.radiusInner1) radiusOuter1 = option.radiusOuter1
    if(option.radiusInner2) radiusInner2 = option.radiusInner2
    if(option.radiusInner2) radiusOuter2 = option.radiusOuter2
    if(option.height) height = option.height
    if(option.verNum) verNum = option.verNum
    if(option.isEnd) isEnd = option.isEnd

    let _vertices: number[] = []
    let faces: number[] = []
    const radiusSet = [[radiusInner1, radiusOuter1],[radiusInner2, radiusOuter2]]
    const heightSet = [height/2,-height/2]
    for(let ridx = 0; ridx < radiusSet.length; ridx++) {
        const radiuses = radiusSet[ridx]
        const h = heightSet[ridx]
        for(const radius of radiuses) {
            for(let vidx = 0; vidx < verNum; vidx++) {
                const theta = vidx / verNum * Math.PI * 2
                const c = Math.cos(theta)
                const s = Math.sin(theta)
                _vertices = _vertices.concat([h, c * radius, s * radius])
            }
        }
    }
    const vertices = new Float32Array(_vertices)

    for(let vidx = 0; vidx < verNum; vidx++) {
        faces = faces.concat([vidx+2*verNum,vidx,(vidx+1)%verNum])
        faces = faces.concat([vidx+2*verNum,(vidx+1)%verNum,(vidx+1)%verNum+2*verNum])
    }
    for(let vidx = 0; vidx < verNum; vidx++) {
        faces = faces.concat([vidx+1*verNum,vidx+2*verNum+1*verNum,(vidx+1)%verNum+1*verNum])
        faces = faces.concat([(vidx+1)%verNum+1*verNum,vidx+2*verNum+1*verNum,(vidx+1)%verNum+2*verNum+1*verNum])
    }
    if(isEnd) {
        for(let vidx = 0; vidx < verNum; vidx++) {
            faces = faces.concat([vidx,vidx+1*verNum,(vidx+1)%verNum])
            faces = faces.concat([(vidx+1)%verNum,vidx+1*verNum,((vidx+1)%verNum)+1*verNum])
        }
        for(let vidx = 0; vidx < verNum; vidx++) {
            faces = faces.concat([vidx+3*verNum,vidx+2*verNum,((vidx+1)%verNum)+2*verNum])
            faces = faces.concat([vidx+3*verNum,((vidx+1)%verNum)+2*verNum,((vidx+1)%verNum)+3*verNum])
        }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))
    geometry.setIndex(faces)
    geometry.computeVertexNormals()
    return new THREE.Mesh(geometry, material)
}

function getSpiral(option: any, material: any) {
    let radius = 1.0
    let height = 2.0
    let rollNum = 3
    let circleVerNum = 12
    if(option.radius) radius = option.radius
    if(option.height) height = option.height
    if(option.rollNum) rollNum = option.rollNum
    if(option.circleVerNum) circleVerNum = option.circleVerNum

    let _vertices: number[] = []
    let faces: number[] = []
    for(let idx = 0; idx < circleVerNum * rollNum; idx++) {
        const theta = Math.PI * 2 * (idx / circleVerNum)
        const c = Math.cos(theta)
        const s = Math.sin(theta)
        const h = height * (idx / (circleVerNum * rollNum)) - height/2
        _vertices = _vertices.concat([0,0,h])
        _vertices = _vertices.concat([c * radius, s * radius, h])
    }
    const vertices = new Float32Array(_vertices)
    
    for(let idx = 0; idx < circleVerNum * rollNum - 1; idx++) {
        faces.push(idx*2)
        faces.push(idx*2+1)
        faces.push(idx*2+2)

        faces.push(idx*2+2)
        faces.push(idx*2+1)
        faces.push(idx*2+3)
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))
    geometry.setIndex(faces)
    geometry.computeVertexNormals()
    return new THREE.Mesh(geometry, material)
}


