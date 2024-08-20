import TurnGame from "./turnGame"

class BoardGame extends TurnGame {
    board: any

    constructor() {
        super()
        this.board = []
    }

    deleteGameResources() {}

    initBoard() {}

}

export default BoardGame
