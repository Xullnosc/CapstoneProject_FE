import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import Swal from '../../utils/swal';
import { adminService, type HodAccount } from '../../services/adminService';
import styles from './HodAccountsPage.module.css';

const CAMPUSES = [
  { label: 'FU-Hòa Lạc', value: 1 },
  { label: 'FU-Đà Nẵng', value: 2 },
  { label: 'FU-Hồ Chí Minh', value: 3 },
  { label: 'FU-Cần Thơ', value: 4 },
  { label: 'FU-Quy Nhơn', value: 5 },
];

const HodAccountsPage = () => {
  const navigate = useNavigate();
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
  const [campusId, setCampusId] = useState<number | null>(null);

  const trimmed = useMemo(() => {
    return {
      fullName: fullName.trim(),
      email: email.trim(),
      username: username.trim(),
      password,
      campusId: campusId || 0,
      search: search.trim(),
    };
  }, [fullName, email, username, password, campusId, search]);

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
    setCampusId(null);
    setIsUpsertOpen(true);
  };

  const openEdit = (hod: HodAccount) => {
    setSelected(hod);
    setFullName(hod.fullName ?? '');
    setEmail(hod.email ?? '');
    setUsername(hod.username ?? '');
    setPassword('');
    setCampusId(hod.campusId ?? null);
    setIsUpsertOpen(true);
  };

  const handleCreateOrUpdate = async () => {
    // Better validation
    const missing = [];
    if (!trimmed.fullName) missing.push('Full Name');
    if (!trimmed.email) missing.push('Email');
    if (!trimmed.campusId) missing.push('Campus');
    if (!trimmed.username) missing.push('Username');
    if (!selected && !trimmed.password) missing.push('Password');

    if (missing.length > 0) {
      await toast('warning', 'Missing information', `Please provide: ${missing.join(', ')}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await adminService.createOrUpdateHod({
        userId: selected?.userId,
        fullName: trimmed.fullName || trimmed.email,
        email: trimmed.email,
        username: trimmed.username,
        password: trimmed.password,
        campusId: trimmed.campusId,
      });
      await toast('success', 'Success', res?.message ?? 'HOD account created/updated successfully.');

      setFullName('');
      setEmail('');
      setUsername('');
      setPassword('');
      setCampusId(null);
      setIsUpsertOpen(false);
      await load(trimmed.search || undefined);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      const message =
        axiosError.response?.data?.message || axiosError.message || 'Could not create/update HOD account.';
      await toast('error', 'Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDelete = async (hod: HodAccount) => {
    const result = await Swal.fire({
      title: 'Delete HOD Account?',
      text: `Are you sure you want to delete the account for ${hod.fullName || hod.email}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
    });

    if (result.isConfirmed) {
      try {
        setIsLoading(true);
        const res = await adminService.deleteHod(hod.userId);
        await toast('success', 'Deleted', res?.message ?? 'Account deleted successfully.');
        await load(trimmed.search || undefined);
      } catch (err) {
        console.error(err);
        await toast('error', 'Failed', (err as { message?: string })?.message ?? 'Could not delete HOD account.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const dialogHeader = (
    <div className="flex flex-col gap-1">
      <h3 className="text-xl font-bold text-gray-800">
        {selected ? 'Update HOD Account' : 'Create HOD Account'}
      </h3>
      <p className="text-xs text-gray-500 font-medium">Manage credentials for department heads</p>
    </div>
  );

  const dialogFooter = (
    <div className={`flex justify-end gap-3 mt-2 ${styles.hodDialogFooter}`}>
      <Button
        label="Cancel"
        icon="pi pi-times"
        className={styles.premiumButtonSecondary}
        onClick={() => setIsUpsertOpen(false)}
        disabled={isSubmitting}
        text
      />
      <Button
        label={isSubmitting ? 'Processing...' : selected ? 'Update' : 'Create'}
        icon={isSubmitting ? 'pi pi-spin pi-spinner' : selected ? 'pi pi-check' : 'pi pi-plus'}
        className={styles.premiumButton}
        onClick={handleCreateOrUpdate}
        disabled={isSubmitting}
      />
    </div>
  );

  return (
    <div className={`max-w-5xl mx-auto p-4 sm:p-6 ${styles.adminForm}`}>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">HOD Accounts</h1>
          <p className="text-gray-500 mt-2 font-medium">Manage administrative access for Department Heads.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            label="Promote from Lecturer Pool"
            icon="pi pi-users"
            className={styles.premiumButtonSecondary}
            onClick={() => navigate('/lecturers')}
          />
          <Button
            label="New HOD Account"
            icon="pi pi-user-plus"
            className={styles.premiumButton}
            onClick={openCreate}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 px-6 py-5 bg-white">
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 px-4 py-2 rounded-xl border border-orange-100 flex items-center gap-2">
              <span className="text-sm font-bold text-orange-700">Total Accounts</span>
              <span className="bg-orange-600 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-sm">
                {items.length}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <i className="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full sm:w-64 h-11 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50/50 outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-sm font-medium transition-all"
              />
            </div>
            <Button
              icon="pi pi-refresh"
              className={styles.premiumButtonSecondary}
              onClick={() => load(trimmed.search || undefined)}
              disabled={isLoading}
              tooltip="Refresh data"
              tooltipOptions={{ position: 'bottom' }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest w-20">ID</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">User Details</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Campus</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Username</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-6"><div className="h-4 bg-gray-100 rounded w-8"></div></td>
                    <td className="px-6 py-6"><div className="h-10 bg-gray-100 rounded w-48"></div></td>
                    <td className="px-6 py-6"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                    <td className="px-6 py-6"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                    <td className="px-6 py-6"><div className="h-6 bg-gray-100 rounded-full w-20"></div></td>
                    <td className="px-6 py-6"></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400 gap-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                        <i className="pi pi-users text-3xl opacity-20"></i>
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-bold text-gray-600">No accounts found</p>
                        <p className="text-sm font-medium text-gray-400">Try adjusting your search criteria</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((hod) => (
                  <tr key={hod.userId} className="hover:bg-orange-50/30 transition-colors group">
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-gray-400">#{hod.userId}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-800 leading-tight">{hod.fullName || 'N/A'}</span>
                        <span className="text-xs font-medium text-gray-500 mt-0.5">{hod.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-gray-600 bg-gray-100/50 px-2 py-1 rounded-md border border-gray-100">
                        {hod.campus || 'Global'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-mono">{hod.username || '—'}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-tight border ${hod.hasCredential
                          ? 'bg-green-50 text-green-700 border-green-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${hod.hasCredential ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                        {hod.hasCredential ? 'Configured' : 'Needs Setup'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right flex justify-end gap-1">
                      <Button
                        icon="pi pi-pencil"
                        className="p-button-rounded p-button-text p-button-plain text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-all"
                        onClick={() => openEdit(hod)}
                        tooltip="Edit account"
                      />
                      <Button
                        icon="pi pi-trash"
                        className="p-button-rounded p-button-text p-button-danger hover:bg-red-50 transition-all"
                        onClick={() => handleDelete(hod)}
                        tooltip="Delete account"
                      />
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
        header={dialogHeader}
        footer={dialogFooter}
        className="w-full max-w-lg"
        headerClassName={styles.hodDialogHeader}
        maskClassName="bg-black/40 backdrop-blur-sm z-[9999]"
        modal
        draggable={false}
        resizable={false}
      >
        <div className="py-6 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Full Name</label>
              <InputText
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dr. John Smith"
                className="w-full"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Campus</label>
              <Dropdown
                value={campusId}
                options={CAMPUSES}
                onChange={(e) => setCampusId(e.value)}
                placeholder="Select Campus"
                appendTo="self"
                className="w-full text-sm"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Email Address</label>
            <div className="relative">
              <i className="pi pi-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <InputText
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hod.name@fpt.edu.vn"
                className="w-full pl-11!"
                disabled={isSubmitting}
              />
            </div>
            {selected && email.trim() !== selected.email && (
              <div className="flex items-center justify-between mt-2">
                <p className="flex items-center gap-1.5 text-[11px] text-orange-600 font-bold uppercase tracking-tight">
                  <i className="pi pi-info-circle text-[10px]"></i>
                  Email change will be applied upon update
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Username</label>
              <InputText
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="hod_user"
                className="w-full"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                {selected ? 'Reset Password' : 'Password'}
              </label>
              <Password
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full"
                inputClassName="w-full"
                toggleMask
                feedback={false}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {selected && (
            <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
              <p className="text-[11px] text-orange-800/80 font-bold flex gap-2">
                <i className="pi pi-info-circle text-xs"></i>
                <span>Leave the password field empty if you do not wish to change it.</span>
              </p>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
};

export default HodAccountsPage;
