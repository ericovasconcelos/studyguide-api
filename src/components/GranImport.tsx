import React, { useState } from 'react';
import { Card, Button, Progress, Alert, List, Typography, Space } from 'antd';
import { CloudDownloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { importService } from '../data/config/dependencies';
import { getApiUrl } from '../config/env';

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

  const handleImport = async () => {
    const token = localStorage.getItem('granToken');
    if (!token) {
      setError('Token do Gran não encontrado. Configure o token nas configurações.');
      return;
    }

    setImporting(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      // Fazer a requisição para o servidor usando a URL configurada
      const response = await fetch(getApiUrl('fetchGranData'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar dados do Gran');
      }

      const data = await response.json() as GranApiResponse;
      
      if (!data.studyRecords || !Array.isArray(data.studyRecords)) {
        throw new Error('Dados inválidos recebidos do Gran');
      }

      // Mapear os registros para o formato esperado
      const mappedRecords = data.studyRecords.map((record: GranRecord) => ({
        id: record.id,
        date: record.date,
        subject: record.subject,
        studyTime: record.studyTime,
        totalExercises: record.totalExercises || 0,
        correctAnswers: record.correctAnswers || 0,
        studyType: record.studyType,
        studyPeriod: record.studyPeriod,
        cycle: record.cycle,
        cycleId: record.cycleId,
        version: record.version
      }));

      // Importar os registros mapeados
      const importResult = await importService.importGranRecords(mappedRecords);
      setResult(importResult);
      setProgress(100);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao importar');
    } finally {
      setImporting(false);
      setProgress(100);
    }
  };

  return (
    <Card title="Importar do Gran Cursos">
      <Space direction="vertical" style={{ width: '100%' }}>
        {error && (
          <Alert
            message="Erro na importação"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        )}

        {importing && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Progress type="circle" percent={progress} />
            <Text style={{ display: 'block', marginTop: '10px' }}>
              Importando registros...
            </Text>
          </div>
        )}

        {result && (
          <div>
            <Alert
              message="Importação concluída"
              description={
                <div>
                  <p>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} /> {result.imported} registros importados
                  </p>
                  {result.duplicates > 0 && (
                    <p>
                      <CloseCircleOutlined style={{ color: '#faad14' }} /> {result.duplicates} registros duplicados
                    </p>
                  )}
                  {result.errors > 0 && (
                    <p>
                      <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> {result.errors} erros encontrados
                    </p>
                  )}
                </div>
              }
              type="success"
              showIcon
            />

            {result.details.length > 0 && (
              <List
                size="small"
                header={<div>Detalhes da importação</div>}
                bordered
                dataSource={result.details}
                renderItem={item => <List.Item>{item}</List.Item>}
                style={{ marginTop: '20px' }}
              />
            )}
          </div>
        )}

        <Button
          type="primary"
          icon={<CloudDownloadOutlined />}
          onClick={handleImport}
          loading={importing}
          disabled={importing}
          block
        >
          {importing ? 'Importando...' : 'Importar Registros do Gran'}
        </Button>
      </Space>
    </Card>
  );
} 