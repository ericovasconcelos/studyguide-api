import React, { useState } from "react";
import { Input, InputNumber, Button, Upload, List } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import Papa from "papaparse";
import { syncStudyCycleWithCloud } from "../utils/storage";

export default function StudyCycleManager({ studyCycle, setStudyCycle }) {
  const [newSubject, setNewSubject] = useState("");
  const [newTime, setNewTime] = useState(0);

  const handleAddSubject = () => {
    if (newSubject && newTime > 0) {
      const updatedCycle = [...studyCycle, { subject: newSubject, targetTime: newTime * 60 }];
      setStudyCycle(updatedCycle);
      localStorage.setItem("studyCycle", JSON.stringify(updatedCycle));
      
      // Tenta sincronizar com a nuvem se estiver disponível
      syncStudyCycleWithCloud(updatedCycle);
      
      setNewSubject("");
      setNewTime(0);
    }
  };

  const handleRemoveSubject = (subject) => {
    const updatedCycle = studyCycle.filter((item) => item.subject !== subject);
    setStudyCycle(updatedCycle);
    localStorage.setItem("studyCycle", JSON.stringify(updatedCycle));
    
    // Tenta sincronizar com a nuvem se estiver disponível
    syncStudyCycleWithCloud(updatedCycle);
  };

  const handleExportCSV = () => {
    const csvData = [
      ["Matéria", "Tempo (horas)"],
      ...studyCycle.map((item) => [item.subject, item.targetTime ? Math.round(item.targetTime / 60) : (item.time || 0)]),
    ];
    const csvContent = Papa.unparse(csvData);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "ciclo_estudos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (file) => {
    Papa.parse(file, {
      complete: (result) => {
        const newCycle = result.data.slice(1).map((row) => ({
          subject: row[0],
          targetTime: parseFloat(row[1]) * 60, // Convertendo para minutos
        })).filter(item => item.subject && !isNaN(item.targetTime));
        
        setStudyCycle(newCycle);
        localStorage.setItem("studyCycle", JSON.stringify(newCycle));
        
        // Tenta sincronizar com a nuvem se estiver disponível
        syncStudyCycleWithCloud(newCycle);
      },
      header: false,
    });
    return false;
  };

  return (
    <div>
      <h3>Adicionar Matéria</h3>
      <Input placeholder="Nome da Matéria" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
      <InputNumber min={1} placeholder="Tempo (horas)" value={newTime} onChange={(value) => setNewTime(value)} style={{ marginLeft: "10px" }} />
      <Button type="primary" onClick={handleAddSubject} style={{ marginLeft: "10px" }}>
        Adicionar
      </Button>

      <h3>Importar Ciclo</h3>
      <Upload beforeUpload={handleImportCSV} showUploadList={false}>
        <Button icon={<UploadOutlined />}>Importar CSV</Button>
      </Upload>

      <h3>Matérias no Ciclo</h3>
      <List
        dataSource={studyCycle}
        renderItem={(item) => (
          <List.Item>
            <strong>{item.subject}</strong> - {item.targetTime ? Math.round(item.targetTime / 60) : (item.time || 0)} horas
            <Button type="link" danger onClick={() => handleRemoveSubject(item.subject)}>
              Remover
            </Button>
          </List.Item>
        )}
      />
      <Button type="primary" onClick={handleExportCSV} style={{ marginTop: "10px" }}>
        Exportar CSV
      </Button>
    </div>
  );
}
