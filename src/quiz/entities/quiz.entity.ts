export class Question {
  displayId: string;
  statement: string;
  options: string[];
  correctOption: string;
  justification: string;

  constructor(data: {
    displayId: string;
    statement: string;
    options: string[];
    correctOption: string;
    justification: string;
  }) {
    this.displayId = data.displayId;
    this.statement = data.statement;
    this.options = data.options;
    this.correctOption = data.correctOption;
    this.justification = data.justification;
  }
}

export class Quiz {
  theme: string;
  questions: Question[];
  numQuestions: number;

  constructor(theme: string, questions: Question[]) {
    this.theme = theme;
    this.questions = questions;
    this.numQuestions = questions.length;
  }
}