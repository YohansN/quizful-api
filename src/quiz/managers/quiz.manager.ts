
export enum QuizStatus {
    WaitingForPlayersToJoinQuiz,
    QuizInProgress,
    QuizEnded
}

export interface Player{
    socketId: string;
    id: string;
    name: string;
}

export class QuizManager {
    roomId: string;
    quizStatus: QuizStatus;
    private activePlayers: Player[] = [];
    questionIndex: number = 0;

    constructor(roomId: string) {
        this.roomId = roomId;
        this.quizStatus = QuizStatus.WaitingForPlayersToJoinQuiz;
    }

    addPlayer(player: Player) {
        this.activePlayers.push(player);
        console.log(`Player: ${player.name} adicionado na sala ${this.roomId}`)
    }

    removePlayer(socketId: string) {
        this.activePlayers = this.activePlayers.filter(player => player.socketId !== socketId);
    }
    
    listPlayers() {
        return this.activePlayers;
    }

    changeQuizStatus(status: QuizStatus) {
        this.quizStatus = status
    }

    setQuestionIndex(index: number) {
        this.questionIndex = index;
    }

  }