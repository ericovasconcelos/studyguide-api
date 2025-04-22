import React from 'react';
import { LoginForm } from './LoginForm';
import { useAuth } from '../hooks/useAuth';
import { Card, Typography, Button } from 'antd';
import './LoginPage.css';

const { Title } = Typography;

interface LoginPageProps {
  onRegisterClick: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onRegisterClick }) => {
  const { login, loading, error } = useAuth();

  return (
    <div className="login-page">
      <Card className="login-page-card">
        <div className="login-page-logo">
          <Title level={2}>StudyGuide</Title>
          <p>Organize seus estudos e acompanhe seu progresso</p>
        </div>
        
        <LoginForm 
          onLogin={login}
          loading={loading}
          error={error}
        />
        
        <div className="auth-page-footer">
          <p>Ainda não tem uma conta?</p>
          <Button 
            type="link" 
            onClick={onRegisterClick}
            className="auth-page-link"
          >
            Cadastre-se
          </Button>
        </div>
      </Card>
    </div>
  );
}; 