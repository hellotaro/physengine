import {get} from "../util/api"
import Object from "../object/object"
import { Vector3 } from "../util/vector"
import { copyObject } from "../util/misc"
import ScenarioManager from "./scenarioManager"

type ObjectType = Object

class ObjectManager {
    private static _instance: ObjectManager|undefined

    public static getInstance(): ObjectManager {
        if(this._instance === undefined) this._instance = new ObjectManager()
        return this._instance
    }

    objects: ObjectType[]
    originDefs: any
    addObjectDefs: any[]
    isObjectRefleshing: boolean

    private constructor() {
        this.objects = []
        this.originDefs = []
        this.addObjectDefs = []
        this.isObjectRefleshing = false
    }

    async update(sc: ScenarioManager, addScene: any) {
        // add object in start phase
        await this.refreshAddObjectDef(addScene)
        
        for(let object of this.objects) {
            object.update()
        }
    }

    async loadSceneObject(url: string, addScene: any, isHideObject: boolean = true) {
        const objDef = await get(url)
        if(isHideObject) {
            this.originDefs = this.setOriginObjectDefs(objDef, new Vector3(100,100,100))
        } else {
            this.originDefs = this.setOriginObjectDefs(objDef, null)
        }
        return await this._loadSceneObject(objDef, addScene)
    }
    async _loadSceneObject(objDef: any, addScene: any) {
        const newObjects = await this.loadObjects(objDef, addScene)
        this.objects = this.objects.concat(newObjects)
        return newObjects
    }
    async loadObjects(objDef: any, addScene: any) {
        // load objects in parallel
        const objects = await Promise.all(objDef.map((def:any) => this.loadObject(def)))
        
        // add THREE object to scene
        for(let obj of objects) {
            addScene(obj.object)
        }
        return objects
    }
    async loadObject(def: any) {
        const obj = this._getBaseObject(def)
        await obj.init(def)
        obj.applyDef(def)
        return obj
    }

    addObjectDef(def: any) {
        this.addObjectDefs.push(def)
    }
    async refreshAddObjectDef(addScene: any) {
        if(!this.isObjectRefleshing && this.addObjectDefs.length > 0) {
            this.isObjectRefleshing = true
            const objectDefNum = this.addObjectDef.length
            const newObjectDefs = this.addObjectDefs.slice(0,objectDefNum)
            this.addObjectDefs = this.addObjectDefs.slice(objectDefNum)
            await this._loadSceneObject(newObjectDefs, addScene)
            this.isObjectRefleshing = false
        }
    }

    _getBaseObject(def: any): ObjectType {
        if(this.searchObjectByName(def.name) !== null) console.warn("[ObjectManager] _getBaseObject - same name! : " + def.name)

        let obj: ObjectType = new Object(def)
        return obj
    }

    searchObjectByName(name: string) {
        for(let obj of this.objects) {
            if(obj.name == name) return obj
        }
        return null
    }

    searchObjectByUUID(uuid: string) {
        for(let obj of this.objects) {
            let isFound = false
            if(obj.object?.uuid == uuid) {
                isFound = true
            }
            obj.object?.traverse((child: any) => {
                if(child.uuid == uuid) {
                    isFound = true
                }
            })
            if(isFound) {
                return obj
            }
        }
        return null
    }

    searchObjectByRole(role: string) {
        let target = null
        for(let obj of this.objects) {
            if(obj.info.role == role) {
                target = obj
                break
            }
        }
        return target
    }

    searchObjects(applyFunc: any) {
        let objects = []
        for(let obj of this.objects) {
            if(applyFunc(obj)) {
                objects.push(obj)
            }
        }
        return objects
    }

    removeObjectByName(name: string) {
        const newObject:ObjectType[] = []
        for(let obj of this.objects) {
            if(obj.name != name) newObject.push(obj)
        }
        this.objects = newObject
    }

    findObjectNameByPrefix(prefix: string) {
        let names = []
        for(let obj of this.objects) {
            if(obj.name.substring(0,prefix.length) == prefix) {
                names.push(obj.name)
            }
        }
        return names
    }

    updateAllObjectMaterial() {
        for(let obj of this.objects) {
            if(obj.materialSettings.settings && obj.materialSettings.settings.color) {
                obj.updateMaterialColor(obj.materialSettings.settings.color)
            }
        }
    }

    applyAllObjects(applyFunc: any) {
        for(let object of this.objects) {
            applyFunc(object)
        }
    }

    getOriginObjectDefs() {
        return this.originDefs
    }
    setOriginObjectDefs(originDef: any, farVec3: Vector3|null = new Vector3(100,100,100)) {
        originDef = copyObject(originDef)
        if(farVec3 !== null) {
            for(let def of originDef) {
                if(def.initPos) def.initPos = [farVec3.x,farVec3.y,farVec3.z]
            }
        }
        return originDef
    }
    getOriginObjectDefByName(objName: string, newObjName: string) {
        for(let def of this.originDefs) {
            if(def.name == objName) {
                const newDef = copyObject(def)
                newDef.name = newObjName
                return newDef
            }
        }
        console.warn("[ObjectManager] getOriginObjectDefByName - no object: " + objName)
        return null
    }

    hideAllObjects(vec3: Vector3 = new Vector3(100,100,100)) {
        for(let object of this.objects) {
            object.setObjectPosition(vec3)
        }
    }
}

export default ObjectManager
