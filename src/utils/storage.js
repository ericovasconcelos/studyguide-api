// Funções para armazenamento local
export const getLocalStorageStudyRecords = () => {
  return JSON.parse(localStorage.getItem("studyRecords")) || [];
};

export const saveStudyRecordToLocalStorage = (records) => {
  localStorage.setItem("studyRecords", JSON.stringify(records));
};

// Versão original para compatibilidade retroativa
export const getStoredRecords = () => {
  return getLocalStorageStudyRecords();
};
  
export const saveStudyRecord = (records) => {
  saveStudyRecordToLocalStorage(records);
  // Tenta sincronizar com a nuvem se disponível
  if (window.syncToCloud && typeof window.syncToCloud === 'function') {
    window.syncToCloud(records);
  }
};

// Funções para sincronização com cloud
export const syncToCloud = (userId, cloudKey) => {
  if (!userId || !cloudKey) return;
  
  // Configuração para acesso a API remota
  window.cloudConfig = {
    userId,
    cloudKey
  };
  
  // Função para sincronizar com a nuvem
  window.syncToCloud = async (records) => {
    if (!window.cloudConfig) return;
    
    try {
      // Armazena um timestamp para saber quando foi a última sincronização
      const lastSync = new Date().toISOString();
      localStorage.setItem("lastCloudSync", lastSync);
      
      // Salva localmente a informação de que o usuário está conectado à nuvem
      localStorage.setItem("cloudUserId", window.cloudConfig.userId);
      
      // Prepara os dados para envio (em aplicação real, enviaria para um servidor)
      const syncData = {
        userId: window.cloudConfig.userId,
        records,
        lastSync,
        device: navigator.userAgent
      };
      
      // Em uma implementação real, aqui enviaria os dados para uma API
      console.log("Sincronizando com a nuvem:", syncData);
      
      // Salva informação da sincronização em localStorage como demonstração
      // Em uma implementação real, isso viria do servidor
      localStorage.setItem("cloudData", JSON.stringify(syncData));
      
      return true;
    } catch (error) {
      console.error("Erro ao sincronizar com a nuvem:", error);
      return false;
    }
  };
  
  // Verifica se já existe dados salvos para este usuário
  const existingCloudData = localStorage.getItem("cloudData");
  let existingRecords = [];
  let returnData = {
    isConnected: true,
    lastSync: null,
    dataUpdated: false
  };
  
  if (existingCloudData) {
    const cloudData = JSON.parse(existingCloudData);
    
    // Se o ID do usuário corresponde, carregar os dados da nuvem
    if (cloudData.userId === userId) {
      existingRecords = cloudData.records || [];
      returnData.lastSync = cloudData.lastSync;
      
      // Se tiver dados na nuvem e eles forem diferentes dos dados locais
      const localRecords = getLocalStorageStudyRecords();
      if (existingRecords.length > 0 && 
          JSON.stringify(existingRecords) !== JSON.stringify(localRecords)) {
        // Atualiza os registros locais com os dados da nuvem
        saveStudyRecordToLocalStorage(existingRecords);
        returnData.dataUpdated = true;
      }
    }
  }
  
  // Se não houve dados restaurados, enviar os dados locais para a nuvem
  if (!returnData.dataUpdated) {
    const records = getLocalStorageStudyRecords();
    window.syncToCloud(records);
    returnData.lastSync = localStorage.getItem("lastCloudSync") || null;
  }
  
  return returnData;
};

// Função para obter dados da nuvem
export const getCloudData = () => {
  const cloudData = localStorage.getItem("cloudData");
  return cloudData ? JSON.parse(cloudData) : null;
};

// Verificar se o usuário está sincronizado com a nuvem
export const isCloudSynced = () => {
  return !!localStorage.getItem("cloudUserId");
};

// Desconectar da nuvem
export const disconnectFromCloud = () => {
  localStorage.removeItem("cloudUserId");
  localStorage.removeItem("lastCloudSync");
  localStorage.removeItem("cloudData");
  window.cloudConfig = null;
  window.syncToCloud = null;
  
  return {
    isConnected: false
  };
};

// Sincronizar ciclo de estudos com a nuvem
export const syncStudyCycleWithCloud = (cycle) => {
  if (!window.cloudConfig) return false;
  
  try {
    // Salva o ciclo no localStorage
    localStorage.setItem("studyCycle", JSON.stringify(cycle));
    
    // Prepara os dados do ciclo para sincronização
    const cycleData = {
      userId: window.cloudConfig.userId,
      cycle,
      lastSync: new Date().toISOString()
    };
    
    // Em uma implementação real, aqui enviaria os dados para uma API
    console.log("Sincronizando ciclo com a nuvem:", cycleData);
    localStorage.setItem("cloudCycleData", JSON.stringify(cycleData));
    
    return true;
  } catch (error) {
    console.error("Erro ao sincronizar ciclo com a nuvem:", error);
    return false;
  }
};

// Recuperar ciclo de estudos da nuvem
export const getCloudStudyCycle = () => {
  if (!window.cloudConfig) return null;
  
  try {
    const cloudCycleData = localStorage.getItem("cloudCycleData");
    if (!cloudCycleData) return null;
    
    const cycleData = JSON.parse(cloudCycleData);
    
    // Verificar se é o mesmo usuário
    if (cycleData.userId === window.cloudConfig.userId) {
      return cycleData.cycle || null;
    }
    
    return null;
  } catch (error) {
    console.error("Erro ao recuperar ciclo da nuvem:", error);
    return null;
  }
};

// Função para gerar dados de exemplo do Gran Cursos
export const generateMockGranData = () => {
  const subjects = [
    "Direito Constitucional", 
    "Direito Administrativo", 
    "Português", 
    "Raciocínio Lógico", 
    "Informática"
  ];
  
  const studyTypes = ["Teoria", "Exercícios", "Revisão", "Simulado"];
  
  // Gera datas dos últimos 14 dias
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().split('T')[0] + 'T08:00:00');
  }
  
  // Cria de 15 a 25 registros aleatórios
  const records = [];
  const recordCount = Math.floor(Math.random() * 10) + 15;
  
  for (let i = 0; i < recordCount; i++) {
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const date = dates[Math.floor(Math.random() * dates.length)];
    const studyTime = Math.floor(Math.random() * 10800) + 1800; // Entre 30min e 3h30 (em segundos)
    const totalExercises = Math.floor(Math.random() * 50) + 10;
    const correctAnswers = Math.floor(Math.random() * (totalExercises + 1));
    const studyType = studyTypes[Math.floor(Math.random() * studyTypes.length)];
    
    records.push({
      date,
      subject,
      studyTime,
      totalExercises,
      correctAnswers,
      studyType
    });
  }
  
  return {
    studyRecords: records
  };
};