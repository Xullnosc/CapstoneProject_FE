import React from 'react';

interface SkillFilterProps {
  skills: string[];
  selectedSkill?: string;
  onSkillSelect: (skill: string) => void;
}

const SkillFilter: React.FC<SkillFilterProps> = ({ skills, selectedSkill, onSkillSelect }) => {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mr-2">
        Quick Filters:
      </span>
      <button
        onClick={() => onSkillSelect('')}
        className={`px-4 py-1.5 rounded-lg border-2 font-bold text-xs transition-all ${
          !selectedSkill
            ? 'bg-[#F27123] border-[#F27123] text-white shadow-sm' 
            : 'bg-white border-slate-200 text-slate-600 hover:border-[#F27123] hover:text-[#F27123]'
        }`}
      >
        All
      </button>
      {skills.map((skill) => {
        const isActive = selectedSkill === skill;
        return (
          <button
            key={skill}
            onClick={() => onSkillSelect(skill)}
            className={`
              px-4 py-1.5 rounded-lg border-2 font-bold text-xs transition-all
              ${isActive 
                ? 'bg-[#F27123] border-[#F27123] text-white shadow-sm' 
                : 'bg-white border-slate-200 text-slate-600 hover:border-[#F27123] hover:text-[#F27123]'}
            `}
          >
            {skill}
          </button>
        );
      })}
    </div>
  );
};

export default SkillFilter;
