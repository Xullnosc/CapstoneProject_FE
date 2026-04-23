import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AccessDeniedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = useMemo(() => (location.state as { from?: string } | null)?.from, [location.state]);

  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-6 py-16">
      <div className="w-full max-w-xl bg-white border border-gray-100 rounded-3xl shadow-sm p-10 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-3xl">block</span>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">
          Access denied
        </h1>
        <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
          Bạn không có quyền truy cập tài nguyên này. Nếu bạn nghĩ đây là lỗi, hãy liên hệ quản trị viên hoặc thử đăng nhập lại.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/home')}
            className="px-6 py-3 rounded-2xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors"
          >
            Go to home
          </button>
          <button
            onClick={() => (from ? navigate(from, { replace: true }) : navigate(-1))}
            className="px-6 py-3 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    </main>
  );
};

export default AccessDeniedPage;

