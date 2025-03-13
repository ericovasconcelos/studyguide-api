import React, { useState, useEffect } from "react";
import { Button, Modal, Input, Drawer, Form, notification, Menu, Avatar, Badge } from "antd";
import StudyForm from "./components/StudyForm";
import StudyCycleManager from "./components/StudyCycleManager";
import { NewStudyDashboard } from "./components/Dashboard/NewStudyDashboard";
import SettingsManager from "./components/SettingsManager";
import GranImport from "./components/GranImport";
import { ConfigProvider, Typography } from 'antd';
import {
  CloudUploadOutlined,
  CloudDownloadOutlined,
  DashboardOutlined,
  BookOutlined,
  BarChartOutlined,
  SettingOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  ImportOutlined
} from "@ant-design/icons";
import "./App.css";
import { studyService, studyCycleService } from './data/config/dependencies';
import { useStudies } from './hooks/useStudies';
import { useStudyCycles } from './hooks/useStudyCycles';
import { Study } from './data/models/Study';

const { Text } = Typography;

export default function StudyTracker() {
  // Hooks personalizados para gerenciar estudos e ciclos
  const { 
    studies, 
    loading: studiesLoading, 
    error: studiesError, 
    addStudy,
    refresh: refreshStudies
  } = useStudies(studyService);

  const {
    cycles: studyCycle,
    loading: cyclesLoading,
    error: cyclesError,
    updateCycles: setStudyCycle,
    reloadCycles: refreshCycles
  } = useStudyCycles(studyCycleService);

  // Estados locais da UI
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCycleModalVisible, setIsCycleModalVisible] = useState(false);
  const [isCloudDrawerVisible, setIsCloudDrawerVisible] = useState(false);
  const [cloudUserId, setCloudUserId] = useState("");
  const [cloudKey, setCloudKey] = useState("");
  const [cloudSyncStatus, setCloudSyncStatus] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  // Novo estado para modal de configurações
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);

  // Novo estado para modal de importação
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);

  const handleSaveStudy = async (newRecord: Study) => {
    const result = await addStudy(newRecord);
    if (result.success) {
      setIsModalVisible(false);
      notification.success({
        message: "Estudo registrado",
        description: "Seu registro de estudo foi salvo com sucesso!",
        placement: "topRight"
      });
    } else {
      notification.error({
        message: "Erro ao salvar",
        description: result.error,
        placement: "topRight"
      });
    }
  };

  const handleConnectToCloud = () => {
    if (!cloudUserId || !cloudKey) {
      notification.error({
        message: "Campos obrigatórios",
        description: "Por favor, preencha o ID do usuário e a chave de sincronização",
        placement: "topRight"
      });
      return;
    }
    
    setCloudSyncStatus(true);
    setIsCloudDrawerVisible(false);
    
    notification.success({
      message: "Conectado!",
      description: "Seus dados agora estão sincronizados com a nuvem",
      placement: "topRight"
    });
  };
  
  const handleDisconnectFromCloud = () => {
    setCloudSyncStatus(false);
    
    notification.info({
      message: "Desconectado",
      description: "Seus dados agora são apenas locais",
      placement: "topRight"
    });
  };

  const handleImportClick = () => {
    const token = localStorage.getItem('granToken');
    if (!token) {
      notification.warning({
        message: 'Token não configurado',
        description: 'Configure o token do Gran nas configurações antes de importar.',
        btn: (
          <Button type="primary" size="small" onClick={() => {
            setIsImportModalVisible(false);
            setIsSettingsModalVisible(true);
          }}>
            Ir para Configurações
          </Button>
        )
      });
      return;
    }
    setIsImportModalVisible(true);
  };

  const renderHeader = () => (
    <div className="app-header">
      <div className="flex items-center gap-4">
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="desktop-menu-button"
        />
        <Button
          type="text"
          icon={<MenuUnfoldOutlined />}
          onClick={() => setMobileMenuVisible(!mobileMenuVisible)}
          className="mobile-menu-button"
        />
        <Text strong className="text-lg">StudyGuide</Text>
      </div>
      <div className="header-controls">
        <Badge count={5}>
          <Button type="text" icon={<BellOutlined />} />
        </Badge>
        <Button
          type="text"
          icon={cloudSyncStatus ? <CloudDownloadOutlined /> : <CloudUploadOutlined />}
          onClick={() => cloudSyncStatus ? handleDisconnectFromCloud() : setIsCloudDrawerVisible(true)}
        />
        <Avatar icon={<UserOutlined />} />
      </div>
    </div>
  );

  const renderSidebar = () => (
    <div className={`app-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuVisible ? 'open' : ''}`}>
      <Menu
        mode="inline"
        defaultSelectedKeys={['1']}
        inlineCollapsed={sidebarCollapsed}
        items={[
          {
            key: '1',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
          },
          {
            key: '2',
            icon: <BookOutlined />,
            label: 'Estudos',
            onClick: () => setIsModalVisible(true),
          },
          {
            key: '3',
            icon: <BarChartOutlined />,
            label: 'Ciclos',
            onClick: () => setIsCycleModalVisible(true),
          },
          {
            key: '4',
            icon: <ImportOutlined />,
            label: 'Importar do Gran',
            onClick: handleImportClick,
          },
          {
            key: '5',
            icon: <SettingOutlined />,
            label: 'Configurações',
            onClick: () => setIsSettingsModalVisible(true),
          },
        ]}
      />
    </div>
  );

  // Adicionar classe ao main-content baseado no estado do sidebar
  const mainContentClass = `main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''} fade-in`;

  if (studiesLoading || cyclesLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>Carregando dados...</h2>
      </div>
    );
  }

  if (studiesError || cyclesError) {
    const error = studiesError || cyclesError;
    console.error('[DEBUG] Erro detalhado na aplicação:', error);
    
    return (
      <div className="error-container">
        <h2>Erro ao carregar dados</h2>
        <p className="error-message">
          {error?.message || 'Erro desconhecido'}
        </p>
        
        {/* Mostrar detalhes do erro para debug */}
        <div className="error-details" style={{ marginBottom: '20px', padding: '10px', background: '#f8f8f8', border: '1px solid #ddd', borderRadius: '4px', maxHeight: '200px', overflow: 'auto' }}>
          <h3>Detalhes do erro (para diagnóstico):</h3>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
        
        <div className="error-actions">
          <Button type="primary" onClick={() => window.location.reload()}>
            Tentar Novamente
          </Button>
          <Button onClick={() => {
            // Limpa os estados de erro e recarrega apenas os dados locais
            if (studiesError) refreshStudies();
            if (cyclesError) refreshCycles();
          }}>
            Carregar Dados Locais
          </Button>
          <Button 
            onClick={async () => {
              try {
                const response = await fetch('http://localhost:5000/sync/download?since=2023-01-01T00:00:00.000Z', {
                  headers: { 'X-User-Id': 'user-123' }
                });
                const result = await response.text();
                alert(`Teste de conexão: ${response.status} ${response.statusText}\n\nResposta: ${result.substring(0, 200)}${result.length > 200 ? '...' : ''}`);
              } catch (err) {
                alert(`Teste de conexão falhou: ${err instanceof Error ? err.message : String(err)}`);
              }
            }}
          >
            Testar Conexão API
          </Button>
        </div>
        <div className="error-help">
          <h3>Sugestões para resolver:</h3>
          <ul>
            <li>Verifique sua conexão com a internet</li>
            <li>Certifique-se de que o servidor está rodando (npm run server)</li>
            <li>No WSL, talvez seja necessário usar o endereço IP em vez de localhost</li>
            <li>Verifique o console do navegador para mais detalhes sobre o erro</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#2563eb',
          borderRadius: 8,
        },
      }}
    >
      <div className="app-container" onClick={() => mobileMenuVisible && setMobileMenuVisible(false)}>
        {renderHeader()}
        {renderSidebar()}
        
        <main className={mainContentClass}>
          <NewStudyDashboard 
            studyRecords={studies}
            studyCycle={studyCycle?.[0]}
            setIsModalVisible={setIsModalVisible}
            setIsCycleModalVisible={setIsCycleModalVisible}
          />
        </main>

        <Modal
          title="Adicionar Registro de Estudo"
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
        >
          <StudyForm
            onSubmit={handleSaveStudy}
          />
        </Modal>

        <Modal
          title="Gerenciar Ciclos"
          open={isCycleModalVisible}
          onCancel={() => setIsCycleModalVisible(false)}
          footer={null}
          width={800}
        >
          <StudyCycleManager
            studyCycle={studyCycle}
            setStudyCycle={setStudyCycle}
          />
        </Modal>

        <Modal
          title="Configurações"
          open={isSettingsModalVisible}
          onCancel={() => setIsSettingsModalVisible(false)}
          footer={null}
          width={800}
        >
          <SettingsManager
            cloudUserId={cloudUserId}
            cloudKey={cloudKey}
            onCloudConnect={handleConnectToCloud}
            onCloudDisconnect={handleDisconnectFromCloud}
            cloudSyncStatus={cloudSyncStatus}
          />
        </Modal>

        <Modal
          title="Importar do Gran Cursos"
          open={isImportModalVisible}
          onCancel={() => setIsImportModalVisible(false)}
          footer={null}
          width={800}
        >
          <GranImport />
        </Modal>

        <Drawer
          title="Sincronização com a Nuvem"
          placement="right"
          onClose={() => setIsCloudDrawerVisible(false)}
          open={isCloudDrawerVisible}
        >
          <div style={{ marginBottom: "20px" }}>
            <p>Configure a sincronização para acessar seus dados de estudo em qualquer dispositivo.</p>
            <p>Crie um ID único e uma chave secreta que você usará em todos os dispositivos para acessar seus dados.</p>
          </div>
          
          <Form layout="vertical">
            <Form.Item label="ID de Usuário (crie um ID único)">
              <Input 
                value={cloudUserId} 
                onChange={(e) => setCloudUserId(e.target.value)}
                placeholder="Ex: eric123"
              />
            </Form.Item>
            
            <Form.Item label="Chave de Sincronização (crie uma senha segura)">
              <Input.Password 
                value={cloudKey} 
                onChange={(e) => setCloudKey(e.target.value)}
                placeholder="Crie uma senha para sincronização"
              />
            </Form.Item>
            
            <Button type="primary" block onClick={handleConnectToCloud}>
              Conectar e Sincronizar
            </Button>
          </Form>
          
          <div style={{ marginTop: "20px", border: "1px solid #333", padding: "15px", borderRadius: "5px" }}>
            <h4>Como funciona?</h4>
            <p>1. Use o mesmo ID e chave em todos os seus dispositivos</p>
            <p>2. Seus dados serão sincronizados automaticamente</p>
            <p>3. Se você perder seus dados, basta usar o mesmo ID e chave para recuperá-los</p>
          </div>
        </Drawer>
      </div>
    </ConfigProvider>
  );
}
