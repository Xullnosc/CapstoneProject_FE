import { Outlet, useLocation } from "react-router-dom";
import AIStudioNav from "./components/AIStudioNav";
import PremiumBreadcrumb from "../../../components/Common/PremiumBreadcrumb";

export default function AIStudioLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-white border-b border-gray-200 mb-8">
        <main className="max-w-[1200px] mx-auto w-full px-6 py-3">
          <PremiumBreadcrumb items={[
            { label: 'Home', to: '/home' },
            { label: 'AI Studio' }
          ]} />
          
          <div className="mt-4">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI Studio</h1>
            <p className="text-sm font-medium text-slate-500">Configure global parameters and AI model settings</p>
          </div>
        </main>
      </div>

      <main className="max-w-[1200px] mx-auto w-full px-6 pb-12">
        <div className="min-h-[calc(100vh-16rem)] overflow-hidden rounded-[30px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,#fff2dc_0%,#ffffff_45%,#f8fafc_100%)] shadow-[0_24px_72px_rgba(15,23,42,0.09)]">
      <div className="grid min-h-[calc(100vh-12rem)] grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)]">
        <AIStudioNav
          currentPath={location.pathname}
          badge="Account Vault"
          description="Your provider keys are scoped to your account and saved in Redis."
          footerTitle="How it works"
          footerItems={[
            "Save your own provider key.",
            "Test the connection before use.",
            "Choose which saved key is currently active.",
          ]}
        />
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
        </div>
      </main>
    </div>
  );
}
