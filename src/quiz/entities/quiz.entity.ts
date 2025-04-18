import { v5 as uuidv5 } from 'uuid';

export class Option {
  id: string;
  letter: string;
  text: string;
  correctAnswer: boolean;

  constructor(data: any) {
    this.id = data.id;
    this.letter = data.letter;
    this.text = data.text;
    this.correctAnswer = data.correctAnswer;
  }
}

export class Question {
  id: string;
  displayId: string;
  question: string;
  options: Option[];
  justification: string;

  constructor(data: any) {
    this.id = data.id;
    this.displayId = data.displayId; //q1, q2 ...
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
    const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
    const id = `${theme}-${numQuestions}`;
    const hashedId = uuidv5(id, NAMESPACE);
    console.log(`Quiz-ID: ${hashedId}`);
    return hashedId;
  }
}
