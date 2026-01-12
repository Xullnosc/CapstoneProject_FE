import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Implement logout logic here (e.g., clear token)
        navigate('/');
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <Card title="Welcome Dashboard" className="w-1/2 text-center md:w-25rem">
                <p className="m-0 mb-4">
                    You have successfully logged in!
                </p>
                <Button label="Logout" icon="pi pi-sign-out" onClick={handleLogout} />
            </Card>
        </div>
    );
};

export default Home;
