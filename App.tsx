
import React, { useState, useCallback } from 'react';
import { LearningPlan, LearningModule } from './types';
import { generateLearningPlan } from './services/geminiService';
import TopicInput from './components/TopicInput';
import LearningPlanDisplay from './components/LearningPlanDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import BrainCircuitIcon from './components/icons/BrainCircuitIcon';
import PracticeModal from './components/PracticeModal';

const App: React.FC = () => {
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);

  const handleGeneratePlan = useCallback(async (topic: string) => {
    if (!topic) {
      setError("Please enter a topic.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLearningPlan(null);
    setSelectedModule(null);

    try {
      const plan = await generateLearningPlan(topic);
      setLearningPlan(plan);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred. Please try again.";
      setError(`Failed to generate learning plan. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleStartPractice = (module: LearningModule) => {
    setSelectedModule(module);
  };

  const handleCloseModal = () => {
    setSelectedModule(null);
  };

  return (
    <>
      <div className="min-h-screen bg-slate-900 flex flex-col items-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl mx-auto">
          <header className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-2">
              <BrainCircuitIcon className="w-12 h-12 text-sky-400" />
              <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
                AI Learning Planner
              </h1>
            </div>
            <p className="text-slate-400 text-lg">
              Enter any topic and get a structured, step-by-step learning plan.
            </p>
          </header>

          <main>
            <TopicInput onGenerate={handleGeneratePlan} isLoading={isLoading} />
            
            <div className="mt-8">
              {isLoading && <LoadingSpinner />}
              {error && <ErrorMessage message={error} />}
              {learningPlan && !isLoading && (
                <LearningPlanDisplay 
                  plan={learningPlan} 
                  onStartPractice={handleStartPractice} 
                />
              )}
              {!isLoading && !error && !learningPlan && (
                 <div className="text-center p-8 bg-slate-800/50 rounded-lg border border-slate-700">
                    <h2 className="text-2xl font-semibold text-slate-300 mb-2">Ready to Learn?</h2>
                    <p className="text-slate-400">Your personalized learning journey awaits. Just type a topic above, like "React for beginners" or "Azure AZ-900 Certification", and let's get started!</p>
                 </div>
              )}
            </div>
          </main>
        </div>
         <footer className="w-full max-w-4xl mx-auto text-center mt-12 text-slate-500 text-sm">
          <p>Powered by Google Gemini. Plans are AI-generated and should be used as a starting point.</p>
        </footer>
      </div>
      {selectedModule && (
        <PracticeModal 
          module={selectedModule} 
          isOpen={!!selectedModule}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default App;
