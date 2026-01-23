import { useRef } from 'react';
import { Avatar } from 'primereact/avatar';
import { Badge } from 'primereact/badge';
import { Menu } from 'primereact/menu';
import { useNavigate } from 'react-router-dom';
import 'primeicons/primeicons.css';

const Header = () => {
    const navigate = useNavigate();
    const menuRef = useRef<Menu>(null);

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
            {/* Left Section: Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/home')}>
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white">
                    <i className="pi pi-graduation-cap text-lg"></i>
                </div>
                <div className="text-xl font-bold text-gray-800">
                    CAPSTONE<span className="text-orange-500">PRO</span>
                </div>
            </div>

            {/* Center Section: Navigation & Action Button */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-12 lg:gap-16">
                {/* Left Navigation */}
                <nav className="hidden md:flex items-center gap-8 lg:gap-10">
                    <a href="/home" className="flex items-center gap-2 text-orange-600 font-semibold px-3 py-2 rounded-xl hover:bg-orange-50 transition-all duration-200">
                        <i className="pi pi-home text-xl"></i>
                        <span>Homepage</span>
                    </a>
                    <a href="#" className="flex items-center gap-2 text-gray-500 font-medium hover:text-orange-600 px-3 py-2 rounded-xl hover:bg-orange-50 transition-all duration-200">
                        <i className="pi pi-users text-xl"></i>
                        <span>My Team</span>
                    </a>
                </nav>

                {/* Center Action Button */}
                <button className="w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-600 cursor-pointer rounded-full flex items-center justify-center text-white hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-orange-200/50 shadow-lg hover:shadow-none translate-y-0">
                    <i className="pi pi-plus text-2xl font-bold"></i>
                </button>

                {/* Right Navigation */}
                <nav className="hidden md:flex items-center gap-8 lg:gap-10">
                    <a href="#" className="flex items-center gap-2 text-gray-500 font-medium hover:text-orange-600 px-3 py-2 rounded-xl hover:bg-orange-50 transition-all duration-200">
                        <i className="pi pi-book text-xl"></i>
                        <span>Thesis List</span>
                    </a>
                    <div className="relative flex items-center gap-2 text-gray-500 font-medium hover:text-orange-600 px-3 py-2 rounded-xl hover:bg-orange-50 transition-all duration-200 cursor-pointer">
                        <div className="relative">
                            <i className="pi pi-bell text-xl"></i>
                            <Badge value="" severity="danger" className="p-0 w-2.5 h-2.5 min-w-0 absolute top-0 right-0 rounded-full border-2 border-white"></Badge>
                        </div>
                        <span>Notifications</span>
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
