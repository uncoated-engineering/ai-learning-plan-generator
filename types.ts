
export interface Resource {
  type: string;
  title: string;
  url?: string;
}

export interface LearningModule {
  moduleTitle: string;
  description: string;
  duration: string;
  keyTopics: string[];
  resources: Resource[];
}

export interface LearningPlan {
  planTitle: string;
  summary: string;
  modules: LearningModule[];
}

export interface PracticeQuestion {
  question: string;
  answer: string;
}

export interface MiniProject {
    title: string;
    description: string;
    tasks: string[];
}

export interface AnswerEvaluation {
  assessment: 'Correct' | 'Partially Correct' | 'Incorrect' | 'Needs Review';
  feedback: string;
  score: number;
}
