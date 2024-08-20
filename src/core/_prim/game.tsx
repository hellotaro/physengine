import ScenarioManager from "../../manager/scenarioManager"

abstract class Game {
    assetMapping: any
    textMapping: {[key: string]: any}
    lang: string
    
    constructor() {
        this.textMapping = {}
        this.lang = "ja"
    }

    async initGame(sc: ScenarioManager, assetMapping: any) {}
    abstract deleteGameResources(): void

    async update(sc: ScenarioManager) {}

    getObjDef(name: string, newName: string, sc: ScenarioManager) {}

    setAssetMapping(mapping: any) {}

    getText(textName: string) {
        if(this.textMapping[textName]) {
            let lang = "en"
            if(this.textMapping[textName][this.lang]) {
                lang = this.lang
            }
            return this.textMapping[textName][lang]
        }
        return "[Not found]"
    }
    setTextMapping(mapping: {[key: string]: any}) {
        this.textMapping = mapping
    }
    setLang(lang: string) {
        this.lang = lang
    }
}

export default Game
