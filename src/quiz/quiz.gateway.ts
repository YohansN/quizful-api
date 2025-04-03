import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket } from '@nestjs/websockets';
import { QuizService } from './quiz.service';
import { Server, Socket } from 'socket.io';
import { LlmService } from '../llm/llm.service';
import { QuizManager } from './managers/quiz.manager';
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

  @SubscribeMessage('for_all_msg')
  handleEventForAll(@MessageBody() body: any) {
    this.server.emit("log", {mensagem: body})
  }

  @SubscribeMessage('room_msg')
  handleEventRoomOnly(@MessageBody() data: { roomId: string; message: string }) {
    const { roomId, message } = data;
    this.server.to(roomId).emit("log", message);
  }

  @SubscribeMessage('create_quiz')
  async handleEventCreateQuiz(@MessageBody() data: { theme: string; numQuestions: number }, @ConnectedSocket() client: Socket) {
    const { theme, numQuestions } = data;
    console.log(`SERVIDOR: Criando quiz com tema: ${theme} e número de questões: ${numQuestions}`);
    const quiz = await this.quizService.generateQuiz(data.theme, data.numQuestions, client.id);
    const roomId = `quiz-${quiz.id}-${Date.now()}`;

    // AS MUDANÇAS DE HOJE COMEÇAM AQUI - AS MUDANÇAS DE HOJE COMEÇAM AQUI - AS MUDANÇAS DE HOJE COMEÇAM AQUI - AS MUDANÇAS DE HOJE COMEÇAM AQUI - AS MUDANÇAS DE HOJE COMEÇAM AQUI  

    //await this.handleEventCreateRoom(roomId, client); // Create a room for the quiz
    this.quizRooms.set(roomId, quiz); //Save the quiz associate w/ the room
    this.quizManagers.set(roomId, new QuizManager(roomId));
    console.log(`SERVIDOR: Room criada com id: ${roomId}`);
    //this.server.to(roomId).emit('quiz_data', quiz); // Send the quiz data to the room

    const rooms = Array.from(this.server.sockets.adapter.rooms.keys())
    .filter(roomId => !this.server.sockets.adapter.sids.has(roomId)); // Exclude individual socket IDs
    this.server.emit("list_rooms", { rooms });
  }

  //Função inutilizada - remover
  //@SubscribeMessage('create_room') - Vai ser feito pelo outro evento
  async handleEventCreateRoom(@MessageBody() roomName: string , @ConnectedSocket() client: Socket) {

    // Check if the room already exists
    const roomExists = this.server.sockets.adapter.rooms.has(roomName);

    if (roomExists) {
      // Send an error message to the client
      client.emit("log", { mensagem: `Room ${roomName} already exists. Cannot create.` });
    } else {
      this.quizManagers.set(roomName, new QuizManager(roomName)); //Iniciando uma instância de quizManager p/ essa sala
      // TROCAR POSTERIORMENTE PARA ADICIONAR JOGADOR NA SALA APENAS QUANDO ENTRAR PELA TELA DO FRONT
      client.join(roomName); // Add the client to the specified room
      this.quizManagers.get(roomName)?.addPlayer({ socketId: client.id, id: client.id, name: `Player-${client.id}` })

      // Emit a message to the room confirming its creation
      this.server.to(roomName).emit("log", { mensagem: `Room ${roomName} created and joined by ${client.id}` });

      // Emit the list of all rooms
      const rooms = Array.from(this.server.sockets.adapter.rooms.keys())
        .filter(room => !this.server.sockets.adapter.sids.has(room)); // Exclude individual socket IDs
      this.server.emit("list_rooms", { rooms });
    }
  }

  @SubscribeMessage('join_room')
  handleEventJoinRoom(@MessageBody() roomName: string , @ConnectedSocket() client: Socket) {
    //const roomExists = this.server.sockets.adapter.rooms.has(roomName);
    const roomExists = this.quizRooms.get(roomName);
    if (roomExists) {
      client.join(roomName); //Adicionar o usuário na sala socket
      // MUDAR PARA RECEBER INFORMAÇÕES DO PLAYER DO FRONT E INSTANCIAR UM PLAYER AQUI E DEPOIS ADICIONAR ELE.
      this.quizManagers.get(roomName)?.addPlayer({ socketId: client.id, id: client.id, name: `Player-${client.id}` })
            
      this.server.to(roomName).emit("log", { mensagem: `${client.id} joined room ${roomName}!` });
    }
    else{
      client.emit("log", { mensagem: `Room ${roomName} dosn't exists. Cannot join.` });
    }
  }

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

}
