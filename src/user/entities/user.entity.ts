import { createHash, randomBytes } from "crypto";
import { v5 as uuidv5 } from 'uuid';
export class User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  quizzes: string[]; // Lista de IDs de quizzes associados ao usuário

  constructor(username: string, email: string, password: string) {
    this.username = username;
    this.email = email;
    this.id = this.generateId(email);
    this.passwordSalt = randomBytes(16).toString("hex");
    this.passwordHash = this.hashPassword(password);
    this.quizzes = [];
  }

  private generateId(email: string) {
    const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
    
    const response =  uuidv5(email, NAMESPACE);
    console.log(`User-ID: ${response}`);
    return response;
  }

  private hashPassword(password: string): string {
    const salt = this.passwordSalt;
    return createHash("sha256").update(password + salt).digest("hex");
  }

  verifyPassword(password: string): boolean {
    return this.hashPassword(password) === this.passwordHash;
  }

  addQuiz(quizId: string) {
    this.quizzes.push(quizId);
  }
}
