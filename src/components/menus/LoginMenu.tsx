import { useState } from 'react';

export const LoginMenu = () => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="fixed top-0 left-1/2 -translate-x-1/2 z-50 w-[70%] pt-4"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {/* Trigger Area */}
      <div className="h-3 w-full" />

      {/* Menu Dropdown */}
      <div
        className={`bg-white border-2 border-orange-400 rounded-2xl shadow-sm transition-all duration-300 ease-in-out ${isVisible
            ? 'translate-y-0 opacity-100 visible'
            : '-translate-y-4 opacity-0 invisible'
          }`}
      >
        <div className="flex items-center justify-between px-6 py-3">
          {/* Logo và tên website */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <span className="text-gray-800 font-bold text-lg">Namedly</span>
          </div>

          {/* Register Button */}
          <button className="bg-orange-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-orange-600 cursor-pointer transition-colors text-sm">
            Register
          </button>
        </div>
      </div>
    </div>
  );
};