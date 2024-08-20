import {Vector3} from "../../util/vector"
import * as THREE from 'three'

type LightType = "ambient"|"point"|"spot"
type THREELightType = THREE.AmbientLight|THREE.DirectionalLight|THREE.PointLight|THREE.SpotLight

class LightObject {
    lightDef: any
    name: string
    light: THREELightType
    _curPos: Vector3

    constructor() {
        this.name = "[none]"
        this.light = new THREE.AmbientLight()
        this._curPos = new Vector3()
    }
    init(lightDef: any) {
        this.lightDef = lightDef
        this.name = lightDef.name
        const light = this._getTHREELight(lightDef)
        this.light = light
        this.getObjectPosition()
    }

    _getTHREELight(lightSettings: any): THREELightType {
        const lightType = lightSettings.type
        let light: THREELightType = new THREE.AmbientLight()
        const lightColor = lightSettings.color
        if(lightType == "ambient") {
            const intensity = lightSettings.intensity
            light = new THREE.AmbientLight(lightColor, intensity)
        }
        if(lightType == "directional") {
            const intensity = lightSettings.intensity
            if(intensity) {
                light = new THREE.DirectionalLight(lightColor, intensity)
            } else {
                light = new THREE.DirectionalLight(lightColor)
            }
        }
        if(lightType == "point") {
            const intensity = lightSettings.intensity
            const distance = lightSettings.distance
            if(distance) {
                light = new THREE.PointLight(lightColor, intensity, distance)
            }
            else if(intensity) {
                light = new THREE.PointLight(lightColor, intensity)
            }
            else {
                light = new THREE.PointLight(lightColor)
            }
            const pos = lightSettings.pos
            light.position.set(pos[0],pos[1],pos[2])
        }
        if(lightType == "spot") {
            const intensity = lightSettings.intensity
            if(intensity) {
                light = new THREE.SpotLight(lightColor, intensity)
            } else {
                light = new THREE.SpotLight(lightColor)
            }
            const pos = lightSettings.pos
            light.position.set(pos[0],pos[1],pos[2])
        }
        if(light !== null) {
            if(lightSettings.shadow != "none") {
                light.castShadow = true
            }
        }

        return light
    }

    getObjectPosition() {
        this._curPos = new Vector3(
            this.light.position.x,
            this.light.position.y,
            this.light.position.z
        )
        return this._curPos
    }
    setObjectPosition(vec3: Vector3) {
        this._curPos = vec3
        this.light.position.x = vec3.x
        this.light.position.y = vec3.y
        this.light.position.z = vec3.z
    }

}

export default LightObject
