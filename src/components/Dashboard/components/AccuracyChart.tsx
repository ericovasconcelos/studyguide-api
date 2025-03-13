import React from 'react';
import { Card } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { StudyMetrics } from '../types';

interface AccuracyChartProps {
  subjectPerformance: StudyMetrics['subjectPerformance'];
  colors: string[];
}

const AccuracyChart: React.FC<AccuracyChartProps> = ({ subjectPerformance, colors }) => {
  const chartData = Object.entries(subjectPerformance)
    .filter(([_, data]) => data.questions > 0)
    .map(([subject, data]) => ({
      subject,
      accuracy: data.accuracy,
      questions: data.questions,
      correctAnswers: data.correctAnswers
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip" style={{ 
          backgroundColor: '#fff', 
          padding: '10px', 
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <p style={{ margin: 0 }}><strong>{label}</strong></p>
          <p style={{ margin: 0 }}>Taxa de acerto: {Math.round(data.accuracy)}%</p>
          <p style={{ margin: 0 }}>Questões corretas: {data.correctAnswers} de {data.questions}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card 
      title="Taxa de Acerto por Matéria" 
      className="shadow-sm"
      style={{ background: '#fff', minHeight: '400px' }}
    >
      <div style={{ height: 400, marginBottom: '20px' }}>
        <ResponsiveContainer>
          <BarChart 
            data={chartData}
            margin={{ top: 20, right: 30, left: 40, bottom: 100 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <YAxis 
              type="category"
              dataKey="subject"
              width={150}
            />
            <XAxis 
              type="number"
              tickFormatter={(value) => `${Math.round(value)}%`}
              domain={[0, 100]}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="accuracy" 
              name="Taxa de Acerto"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default AccuracyChart; 