import React, { useState } from "react";
import { Form, Input, Button, Select } from "antd";

const { Option } = Select;

export default function StudyForm({ onSave }) {
  const [formData, setFormData] = useState({
    date: "",
    subject: "",
    studyType: "",
    studyTime: "",
    totalExercises: 0,
    correctAnswers: 0,
    totalPages: 0,
    stopPoint: "",
    studyPeriod: "",
    cycle: "",
  });

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Form layout="vertical">
      <Form.Item label="Data">
        <Input type="date" onChange={(e) => handleChange("date", e.target.value)} />
      </Form.Item>

      <Form.Item label="Disciplina">
        <Input placeholder="Nome da Disciplina" onChange={(e) => handleChange("subject", e.target.value)} />
      </Form.Item>

      <Form.Item label="Tipo de Estudo">
        <Select onChange={(value) => handleChange("studyType", value)}>
          <Option value="Questões/Exercícios">Questões/Exercícios</Option>
          <Option value="Livro">Livro</Option>
          <Option value="PDF">PDF</Option>
          <Option value="Videoaula">Videoaula</Option>
          <Option value="Aula presencial">Aula presencial</Option>
          <Option value="Outros">Outros</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Tempo Estudado (HH:MM)">
        <Input placeholder="Ex: 01:30" onChange={(e) => handleChange("studyTime", e.target.value)} />
      </Form.Item>

      <Form.Item label="Total de Questões">
        <Input type="number" placeholder="Ex: 25" onChange={(e) => handleChange("totalExercises", e.target.value)} />
      </Form.Item>

      <Form.Item label="Acertos">
        <Input type="number" placeholder="Ex: 20" onChange={(e) => handleChange("correctAnswers", e.target.value)} />
      </Form.Item>

      <Form.Item label="Páginas Lidas">
        <Input type="number" placeholder="Ex: 12" onChange={(e) => handleChange("totalPages", e.target.value)} />
      </Form.Item>

      <Form.Item label="Ponto de Parada">
        <Input placeholder="Ex: Capítulo 5" onChange={(e) => handleChange("stopPoint", e.target.value)} />
      </Form.Item>

      <Form.Item label="Período">
        <Select onChange={(value) => handleChange("studyPeriod", value)}>
          <Option value="Manhã">Manhã</Option>
          <Option value="Tarde">Tarde</Option>
          <Option value="Noite">Noite</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Ciclo">
        <Input placeholder="Nome do Ciclo" onChange={(e) => handleChange("cycle", e.target.value)} />
      </Form.Item>

      <Button type="primary" onClick={handleSubmit}>
        Salvar Estudo
      </Button>
    </Form>
  );
}
