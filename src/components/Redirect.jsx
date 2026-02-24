import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const RedirectToDashboard = () => {
    const navigate = useNavigate();
    useEffect(() => {
        navigate('/');
    }, [navigate]);
    return null;
}

export default RedirectToDashboard;
