import React from 'react';
import { Form, Input, Button, Alert, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { logger } from '../utils/logger';
import './RegisterForm.css';

const { Title } = Typography;

interface RegisterFormProps {
  onRegister: (name: string, email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, loading, error }) => {
  const [form] = Form.useForm();
  
  const handleSubmit = async (values: { name: string, email: string, password: string, confirmPassword: string }) => {
    try {
      if (values.password !== values.confirmPassword) {
        form.setFields([
          {
            name: 'confirmPassword',
            errors: ['As senhas não conferem']
          }
        ]);
        return;
      }
      
      await onRegister(values.name, values.email, values.password);
    } catch (err) {
      logger.error('Erro ao registrar usuário', err);
    }
  };

  return (
    <div className="register-form-container">
      <div className="register-form-header">
        <Title level={3}>Criar Conta</Title>
        <p>Registre-se para começar a usar o StudyGuide</p>
      </div>

      {error && (
        <Alert
          message="Erro no Registro"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        name="register"
        onFinish={handleSubmit}
        layout="vertical"
      >
        <Form.Item
          name="name"
          rules={[{ required: true, message: 'Por favor, insira seu nome' }]}
        >
          <Input 
            prefix={<UserOutlined />} 
            placeholder="Nome completo" 
            size="large"
          />
        </Form.Item>
        
        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Por favor, insira seu email' },
            { type: 'email', message: 'Email inválido' }
          ]}
        >
          <Input 
            prefix={<MailOutlined />} 
            placeholder="Email" 
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: 'Por favor, insira sua senha' },
            { min: 6, message: 'A senha deve ter pelo menos 6 caracteres' }
          ]}
        >
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder="Senha" 
            size="large"
          />
        </Form.Item>
        
        <Form.Item
          name="confirmPassword"
          rules={[
            { required: true, message: 'Por favor, confirme sua senha' }
          ]}
        >
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder="Confirme sua senha" 
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            className="register-form-button"
            size="large"
            block
          >
            Criar Conta
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}; 