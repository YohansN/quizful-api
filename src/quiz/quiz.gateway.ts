import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket } from '@nestjs/websockets';
import { QuizService } from './quiz.service';
import { Server, Socket } from 'socket.io';
import { LlmService } from '../llm/llm.service';
import { QuizManager, QuizStatus } from './managers/quiz.manager';
import { Quiz } from './entities/quiz.entity';
import { QuizRepository } from './quiz.repository';
import { UserService } from '../user/user.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class QuizGateway implements OnGatewayConnection, OnGatewayDisconnect{
  constructor(
    private readonly quizService: QuizService, 
    private readonly llmService: LlmService,
    private readonly quizRepository: QuizRepository,
    private readonly userService: UserService
  ) {}

  private quizManagers = new Map<string, QuizManager>(); // Associa salas aos QuizManagers
  private quizRooms = new Map<string, Quiz>(); // Associa um quiz a um room

  // --- SET UP SOCKET.IO ---

  @WebSocketServer()
  server: Server;

  handleConnection(socket: Socket) {
    console.log(`Usuário conectado - Socket ID: ${socket.id}`);
    
    // Log the total number of connected clients
    const totalConnections = this.server.sockets.sockets.size;
    console.log(`Total de conexões ativas: ${totalConnections}`);

    const rooms = Array.from(this.server.sockets.adapter.rooms.keys())
        .filter(room => !this.server.sockets.adapter.sids.has(room));
    socket.emit('list_rooms', { rooms });
  }

  handleDisconnect(socket: Socket) {
    console.log(`Usuário desconectado: Socket ID: ${socket.id}`);
    const totalConnections = this.server.sockets.sockets.size;
    console.log(`Total de conexões ativas: ${totalConnections}`);

    this.quizManagers.forEach((quizManager, roomId) => {
      const disconnectedPlayer = quizManager.listPlayers().find(player => player.socketId === socket.id);

      if (disconnectedPlayer) {
        console.log(`Jogador ${disconnectedPlayer.name} desconectou da sala ${roomId}`);
        
        // Remover jogador do quizManager
        quizManager.removePlayer(socket.id);

        // Emitir lista atualizada de jogadores para a sala
        this.server.to(roomId).emit("players_on_room", quizManager.listPlayers());

        console.log(`Lista de jogadores na sala ${roomId} atualizada: ${quizManager.listPlayers().length} jogadores restantes.`);

        // Se a sala estiver vazia, remover dos mapas
        // if (quizManager.listPlayers().length === 0) {
        //   this.quizManagers.delete(roomId);
        //   this.quizRooms.delete(roomId);
        //   console.log(`Sala ${roomId} foi removida pois não há mais jogadores.`);
        // }
      }
    });
  }

  // --- END SET UP SOCKET.IO ---

  // --- SOCKET.IO MSGS ---  

  @SubscribeMessage('for_all_msg')
  handleEventForAll(@MessageBody() body: any) {
    this.server.emit("log", {mensagem: body})
  }

  @SubscribeMessage('room_msg')
  handleEventRoomOnly(@MessageBody() data: { roomId: string; message: string }) {
    const { roomId, message } = data;
    this.server.to(roomId).emit("log", message);
  }

  // --- END SOCKET.IO MSGS ---


  // --- START SOCKET QUIZ ROOM EVENTS ---
  @SubscribeMessage('create_quiz') // Criar quiz, associa a sala e o quizManager, envia o quizId para o front pelas lista de salas.
  async handleEventCreateQuiz(@MessageBody() data: { theme: string, numQuestions: number, quizAdmin: string }, @ConnectedSocket() client: Socket) {
    const { theme, numQuestions, quizAdmin } = data;
    console.log(`SERVIDOR: Criando quiz com tema: ${theme} e número de questões: ${numQuestions}`);
    const quiz = await this.quizService.generateQuiz(data.theme, data.numQuestions, client.id);
    const roomId = `quiz-${Date.now()}`; // TODO: Melhorar a geração de ID para ser menor.

    this.quizRooms.set(roomId, quiz); //Save the quiz associate w/ the room
    this.quizManagers.set(roomId, new QuizManager(roomId, quiz, quizAdmin, this.quizRepository, this.userService));
    console.log(`SERVIDOR: Room criada com id: ${roomId}`);
    // Envia os meta-dados do quiz para o front: Tema e Código da sala
    client.emit("quiz_info", {quizTheme: quiz.theme, roomId: roomId}); //So deve rodar quando o quiz estiver pronto.

    const rooms = Array.from(this.server.sockets.adapter.rooms.keys())
    .filter(roomId => !this.server.sockets.adapter.sids.has(roomId)); // Exclude individual socket IDs
    this.server.emit("list_rooms", { rooms });
  }

  @SubscribeMessage('join_room')
  handleEventJoinRoom(@MessageBody() data:{ roomName: string, username: string, userId: string } , @ConnectedSocket() client: Socket) {
    //const roomExists = this.server.sockets.adapter.rooms.has(roomName);
    const { roomName, username, userId } = data;
    const roomExists = this.quizRooms.get(roomName);
    if (roomExists) {
      client.join(roomName); //Adicionar o usuário na sala socket
      // MUDAR PARA RECEBER INFORMAÇÕES DO PLAYER DO FRONT E INSTANCIAR UM PLAYER AQUI E DEPOIS ADICIONAR ELE.
      this.quizManagers.get(roomName)?.addPlayer({ socketId: client.id, id: userId, name: username, answers: [], score: 0 });
      this.server.to(roomName).emit("quiz_status", this.quizManagers.get(roomName)?.quizStatus);
      client.emit("quiz_admin", this.quizManagers.get(roomName)?.quizAdmin) // Envia o nome do criador do quiz. 
      console.log('quizManager: ', this.quizManagers.get(roomName));
      this.server.to(roomName).emit("log", { mensagem: `${client.id} joined room ${roomName}!` });
    }
    else{
      client.emit("log", { mensagem: `Room ${roomName} dosn't exists. Cannot join.` });
    }
  }

  // --- END SOCKET QUIZ ROOM EVENTS ---

  // --- START AUXILIAR EVENTS ---

  @SubscribeMessage('list_players_on_room')
  handleEventListPlayersOnRoom(@MessageBody() roomId: string){
    const quizManager = this.quizManagers.get(roomId)
    if (quizManager)
      //console.log(`SERVIDOR: Lista de jogadores na sala: ${JSON.stringify(quizManager.listPlayers(), null, 2)}`);
      this.server.to(roomId).emit("players_on_room", quizManager?.listPlayers() );
  }

  @SubscribeMessage('check_if_room_exists')
  handleEventCheckIfRoomExists(@MessageBody() roomId: string) {
    console.log(`Verificando se a sala ${roomId} existe...`);
    const roomExists = this.quizRooms.has(roomId);
    console.log(roomExists);
    this.server.emit('room_exists', roomExists);
  }

  @SubscribeMessage('start_quiz')
  handleEventStartQuiz(@MessageBody() roomId: string) {
    console.log('Cliente pedindo Quiz para a sala: ', roomId);
    const quiz = this.quizManagers.get(roomId)?.quiz;
    if (quiz) {
      this.server.to(roomId).emit("send_quiz", quiz);
    } else {
      console.log(`SERVIDOR: QuizManager não encontrado para a sala ${roomId}`);
    }
  }

  @SubscribeMessage('get_quiz_again') //Reenvia quiz para usuario reconectado
  handleEventResendQuiz(@MessageBody() roomId: string, @ConnectedSocket() client: Socket) {
    console.log("Client reconectou e pediu o quiz novamente.");
    const quiz = this.quizManagers.get(roomId)?.quiz;
    if (quiz) {
      client.emit("resend_quiz", quiz);
    } else {
      console.log(`SERVIDOR: QuizManager não encontrado para a sala ${roomId}`);
    }
  }

  @SubscribeMessage('get_quiz_status')
  handleEventGetQuizStatus(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket){
    console.log("Rodando GET QUIZ STATUS");
    const { roomId } = data;
    client.emit("quiz_status", this.quizManagers.get(roomId)?.quizStatus);
  }

  @SubscribeMessage('change_quiz_status')
  handleEventChangeQuizStatus(@MessageBody() data: { roomId: string, quizStatus: QuizStatus }){
    const { roomId, quizStatus } = data;
    this.quizManagers.get(roomId)?.changeQuizStatus(quizStatus);
    this.server.to(roomId).emit("new_quiz_status", this.quizManagers.get(roomId)?.quizStatus);
    console.log('quizManager: ', this.quizManagers.get(roomId)); //Verificação do manager da sala
  }

  @SubscribeMessage('current_question') // Para atualizar a questão atual apenas para jogadores que recarregarem a página.
  handleEventCurrentQuestion(@MessageBody() data: {roomId: string}, @ConnectedSocket() client: Socket) {
    const { roomId } = data;
    const currentQuestionIndex = this.quizManagers.get(roomId)?.questionIndex;
    client.emit("updated_current_question_index", currentQuestionIndex);
    // this.server.to(roomId).emit("", currentQuestionIndex); //precisa retornar o index da questão atual apenas para o jogador q pediu!!
  }

  @SubscribeMessage('answer_question')
  handleEventAnswerQuestion(@MessageBody() data: { roomId: string, username: string, questionIndex: number, selectedOption: number }, @ConnectedSocket() client: Socket) {
    const { roomId, username, questionIndex, selectedOption } = data;

    const manager = this.quizManagers.get(roomId);
    
    if (!manager) {
      console.error(`QuizManager não encontrado para a sala ${roomId}`);
      return;
    }

    const player = manager.getPlayerByUsername(username);

    if (!player) {
      console.error(`Jogador ${username} não encontrado na sala ${roomId}`);
      return;
    }

    const question = manager.quiz.questions[questionIndex];
    const numericCorrectOption = Number.parseInt(question.correctOption); //TODO: Modificar question.correctOption para ser o index da opção correta.
    const isCorrect = numericCorrectOption === selectedOption;

    // Adiciona a resposta ao histórico do jogador
    player.answers.push({
      questionIndex,
      selectedOption,
      isCorrect,
    });

    if (isCorrect) {
      manager.addPointsToPlayer(username, 1);
      console.log(`Jogador ${username} respondeu corretamente a questão ${questionIndex + 1}.`);
    }
    else {
      console.log(`Jogador ${username} respondeu incorretamente a questão ${questionIndex + 1}.`);
    }
    
    // TODO: Mandar informações de acerto/errado para o front.
    const feedback: Object = {
      numericCorrectOption, // Mostra a opção correta na tela
      isCorrect, // Indica qual toast notification ativar
    }
    client.emit("question_feedback", feedback);
    
    if(manager.haveAllPlayersAnsweredCurrentQuestion()) { //Passa a questão caso todos os jogadores já tenham respondido.
      console.log(`Todos os jogadores responderam a questão ${questionIndex + 1}.`);
      // TODO: Chamar tela intermediaria de resultados entre questões
      setTimeout(() => {
        if (manager.questionIndex < manager.quiz.numQuestions - 1) { //Verifica se ainda há questões antes de passar para a próxima.
          this.handleEventNextQuestion({
            roomId,
            currentQuestion: questionIndex
          });
        }
        else { // Muda o status do quiz, fazendo o client chamar o scoreboard.
          this.handleEventChangeQuizStatus({
            roomId,
            quizStatus: QuizStatus.QuizEnded,
          });
        }
      }, 5000); //Delay para dar feedback visual aos jogadores antes de passar para a próxima questão.
    }
  }

  @SubscribeMessage('next_question')
  handleEventNextQuestion(@MessageBody() data: { roomId: string, currentQuestion: number }) {
    const { roomId, currentQuestion } = data;
    this.quizManagers.get(roomId)?.setQuestionIndex(currentQuestion + 1);
    this.server.to(roomId).emit("new_current_question", currentQuestion + 1);
  }

  @SubscribeMessage('get_scoreboard')
  handleEventGetScoreboard(@MessageBody() data: { roomId: string}) {
    const { roomId } = data;
    const scoreboard = this.quizManagers.get(roomId)?.getScoreboard();
    this.server.to(roomId).emit("scoreboard", scoreboard);
  }

}
