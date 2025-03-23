import { createHash } from "crypto";

export class Option {
  letter: string;
  text: string;
  correctAnswer: boolean;

  constructor(data: any) {
    this.letter = data.letter;
    this.text = data.text;
    this.correctAnswer = data.correctAnswer;
  }
}

export class Question {
  id: string;
  question: string;
  options: Option[];
  justification: string;

  constructor(data: any) {
    this.id = data.id;
    this.question = data.question;
    this.options = data.options.map((opt: any) => new Option(opt));
    this.justification = data.justification;
  }
}

export class Quiz {
  id: string;
  theme: string;
  numQuestions: number;
  questions: Question[];
  creator_ID: string;

  constructor(theme: string, numQuestions: number, questions: Question[], creator_ID: string) {
    this.theme = theme;
    this.numQuestions = numQuestions;
    this.questions = questions;
    this.creator_ID = creator_ID;
    this.id = this.generateId(theme, numQuestions);
  }

  private generateId(theme: string, numQuestions: number): string {
    const data = `${theme}-${numQuestions}`;
    return createHash('sha256').update(data).digest('hex');
  }
}
