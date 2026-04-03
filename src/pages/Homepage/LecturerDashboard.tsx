import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { dashboardService } from "../../services/dashboardService";
import type {
  LecturerDashboardStats,
  RecentApplicationRow,
  RecentMentorInvitationRow,
} from "../../services/dashboardService";

const pct = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

function StackedBar(props: {
  segments: { key: string; label: string; value: number; className: string }[];
}) {
  const total = props.segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) {
    return (
      <div className="h-3 rounded-full bg-gray-100 w-full" title="No data" />
    );
  }
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
      {props.segments
        .filter((seg) => seg.value > 0)
        .map((seg) => (
          <div
            key={seg.key}
            className={`${seg.className} transition-all`}
            style={{ width: `${pct(seg.value, total)}%` }}
            title={`${seg.label}: ${seg.value}`}
          />
        ))}
    </div>
  );
}

const panelClass =
  "bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group";

const LecturerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<LecturerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getLecturerStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch lecturer dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-3xl border border-gray-100 h-36 animate-pulse flex flex-col justify-center"
          >
            <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
            <div className="h-8 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="pt-6 text-center text-gray-500">
        Could not load dashboard. Please try again later.
      </div>
    );
  }

  const m = stats.mentor;
  const a = stats.applications;
  const o = stats.ownTheses;

  const invitationTotal =
    m.invitationsPending +
    m.invitationsAccepted +
    m.invitationsDeclined +
    m.invitationsCancelled;

  const applicationTotal =
    a.pendingCount + a.approvedCount + a.rejectedCount + a.cancelledCount;

  const invitationSegments = [
    {
      key: "p",
      label: "Pending",
      value: m.invitationsPending,
      className: "bg-orange-400",
    },
    {
      key: "a",
      label: "Accepted",
      value: m.invitationsAccepted,
      className: "bg-emerald-500",
    },
    {
      key: "d",
      label: "Declined",
      value: m.invitationsDeclined,
      className: "bg-rose-400",
    },
    {
      key: "c",
      label: "Cancelled",
      value: m.invitationsCancelled,
      className: "bg-slate-300",
    },
  ];

  const applicationSegments = [
    {
      key: "p",
      label: "Pending",
      value: a.pendingCount,
      className: "bg-orange-400",
    },
    {
      key: "ap",
      label: "Approved",
      value: a.approvedCount,
      className: "bg-emerald-500",
    },
    {
      key: "r",
      label: "Rejected",
      value: a.rejectedCount,
      className: "bg-rose-400",
    },
    {
      key: "c",
      label: "Cancelled",
      value: a.cancelledCount,
      className: "bg-slate-300",
    },
  ];

  const formatDt = (v: string | null | undefined) => {
    if (!v) return "—";
    try {
      return format(new Date(v), "dd/MM/yyyy HH:mm");
    } catch {
      return v;
    }
  };

  const invDateBody = (row: RecentMentorInvitationRow) => formatDt(row.createdAt);
  const appDateBody = (row: RecentApplicationRow) => formatDt(row.createdAt);

  const campus = stats.campusSummary;

  const quickLinks = [
    { label: "My teams", path: "/teams/my-teams", icon: "pi pi-users" },
    { label: "Invitations", path: "/mentor-invitations", icon: "pi pi-envelope" },
    {
      label: "Assignment review",
      path: "/application-review",
      icon: "pi pi-file-edit",
    },
  ];

  return (
    <div className="space-y-8 pt-6 fadein animation-duration-500">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
              Lecturer workspace
            </h2>
            {stats.currentSemesterCode && (
              <span className="px-2.5 py-1 rounded-lg bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200">
                {stats.currentSemesterCode}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm max-w-2xl leading-relaxed">
            Mentor activity, thesis applications, your topics, and campus
            context — aligned with your FCTMS navigation.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {quickLinks.map((link) => (
            <button
              key={link.path}
              type="button"
              onClick={() => navigate(link.path)}
              className="inline-flex items-center gap-2 rounded-xl border border-orange-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors"
            >
              <i className={`${link.icon} text-orange-500`} />
              {link.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`${panelClass}`}>
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-linear-to-br from-purple-500 to-fuchsia-500 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ease-in-out" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 rounded-2xl bg-linear-to-br from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-200/80">
              <i className="pi pi-users text-xl" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Teams mentored
            </p>
            <p className="text-3xl font-black text-gray-800 tracking-tight mt-1">
              {m.mentoredTeamsInCurrentSemester}
              <span className="text-lg font-bold text-gray-400">
                {" "}
                / {m.maxMentorTeamsPerSemester}
              </span>
            </p>
            <div className="mt-4 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-linear-to-r from-orange-500 to-amber-500 transition-all"
                style={{
                  width: `${pct(
                    m.mentoredTeamsInCurrentSemester,
                    m.maxMentorTeamsPerSemester
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className={`${panelClass}`}>
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-linear-to-br from-orange-500 to-amber-500 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ease-in-out" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 rounded-2xl bg-linear-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200/80">
              <i className="pi pi-inbox text-xl" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Pending applications
            </p>
            <p className="text-3xl font-black text-gray-800 tracking-tight mt-1">
              {a.pendingCount}
            </p>
            <button
              type="button"
              onClick={() => navigate("/application-review")}
              className="mt-3 text-sm font-semibold text-orange-600 hover:text-orange-700"
            >
              Review now →
            </button>
          </div>
        </div>

        <div className={`${panelClass}`}>
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-linear-to-br from-sky-500 to-blue-500 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ease-in-out" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 rounded-2xl bg-linear-to-br from-sky-500 to-blue-500 text-white shadow-lg shadow-sky-200/80">
              <i className="pi pi-bell text-xl" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Unread notifications
            </p>
            <p className="text-3xl font-black text-gray-800 tracking-tight mt-1">
              {stats.unreadNotifications}
            </p>
            <button
              type="button"
              onClick={() => navigate("/notifications")}
              className="mt-3 text-sm font-semibold text-orange-600 hover:text-orange-700"
            >
              Open inbox →
            </button>
          </div>
        </div>

        <div className={`${panelClass}`}>
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-linear-to-br from-emerald-500 to-teal-500 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ease-in-out" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200/80">
              <i className="pi pi-book text-xl" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              My theses (semester)
            </p>
            <p className="text-3xl font-black text-gray-800 tracking-tight mt-1">
              {o.totalInCurrentSemester}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/my-thesis")}
                className="text-sm font-semibold text-orange-600 hover:text-orange-700"
              >
                My thesis
              </button>
              <span className="text-gray-300">·</span>
              <button
                type="button"
                onClick={() => navigate("/propose-thesis")}
                className="text-sm font-semibold text-gray-600 hover:text-orange-600"
              >
                Propose topic
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={panelClass}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <i className="pi pi-chart-bar text-sm" />
              </span>
              <h3 className="font-bold text-gray-800">Mentor invitations</h3>
            </div>
            <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
              {invitationTotal} total
            </span>
          </div>
          <StackedBar segments={invitationSegments} />
          <ul className="mt-4 space-y-2.5 text-sm">
            {invitationSegments.map((seg) => (
              <li
                key={seg.key}
                className="flex justify-between text-gray-600 border-b border-gray-50 last:border-0 pb-2 last:pb-0"
              >
                <span>{seg.label}</span>
                <span className="font-semibold text-gray-900 tabular-nums">
                  {seg.value}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={panelClass}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <i className="pi pi-list text-sm" />
              </span>
              <h3 className="font-bold text-gray-800">
                Thesis applications (your topics)
              </h3>
            </div>
            <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
              {applicationTotal} total
            </span>
          </div>
          <StackedBar segments={applicationSegments} />
          <ul className="mt-4 space-y-2.5 text-sm">
            {applicationSegments.map((seg) => (
              <li
                key={seg.key}
                className="flex justify-between text-gray-600 border-b border-gray-50 last:border-0 pb-2 last:pb-0"
              >
                <span>{seg.label}</span>
                <span className="font-semibold text-gray-900 tabular-nums">
                  {seg.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={panelClass}>
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <i className="pi pi-chart-pie text-sm" />
            </span>
            <h3 className="font-bold text-gray-800">Your theses by status</h3>
          </div>
          {o.byStatus.length === 0 ? (
            <p className="text-sm text-gray-500">No theses in this scope yet.</p>
          ) : (
            <div className="space-y-3">
              {o.byStatus.map((row) => (
                <div key={row.status || "unknown"}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600">
                      {row.status || "(no status)"}
                    </span>
                    <span className="font-bold text-gray-800 tabular-nums">
                      {row.count}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-orange-400 to-orange-600"
                      style={{
                        width: `${pct(row.count, o.totalInCurrentSemester || 1)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={panelClass}>
          <h3 className="font-bold text-gray-800 mb-1">Campus snapshot</h3>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Same campus-wide counts as the overview cards (filtered by your
            campus).
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl p-4 border border-gray-100 bg-linear-to-br from-white to-gray-50/80 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-linear-to-br from-blue-500 to-cyan-500 rounded-full opacity-10" />
              <div className="relative text-gray-500 text-xs font-medium uppercase tracking-wide">
                Users
              </div>
              <div className="relative text-2xl font-black text-gray-800 mt-1">
                {campus.totalUsers}
              </div>
            </div>
            <div className="rounded-2xl p-4 border border-gray-100 bg-linear-to-br from-white to-orange-50/40 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-linear-to-br from-orange-500 to-amber-500 rounded-full opacity-10" />
              <div className="relative text-gray-500 text-xs font-medium uppercase tracking-wide">
                Theses
              </div>
              <div className="relative text-2xl font-black text-gray-800 mt-1">
                {campus.totalTheses}
              </div>
            </div>
            <div className="rounded-2xl p-4 border border-gray-100 bg-linear-to-br from-white to-purple-50/40 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-linear-to-br from-purple-500 to-fuchsia-500 rounded-full opacity-10" />
              <div className="relative text-gray-500 text-xs font-medium uppercase tracking-wide">
                Teams
              </div>
              <div className="relative text-2xl font-black text-gray-800 mt-1">
                {campus.totalTeams}
              </div>
            </div>
            <div className="rounded-2xl p-4 border border-gray-100 bg-linear-to-br from-white to-emerald-50/40 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-linear-to-br from-emerald-500 to-teal-500 rounded-full opacity-10" />
              <div className="relative text-gray-500 text-xs font-medium uppercase tracking-wide">
                Semesters
              </div>
              <div className="relative text-2xl font-black text-gray-800 mt-1">
                {campus.totalSemesters}
              </div>
            </div>
          </div>
        </div>
      </div>

      {stats.reviewer && (
        <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
                <i className="pi pi-check-square text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-orange-900 text-lg">
                  Reviewer workload
                </h3>
                <p className="text-sm text-orange-800/90">
                  {stats.reviewer.pendingReviewCount} thesis(es) awaiting your
                  decision
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/thesis")}
              className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 text-white text-sm font-semibold px-5 py-2.5 shadow-md shadow-orange-200 hover:bg-orange-600 transition-colors"
            >
              <i className="pi pi-external-link text-sm" />
              Thesis list
            </button>
          </div>
          {stats.reviewer.pendingTheses.length > 0 && (
            <div className="rounded-2xl border border-orange-100/80 bg-white/80 overflow-hidden">
              <DataTable
                value={stats.reviewer.pendingTheses}
                size="small"
                className="text-sm"
              >
                <Column field="title" header="Title" />
                <Column field="thesisStatus" header="Thesis status" />
                <Column
                  header=""
                  body={(row) => (
                    <button
                      type="button"
                      className="text-orange-600 font-semibold text-sm hover:underline"
                      onClick={() => navigate(`/thesis/${row.thesisId}`)}
                    >
                      Open
                    </button>
                  )}
                />
              </DataTable>
            </div>
          )}
        </div>
      )}

      <div className="bg-orange-50 border border-orange-100 p-6 rounded-3xl flex items-start gap-4">
        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
          <i className="pi pi-lightbulb text-xl" />
        </div>
        <div>
          <h4 className="font-bold text-orange-900 text-lg mb-1">
            Tip: keep assignments moving
          </h4>
          <p className="text-orange-800/90 text-sm leading-relaxed">
            Pending applications and mentor invitations are scoped to the
            current semester when one is active — use the quick actions above to
            jump straight into review flows.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={panelClass}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <i className="pi pi-history text-sm" />
              </span>
              <h3 className="font-bold text-gray-800">
                Recent mentor invitations
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate("/mentor-invitations")}
              className="text-sm font-semibold text-orange-600 hover:text-orange-700"
            >
              View all
            </button>
          </div>
          <DataTable
            value={m.recentInvitations}
            emptyMessage="No recent invitations"
            size="small"
            className="p-datatable-sm"
          >
            <Column field="teamCode" header="Team" />
            <Column field="status" header="Status" />
            <Column header="Sent" body={invDateBody} />
          </DataTable>
        </div>

        <div className={panelClass}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <i className="pi pi-clock text-sm" />
              </span>
              <h3 className="font-bold text-gray-800">Pending applications</h3>
            </div>
            <button
              type="button"
              onClick={() => navigate("/application-review")}
              className="text-sm font-semibold text-orange-600 hover:text-orange-700"
            >
              Review
            </button>
          </div>
          <DataTable
            value={a.recentPending}
            emptyMessage="No pending applications"
            size="small"
            className="p-datatable-sm"
          >
            <Column field="thesisTitle" header="Thesis" />
            <Column field="teamCode" header="Team" />
            <Column header="Submitted" body={appDateBody} />
          </DataTable>
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard;
