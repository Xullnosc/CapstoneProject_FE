import { useEffect, useMemo, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Dialog } from 'primereact/dialog';
import Swal from '../../utils/swal';
import { adminService, type HodAccount } from '../../services/adminService';
import styles from './HodAccountsPage.module.css';

const HodAccountsPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<HodAccount[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<HodAccount | null>(null);

  const [isUpsertOpen, setIsUpsertOpen] = useState(false);

  // Create/Update HOD
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const trimmed = useMemo(() => {
    return {
      fullName: fullName.trim(),
      email: email.trim(),
      username: username.trim(),
      password,
      search: search.trim(),
    };
  }, [fullName, email, username, password, search]);

  const toast = (icon: 'success' | 'warning' | 'error', title: string, text: string) => {
    return Swal.fire({
      icon,
      title,
      text,
      confirmButtonColor: '#F26F21',
      confirmButtonText: 'OK',
    });
  };

  const load = async (term?: string) => {
    try {
      setIsLoading(true);
      const data = await adminService.getHodAccounts(term);
      setItems(data ?? []);
    } catch (err) {
      console.error(err);
      await toast('error', 'Failed', 'Could not load HOD accounts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setSelected(null);
    setFullName('');
    setEmail('');
    setUsername('');
    setPassword('');
    setIsUpsertOpen(true);
  };

  const openEdit = (hod: HodAccount) => {
    setSelected(hod);
    setFullName(hod.fullName ?? '');
    setEmail(hod.email ?? '');
    setUsername(hod.username ?? '');
    setPassword('');
    setIsUpsertOpen(true);
  };

  const handleCreateOrUpdate = async () => {
    if (!trimmed.email || !trimmed.username || !trimmed.password) {
      await toast('warning', 'Missing information', 'Please enter Email, Username, and Password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await adminService.createOrUpdateHod({
        fullName: trimmed.fullName || trimmed.email,
        email: trimmed.email,
        username: trimmed.username,
        password: trimmed.password,
      });
      await toast('success', 'Success', res?.message ?? 'HOD account created/updated successfully.');

      setFullName('');
      setEmail('');
      setUsername('');
      setPassword('');
      setIsUpsertOpen(false);
      await load(trimmed.search || undefined);
    } catch (err) {
      console.error(err);
      await toast('error', 'Failed', (err as { message?: string })?.message ?? 'Could not create/update HOD account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`max-w-5xl mx-auto p-4 sm:p-6 ${styles.adminForm}`}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">HOD Accounts</h1>
        <p className="text-gray-600 mt-1">Create/update HOD accounts (username/password) provided by Admin.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 px-6 py-5 bg-white">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100/80 p-1 rounded-xl flex gap-1">
              <button className="px-4 py-1.5 rounded-lg bg-white text-gray-900 text-sm font-bold shadow-sm transition-all border border-gray-200/50">
                HOD Accounts{' '}
                <span className="ml-1 text-xs text-orange-700 bg-orange-600/10 px-1.5 py-0.5 rounded-md">
                  {items.length}
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search HOD accounts (email, name)..."
                className="w-full sm:w-72 h-11 pl-10 pr-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-sm font-medium transition-all"
              />
            </div>
            <button
              type="button"
              onClick={() => load(trimmed.search || undefined)}
              disabled={isLoading}
              className="h-11 px-4 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="h-11 px-4 rounded-xl text-white font-bold text-sm hover:shadow-lg hover:shadow-orange-200/40 transition"
              style={{ background: 'linear-gradient(90deg, #F26F21 0%, #FF8A3D 55%, #FFB13C 100%)' }}
            >
              + New HOD
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/80 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-20">ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Full name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Username</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Credential</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-10"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-48"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-full w-24"></div></td>
                    <td className="px-6 py-4"></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400 gap-3">
                      <span className="material-symbols-outlined text-4xl opacity-50">person_off</span>
                      <span className="text-sm font-medium">No HOD accounts found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((hod) => (
                  <tr key={hod.userId} className="hover:bg-orange-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-800">{hod.userId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 font-medium">{hod.email ?? 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{hod.fullName ?? 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700 font-mono">{hod.username ?? '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border ${hod.hasCredential
                          ? 'bg-green-50 text-green-700 border-green-100'
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                      >
                        {hod.hasCredential ? 'Configured' : 'Not set'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(hod)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg border bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-orange-600 hover:border-orange-200 transition-all"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit dialog */}
      <Dialog
        visible={isUpsertOpen}
        onHide={() => setIsUpsertOpen(false)}
        className="w-full max-w-lg"
        contentClassName="!rounded-2xl bg-white shadow-2xl border border-gray-100 [&::-webkit-scrollbar]:hidden"
        maskClassName="bg-black/40 backdrop-blur-sm z-[9999]"
        showHeader={false}
        modal
        dismissableMask
        draggable={false}
        resizable={false}
        style={{ overflow: 'hidden' }}
      >
        <div className="relative p-8 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setIsUpsertOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100 focus:outline-none"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <div className="text-center mb-8 mt-2">
            <h3 className="text-3xl font-extrabold text-[#F26F21]">
              {selected ? 'Update HOD Account' : 'Create HOD Account'}
            </h3>
            <div className="h-1 w-16 bg-orange-200 mx-auto mt-2 rounded-full"></div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Full name (optional)</label>
              <InputText
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name (optional)"
                className="w-full"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Email</label>
              <InputText
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full"
                disabled={isSubmitting || !!selected}
              />
              {selected && (
                <p className="mt-2 text-xs text-gray-500 ml-1">Email is locked in edit mode.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Username</label>
              <InputText
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                {selected ? 'New password' : 'Password'}
              </label>
              <Password
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={selected ? 'Enter new password' : 'Enter password'}
                className="w-full"
                feedback={false}
                toggleMask
                disabled={isSubmitting}
              />
              {selected && (
                <p className="mt-2 text-xs text-gray-500 ml-1">A password is required to update credentials.</p>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200"
                onClick={() => setIsUpsertOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateOrUpdate}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 focus:ring-4 focus:ring-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(90deg, #F26F21 0%, #FF8A3D 55%, #FFB13C 100%)' }}
              >
                {isSubmitting ? 'Processing...' : selected ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      </Dialog>

    </div>
  );
};

export default HodAccountsPage;

