import React, { useState } from 'react';
import { Form, Input, Button, Alert, Typography } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import { logger } from '../utils/logger';
import './ChangePasswordForm.css';

const { Title } = Typography;
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface ChangePasswordFormProps {
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ 
  userId, 
  onSuccess, 
  onCancel 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (values: { 
    currentPassword: string; 
    newPassword: string; 
    confirmPassword: string 
  }) => {
    // Validar senhas iguais
    if (values.newPassword !== values.confirmPassword) {
      form.setFields([
        {
          name: 'confirmPassword',
          errors: ['As senhas não conferem']
        }
      ]);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/change-password`, {
        userId,
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });

      if (response.data.success) {
        setSuccess(true);
        form.resetFields();
        
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else {
        throw new Error(response.data.error || 'Erro ao alterar senha.');
      }
    } catch (err) {
      logger.error('Erro ao alterar senha', err);
      
      let errorMessage = 'Falha ao alterar a senha. Tente novamente.';
      
      if (axios.isAxiosError(err) && err.response) {
        errorMessage = err.response.data.error || errorMessage;
        
        // Traduzir mensagens comuns
        if (errorMessage === 'Current password is incorrect') {
          errorMessage = 'A senha atual está incorreta.';
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-form-container">
      <div className="change-password-form-header">
        <Title level={4}>Alterar Senha</Title>
        <p>Atualize sua senha para manter sua conta segura</p>
      </div>

      {error && (
        <Alert
          message="Erro"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {success && (
        <Alert
          message="Sucesso"
          description="Sua senha foi alterada com sucesso!"
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        name="changePassword"
        onFinish={handleSubmit}
        layout="vertical"
      >
        <Form.Item
          name="currentPassword"
          rules={[{ required: true, message: 'Por favor, digite sua senha atual' }]}
        >
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder="Senha atual" 
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="newPassword"
          rules={[
            { required: true, message: 'Por favor, digite sua nova senha' },
            { min: 6, message: 'A senha deve ter pelo menos 6 caracteres' }
          ]}
        >
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder="Nova senha" 
            size="large"
          />
        </Form.Item>
        
        <Form.Item
          name="confirmPassword"
          rules={[
            { required: true, message: 'Por favor, confirme sua nova senha' }
          ]}
        >
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder="Confirme sua nova senha" 
            size="large"
          />
        </Form.Item>

        <Form.Item className="change-password-form-buttons">
          <Button 
            type="default" 
            onClick={onCancel}
            className="cancel-button"
          >
            Cancelar
          </Button>
          
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            className="submit-button"
          >
            Alterar Senha
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}; 