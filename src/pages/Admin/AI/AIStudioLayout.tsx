import { Outlet, useLocation } from "react-router-dom";
import AIStudioNav from "./components/AIStudioNav";

export default function AIStudioLayout() {
  const location = useLocation();

  return (
    <div className="min-h-[calc(100vh-12rem)] overflow-hidden rounded-[30px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,#fff2dc_0%,#ffffff_45%,#f8fafc_100%)] shadow-[0_24px_72px_rgba(15,23,42,0.09)]">
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
  );
}
