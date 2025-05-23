import React, { useState, useEffect } from "react";
import { toDashboardStudy } from './utils/adapters'; // ajuste o caminho conforme necessário

import { Button, Modal, Menu, Avatar, Badge, ConfigProvider, Typography, notification } from "antd";
import {
  DashboardOutlined,
  BookOutlined,
  BarChartOutlined,
  SettingOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined
} from "@ant-design/icons";

import StudyForm from "./components/StudyForm";
import StudyCycleManager from "./components/StudyCycleManager";
import { NewStudyDashboard } from "./components/Dashboard/NewStudyDashboard";
import SettingsManager from "./components/SettingsManager";
import { DataProvider } from './contexts/DataContext';
import { AuthProvider } from './contexts/AuthContext';
import { useStudies } from './hooks/useStudies';
import { useAuth } from './hooks/useAuth';
import { Study } from './domain/entities/Study';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';

import "./App.css";

const { Text } = Typography;

// Enum para páginas de autenticação
enum AuthPage {
  LOGIN = 'login',
  REGISTER = 'register'
}

function AppContent() {
  const { isAuthenticated, user, logout } = useAuth();
  const [authPage, setAuthPage] = useState<AuthPage>(AuthPage.LOGIN);
  
  const {
    studies,
    loading: studiesLoading,
    error: studiesError,
    save,
    refresh: refreshStudies,
  } = useStudies();

  // Estados da UI
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCycleModalVisible, setIsCycleModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [studyCycle, setStudyCycle] = useState(null);

  // Funções para alternar entre páginas de autenticação
  const showLoginPage = () => setAuthPage(AuthPage.LOGIN);
  const showRegisterPage = () => setAuthPage(AuthPage.REGISTER);

  // Efeito para carregar dados iniciais
  useEffect(() => {
    if (isAuthenticated) {
      refreshStudies();
    }
  }, [isAuthenticated, refreshStudies]);

  const handleSaveStudy = async (newRecord: Study) => {
    try {
      await save(newRecord);
      setIsModalVisible(false);
      notification.success({
        message: 'Estudo registrado',
        description: 'Seu registro de estudo foi salvo com sucesso!',
        placement: 'topRight'
      });
    } catch (error) {
      notification.error({
        message: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar o estudo',
        placement: 'topRight'
      });
    }
  };

  const handleLogout = () => {
    logout();
    notification.info({
      message: 'Logout realizado',
      description: 'Você saiu do sistema com sucesso',
      placement: 'topRight'
    });
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
        <div className="user-info">
          {user && (
            <span className="user-name">{user.name}</span>
          )}
          <Avatar icon={<UserOutlined />} />
          <Button 
            type="text" 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
            title="Sair"
          />
        </div>
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
            icon: <SettingOutlined />,
            label: 'Configurações',
            onClick: () => setIsSettingsModalVisible(true),
          },
        ]}
      />
    </div>
  );

  // Se não estiver autenticado, mostrar página de login ou registro
  if (!isAuthenticated) {
    if (authPage === AuthPage.LOGIN) {
      return <LoginPage onRegisterClick={showRegisterPage} />;
    } else {
      return <RegisterPage onLoginClick={showLoginPage} />;
    }
  }

  if (studiesLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>Carregando dados...</h2>
      </div>
    );
  }

  if (studiesError) {
    return (
      <div className="error-container">
        <h2>Erro ao carregar dados</h2>
        <p className="error-message">
          {studiesError}
        </p>
        <div className="error-actions">
          <Button type="primary" onClick={() => window.location.reload()}>
            Tentar Novamente
          </Button>
          <Button onClick={refreshStudies}>
            Carregar Dados Locais
          </Button>
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
        
        <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''} fade-in`}>
          <NewStudyDashboard 
            studyRecords={studies.map(toDashboardStudy)}
            setIsModalVisible={setIsModalVisible}
            setIsCycleModalVisible={setIsCycleModalVisible}
          />
        </main>

        <Modal
          title="Adicionar Registro de Estudo"
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
        >
          <StudyForm
            onSubmit={handleSaveStudy}
          />
        </Modal>

        <Modal
          title="Gerenciar Ciclos de Estudo"
          open={isCycleModalVisible}
          onCancel={() => setIsCycleModalVisible(false)}
          footer={null}
          width={800}
        >
          <StudyCycleManager studyCycle={studyCycle} setStudyCycle={setStudyCycle} />
        </Modal>

        <Modal
          title="Configurações"
          open={isSettingsModalVisible}
          onCancel={() => setIsSettingsModalVisible(false)}
          footer={null}
          width={800}
        >
          <SettingsManager onClose={() => setIsSettingsModalVisible(false)} />
        </Modal>
      </div>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
