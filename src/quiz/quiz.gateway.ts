import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket } from '@nestjs/websockets';
import { QuizService } from './quiz.service';
import { Server, Socket } from 'socket.io';
import { LlmService } from '../llm/llm.service';
import { QuizManager, QuizStatus } from './managers/quiz.manager';
import { Quiz } from './entities/quiz.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class QuizGateway implements OnGatewayConnection, OnGatewayDisconnect{
  constructor(private readonly quizService: QuizService, private readonly llmService: LlmService) {}

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
  async handleEventCreateQuiz(@MessageBody() data: { theme: string; numQuestions: number }, @ConnectedSocket() client: Socket) {
    const { theme, numQuestions } = data;
    console.log(`SERVIDOR: Criando quiz com tema: ${theme} e número de questões: ${numQuestions}`);
    const quiz = await this.quizService.generateQuiz(data.theme, data.numQuestions, client.id);
    // const roomId = `quiz-${quiz.id}-${Date.now()}`;
    const roomId = `quiz-${Date.now()}`;

    // AS MUDANÇAS DE HOJE COMEÇAM AQUI - AS MUDANÇAS DE HOJE COMEÇAM AQUI - AS MUDANÇAS DE HOJE COMEÇAM AQUI - AS MUDANÇAS DE HOJE COMEÇAM AQUI - AS MUDANÇAS DE HOJE COMEÇAM AQUI  

    //await this.handleEventCreateRoom(roomId, client); // Create a room for the quiz
    this.quizRooms.set(roomId, quiz); //Save the quiz associate w/ the room
    this.quizManagers.set(roomId, new QuizManager(roomId, quiz));
    console.log(`SERVIDOR: Room criada com id: ${roomId}`);
    //this.server.to(roomId).emit('quiz_data', quiz); // Send the quiz data to the room

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

  @SubscribeMessage('next_question')
  handleEventNextQuestion(@MessageBody() data: { roomId: string, currentQuestion: number }) {
    const { roomId, currentQuestion } = data;
    this.quizManagers.get(roomId)?.setQuestionIndex(currentQuestion + 1);
    this.server.to(roomId).emit("new_current_question", currentQuestion + 1);
  }

}
