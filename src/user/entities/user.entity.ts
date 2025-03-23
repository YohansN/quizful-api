import { createHash, randomBytes } from "crypto";

export class User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  quizzes: string[]; // Lista de IDs de quizzes associados ao usuário

  constructor(name: string, email: string, password: string) {
    this.name = name;
    this.email = email;
    this.id = this.generateId(email);
    this.salt = randomBytes(16).toString("hex");
    this.passwordHash = this.hashPassword(password);
    this.quizzes = [];
  }

  private generateId(email: string): string {
    return createHash("sha256").update(email).digest("hex");
  }

  private hashPassword(password: string): string {
    return createHash("sha256").update(password + this.salt).digest("hex");
  }

  verifyPassword(password: string): boolean {
    return this.hashPassword(password) === this.passwordHash;
  }

  addQuiz(quizId: string) {
    this.quizzes.push(quizId);
  }
}
