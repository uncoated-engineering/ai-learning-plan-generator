
import { GoogleGenAI, Type } from "@google/genai";
import { LearningPlan, LearningModule, PracticeQuestion, MiniProject, AnswerEvaluation } from '../types';



if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const learningPlanSchema = {
  type: Type.OBJECT,
  properties: {
    planTitle: { type: Type.STRING, description: "A concise and engaging title for the learning plan." },
    summary: { type: Type.STRING, description: "A brief, 1-2 sentence summary of what the learner will achieve." },
    modules: {
      type: Type.ARRAY,
      description: "A list of learning modules or steps.",
      items: {
        type: Type.OBJECT,
        properties: {
          moduleTitle: { type: Type.STRING, description: "Title of the learning module." },
          description: { type: Type.STRING, description: "Detailed description of the module's content and objectives." },
          duration: { type: Type.STRING, description: "Estimated time to complete the module (e.g., '1 week', '5 hours')." },
          keyTopics: {
            type: Type.ARRAY,
            description: "A list of key topics, concepts, or skills covered in this module.",
            items: { type: Type.STRING }
          },
          resources: {
            type: Type.ARRAY,
            description: "A list of suggested learning resources.",
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: "Type of resource (e.g., 'Video', 'Article', 'Book', 'Official Docs')." },
                title: { type: Type.STRING, description: "The title of the resource." },
                url: { type: Type.STRING, description: "A direct URL to the resource, if available." }
              },
              required: ["type", "title"]
            }
          }
        },
        required: ["moduleTitle", "description", "duration", "keyTopics", "resources"]
      }
    }
  },
  required: ["planTitle", "summary", "modules"]
};

const practiceQuestionsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            question: { type: Type.STRING, description: "The practice question." },
            answer: { type: Type.STRING, description: "The correct and concise answer to the question." }
        },
        required: ["question", "answer"]
    }
};

const miniProjectSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A catchy title for the mini-project." },
        description: { type: Type.STRING, description: "A brief, one-paragraph description of the project and what skills it reinforces." },
        tasks: { 
            type: Type.ARRAY,
            description: "A list of actionable tasks or steps to complete the project.",
            items: { type: Type.STRING }
        }
    },
    required: ["title", "description", "tasks"]
};

const answerEvaluationSchema = {
    type: Type.OBJECT,
    properties: {
        assessment: { 
            type: Type.STRING, 
            description: "A single-word assessment of the user's answer. Must be one of: 'Correct', 'Partially Correct', 'Incorrect'."
        },
        feedback: { 
            type: Type.STRING, 
            description: "Constructive feedback for the user. Explain what was right and what could be improved. Be specific and encouraging." 
        },
        score: {
            type: Type.INTEGER,
            description: "A score from 0 to 10 representing the quality of the user's answer, where 10 is a perfect match."
        }
    },
    required: ["assessment", "feedback", "score"]
};


const callGemini = async (prompt: string, schema: object) => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error communicating with Gemini:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unexpected error occurred while communicating with the AI.");
    }
};

export const generateLearningPlan = async (topic: string): Promise<LearningPlan> => {
  const prompt = `Create a detailed, structured learning plan for the topic: "${topic}". The plan should be comprehensive and practical for a self-learner. It must include a title, a brief summary, and a list of sequential modules. Each module needs a clear title, a detailed description of its objectives, an estimated duration, a list of key topics to cover, and a curated list of varied learning resources (like articles, videos, or books).`;
  
  const planData = await callGemini(prompt, learningPlanSchema);
  if (!planData.planTitle || !Array.isArray(planData.modules)) {
      throw new Error("AI returned data in an unexpected format.");
  }
  return planData as LearningPlan;
};

export const generatePracticeQuestions = async (module: LearningModule): Promise<PracticeQuestion[]> => {
    const prompt = `Based on the learning module titled "${module.moduleTitle}", which covers "${module.description}" and key topics like [${module.keyTopics.join(', ')}], generate 5-7 open-ended practice questions to test understanding. For each question, provide an ideal, correct answer that will be used for evaluation.`;
    
    const questionsData = await callGemini(prompt, practiceQuestionsSchema);
    if (!Array.isArray(questionsData) || questionsData.some(q => !q.question || !q.answer)) {
        throw new Error("AI returned question data in an unexpected format.");
    }
    return questionsData as PracticeQuestion[];
};

export const generateMiniProject = async (module: LearningModule): Promise<MiniProject> => {
    const prompt = `Suggest a small, practical mini-project for a learner who has just completed a module on "${module.moduleTitle}". The module covers: "${module.description}" and key topics like [${module.keyTopics.join(', ')}]. The project should be something they can build in a few hours to apply their new skills. Provide a project title, a short description, and a list of specific tasks or features to implement.`;

    const projectData = await callGemini(prompt, miniProjectSchema);
    if (!projectData.title || !projectData.description || !Array.isArray(projectData.tasks)) {
        throw new Error("AI returned project data in an unexpected format.");
    }
    return projectData as MiniProject;
};

export const evaluateAnswer = async (question: string, idealAnswer: string, userAnswer: string): Promise<AnswerEvaluation> => {
    const prompt = `
      You are an expert AI Learning Assistant. Your role is to evaluate a user's answer to a given question.
      
      **The Question:**
      "${question}"
      
      **The Ideal Answer (for your reference):**
      "${idealAnswer}"
      
      **The User's Answer:**
      "${userAnswer}"
      
      ---
      
      **Your Task:**
      Carefully evaluate the user's answer by comparing it to the ideal answer. Consider correctness, completeness, and clarity. If the question involves code, also evaluate for syntax, logic, and best practices.
      
      Provide your evaluation in the required JSON format.
      1.  **assessment**: A single-word summary. Choose one of: 'Correct', 'Partially Correct', 'Incorrect'.
      2.  **feedback**: Constructive feedback for the user. Start by acknowledging what they got right, then explain any mistakes or omissions. Keep it encouraging.
      3.  **score**: An integer score from 0 to 10, where 10 is a perfect answer.
    `;
    
    const evaluationData = await callGemini(prompt, answerEvaluationSchema);
    
    if (!evaluationData.assessment || !evaluationData.feedback || typeof evaluationData.score !== 'number') {
        throw new Error("AI returned evaluation data in an unexpected format.");
    }

    const validAssessments: AnswerEvaluation['assessment'][] = ['Correct', 'Partially Correct', 'Incorrect'];
    if (!validAssessments.includes(evaluationData.assessment)) {
        evaluationData.assessment = 'Needs Review';
    }

    return evaluationData as AnswerEvaluation;
};
