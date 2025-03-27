import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket } from '@nestjs/websockets';
import { QuizService } from './quiz.service';
import { Server, Socket } from 'socket.io';
import { LlmService } from '../llm/llm.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class QuizGateway implements OnGatewayConnection, OnGatewayDisconnect{
  constructor(private readonly quizService: QuizService, private readonly llmService: LlmService) {}

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
  }

  @SubscribeMessage('for_all_msg')
  handleEventForAll(@MessageBody() body: any) {
    this.server.emit("log", {mensagem: body})
  }

  @SubscribeMessage('room_msg')
  handleEventRoomOnly(@MessageBody() data: { roomId: string; body: any }) {
    const { roomId, body } = data; // Desestrutura os valores do objeto
    this.server.to(roomId).emit("log", data);
  }

  @SubscribeMessage('create_quiz')
  async handleEventCreateQuiz(@MessageBody() data: { theme: string; numQuestions: number }, @ConnectedSocket() client: Socket) {
    const { theme, numQuestions } = data;
    console.log(`SERVIDOR: Criando quiz com tema: ${theme} e número de questões: ${numQuestions}`);
    const quiz = await this.quizService.generateQuiz(data.theme, data.numQuestions, client.id);
    const roomId = `quiz-${quiz.id}-${Date.now()}`;

    await this.handleEventCreateRoom(roomId, client); // Create a room for the quiz

    this.server.to(roomId).emit('quiz_data', quiz); // Send the quiz data to the room
  }

  //@SubscribeMessage('create_room') - Vai ser feito pelo outro evento
  async handleEventCreateRoom(@MessageBody() roomName: string , @ConnectedSocket() client: Socket) {

    // Check if the room already exists
    const roomExists = this.server.sockets.adapter.rooms.has(roomName);

    if (roomExists) {
      // Send an error message to the client
      client.emit("log", { mensagem: `Room ${roomName} already exists. Cannot create.` });
      console.log("Erro: Sala já existe.");
    } else {
      client.join(roomName); // Add the client to the specified room

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
    const roomExists = this.server.sockets.adapter.rooms.has(roomName);
    if (roomExists) {
      client.join(roomName);
      console.log(`O client ${client.id} entrou na sala ${roomName}`);
      this.server.to(roomName).emit("log", { mensagem: `${client.id} joined room ${roomName}!` });
    }
    else{
      client.emit("log", { mensagem: `Room ${roomName} dosn't exists. Cannot join.` });
    }
  }


}
