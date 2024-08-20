import {copyObject} from "../../util/misc"
import {Vector3} from "../../util/vector"
import {GameObject} from "../../object/object"
import ObjectManager from "../../manager/objectManager"
import ScenarioManager from "../../manager/scenarioManager"
import PhysicsGame from "../_prim/physicsGame"

type TestPhysicsAssetMapping = {
    targetCube: string
    targetSphere: string
    targetCustom: string
    targetCustom2: string
    wallCube: string
}

class TestPhysics extends PhysicsGame {
    assetMapping: TestPhysicsAssetMapping

    selectedObject: GameObject|null
    selectDistance: number
    objPosDir: "xy"|"yz"|"zx"

    constructor() {
        super()

        this.assetMapping = {
            targetCube: "",
            targetSphere: "",
            targetCustom: "",
            targetCustom2: "",
            wallCube: "",
        }
        this.selectedObject = null
        this.selectDistance = 0
        this.objPosDir = "yz"
    }

    async initGame(sc: ScenarioManager, assetMapping: TestPhysicsAssetMapping) {
        this.setAssetMapping(assetMapping)
        await this.genObjects(sc)
        this.initPhysInfo(sc, assetMapping)

        let camPos = new Vector3(0,-10,0)
        switch(this.objPosDir) {
            case "xy":
                camPos = new Vector3(0,0,10)
                break
            case "yz":
                camPos = new Vector3(-10,0,0)
                break
            case "zx":
                camPos = new Vector3(0,-10,0)
                break
        }
        sc.getActiveCamera().setObjectPosition(camPos)
    }
    deleteGameResources() {}

    async update(sc: ScenarioManager) {
        await super.update(sc)
    }

    getDirPos(v1: number, v2: number, origin: number = 0) {
        let array = [v1,v2,0]
        switch(this.objPosDir) {
            case "xy":
                array = [v1,v2,origin]
                break
            case "yz":
                array = [origin,v1,v2]
                break
            case "zx":
                array = [v2,origin,v1]
                break
        }

        return array
    }

    async genObjects(sc: ScenarioManager) {
        const om:ObjectManager = sc.objectManager

        const objectDefs = []

        let targetDef = null

        //* tmp1 ==
        targetDef = this.getObjDef("targetSphere", "targetSphere_1", sc)
        targetDef.initPos = [0, 0, -2]
        targetDef.initScale = [0.5,0.5,0.5]
        targetDef.physics.velocity = [0,0,0.06]
        //targetDef.physics.rotation = [0.05,0,0]
        objectDefs.push(targetDef)
        targetDef = this.getObjDef("targetSphere", "targetSphere_2", sc)
        targetDef.initPos = [0,-0.5,2]
        targetDef.initScale = [0.5,0.5,0.5]
        targetDef.material.settings.color = "#AAF"
        targetDef.physics.velocity = [0,0,-0.03]
        objectDefs.push(targetDef)
        // == tmp */
        /* tmp2 ==
        targetDef = this.getObjDef("targetCube", "targetCube_1", sc)
        targetDef.initPos = this.getDirPos(0.2,2)
        targetDef.initRot = [0,0,0]
        targetDef.initScale = [1,1,1]
        targetDef.physics.velocity = this.getDirPos(0,-0.02)
        objectDefs.push(targetDef)
        targetDef = this.getObjDef("targetCube", "targetCube_2", sc)
        targetDef.initPos = this.getDirPos(-0.2,-2)
        targetDef.initRot = [0,0,0]
        targetDef.initScale = [1,1,1]
        targetDef.material.settings.color = "#AAF"
        targetDef.physics.velocity = this.getDirPos(0,0.01)
        objectDefs.push(targetDef)
        // == tmp */
        /* tmp3 ==
        targetDef = this.getObjDef("targetSphere", "targetSphere_1", sc)
        targetDef.initPos = this.getDirPos(0.3,-2)
        targetDef.initRot = [0,0,0]
        targetDef.initScale = [0.5,0.5,0.5]
        targetDef.physics.velocity = this.getDirPos(0,0.02)
        objectDefs.push(targetDef)
        targetDef = this.getObjDef("targetCube", "targetCube_2", sc)
        targetDef.initPos = this.getDirPos(-0.4,2)
        targetDef.initRot = [0,0,0]
        targetDef.initScale = [1,1,1]
        targetDef.material.settings.color = "#AAF"
        targetDef.physics.velocity = this.getDirPos(0,-0.01)
        objectDefs.push(targetDef)
        // == tmp */
        /* tmp4 ==
        targetDef = this.getObjDef("targetCube", "targetCube_1", sc)
        targetDef.initPos = this.getDirPos(0.65,2)
        targetDef.initRot = [0,0,0]
        targetDef.initScale = [1,1,1]
        targetDef.physics.velocity = this.getDirPos(-0.001,-0.02)
        objectDefs.push(targetDef)
        targetDef = this.getObjDef("targetCube", "targetCube_2", sc)
        targetDef.initPos = this.getDirPos(-0.65,-2)
        targetDef.initRot = [0,0,0]
        targetDef.initScale = [1,1,1]
        targetDef.material.settings.color = "#AAF"
        targetDef.physics.velocity = this.getDirPos(0.001,0.01)
        objectDefs.push(targetDef)
        // == tmp */
        /* tmp5 ==
        targetDef = this.getObjDef("targetCustom", "targetCustom_1", sc)
        targetDef.initPos = this.getDirPos(0.2,2)
        targetDef.initRot = [0,0,0]
        targetDef.initScale = [1,1,1]
        targetDef.physics.velocity = this.getDirPos(0,-0.02)
        objectDefs.push(targetDef)
        targetDef = this.getObjDef("targetCustom", "targetCustom_2", sc)
        targetDef.initPos = this.getDirPos(-0.2,-2)
        targetDef.initRot = [0,0,0]
        targetDef.initScale = [1,1,1]
        targetDef.material.settings.color = "#AAF"
        targetDef.physics.velocity = this.getDirPos(0,0.01)
        objectDefs.push(targetDef)
        // == tmp */
        /* tmp6 ==
        targetDef = this.getObjDef("targetCube", "targetCube_1", sc)
        targetDef.initPos = this.getDirPos(0,2)
        targetDef.initRot = [0,0,0]
        targetDef.initScale = [1.5,1.5,1.5]
        targetDef.physics.velocity = this.getDirPos(0,-0.02)
        objectDefs.push(targetDef)
        targetDef = this.getObjDef("targetCustom", "targetCustom_2", sc)
        targetDef.initPos = this.getDirPos(0,-2)
        targetDef.initRot = [0,0,0]
        targetDef.initScale = [1,1,1]
        targetDef.material.settings.color = "#AAF"
        targetDef.physics.velocity = this.getDirPos(0,0.01)
        objectDefs.push(targetDef)
        // == tmp */
        /* tmp7 ==
        targetDef = this.getObjDef("targetSphere", "targetSphere_1", sc)
        targetDef.initPos = this.getDirPos(0.4,2)
        targetDef.initRot = [0,0,0]
        targetDef.initScale = [0.5,0.5,0.5]
        targetDef.physics.velocity = this.getDirPos(0,-0.02)
        objectDefs.push(targetDef)
        targetDef = this.getObjDef("targetCustom", "targetCustom_2", sc)
        targetDef.initPos = this.getDirPos(-0.4,-2)
        targetDef.initRot = [0,0,0]
        targetDef.initScale = [1,1,1]
        targetDef.material.settings.color = "#AAF"
        targetDef.physics.velocity = this.getDirPos(0,0.01)
        objectDefs.push(targetDef)
        // == tmp */
        /* tmp8 ==
        targetDef = this.getObjDef("targetSphere", "targetSphere_1", sc)
        targetDef.initPos = this.getDirPos(0.4,1.5)
        targetDef.initRot = [0,0,0]
        targetDef.initScale = [0.5,0.5,0.5]
        targetDef.physics.velocity = this.getDirPos(0,-0.02)
        objectDefs.push(targetDef)
        targetDef = this.getObjDef("targetGroup", "targetGroup_1", sc)
        targetDef.initPos = this.getDirPos(-0.4,-1.5)
        targetDef.initRot = [0,0,0]
        targetDef.initScale = [1,1,1]
        targetDef.material.settings.color = "#AAF"
        targetDef.physics.velocity = this.getDirPos(0,0.01)
        objectDefs.push(targetDef)
        // == tmp */
        /* tmp9 ==
        targetDef = this.getObjDef("targetCube", "targetCube_1", sc)
        targetDef.initPos = [0,2,0]
        targetDef.initRot = [0,0,0]
        targetDef.initScale = [1,1,1]
        targetDef.physics.velocity = [0,-0.02,0]
        objectDefs.push(targetDef)
        targetDef = this.getObjDef("targetSphere", "targetSphere_1", sc)
        targetDef.initPos = [0,0.3,2]
        targetDef.initRot = [0,0,0]
        targetDef.initScale = [0.5,0.5,0.5]
        targetDef.physics.velocity = this.getDirPos(0,-0.02)
        objectDefs.push(targetDef)
        targetDef = this.getObjDef("targetCustom", "targetCustom_2", sc)
        targetDef.initPos = [0,-0.3,-2]
        targetDef.initRot = [0,0,0]
        targetDef.initScale = [1,1,1]
        targetDef.material.settings.color = "#AAF"
        targetDef.physics.velocity = this.getDirPos(0,0.03)
        objectDefs.push(targetDef)
        // == tmp */

        // wall
        targetDef = this.getObjDef("wallCube", "wallCube_1", sc)
        targetDef.initPos = this.getDirPos(-4,0)
        targetDef.initRot = [0,0,0]
        targetDef.initScale = this.getDirPos(2,8,2)
        objectDefs.push(targetDef)
        targetDef = this.getObjDef("wallCube", "wallCube_2", sc)
        targetDef.initPos = this.getDirPos(4,0)
        targetDef.initRot = [0,0,0]
        targetDef.initScale = this.getDirPos(2,8,2)
        objectDefs.push(targetDef)
        targetDef = this.getObjDef("wallCube", "wallCube_1", sc)
        targetDef.initPos = this.getDirPos(0,-4)
        targetDef.initRot = [0,0,0]
        targetDef.initScale = this.getDirPos(8,2,2)
        objectDefs.push(targetDef)
        targetDef = this.getObjDef("wallCube", "wallCube_1", sc)
        targetDef.initPos = this.getDirPos(0,4)
        targetDef.initRot = [0,0,0]
        targetDef.initScale = this.getDirPos(8,2,2)
        objectDefs.push(targetDef)
        
        sc.clearScene()
        await om._loadSceneObject(objectDefs, sc.addScene)
    }
    getObjDef(name: string, newName: string, sc: ScenarioManager) {
        const om:ObjectManager = sc.objectManager

        let obj: any = null
        if(name == "targetCube") obj = om.getOriginObjectDefByName(this.assetMapping.targetCube, newName)
        if(name == "targetSphere") obj = om.getOriginObjectDefByName(this.assetMapping.targetSphere, newName)
        if(name == "targetCustom") obj = om.getOriginObjectDefByName(this.assetMapping.targetCustom, newName)
        if(name == "targetCustom2") obj = om.getOriginObjectDefByName(this.assetMapping.targetCustom2, newName)
        if(name == "wallCube") obj = om.getOriginObjectDefByName(this.assetMapping.wallCube, newName)

        return obj
    }

    setAssetMapping(mapping: TestPhysicsAssetMapping) {
        this.assetMapping = mapping
    }
}

export default TestPhysics
