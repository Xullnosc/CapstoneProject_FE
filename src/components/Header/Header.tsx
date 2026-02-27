import { useState, useEffect } from 'react';
import { Avatar } from 'primereact/avatar';
import { Badge } from 'primereact/badge';
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import { Sidebar } from 'primereact/sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import 'primeicons/primeicons.css';
import { authService } from '../../services/authService';
import Swal from '../../utils/swal';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [visible, setVisible] = useState(false);
    const [currentSemesterCode, setCurrentSemesterCode] = useState<string>('');

    // Auth & Permissions
    const user = authService.getUser();
    // Assuming HOD/Admin role check. Adjust strings/IDs as per your system
    // Based on previous Context: "HOD" or "Admin".
    // In Header, it used IDs. Let's use roleName if available, or IDs for safety if roleName is unreliable.
    // However, I previously added roleName to authService.
    const canManageSemesters = user?.roleName === 'Admin';
    const isHOD = user?.roleName === 'HOD' || user?.roleName === 'Head of Department';

    useEffect(() => {
        const fetchCurrentSemester = async () => {
            try {
                // Dynamic import not strictly needed if we want to standard import, but keeping existing style
                const { semesterService } = await import('../../services/semesterService');
                // Ensure we get the *latest* active semester
                const current = await semesterService.getCurrentSemester();
                setCurrentSemesterCode(current ? current.semesterCode : '');
            } catch (error) {
                console.error("Failed to fetch semester context", error);
            }
        };

        fetchCurrentSemester();

        // Listen for updates
        const handleSemesterChange = () => {
            console.log("Semester changed event received. Refreshing Header...");
            fetchCurrentSemester();
        };

        window.addEventListener('semesterChanged', handleSemesterChange);

        return () => {
            window.removeEventListener('semesterChanged', handleSemesterChange);
        };
    }, []);

    return (
        <header className="h-16 bg-white shadow-sm border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 lg:px-8 relative z-50">
            {/* Left Section: Logo & Mobile Menu */}
            <div className="flex items-center gap-4">
                {/* Hamburger Menu (Mobile Only) */}
                <button
                    className="block sm:hidden text-gray-600 hover:text-orange-500 transition-colors"
                    onClick={() => setVisible(true)}
                >
                    <i className="pi pi-bars text-xl"></i>
                </button>

                {/* Logo */}
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => !isHOD && navigate('/home')}>
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white">
                        <i className="pi pi-graduation-cap text-lg"></i>
                    </div>
                    <div className="text-xl font-bold text-gray-800">
                        FC<span className="text-orange-500">TMS</span>
                    </div>
                    {currentSemesterCode && (
                        <div className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded border border-orange-200">
                            {currentSemesterCode}
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Sidebar */}
            <Sidebar visible={visible} onHide={() => setVisible(false)} className="w-[80vw] sm:w-[20rem]">
                <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-8 px-2">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white">
                            <i className="pi pi-graduation-cap text-lg"></i>
                        </div>
                        <div className="text-xl font-bold text-gray-800">
                            FC<span className="text-orange-500">TMS</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        {!isHOD && (
                            <div onClick={() => navigate('/home')} className={`flex items-center gap-3 font-medium px-4 py-3 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 cursor-pointer ${location.pathname === '/home' ? 'text-orange-600 bg-orange-50' : 'text-gray-700'}`}>
                                <i className="pi pi-home text-xl"></i>
                                <span>Homepage</span>
                            </div>
                        )}
                        {(canManageSemesters || isHOD) && (
                            <div onClick={() => navigate('/semesters')} className={`flex items-center gap-3 font-medium px-4 py-3 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 cursor-pointer ${location.pathname.startsWith('/semesters') ? 'text-orange-600 bg-orange-50' : 'text-gray-700'}`}>
                                <i className="pi pi-calendar text-xl"></i>
                                <span>Semesters</span>
                            </div>
                        )}
                        {!isHOD && (
                            <div onClick={() => navigate('/teams/team')} className={`flex items-center gap-3 font-medium px-4 py-3 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 cursor-pointer ${location.pathname.startsWith('/teams/team') ? 'text-orange-600 bg-orange-50' : 'text-gray-700'}`}>
                                <i className="pi pi-users text-xl"></i>
                                <span>My Team</span>
                            </div>
                        )}
                        <div onClick={() => navigate('/my-thesis')} className={`flex items-center gap-3 font-medium px-4 py-3 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 cursor-pointer ${location.pathname === '/my-thesis' ? 'text-orange-600 bg-orange-50' : 'text-gray-700'}`}>
                            <i className="pi pi-book text-xl"></i>
                            <span>Thesis List</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700 font-medium px-4 py-3 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 cursor-pointer">
                            <div className="relative">
                                <i className="pi pi-bell text-xl"></i>
                                <Badge value="" severity="danger" className="p-0 w-2.5 h-2.5 min-w-0 absolute top-0 right-0 rounded-full border-2 border-white"></Badge>
                            </div>
                            <span>Notifications</span>
                        </div>
                    </div>

                    {!isHOD && (
                        <div className="mt-auto">
                            <button onClick={() => navigate('/propose-thesis')} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-orange-200/50 hover:from-orange-600 hover:to-orange-700 transition-all duration-300">
                                <i className="pi pi-plus text-lg"></i>
                                <span>Propose Thesis</span>
                            </button>
                        </div>
                    )}
                </div>
            </Sidebar>

            {/* Center Section: Navigation & Action Button (Tablet/Desktop) */}
            {!isHOD ? (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden sm:flex items-center gap-8 lg:gap-16">
                    {/* Left Navigation */}
                    <nav className="flex items-center gap-4 lg:gap-10">
                        <div onClick={() => navigate('/home')} className={`flex items-center gap-2 font-semibold px-3 py-2 rounded-xl hover:bg-orange-50 transition-all duration-200 cursor-pointer ${location.pathname === '/home' ? 'text-orange-600 bg-orange-50' : 'text-gray-500 hover:text-orange-600'}`}>
                            <i className="pi pi-home text-xl"></i>
                            <span className="hidden lg:block whitespace-nowrap">Homepage</span>
                        </div>
                        {canManageSemesters && (
                            <div onClick={() => navigate('/semesters')} className={`flex items-center gap-2 font-semibold px-3 py-2 rounded-xl hover:bg-orange-50 transition-all duration-200 cursor-pointer ${location.pathname.startsWith('/semesters') ? 'text-orange-600 bg-orange-50' : 'text-gray-500 hover:text-orange-600'}`}>
                                <i className="pi pi-calendar text-xl"></i>
                                <span className="hidden lg:block whitespace-nowrap">Semesters</span>
                            </div>
                        )}
                        <div onClick={() => navigate('/teams/team')} className={`flex items-center gap-2 font-medium px-3 py-2 rounded-xl hover:bg-orange-50 transition-all duration-200 cursor-pointer ${location.pathname.startsWith('/teams/team') ? 'text-orange-600 bg-orange-50' : 'text-gray-500 hover:text-orange-600'}`}>
                            <i className="pi pi-users text-xl"></i>
                            <span className="hidden lg:block whitespace-nowrap">My Team</span>
                        </div>
                    </nav>

                    {/* Center Action Button */}
                    <button onClick={() => navigate('/propose-thesis')} className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-r from-orange-500 to-orange-600 cursor-pointer rounded-full flex items-center justify-center text-white hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-orange-200/50 shadow-lg hover:shadow-none translate-y-0">
                        <i className="pi pi-plus text-xl lg:text-2xl font-bold"></i>
                    </button>

                    {/* Right Navigation */}
                    <nav className="flex items-center gap-4 lg:gap-10">
                        <div onClick={() => navigate('/my-thesis')} className={`cursor-pointer flex items-center gap-2 font-medium hover:text-orange-600 px-3 py-2 rounded-xl transition-all duration-200 ${location.pathname === '/my-thesis' ? 'text-orange-600 bg-orange-50' : 'text-gray-500 hover:bg-orange-50'}`}>
                            <i className="pi pi-book text-xl"></i>
                            <span className="hidden lg:block whitespace-nowrap">Thesis List</span>
                        </div>
                        <div className="relative flex items-center gap-2 text-gray-500 font-medium hover:text-orange-600 px-3 py-2 rounded-xl hover:bg-orange-50 transition-all duration-200 cursor-pointer">
                            <div className="relative">
                                <i className="pi pi-bell text-xl"></i>
                                <Badge value="" severity="danger" className="p-0 w-2.5 h-2.5 min-w-0 absolute top-0 right-0 rounded-full border-2 border-white"></Badge>
                            </div>
                            <span className="hidden lg:block whitespace-nowrap">Notifications</span>
                        </div>
                    </nav>
                </div>
            ) : (
                /* HOD View: Just navigation links, no center button, simplified */
                <div className="hidden sm:flex items-center gap-8">
                    <nav className="flex items-center gap-4 lg:gap-6">
                        <div onClick={() => navigate('/semesters')} className={`flex items-center gap-2 font-semibold px-3 py-2 rounded-xl hover:bg-orange-50 transition-all duration-200 cursor-pointer ${location.pathname.startsWith('/semesters') ? 'text-orange-600 bg-orange-50' : 'text-gray-500 hover:text-orange-600'}`}>
                            <i className="pi pi-calendar text-xl"></i>
                            <span className="hidden lg:block whitespace-nowrap">Semesters</span>
                        </div>
                        <div onClick={() => navigate('/thesis')} className={`flex items-center gap-2 font-medium px-3 py-2 rounded-xl hover:bg-orange-50 transition-all duration-200 cursor-pointer ${location.pathname.startsWith('/thesis') ? 'text-orange-600 bg-orange-50' : 'text-gray-500 hover:text-orange-600'}`}>
                            <i className="pi pi-book text-xl"></i>
                            <span className="hidden lg:block whitespace-nowrap">Thesis List</span>
                        </div>
                    </nav>
                </div>
            )}

            {/* Right Section: User Profile */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                {isHOD && (
                    <div className="mr-1 relative cursor-pointer flex items-center justify-center w-10 h-10 rounded-full hover:bg-orange-50 text-gray-500 hover:text-orange-600 transition-all duration-200">
                        <i className="pi pi-bell text-xl"></i>
                        <Badge severity="danger" className="p-0 w-2.5 h-2.5 min-w-0 absolute top-2 right-2.5 rounded-full border-2 border-white"></Badge>
                    </div>
                )}
                <Menu as="div" className="relative">
                    <MenuButton className="flex items-center gap-3 rounded-full hover:bg-gray-50 transition-colors p-1 pr-2 outline-none cursor-pointer">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-bold text-gray-800">{authService.getUser()?.fullName || 'User'}</div>
                            <div className="text-xs text-gray-500">
                                {authService.getUser()?.roleName || 'Student'}
                            </div>
                        </div>
                        <Avatar
                            image={authService.getUser()?.avatar || "https://cdn.haitrieu.com/wp-content/uploads/2021/10/Logo-Dai-hoc-FPT.png"}
                            shape="circle"
                            size="normal"
                            className="border border-gray-200"
                        />
                        <i className="pi pi-chevron-down text-gray-400 text-xs"></i>
                    </MenuButton>

                    <Transition
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <MenuItems className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl bg-white py-2 shadow-xl ring-1 ring-black/5 focus:outline-none">
                            <div className="px-4 py-3 border-b border-gray-100 mb-1">
                                <p className="text-xs text-gray-500">Signed in as</p>
                                <p className="truncate text-sm font-bold text-gray-900">{authService.getUser()?.email || 'User'}</p>
                            </div>

                            <MenuItem>
                                {({ focus }) => (
                                    <button
                                        onClick={() => navigate('/profile')}
                                        className={`${focus ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                                            } group flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer`}
                                    >
                                        <i className={`pi pi-user ${focus ? 'text-orange-500' : 'text-gray-400'}`}></i>
                                        Account
                                    </button>
                                )}
                            </MenuItem>
                            <MenuItem>
                                {({ focus }) => (
                                    <button
                                        onClick={() => navigate('/settings')}
                                        className={`${focus ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                                            } group flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer`}
                                    >
                                        <i className={`pi pi-cog ${focus ? 'text-orange-500' : 'text-gray-400'}`}></i>
                                        Settings
                                    </button>
                                )}
                            </MenuItem>

                            <div className="my-1 border-t border-gray-100" />

                            <MenuItem>
                                {({ focus }) => (
                                    <button
                                        onClick={() => {
                                            authService.logout();
                                            navigate('/');
                                            Swal.fire({
                                                icon: 'success',
                                                title: 'Logged Out',
                                                text: 'You have been logged out successfully.',
                                                timer: 1500,
                                                showConfirmButton: false
                                            });
                                        }}
                                        className={`${focus ? 'bg-red-50 text-red-600' : 'text-gray-700'
                                            } group flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer`}
                                    >
                                        <i className={`pi pi-sign-out ${focus ? 'text-red-500' : 'text-gray-400'}`}></i>
                                        Log out
                                    </button>
                                )}
                            </MenuItem>
                        </MenuItems>
                    </Transition>
                </Menu>
            </div>
        </header>
    );
};

export default Header;
