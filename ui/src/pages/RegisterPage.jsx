import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

// RegisterPage redirects to LoginPage which now handles both sign in and sign up
const RegisterPage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/login', { replace: true });
  }, [navigate]);
  return null;
};

export default RegisterPage;
