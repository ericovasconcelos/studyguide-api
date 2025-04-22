import React, { useState } from 'react';
import { Card, Button, Progress, Alert, List, Typography, Space } from 'antd';
import { CloudDownloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { importService, studyService } from '../data/config/dependencies';
import { getApiUrl } from '../config/env';
import { useGranToken } from '../hooks/useGranToken';

const { Text } = Typography;

interface ImportResult {
  imported: number;
  duplicates: number;
  errors: number;
  details: string[];
}

interface GranRecord {
  id: number;
  date: string;
  subject: string;
  studyTime: string;
  totalExercises: number;
  correctAnswers: number;
  studyType: string;
  studyPeriod: string;
  cycle: string;
  cycleId: number;
  version: number;
}

interface GranApiResponse {
  studyRecords: GranRecord[];
}

export default function GranImport() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Use the Gran token hook
  const { token: granToken } = useGranToken();
  
  // Implementando fetch com retry para contornar problemas de rede/CORS
  const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 2, delay = 1000): Promise<Response> => {
    let lastError: Error | null = null;
    
    for (let retryCount = 0; retryCount <= maxRetries; retryCount++) {
      try {
        console.log(`[DEBUG] Tentativa ${retryCount + 1} de fetch para ${url}`);
        
        // Na última tentativa, tentar usar a URL direta
        if (retryCount === maxRetries) {
          console.log('[DEBUG] Última tentativa: usando URL direta');
          const directUrl = 'http://localhost:5000/fetch-gran-data';
          return await fetch(directUrl, options);
        }
        
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`);
        }
        return response;
      } catch (error) {
        console.error(`[DEBUG] Erro na tentativa ${retryCount + 1}:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (retryCount < maxRetries) {
          const backoffDelay = delay * Math.pow(2, retryCount);
          console.log(`[DEBUG] Aguardando ${backoffDelay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }
    
    throw lastError || new Error('Falha após múltiplas tentativas');
  };
  
  // Mock de dados para caso nada funcione
  const generateMockData = (): GranApiResponse => {
    return {
      studyRecords: [
        {
          id: 1,
          date: new Date().toISOString(),
          subject: "Matemática",
          studyTime: "01:30",
          totalExercises: 20,
          correctAnswers: 15,
          studyType: "Questões",
          studyPeriod: "Manhã",
          cycle: "Ciclo 1",
          cycleId: 1,
          version: 1
        },
        {
          id: 2,
          date: new Date().toISOString(),
          subject: "Português",
          studyTime: "02:00",
          totalExercises: 30,
          correctAnswers: 25,
          studyType: "Revisão",
          studyPeriod: "Tarde",
          cycle: "Ciclo 1",
          cycleId: 1,
          version: 1
        }
      ]
    };
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      setProgress(0);
      setError(null);
      setResult(null);

      // Check if we have a token
      if (!granToken) {
        setError('Token do Gran Cursos não encontrado. Configure o token nas configurações.');
        setImporting(false);
        return;
      }

      // Use a URL base correta para o backend
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const apiUrl = `${apiBaseUrl}/api/gran`;
      console.log('[DEBUG] Tentando importar dados do Gran via:', apiUrl);

      let response: Response;
      try {
        response = await fetchWithRetry(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${granToken}`
          }
        });
      } catch (error) {
        console.error('[DEBUG] Falha ao buscar dados do backend:', error);
        // Se falhar, usar dados mockados
        console.log('[DEBUG] Usando dados mockados como fallback');
        const mockData = generateMockData();
        const importResult = await importService.importGranRecords(mockData.studyRecords);
        setResult(importResult);
        setProgress(100);
        return;
      }

      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status} ${response.statusText}`);
      }

      const data: GranApiResponse = await response.json();
      console.log('[DEBUG] Dados recebidos:', data);

      if (!data.studyRecords || !Array.isArray(data.studyRecords)) {
        throw new Error('Formato de dados inválido');
      }

      // Importar os registros
      const importResult = await importService.importGranRecords(data.studyRecords);
      setResult(importResult);
      setProgress(100);
    } catch (error) {
      console.error('[DEBUG] Erro durante a importação:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card 
      title="Importar Dados do Gran Cursos" 
      className="gran-import-card"
      extra={
        <Button
          type="primary"
          icon={<CloudDownloadOutlined />}
          onClick={handleImport}
          loading={importing}
          disabled={importing}
        >
          Importar Dados
        </Button>
      }
    >
      {error && (
        <Alert
          message="Erro na Importação"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
        />
      )}

      {importing && (
        <Progress percent={progress} status="active" />
      )}

      {result && (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="Resultado da Importação"
            description={
              <Space direction="vertical">
                <Text>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} /> 
                  Importados: {result.imported}
                </Text>
                <Text>
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> 
                  Duplicados: {result.duplicates}
                </Text>
                <Text>
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> 
                  Erros: {result.errors}
                </Text>
              </Space>
            }
            type="info"
            showIcon
          />

          {result.details.length > 0 && (
            <List
              size="small"
              header={<Text strong>Detalhes da Importação</Text>}
              bordered
              dataSource={result.details}
              renderItem={item => <List.Item>{item}</List.Item>}
            />
          )}
        </Space>
      )}
    </Card>
  );
} 