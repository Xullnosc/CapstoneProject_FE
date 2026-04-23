import React from 'react';
import { useNavigate } from 'react-router-dom';
import { type DiscoveryStudentDto } from '../../types/studentInteraction';


interface DiscoveryCardProps {
  student: DiscoveryStudentDto;
  onContact?: (userId: number) => void;
}

const DiscoveryCard: React.FC<DiscoveryCardProps> = ({ student, onContact }) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/profile/${student.userId}`)}
      className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-[#F27123]/30 hover:shadow-xl transition-all group cursor-pointer shadow-sm flex flex-col h-full"
    >
      <div className="flex-1">
        <div className="flex justify-between items-start mb-6">
          {student.avatar ? (
            <img src={student.avatar} alt={student.fullName} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-100" />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-slate-400">person</span>
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-[#F27123] transition-colors leading-tight">
          {student.fullName}
        </h3>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 italic truncate">
          {student.majorName || 'Specialist'}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {(student.skills || []).map((skill, index) => (
            <span 
              key={index} 
              className="px-3 py-1 bg-gray-50 text-gray-600 text-[10px] font-bold rounded-lg border border-gray-100 shadow-sm"
            >
              {typeof skill === 'string' ? skill : skill.skillTag}
            </span>
          ))}
        </div>
      </div>

      <button 
        onClick={(e) => {
          e.stopPropagation();
          onContact?.(student.userId);
        }}
        className="w-full py-3 bg-white border-2 border-[#F27123]/20 text-[#F27123] font-bold text-sm rounded-2xl hover:bg-[#F27123] hover:text-white hover:border-[#F27123] transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
      >
        <span className="material-symbols-outlined text-lg">chat</span>
        Contact Student
      </button>
    </div>
  );
};

export default DiscoveryCard;
