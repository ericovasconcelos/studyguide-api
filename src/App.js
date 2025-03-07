import React, { useState, useEffect } from "react";
import { Button, Modal, Input, message, Drawer, Form, notification } from "antd";
import StudyForm from "./components/StudyForm";
import StudyCycleManager from "./components/StudyCycleManager";
import StudyDashboard from "./components/StudyDashboard";
import { getStoredRecords, saveStudyRecord, syncToCloud, isCloudSynced, disconnectFromCloud, getCloudData, getCloudStudyCycle } from "./utils/storage";
import axios from "axios";
import { ConfigProvider } from 'antd';
import { CloudUploadOutlined, CloudDownloadOutlined, LogoutOutlined } from "@ant-design/icons";

export default function StudyTracker() {
  const [studyRecords, setStudyRecords] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCycleModalVisible, setIsCycleModalVisible] = useState(false);
  const [studyCycle, setStudyCycle] = useState([]);
  const [bearerToken, setBearerToken] = useState(localStorage.getItem("bearerToken") || "");
  const [isCloudDrawerVisible, setIsCloudDrawerVisible] = useState(false);
  const [cloudUserId, setCloudUserId] = useState("");
  const [cloudKey, setCloudKey] = useState("");
  const [cloudSyncStatus, setCloudSyncStatus] = useState(isCloudSynced());
  const [lastSyncTime, setLastSyncTime] = useState(localStorage.getItem("lastCloudSync") || null);

  useEffect(() => {
    setStudyRecords(getStoredRecords());
    const storedCycle = JSON.parse(localStorage.getItem("studyCycle")) || [];
    setStudyCycle(storedCycle);
    
    // Verifica se já existe sincronização com a nuvem
    if (isCloudSynced()) {
      setCloudSyncStatus(true);
      const cloudData = getCloudData();
      if (cloudData) {
        setCloudUserId(cloudData.userId);
        setLastSyncTime(cloudData.lastSync);
      }
    }
  }, []);

  const handleSaveStudy = (newRecord) => {
    const updatedRecords = [...studyRecords, newRecord];
    setStudyRecords(updatedRecords);
    saveStudyRecord(updatedRecords);
    setIsModalVisible(false);
  };

  const handleTokenChange = (e) => {
    const token = e.target.value;
    setBearerToken(token);
    localStorage.setItem("bearerToken", token);
  };

  const fetchGranData = async () => {
    if (!bearerToken) {
      notification.error({
        message: "Token não informado",
        description: "Por favor, informe o Bearer Token antes de importar os dados.",
        placement: "topRight"
      });
      return;
    }

    try {
      // Usar URL da API de produção quando estiver em produção
      const apiUrl = "https://studyguide-api.onrender.com/fetch-gran-data";
        
      const response = await axios.post(apiUrl, { token: bearerToken });
      if (response.data && response.data.studyRecords) {
        const newRecords = response.data.studyRecords.map((record) => ({
          date: record.date,
          subject: record.subject,
          studyTime: `${Math.floor(record.studyTime / 3600)}:${Math.floor((record.studyTime % 3600) / 60)}`,
          totalExercises: record.totalExercises || 0,
          correctAnswers: record.correctAnswers || 0,
          studyType: record.studyType || "Desconhecido"
        }));

        // Remover duplicatas comparando os registros pelo ID e data
        const uniqueRecords = newRecords.filter(newRecord =>
          !studyRecords.some(existingRecord =>
            existingRecord.date === newRecord.date && existingRecord.subject === newRecord.subject
          )
        );

        const updatedRecords = [...studyRecords, ...uniqueRecords];
        setStudyRecords(updatedRecords);
        saveStudyRecord(updatedRecords);
        notification.success({
          message: "Dados importados",
          description: "Registros importados automaticamente do Gran Cursos!",
          placement: "topRight"
        });
      }
    } catch (error) {
      console.error("Erro ao importar dados do Gran Cursos:", error);
      notification.error({
        message: "Erro de importação",
        description: "Erro ao buscar os registros do Gran Cursos.",
        placement: "topRight"
      });
    }
  };

  const clearStudyRecords = () => {
    setStudyRecords([]);
    saveStudyRecord([]);
    notification.success({
      message: "Registros apagados",
      description: "Todos os registros de estudo foram apagados.",
      placement: "topRight"
    });
  };

  // Funções de sincronização com a nuvem
  const handleConnectToCloud = () => {
    if (!cloudUserId || !cloudKey) {
      notification.error({
        message: "Campos obrigatórios",
        description: "Por favor, preencha o ID do usuário e a chave de sincronização",
        placement: "topRight"
      });
      return;
    }
    
    // Executa a sincronização
    const result = syncToCloud(cloudUserId, cloudKey);
    
    if (result && result.isConnected) {
      setCloudSyncStatus(true);
      setLastSyncTime(result.lastSync);
      
      // Se os dados foram atualizados da nuvem, atualize o estado
      if (result.dataUpdated) {
        // Recarrega os registros atualizados
        const updatedRecords = getStoredRecords();
        setStudyRecords(updatedRecords);
        
        // Tenta recuperar o ciclo de estudos da nuvem
        const cloudCycle = getCloudStudyCycle();
        if (cloudCycle) {
          setStudyCycle(cloudCycle);
          localStorage.setItem("studyCycle", JSON.stringify(cloudCycle));
        }
        
        notification.success({
          message: "Dados recuperados da nuvem!",
          description: "Seus dados foram atualizados com as informações da nuvem",
          placement: "topRight"
        });
      } else {
        // Mesmo que não tenha atualizado registros, tenta buscar ciclo de estudos
        const cloudCycle = getCloudStudyCycle();
        if (cloudCycle) {
          setStudyCycle(cloudCycle);
          localStorage.setItem("studyCycle", JSON.stringify(cloudCycle));
        }
        
        notification.success({
          message: "Sincronização ativada!",
          description: "Seus dados agora estão sincronizados com a nuvem e podem ser acessados em outros dispositivos",
          placement: "topRight"
        });
      }
      
      setIsCloudDrawerVisible(false);
    } else {
      notification.error({
        message: "Erro de sincronização",
        description: "Erro ao sincronizar com a nuvem. Verifique suas credenciais.",
        placement: "topRight"
      });
    }
  };
  
  const handleDisconnectFromCloud = () => {
    const result = disconnectFromCloud();
    
    if (!result.isConnected) {
      setCloudSyncStatus(false);
      setLastSyncTime(null);
      
      notification.info({
        message: "Desconectado da nuvem",
        description: "Seus dados agora são apenas locais e não estão mais sincronizados",
        placement: "topRight"
      });
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          colorBgBase: '#121212',
          colorTextBase: '#fff',
          colorBgElevated: '#1e1e2f',
          colorBgContainer: '#1e1e2f',
          colorBorder: '#333',
          backgroundColor: "#121212",
        },
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "auto", padding: "20px", backgroundColor: "#121212", color: "#fff", borderRadius: "0px" }}>
        <h2 style={{ textAlign: "center", color: "#fff" }}>Dashboard de Estudos</h2>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <div>
            <Input.Password
              placeholder="Cole aqui seu Bearer Token"
              value={bearerToken}
              onChange={handleTokenChange}
              style={{ width: "300px", backgroundColor: "#1e1e2f", color: "#fff", border: "1px solid #555" }}
            />
          </div>
          
          <div>
            {cloudSyncStatus ? (
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: "14px", marginRight: "10px", color: "#52c41a" }}>
                  <CloudDownloadOutlined /> Sincronizado {lastSyncTime ? `(${new Date(lastSyncTime).toLocaleString()})` : ""}
                </span>
                <Button 
                  type="text" 
                  danger 
                  icon={<LogoutOutlined />} 
                  onClick={handleDisconnectFromCloud}
                >
                  Desconectar
                </Button>
              </div>
            ) : (
              <Button 
                type="primary" 
                icon={<CloudUploadOutlined />} 
                onClick={() => setIsCloudDrawerVisible(true)}
              >
                Sincronizar Dispositivos
              </Button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <Button type="primary" onClick={fetchGranData}>
            Importar do Gran Cursos
          </Button>
          <Button type="info" onClick={clearStudyRecords}>
            Limpar Registros
          </Button>
        </div>

        <div style={{ backgroundColor: "#1e1e2f", padding: "20px", borderRadius: "10px" }}>
          <StudyDashboard
            studyRecords={studyRecords}
            studyCycle={studyCycle}
            setIsModalVisible={setIsModalVisible}
            setIsCycleModalVisible={setIsCycleModalVisible}
          />
        </div>

        <Modal title="Registrar Estudo" open={isModalVisible} onCancel={() => setIsModalVisible(false)} footer={null}>
          <StudyForm onSave={handleSaveStudy} />
        </Modal>

        <Modal title="Editar Ciclo de Estudos" open={isCycleModalVisible} onCancel={() => setIsCycleModalVisible(false)} footer={null}>
          <StudyCycleManager studyCycle={studyCycle} setStudyCycle={setStudyCycle} />
        </Modal>
        
        {/* Drawer para sincronização com a nuvem */}
        <Drawer 
          title="Sincronização entre Dispositivos" 
          placement="right"
          onClose={() => setIsCloudDrawerVisible(false)}
          open={isCloudDrawerVisible}
          width={400}
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
