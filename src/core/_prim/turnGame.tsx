import Game from "./game"

type GameState = {
    name: string
    nexts: string[]
}

class TurnGame extends Game {
    state: string
    states: GameState[]

    constructor() {
        super()
        this.states = [
            {name: "play1", nexts: ["move1"]},
            {name: "move1", nexts: ["play2"]},
            {name: "play2", nexts: ["move2"]},
            {name: "move2", nexts: ["play1","finished"]},
            {name: "finished", nexts: ["finished"]},
        ]
        this.state = "play1"
    }

    deleteGameResources() {}

    proceedState(nextIdx: number = 0) {
        let curIdx = -1
        for(let idx=0;idx<this.states.length;idx++) {
            if(this.states[idx].name == this.state) {
                curIdx = idx
                break
            }
        }
        if(curIdx !== -1) {
            const stateInfo = this.states[curIdx]
            this.state = stateInfo.nexts[nextIdx]
        }
    }
}

export default TurnGame
