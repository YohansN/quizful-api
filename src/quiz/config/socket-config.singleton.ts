import { Server } from 'socket.io';

export interface SocketConfig {
  cors: {
    origin: string | string[];
    credentials?: boolean;
  };
  port?: number;
  namespace?: string;
  transports?: string[];
  pingTimeout?: number;
  pingInterval?: number;
}

export class SocketConfigSingleton {
  private static instance: SocketConfigSingleton;
  private server: Server | null = null;
  private config: SocketConfig;
  private isInitialized: boolean = false;

  private constructor() {
    // Configuração padrão do socket
    this.config = {
      cors: {
        origin: '*',
        credentials: false
      },
      port: 3001,
      namespace: '/',
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    };
  }

  /**
   * Obtém a instância única do SocketConfigSingleton
   */
  public static getInstance(): SocketConfigSingleton {
    if (!SocketConfigSingleton.instance) {
      SocketConfigSingleton.instance = new SocketConfigSingleton();
    }
    return SocketConfigSingleton.instance;
  }

  /**
   * Configura as opções do socket
   */
  public configure(config: Partial<SocketConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('Socket configurado com:', this.config);
  }

  /**
   * Obtém a configuração atual
   */
  public getConfig(): SocketConfig {
    return { ...this.config };
  }

  /**
   * Define a instância do servidor Socket.IO
   */
  public setServer(server: Server): void {
    this.server = server;
    this.isInitialized = true;
    console.log('Servidor Socket.IO configurado no singleton');
  }

  /**
   * Obtém a instância do servidor Socket.IO
   */
  public getServer(): Server | null {
    return this.server;
  }

  /**
   * Verifica se o servidor foi inicializado
   */
  public isServerInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Obtém estatísticas do servidor
   */
  public getServerStats(): any {
    if (!this.server) {
      return { error: 'Servidor não inicializado' };
    }

    return {
      totalConnections: this.server.sockets.sockets.size,
      rooms: Array.from(this.server.sockets.adapter.rooms.keys()).length,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Emite evento para todos os clientes conectados
   */
  public emitToAll(event: string, data: any): void {
    if (this.server) {
      this.server.emit(event, data);
      console.log(`Evento '${event}' emitido para todos os clientes`);
    } else {
      console.error('Servidor não inicializado para emitir evento');
    }
  }

  /**
   * Emite evento para uma sala específica
   */
  public emitToRoom(room: string, event: string, data: any): void {
    if (this.server) {
      this.server.to(room).emit(event, data);
      console.log(`Evento '${event}' emitido para sala '${room}'`);
    } else {
      console.error('Servidor não inicializado para emitir evento');
    }
  }

  /**
   * Obtém lista de salas ativas
   */
  public getActiveRooms(): string[] {
    if (!this.server) {
      return [];
    }

    return Array.from(this.server.sockets.adapter.rooms.keys())
      .filter(room => !this.server!.sockets.adapter.sids.has(room));
  }

  /**
   * Obtém número de clientes conectados
   */
  public getConnectedClientsCount(): number {
    if (!this.server) {
      return 0;
    }

    return this.server.sockets.sockets.size;
  }

  /**
   * Limpa a instância (útil para testes)
   */
  public static resetInstance(): void {
    SocketConfigSingleton.instance = new SocketConfigSingleton();
  }
} 