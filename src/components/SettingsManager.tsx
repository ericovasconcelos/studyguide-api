import React, { useState } from 'react';
import { Tabs, Card, Form, Input, Button, Switch, Alert, notification, Space, Divider } from 'antd';
import { CloudOutlined, ApiOutlined, SettingOutlined, DatabaseOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;

interface SettingsManagerProps {
  onClose?: () => void;
  cloudUserId?: string;
  cloudKey?: string;
  onCloudConnect?: (userId: string, key: string) => void;
  onCloudDisconnect?: () => void;
  cloudSyncStatus?: boolean;
}

export default function SettingsManager({
  onClose,
  cloudUserId = '',
  cloudKey = '',
  onCloudConnect,
  onCloudDisconnect,
  cloudSyncStatus = false
}: SettingsManagerProps) {
  // Estados locais
  const [granToken, setGranToken] = useState(localStorage.getItem('granToken') || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Handler para salvar token do Gran
  const handleSaveGranToken = () => {
    localStorage.setItem('granToken', granToken);
    notification.success({
      message: 'Token do Gran salvo',
      description: 'O token foi salvo com sucesso.',
      placement: 'topRight'
    });
  };

  // Handler para limpar dados
  const handleClearData = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
      localStorage.clear();
      notification.success({
        message: 'Dados limpos',
        description: 'Todos os dados foram removidos com sucesso.',
        placement: 'topRight'
      });
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
                <Input.Password
                  value={granToken}
                  onChange={(e) => setGranToken(e.target.value)}
                  placeholder="Bearer token do Gran Cursos"
                />
              </Form.Item>
              <Button type="primary" onClick={handleSaveGranToken}>
                Salvar Token
              </Button>
            </Form>
          </Card>

          <Card title="Sincronização com a Nuvem" className="settings-card">
            <Form layout="vertical">
              <Form.Item label="ID de Usuário">
                <Input
                  value={cloudUserId}
                  placeholder="Ex: eric123"
                  disabled={cloudSyncStatus}
                />
              </Form.Item>
              <Form.Item label="Chave de Sincronização">
                <Input.Password
                  value={cloudKey}
                  placeholder="Sua chave secreta"
                  disabled={cloudSyncStatus}
                />
              </Form.Item>
              <Button
                type={cloudSyncStatus ? 'default' : 'primary'}
                onClick={() => cloudSyncStatus ? onCloudDisconnect?.() : onCloudConnect?.(cloudUserId, cloudKey)}
              >
                {cloudSyncStatus ? 'Desconectar' : 'Conectar'}
              </Button>
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
                description="Aqui você pode gerenciar seus dados locais. Tenha cuidado ao limpar os dados, pois esta ação não pode ser desfeita."
                type="info"
                showIcon
              />
              <Button danger onClick={handleClearData}>
                Limpar Todos os Dados
              </Button>
            </Space>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
} 