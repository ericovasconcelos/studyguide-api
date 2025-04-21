import React, { useState, useEffect } from 'react';
import { Tabs, Card, Form, Input, Button, Switch, Alert, notification, Space, Divider, message } from 'antd';
import { ApiOutlined, SettingOutlined, DatabaseOutlined } from '@ant-design/icons';
import { DataCleanupManager } from './DataCleanupManager';
import { logger } from '../utils/logger';
import { useDataContext } from '../contexts/DataContext';
import { cleanupService } from '../data/config/dependencies';
import { useGranToken } from '../hooks/useGranToken';

const { TabPane } = Tabs;

interface SettingsManagerProps {
  onClose?: () => void;
}

export default function SettingsManager({ onClose }: SettingsManagerProps) {
  // Estados locais
  const [granTokenInput, setGranTokenInput] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [cleanupVisible, setCleanupVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Usar o hook useGranToken para gerenciar o token do Gran
  const { token, saveToken, clearToken, error: tokenError, loading: tokenLoading } = useGranToken();

  // Usar o hook useDataContext para acessar as funções de manipulação de dados
  const { /* deleteStudy, */ sync } = useDataContext();

  // Inicializar o campo com o token atual quando disponível
  useEffect(() => {
    if (token) {
      setGranTokenInput(token);
    }
  }, [token]);

  // Handler para salvar token do Gran
  const handleSaveGranToken = async () => {
    try {
      setLoading(true);
      const success = await saveToken(granTokenInput);
      
      if (success) {
        notification.success({
          message: 'Token do Gran salvo com sucesso!',
          placement: 'topRight'
        });
      } else {
        notification.error({
          message: 'Erro ao salvar token do Gran',
          description: tokenError || 'Ocorreu um erro desconhecido',
          placement: 'topRight'
        });
      }
    } catch (error) {
      logger.error('Erro ao salvar token do Gran', error);
      notification.error({
        message: 'Erro ao salvar token do Gran',
        placement: 'topRight'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handler para limpar o token
  const handleClearGranToken = async () => {
    try {
      setLoading(true);
      const success = await clearToken();
      
      if (success) {
        setGranTokenInput('');
        notification.success({
          message: 'Token do Gran removido com sucesso!',
          placement: 'topRight'
        });
      } else {
        notification.error({
          message: 'Erro ao remover token do Gran',
          description: tokenError || 'Ocorreu um erro desconhecido',
          placement: 'topRight'
        });
      }
    } catch (error) {
      logger.error('Erro ao remover token do Gran', error);
      notification.error({
        message: 'Erro ao remover token do Gran',
        placement: 'topRight'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      await sync();
      message.success('Sincronização concluída com sucesso!');
    } catch (error) {
      message.error('Erro ao sincronizar dados');
    }
  };

  return (
    <div className="settings-manager">
      <Tabs defaultActiveKey="integrations">
        <TabPane
          tab={
            <span>
              <ApiOutlined />
              Integrações
            </span>
          }
          key="integrations"
        >
          <Card title="Gran Cursos" className="settings-card">
            <Form layout="vertical">
              <Form.Item
                label="Token de Acesso"
                help="Insira o token de acesso fornecido pelo Gran Cursos"
              >
                <Input
                  value={granTokenInput}
                  onChange={(e) => setGranTokenInput(e.target.value)}
                  placeholder="Bearer token do Gran Cursos"
                />
              </Form.Item>
              {tokenError && (
                <Alert
                  message="Erro"
                  description={tokenError}
                  type="error"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
              <Space>
                <Button
                  type="primary"
                  onClick={handleSaveGranToken}
                  loading={loading || tokenLoading}
                >
                  Salvar Token
                </Button>
                <Button
                  danger
                  onClick={handleClearGranToken}
                  loading={loading || tokenLoading}
                  disabled={!token}
                >
                  Remover Token
                </Button>
              </Space>
            </Form>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <SettingOutlined />
              Preferências
            </span>
          }
          key="preferences"
        >
          <Card className="settings-card">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Modo Escuro</span>
                <Switch checked={darkMode} onChange={setDarkMode} />
              </div>
              <Divider />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Notificações</span>
                <Switch checked={notificationsEnabled} onChange={setNotificationsEnabled} />
              </div>
            </Space>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <DatabaseOutlined />
              Dados
            </span>
          }
          key="data"
        >
          <Card className="settings-card">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="Gerenciamento de Dados"
                description="Aqui você pode gerenciar seus dados locais e do servidor. Tenha cuidado ao limpar os dados, pois algumas ações não podem ser desfeitas."
                type="info"
                showIcon
              />
              <Button
                type="primary"
                onClick={() => setCleanupVisible(true)}
                loading={loading}
              >
                Gerenciar Limpeza de Dados
              </Button>
            </Space>
          </Card>
        </TabPane>
      </Tabs>
      
      <DataCleanupManager
        visible={cleanupVisible}
        onClose={() => setCleanupVisible(false)}
        cleanupService={cleanupService}
      />

      <Form layout="vertical">
        <Form.Item label="Sincronização Automática">
          <Switch defaultChecked />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={handleSync}>
            Sincronizar Agora
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
} 