import React, { useState } from 'react';
import { RegisterForm } from './RegisterForm';
import { useAuth } from '../hooks/useAuth';
import { Card, Typography, Button, Result } from 'antd';
import './RegisterPage.css';

const { Title } = Typography;

interface RegisterPageProps {
  onLoginClick: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onLoginClick }) => {
  const { register, loading, error } = useAuth();
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleRegister = async (name: string, email: string, password: string) => {
    const success = await register(name, email, password);
    if (success) {
      setRegistrationSuccess(true);
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        onLoginClick();
      }, 3000);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="register-page">
        <Result
          status="success"
          title="Conta criada com sucesso!"
          subTitle="Você será redirecionado para a tela de login..."
          extra={
            <Button type="primary" onClick={onLoginClick}>
              Ir para Login
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="register-page">
      <Card className="register-page-card">
        <div className="register-page-logo">
          <Title level={2}>StudyGuide</Title>
          <p>Organize seus estudos e acompanhe seu progresso</p>
        </div>
        
        <RegisterForm 
          onRegister={handleRegister}
          loading={loading}
          error={error}
        />
        
        <div className="auth-page-footer">
          <p>Já tem uma conta?</p>
          <Button 
            type="link" 
            onClick={onLoginClick}
            className="auth-page-link"
          >
            Entrar
          </Button>
        </div>
      </Card>
    </div>
  );
}; 