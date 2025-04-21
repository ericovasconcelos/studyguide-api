import React, { useState } from 'react';
import { Modal, Steps, Form, Checkbox, Button, Alert, Space, Typography } from 'antd';
import type { CheckboxOptionType } from 'antd/es/checkbox/Group';
import { 
  DatabaseOutlined, 
  CloudServerOutlined, 
  SettingOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { DataCleanupService, CleanupScope, LocalDataTypes, ServerDataTypes } from '../services/DataCleanupService';

const { Title, Text } = Typography;
const { Step } = Steps;

interface DataCleanupManagerProps {
  visible: boolean;
  onClose: () => void;
  cleanupService: DataCleanupService;
}

interface CheckboxOptionWithDescription<T> extends Omit<CheckboxOptionType, 'value'> {
  description: string;
  value: T;
}

export const DataCleanupManager: React.FC<DataCleanupManagerProps> = ({
  visible,
  onClose,
  cleanupService
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [scope, setScope] = useState<CleanupScope | null>(null);
  const [localTypes, setLocalTypes] = useState<LocalDataTypes[]>([]);
  const [serverTypes, setServerTypes] = useState<ServerDataTypes[]>([]);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleScopeSelect = (selectedScope: CleanupScope) => {
    setScope(selectedScope);
    setCurrentStep(1);
  };

  const handleLocalTypesSelect = (types: LocalDataTypes[]) => {
    setLocalTypes(types);
    setCurrentStep(2);
  };

  const handleServerTypesSelect = (types: ServerDataTypes[]) => {
    setServerTypes(types);
    setCurrentStep(2);
  };

  const handleConfirm = async () => {
    try {
      let cleanupResult;
      if (scope === CleanupScope.LOCAL) {
        cleanupResult = await cleanupService.cleanupLocalData(localTypes);
      } else {
        cleanupResult = await cleanupService.cleanupServerData(serverTypes);
      }
      setResult(cleanupResult);
      setCurrentStep(3);
    } catch (error) {
      setResult({
        success: false,
        message: `Erro durante a limpeza: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
      setCurrentStep(3);
    }
  };

  const renderScopeSelection = () => (
    <div style={{ textAlign: 'center', padding: '24px' }}>
      <Title level={4}>Onde você deseja limpar os dados?</Title>
      <Space direction="vertical" size="large" style={{ width: '100%', marginTop: '24px' }}>
        <Button
          type="primary"
          icon={<SettingOutlined />}
          size="large"
          onClick={() => handleScopeSelect(CleanupScope.LOCAL)}
          style={{ width: '100%' }}
        >
          Interface do Usuário (dados locais)
        </Button>
        <Button
          type="primary"
          icon={<CloudServerOutlined />}
          size="large"
          onClick={() => handleScopeSelect(CleanupScope.SERVER)}
          style={{ width: '100%' }}
        >
          Servidor (dados persistentes)
        </Button>
      </Space>
    </div>
  );

  const renderLocalTypesSelection = () => (
    <div style={{ padding: '24px' }}>
      <Title level={4}>Quais dados locais deseja limpar?</Title>
      <Form>
        <Form.Item>
          <Checkbox.Group
            options={[
              {
                label: 'Configurações do Usuário',
                value: LocalDataTypes.USER_SETTINGS,
                description: 'Preferências, tokens e configurações de exibição'
              },
              {
                label: 'Dados de Aplicação',
                value: LocalDataTypes.APPLICATION_DATA,
                description: 'Cache de estudos e dados temporários'
              },
              {
                label: 'Todos os Dados Locais',
                value: LocalDataTypes.ALL_LOCAL,
                description: 'Remove todos os dados armazenados localmente'
              }
            ] as CheckboxOptionWithDescription<LocalDataTypes>[]}
            onChange={(values) => handleLocalTypesSelect(values as LocalDataTypes[])}
          />
        </Form.Item>
      </Form>
    </div>
  );

  const renderServerTypesSelection = () => (
    <div style={{ padding: '24px' }}>
      <Title level={4}>Quais dados do servidor deseja limpar?</Title>
      <Alert
        message="Atenção"
        description="Esta ação afetará todos os usuários do sistema. Tenha certeza antes de prosseguir."
        type="warning"
        showIcon
        style={{ marginBottom: '16px' }}
      />
      <Form>
        <Form.Item>
          <Checkbox.Group
            options={[
              {
                label: 'Dados de Usuários',
                value: ServerDataTypes.USER_DATA,
                description: 'Histórico de estudos e metadados'
              },
              {
                label: 'Dados do Sistema',
                value: ServerDataTypes.SYSTEM_DATA,
                description: 'Logs e cache do servidor'
              },
              {
                label: 'Todos os Dados do Servidor',
                value: ServerDataTypes.ALL_SERVER,
                description: 'Remove todos os dados do servidor'
              }
            ] as CheckboxOptionWithDescription<ServerDataTypes>[]}
            onChange={(values) => handleServerTypesSelect(values as ServerDataTypes[])}
          />
        </Form.Item>
      </Form>
    </div>
  );

  const renderConfirmation = () => (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <Title level={4}>Confirmação</Title>
      <Alert
        message="Atenção"
        description="Esta ação não pode ser desfeita. Tem certeza que deseja prosseguir?"
        type="warning"
        showIcon
        style={{ marginBottom: '16px' }}
      />
      <Button type="primary" onClick={handleConfirm} danger>
        Confirmar Limpeza
      </Button>
    </div>
  );

  const renderResult = () => (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      {result?.success ? (
        <>
          <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
          <Title level={4}>Limpeza Concluída</Title>
          <Text>{result.message}</Text>
        </>
      ) : (
        <>
          <WarningOutlined style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }} />
          <Title level={4}>Erro na Limpeza</Title>
          <Text>{result?.message}</Text>
        </>
      )}
    </div>
  );

  const steps = [
    {
      title: 'Escolha o Escopo',
      content: renderScopeSelection()
    },
    {
      title: 'Selecione os Dados',
      content: scope === CleanupScope.LOCAL ? renderLocalTypesSelection() : renderServerTypesSelection()
    },
    {
      title: 'Confirmação',
      content: renderConfirmation()
    },
    {
      title: 'Resultado',
      content: renderResult()
    }
  ];

  return (
    <Modal
      title="Gerenciamento de Limpeza de Dados"
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Steps current={currentStep} style={{ marginBottom: '24px' }}>
        {steps.map((step) => (
          <Step key={step.title} title={step.title} />
        ))}
      </Steps>
      <div>{steps[currentStep].content}</div>
    </Modal>
  );
}; 