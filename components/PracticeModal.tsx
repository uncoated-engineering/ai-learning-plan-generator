
import React, { useState } from 'react';
import { LearningModule, MiniProject, PracticeQuestion, AnswerEvaluation } from '../types';
import { generatePracticeQuestions, generateMiniProject, evaluateAnswer } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import QuizIcon from './icons/QuizIcon';
import LightbulbIcon from './icons/LightbulbIcon';

interface PracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: LearningModule;
}

type PracticeContent = {
    type: 'questions';
    data: PracticeQuestion[];
} | {
    type: 'project';
    data: MiniProject;
} | null;

const QuestionDisplay: React.FC<{ question: PracticeQuestion; index: number }> = ({ question, index }) => {
    const [userAnswer, setUserAnswer] = useState('');
    const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleEvaluate = async () => {
        if (!userAnswer.trim()) {
            setError("Please provide an answer before evaluating.");
            return;
        }
        setIsEvaluating(true);
        setError(null);
        setEvaluation(null);
        try {
            const result = await evaluateAnswer(question.question, question.answer, userAnswer);
            setEvaluation(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during evaluation.";
            setError(errorMessage);
        } finally {
            setIsEvaluating(false);
        }
    };
    
    const getAssessmentColor = (assessment: AnswerEvaluation['assessment']) => {
        switch (assessment) {
            case 'Correct': return 'bg-green-600/50 border-green-500 text-green-300';
            case 'Partially Correct': return 'bg-yellow-600/50 border-yellow-500 text-yellow-300';
            case 'Incorrect': return 'bg-red-600/50 border-red-500 text-red-300';
            default: return 'bg-slate-600 border-slate-500 text-slate-300';
        }
    };

    const resetQuestion = () => {
      setEvaluation(null);
      setUserAnswer('');
      setError(null);
      setIsEvaluating(false);
    }

    return (
        <div className="bg-slate-800/70 p-4 rounded-lg border border-slate-700 space-y-4">
            <p className="font-semibold text-slate-200">
                <span className="font-bold text-sky-400 mr-2">{index + 1}.</span>
                {question.question}
            </p>

            {!evaluation && (
                <>
                    <textarea
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Type your answer here. You can include code snippets..."
                        className="w-full h-32 p-3 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:outline-none transition-shadow duration-200 placeholder-slate-500 text-slate-300 disabled:opacity-50"
                        disabled={isEvaluating}
                    />
                    <button 
                        onClick={handleEvaluate} 
                        disabled={isEvaluating || !userAnswer.trim()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        {isEvaluating ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Evaluating...
                            </>
                        ) : 'Evaluate My Answer'}
                    </button>
                </>
            )}

            {error && !isEvaluating && <ErrorMessage message={error} />}

            {evaluation && (
                <div className="space-y-4 pt-4 border-t border-slate-700 animate-fade-in">
                    <h4 className="font-semibold text-lg text-slate-100">Evaluation Result</h4>
                    
                    <div className="flex flex-wrap items-center gap-4">
                       <span className={`px-3 py-1 text-sm font-bold rounded-full border ${getAssessmentColor(evaluation.assessment)}`}>
                           {evaluation.assessment}
                       </span>
                        <div className="flex-grow">
                             <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                                <div 
                                    className="bg-gradient-to-r from-sky-500 to-blue-500 h-4 rounded-full transition-all duration-500"
                                    style={{ width: `${evaluation.score * 10}%` }}
                                    title={`Score: ${evaluation.score}/10`}
                                ></div>
                            </div>
                        </div>
                        <span className="font-bold text-xl text-slate-200">{evaluation.score}<span className="text-sm text-slate-400">/10</span></span>
                    </div>

                    <div>
                        <h5 className="font-semibold text-slate-300 mb-1">Feedback:</h5>
                        <p className="text-slate-400 whitespace-pre-wrap">{evaluation.feedback}</p>
                    </div>

                    <div>
                        <h5 className="font-semibold text-slate-300 mb-1">Ideal Answer:</h5>
                        <p className="text-slate-400 p-3 bg-slate-900/50 rounded-md border border-slate-600">{question.answer}</p>
                    </div>
                     <button 
                        onClick={resetQuestion}
                        className="w-full mt-2 px-4 py-2 text-sm font-semibold text-sky-300 bg-slate-700/50 rounded-md hover:bg-slate-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
};


const PracticeModal: React.FC<PracticeModalProps> = ({ isOpen, onClose, module }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<PracticeContent>(null);

  const handleGenerateQuestions = async () => {
    setIsLoading(true);
    setError(null);
    setContent(null);
    try {
      const questions = await generatePracticeQuestions(module);
      setContent({ type: 'questions', data: questions });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to generate questions. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateProject = async () => {
    setIsLoading(true);
    setError(null);
    setContent(null);
    try {
      const project = await generateMiniProject(module);
      setContent({ type: 'project', data: project });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to generate project idea. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">Practice Session</h2>
            <p className="text-sm text-slate-400">{module.moduleTitle}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        
        <div className="p-6 flex-grow overflow-y-auto">
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <button onClick={handleGenerateQuestions} disabled={isLoading} className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-700/50 border border-slate-600 rounded-lg hover:bg-slate-700 hover:border-sky-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  <QuizIcon className="w-8 h-8 text-sky-400" />
                  <span className="font-semibold text-slate-200">Practice Questions</span>
              </button>
              <button onClick={handleGenerateProject} disabled={isLoading} className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-700/50 border border-slate-600 rounded-lg hover:bg-slate-700 hover:border-sky-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  <LightbulbIcon className="w-8 h-8 text-sky-400" />
                  <span className="font-semibold text-slate-200">Mini-Project Idea</span>
              </button>
          </div>
          
          <div className="mt-4">
              {isLoading && <LoadingSpinner />}
              {error && !isLoading && <ErrorMessage message={error} />}
              {content?.type === 'questions' && (
                  <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-200 border-b border-slate-700 pb-2 mb-4">Practice Questions</h3>
                      {content.data.map((q, i) => <QuestionDisplay key={i} question={q} index={i} />)}
                  </div>
              )}
              {content?.type === 'project' && (
                  <div className="bg-slate-800/70 p-5 rounded-lg border border-slate-700">
                      <h3 className="text-xl font-bold text-sky-400 mb-2">{content.data.title}</h3>
                      <p className="text-slate-400 mb-4">{content.data.description}</p>
                      <h4 className="font-semibold text-slate-200 mb-2">Your Tasks:</h4>
                      <ul className="list-disc list-inside space-y-2 text-slate-400">
                          {content.data.tasks.map((task, i) => <li key={i}>{task}</li>)}
                      </ul>
                  </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeModal;
