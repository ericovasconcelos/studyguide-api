import React from 'react';
import { Card } from 'antd';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { formatMinutesToHoursMinutes } from '../../../utils/timeUtils';
import { StudyMetrics } from '../types';

interface StudyTimeChartProps {
  subjectPerformance: StudyMetrics['subjectPerformance'];
  colors: string[];
}

const StudyTimeChart: React.FC<StudyTimeChartProps> = ({ subjectPerformance, colors }) => {
  const chartData = Object.entries(subjectPerformance).map(([subject, data]) => ({
    subject,
    timeSpent: data.timeSpent
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const timeSpent = formatMinutesToHoursMinutes(payload[0].value);
      return (
        <div className="custom-tooltip" style={{ 
          backgroundColor: '#fff', 
          padding: '10px', 
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <p style={{ margin: 0 }}><strong>{label}</strong></p>
          <p style={{ margin: 0 }}>Tempo de estudo: {timeSpent}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card 
      title="Distribuição do Tempo por Matéria" 
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
              tickFormatter={(value) => `${Math.floor(value / 60)}h`}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="timeSpent" 
              name="Tempo de Estudo"
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

export default StudyTimeChart; 