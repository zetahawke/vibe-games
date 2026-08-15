export type SubjectId = 'math' | 'english' | 'language' | 'science' | 'history';

export interface CurriculumQuestion {
  prompt: string;
  options: string[];
  correctAnswer: string;
  difficulty: 1 | 2 | 3;
}

export interface CurriculumUnit {
  name: string;
  description: string;
  questions: CurriculumQuestion[];
}

export interface CurriculumSubject {
  id: SubjectId;
  name: string;
  units: CurriculumUnit[];
}

export interface CurriculumBank {
  course: string;
  subjects: CurriculumSubject[];
}

export interface PickedQuestion {
  subjectId: SubjectId;
  subjectName: string;
  unitName: string;
  prompt: string;
  options: string[];
  /** Index into options that matches correctAnswer */
  correctIndex: number;
  difficulty: 1 | 2 | 3;
}

export interface LearningQuizState {
  bank: CurriculumBank;
  subjectId: SubjectId;
  subjectName: string;
  difficulty: number;
  question: PickedQuestion;
  attemptsLeft: number;
  reward: number;
  status: 'active' | 'won' | 'failed';
  lastMessage: string;
}
