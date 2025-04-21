import React, { useState } from "react";
import { Form, Input, Button, Select, DatePicker, InputNumber } from "antd";

const { Option } = Select;

export default function StudyForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    subject: "",
    source: "",
    timeSpent: 0,
    questions: 0,
    correctAnswers: 0,
    topic: "",
    notes: "",
    date: new Date()
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.subject || !formData.timeSpent) {
      alert("Por favor, preencha os campos obrigatórios");
      return;
    }

    onSubmit({
      ...formData,
      date: formData.date.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <Form layout="vertical" onSubmit={handleSubmit}>
      <Form.Item label="Data">
        <DatePicker 
          onChange={(date) => handleChange("date", date)} 
          style={{ width: "100%" }}
        />
      </Form.Item>

      <Form.Item label="Disciplina">
        <Input onChange={(e) => handleChange("subject", e.target.value)} />
      </Form.Item>

      <Form.Item label="Tipo de Estudo">
        <Select onChange={(value) => handleChange("source", value)}>
          <Option value="Teoria">Teoria</Option>
          <Option value="Exercícios">Exercícios</Option>
          <Option value="Revisão">Revisão</Option>
          <Option value="Simulado">Simulado</Option>
          <Option value="Gran Cursos">Gran Cursos</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Tempo de Estudo (minutos)">
        <InputNumber 
          min={0}
          onChange={(value) => handleChange("timeSpent", value)}
          style={{ width: "100%" }}
        />
      </Form.Item>

      <Form.Item label="Número de Questões">
        <InputNumber 
          min={0}
          onChange={(value) => handleChange("questions", value)}
          style={{ width: "100%" }}
        />
      </Form.Item>

      <Form.Item label="Questões Corretas">
        <InputNumber 
          min={0}
          max={formData.questions}
          onChange={(value) => handleChange("correctAnswers", value)}
          style={{ width: "100%" }}
        />
      </Form.Item>

      <Form.Item label="Tópico">
        <Input onChange={(e) => handleChange("topic", e.target.value)} />
      </Form.Item>

      <Form.Item label="Anotações">
        <Input.TextArea 
          onChange={(e) => handleChange("notes", e.target.value)}
          rows={4}
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Adicionar Registro
        </Button>
      </Form.Item>
    </Form>
  );
}
