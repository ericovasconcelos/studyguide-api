import React from "react";
import { Table, Tag, Progress, Tooltip } from "antd";
import { formatMinutesToHoursMinutes } from "../../utils/timeUtils";

function StudyTable({ 
  data = [], 
  loading = false,
  uniqueSubjects = [],
  pagination = false,
}) {
  // Colunas da tabela
  const columns = [
    { 
      title: "Data", 
      dataIndex: "date", 
      key: "date",
      render: (text) => new Date(text).toLocaleDateString('pt-BR'),
      sorter: (a, b) => new Date(a.date) - new Date(b.date)
    },
    { 
      title: "Disciplina", 
      dataIndex: "subject", 
      key: "subject",
      render: (text) => <Tag color="blue">{text}</Tag>,
      filters: uniqueSubjects.map(subject => ({ text: subject, value: subject })),
      onFilter: (value, record) => record.subject === value
    },
    { 
      title: "Tipo", 
      dataIndex: "source", 
      key: "source",
      render: (text) => {
        let color = 'default';
        switch(text) {
          case 'Teoria': color = 'purple'; break;
          case 'Exercícios': color = 'green'; break;
          case 'Revisão': color = 'orange'; break;
          case 'Simulado': color = 'red'; break;
          case 'Gran Cursos': color = 'blue'; break;
          default: color = 'default';
        }
        return <Tag color={color}>{text || 'Outros'}</Tag>;
      },
      filters: [
        { text: 'Teoria', value: 'Teoria' },
        { text: 'Exercícios', value: 'Exercícios' },
        { text: 'Revisão', value: 'Revisão' },
        { text: 'Simulado', value: 'Simulado' },
        { text: 'Gran Cursos', value: 'Gran Cursos' },
        { text: 'Outros', value: 'Outros' }
      ],
      onFilter: (value, record) => record.source === value
    },
    { 
      title: "Tempo", 
      dataIndex: "timeSpent", 
      key: "timeSpent",
      render: (minutes) => formatMinutesToHoursMinutes(minutes),
      sorter: (a, b) => (a.timeSpent || 0) - (b.timeSpent || 0)
    },
    { 
      title: "Questões", 
      dataIndex: "questions", 
      key: "questions",
      sorter: (a, b) => (a.questions || 0) - (b.questions || 0)
    },
    { 
      title: "Acertos", 
      dataIndex: "correctAnswers", 
      key: "correctAnswers",
      render: (text, record) => {
        if (!text || !record.questions) return text || 0;
        const percentage = Math.round((text / record.questions) * 100);
        return (
          <Tooltip title={`${percentage}% de acerto`}>
            <span>{text} <Progress type="circle" percent={percentage} width={20} /></span>
          </Tooltip>
        );
      },
      sorter: (a, b) => (a.correctAnswers || 0) - (b.correctAnswers || 0)
    },
    { 
      title: "Tópico", 
      dataIndex: "topic", 
      key: "topic",
      render: (text) => text && <Tag>{text}</Tag>
    },
    {
      title: "Notas",
      dataIndex: "notes",
      key: "notes",
      render: (text) => text && (
        <Tooltip title={text}>
          <span>📝</span>
        </Tooltip>
      )
    }
  ];

  return (
    <Table
      dataSource={data}
      columns={columns}
      loading={loading}
      rowKey={(record) => record.id}
      pagination={pagination ? { pageSize: 10 } : false}
    />
  );
}

export default StudyTable;