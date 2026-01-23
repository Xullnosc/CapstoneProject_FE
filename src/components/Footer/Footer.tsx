

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 gap-4">
                    <div className="text-center md:text-left">
                        &copy; 2026 University Project Management System. All rights reserved.
                    </div>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-orange-500 transition-colors">Help Center</a>
                        <a href="#" className="hover:text-orange-500 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-orange-500 transition-colors">Contact Support</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
