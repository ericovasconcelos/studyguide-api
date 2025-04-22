import React, { useState } from 'react';
import { Form, Input, Button, Alert, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { logger } from '../utils/logger';
import './LoginForm.css';

const { Title } = Typography;

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, loading, error }) => {
  const [form] = Form.useForm();
  
  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      await onLogin(values.email, values.password);
    } catch (err) {
      logger.error('Erro ao fazer login', err);
    }
  };

  return (
    <div className="login-form-container">
      <div className="login-form-header">
        <Title level={3}>Entrar no StudyGuide</Title>
        <p>Faça login para acessar seus estudos e estatísticas</p>
      </div>

      {error && (
        <Alert
          message="Erro de Login"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        name="login"
        initialValues={{ remember: true }}
        onFinish={handleSubmit}
        layout="vertical"
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Por favor, insira seu email' },
            { type: 'email', message: 'Email inválido' }
          ]}
        >
          <Input 
            prefix={<UserOutlined />} 
            placeholder="Email" 
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Por favor, insira sua senha' }]}
        >
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder="Senha" 
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            className="login-form-button"
            size="large"
            block
          >
            Entrar
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};