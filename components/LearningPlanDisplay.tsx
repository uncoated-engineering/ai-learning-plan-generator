
import React from 'react';
import { LearningPlan, LearningModule } from '../types';
import ChevronDownIcon from './icons/ChevronDownIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import KeyIcon from './icons/KeyIcon';
import QuizIcon from './icons/QuizIcon';

interface ModuleAccordionProps {
  module: LearningModule;
  index: number;
  onStartPractice: (module: LearningModule) => void;
}

const ModuleAccordion: React.FC<ModuleAccordionProps> = ({ module, index, onStartPractice }) => {
  const [isOpen, setIsOpen] = React.useState(index === 0); // Open the first module by default

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 sm:p-5 text-left bg-slate-800 hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 font-bold">{index + 1}</span>
            <h3 className="text-lg font-semibold text-slate-100">{module.moduleTitle}</h3>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 hidden sm:block">{module.duration}</span>
            <ChevronDownIcon
                className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            />
        </div>
      </button>
      <div
        className={`grid transition-all duration-500 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-4 sm:p-6 border-t border-slate-700 text-slate-300">
            <p className="mb-6">{module.description}</p>
            
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-8">
                <div>
                    <h4 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                        <KeyIcon className="w-5 h-5 text-sky-400" />
                        Key Topics
                    </h4>
                    <ul className="list-disc list-inside space-y-2 pl-2 text-slate-400">
                        {module.keyTopics.map((topic, i) => <li key={i}>{topic}</li>)}
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                        <BookOpenIcon className="w-5 h-5 text-sky-400" />
                        Suggested Resources
                    </h4>
                    <ul className="space-y-3">
                        {module.resources.map((res, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <span className="text-xs font-semibold bg-slate-700 text-slate-300 px-2 py-1 rounded-md mt-1">{res.type}</span>
                            {res.url ? (
                                <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 hover:underline transition-colors">{res.title}</a>
                            ) : (
                                <span className="text-slate-300">{res.title}</span>
                            )}
                        </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-700/50 flex justify-center">
              <button
                onClick={() => onStartPractice(module)}
                className="flex items-center gap-3 px-6 py-3 font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-md hover:from-sky-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500 transition-all transform hover:scale-105"
              >
                <QuizIcon className="w-6 h-6" />
                Practice & Test Knowledge
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


interface LearningPlanDisplayProps {
  plan: LearningPlan;
  onStartPractice: (module: LearningModule) => void;
}

const LearningPlanDisplay: React.FC<LearningPlanDisplayProps> = ({ plan, onStartPractice }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center p-6 bg-slate-800 rounded-lg border border-slate-700">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-blue-400 mb-2">
          {plan.planTitle}
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">{plan.summary}</p>
      </div>
      <div className="space-y-4">
        {plan.modules.map((module, index) => (
          <ModuleAccordion key={index} module={module} index={index} onStartPractice={onStartPractice}/>
        ))}
      </div>
    </div>
  );
};

export default LearningPlanDisplay;
