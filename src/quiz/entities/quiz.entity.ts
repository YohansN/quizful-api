import { Student } from 'src/student/entities/student.entity';
import { Question } from 'src/question/entities/question.entity';

export class Quiz {
  id: string;
  title: string;
  stundents: Student[];
  questions: Question[];
  creator_ID: string;
}