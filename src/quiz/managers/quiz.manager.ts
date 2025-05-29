import { Quiz } from "../entities/quiz.entity";

export enum QuizStatus {
    WaitingForPlayersToJoinQuiz,
    QuizInProgress,
    QuizEnded
}

export interface PlayerAnswer {
    questionIndex: number;
    selectedOption: number;
    isCorrect: boolean;
}

export interface Player{
    socketId: string;
    id: string;
    name: string;
    answers: PlayerAnswer[];
    score: number;
}

export class QuizManager {
    roomId: string;
    quizStatus: QuizStatus;
    private activePlayers: Map<string, Player> = new Map();
    questionIndex: number = 0;
    quiz: Quiz;

    constructor(roomId: string, quiz: Quiz) {
        this.roomId = roomId;
        this.quizStatus = QuizStatus.WaitingForPlayersToJoinQuiz;
        this.quiz = quiz;
    }

    addPlayer(player: Player) {
        const existingPlayer = this.activePlayers.get(player.name);

        if (existingPlayer) {
            existingPlayer.socketId = player.socketId; //Atualiza o socketId do jogador existente
            console.log(`Jogador ${existingPlayer.name} reconectado na sala ${this.roomId}`);
        } else {
            this.activePlayers.set(player.name, player);
            console.log(`Jogador novo ${player.name} adicionado na sala ${this.roomId}`);
        }
    }

    removePlayer(socketId: string) {
        for (const [username, player] of this.activePlayers.entries()) {
            if (player.socketId === socketId) {
                player.socketId = ""; // marca como offline
                console.log(`Jogador desconectado: ${player.name}`);
                break;
            }
        }
    }
    
    listPlayers() {
        return Array.from(this.activePlayers.values());
    }

    getPlayerByUsername(username: string): Player | undefined {
        return this.activePlayers.get(username);
    }

    addPointsToPlayer(username: string, points: number){
        const player = this.getPlayerByUsername(username);
        if (player) {   
            player.score += points;
            console.log(`Jogador: ${player.name} ganhou ${points} pontos. Pontuação total: ${player.score}`);
        }
    }

    changeQuizStatus(status: QuizStatus) {
        this.quizStatus = status
    }

    setQuestionIndex(index: number) {
        this.questionIndex = index;
    }

    haveAllPlayersAnsweredCurrentQuestion(): boolean {
        console.log("Verificando se todos os jogadores responderam a pergunta atual...");
        for (const player of this.activePlayers.values()) {
            const alreadyAnswered = player.answers.some(
                answer => answer.questionIndex === this.questionIndex
            );
            if (!alreadyAnswered) {
                console.log("Ainda falta alguem");
                return false; // Pelo menos um jogador não respondeu ainda
            }
        }
        return true;
    }


}