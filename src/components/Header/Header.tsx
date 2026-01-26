import { useRef, useState } from 'react';
import { Avatar } from 'primereact/avatar';
import { Badge } from 'primereact/badge';
import { Menu } from 'primereact/menu';
import { Sidebar } from 'primereact/sidebar';
import { useNavigate } from 'react-router-dom';
import 'primeicons/primeicons.css';

const Header = () => {
    const navigate = useNavigate();
    const menuRef = useRef<Menu>(null);
    const [visible, setVisible] = useState(false);

    const menuItems = [
        {
            label: 'Options',
            items: [
                {
                    label: 'Log out',
                    icon: 'pi pi-sign-out',
                    command: () => {
                        navigate('/');
                    }
                }
            ]
        }
    ];

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
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/home')}>
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white">
                        <i className="pi pi-graduation-cap text-lg"></i>
                    </div>
                    <div className="text-xl font-bold text-gray-800">
                        CAPSTONE<span className="text-orange-500">PRO</span>
                    </div>
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
                            CAPSTONE<span className="text-orange-500">PRO</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <a href="/home" className="flex items-center gap-3 text-gray-700 font-medium px-4 py-3 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-all duration-200">
                            <i className="pi pi-home text-xl"></i>
                            <span>Homepage</span>
                        </a>
                        <div onClick={() => navigate('/teams/team')} className="flex items-center gap-3 text-gray-700 font-medium px-4 py-3 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 cursor-pointer">
                            <i className="pi pi-users text-xl"></i>
                            <span>My Team</span>
                        </div>
                        <a href="#" className="flex items-center gap-3 text-gray-700 font-medium px-4 py-3 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-all duration-200">
                            <i className="pi pi-book text-xl"></i>
                            <span>Thesis List</span>
                        </a>
                        <div className="flex items-center gap-3 text-gray-700 font-medium px-4 py-3 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 cursor-pointer">
                            <div className="relative">
                                <i className="pi pi-bell text-xl"></i>
                                <Badge value="" severity="danger" className="p-0 w-2.5 h-2.5 min-w-0 absolute top-0 right-0 rounded-full border-2 border-white"></Badge>
                            </div>
                            <span>Notifications</span>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <button onClick={() => navigate('/teams')} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-orange-200/50 hover:from-orange-600 hover:to-orange-700 transition-all duration-300">
                            <i className="pi pi-plus text-lg"></i>
                            <span>Create Team</span>
                        </button>
                    </div>
                </div>
            </Sidebar>

            {/* Center Section: Navigation & Action Button (Tablet/Desktop) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden sm:flex items-center gap-8 lg:gap-16">
                {/* Left Navigation */}
                <nav className="flex items-center gap-4 lg:gap-10">
                    <a href="/home" className="flex items-center gap-2 text-orange-600 font-semibold px-3 py-2 rounded-xl hover:bg-orange-50 transition-all duration-200">
                        <i className="pi pi-home text-xl"></i>
                        <span className="hidden lg:block">Homepage</span>
                    </a>
                    <div onClick={() => navigate('/teams/team')} className="flex items-center gap-2 text-gray-500 font-medium hover:text-orange-600 px-3 py-2 rounded-xl hover:bg-orange-50 transition-all duration-200 cursor-pointer">
                        <i className="pi pi-users text-xl"></i>
                        <span className="hidden lg:block">My Team</span>
                    </div>
                </nav>

                {/* Center Action Button */}
                <button onClick={() => navigate('/teams')} className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-r from-orange-500 to-orange-600 cursor-pointer rounded-full flex items-center justify-center text-white hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-orange-200/50 shadow-lg hover:shadow-none translate-y-0">
                    <i className="pi pi-plus text-xl lg:text-2xl font-bold"></i>
                </button>

                {/* Right Navigation */}
                <nav className="flex items-center gap-4 lg:gap-10">
                    <a href="#" className="flex items-center gap-2 text-gray-500 font-medium hover:text-orange-600 px-3 py-2 rounded-xl hover:bg-orange-50 transition-all duration-200">
                        <i className="pi pi-book text-xl"></i>
                        <span className="hidden lg:block">Thesis List</span>
                    </a>
                    <div className="relative flex items-center gap-2 text-gray-500 font-medium hover:text-orange-600 px-3 py-2 rounded-xl hover:bg-orange-50 transition-all duration-200 cursor-pointer">
                        <div className="relative">
                            <i className="pi pi-bell text-xl"></i>
                            <Badge value="" severity="danger" className="p-0 w-2.5 h-2.5 min-w-0 absolute top-0 right-0 rounded-full border-2 border-white"></Badge>
                        </div>
                        <span className="hidden lg:block">Notifications</span>
                    </div>
                </nav>
            </div>

            {/* Right Section: User Profile */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right hidden sm:block cursor-pointer" onClick={(e) => menuRef.current?.toggle(e)}>
                    <div className="text-sm font-bold text-gray-800">Alex Johnson</div>
                    <div className="text-xs text-gray-500">Student</div>
                </div>
                <div className="cursor-pointer" onClick={(e) => menuRef.current?.toggle(e)}>
                    <Avatar image="" shape="circle" size="normal" className="border border-gray-200" />
                </div>
                <Menu model={menuItems} popup ref={menuRef} id="popup_menu" />
            </div>
        </header>
    );
};

export default Header;
