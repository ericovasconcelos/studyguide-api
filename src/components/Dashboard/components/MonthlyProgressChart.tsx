import React, { useMemo } from 'react';
import { Card, Typography } from 'antd';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Study } from '../types';
import { formatMinutesToHoursMinutes } from '../../../utils/timeUtils';

const { Text } = Typography;

interface MonthlyProgressChartProps {
  studyRecords: Study[];
}

const MonthlyProgressChart: React.FC<MonthlyProgressChartProps> = ({ studyRecords }) => {
  const monthlyData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Função para obter o último dia do mês
    const getLastDayOfMonth = (year: number, month: number) => {
      return new Date(year, month + 1, 0).getDate();
    };

    // Função para calcular dados acumulados do mês
    const calculateMonthData = (year: number, month: number, limitDay?: number) => {
      const daysInMonth = getLastDayOfMonth(year, month);
      const daysToProcess = limitDay ? Math.min(limitDay, daysInMonth) : daysInMonth;
      let accumulatedTime = 0;
      
      // Garantir que sempre comece do dia 1 com 0 horas
      const monthData = [{
        day: 1,
        date: new Date(year, month, 1).toISOString().split('T')[0],
        dayTime: 0,
        accumulatedTime: 0
      }];
      
      for (let i = 0; i < daysToProcess; i++) {
        const day = i + 1;
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayRecords = studyRecords.filter(r => r.date.startsWith(dateStr));
        const dayTime = dayRecords.reduce((sum, r) => sum + r.timeSpent, 0);
        accumulatedTime += dayTime;
        
        if (day > 1) { // Pula o dia 1 que já foi adicionado
          monthData.push({
            day,
            date: dateStr,
            dayTime,
            accumulatedTime
          });
        } else { // Atualiza o dia 1 se tiver registros
          monthData[0].dayTime = dayTime;
          monthData[0].accumulatedTime = dayTime;
        }
      }
      
      return monthData;
    };

    const currentMonthData = calculateMonthData(currentYear, currentMonth, currentDay);
    const lastMonthData = calculateMonthData(lastMonthYear, lastMonth);

    // Combina os dados para o gráfico
    const maxDays = Math.max(currentMonthData.length, lastMonthData.length);
    const chartData = Array.from({ length: maxDays }, (_, i) => {
      const currentData = currentMonthData[i];
      const lastData = lastMonthData[i];
      const day = i + 1;
      
      return {
        day,
        // Para o mês atual: mostra null para dias futuros
        currentMonth: day > currentDay ? null : (currentData?.accumulatedTime ?? 0),
        currentMonthDay: day > currentDay ? null : (currentData?.dayTime ?? 0),
        // Para o mês passado: sempre substitui null por 0
        lastMonth: lastData?.accumulatedTime ?? 0,
        lastMonthDay: lastData?.dayTime ?? 0
      };
    });

    return {
      chartData,
      currentMonthTotal: currentMonthData[currentMonthData.length - 1]?.accumulatedTime || 0,
      lastMonthTotal: lastMonthData[lastMonthData.length - 1]?.accumulatedTime || 0,
      currentMonthName: now.toLocaleString('pt-BR', { month: 'long' }),
      lastMonthName: new Date(lastMonthYear, lastMonth).toLocaleString('pt-BR', { month: 'long' })
    };
  }, [studyRecords]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ 
          backgroundColor: '#fff', 
          padding: '10px', 
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <p style={{ margin: 0 }}><strong>Dia {label}</strong></p>
          {payload.map((entry: any) => {
            const isCurrentMonth = entry.dataKey === 'currentMonth';
            const monthName = isCurrentMonth ? monthlyData.currentMonthName : monthlyData.lastMonthName;
            const dayTime = isCurrentMonth ? 
              monthlyData.chartData[label - 1]?.currentMonthDay : 
              monthlyData.chartData[label - 1]?.lastMonthDay;

            return (
              <div key={entry.name}>
                <p style={{ margin: 0, color: entry.color }}>
                  {monthName}:
                </p>
                <p style={{ margin: '0 0 0 10px', color: entry.color }}>
                  Dia: {formatMinutesToHoursMinutes(dayTime || 0)}
                </p>
                <p style={{ margin: '0 0 5px 10px', color: entry.color }}>
                  Total: {formatMinutesToHoursMinutes(entry.value)}
                </p>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <Card 
      title="Progresso Mensal" 
      className="shadow-sm"
      style={{ background: '#fff', minHeight: '400px' }}
      extra={
        <div style={{ textAlign: 'right' }}>
          <Text>{monthlyData.currentMonthName}: {formatMinutesToHoursMinutes(monthlyData.currentMonthTotal)}</Text>
          <br />
          <Text type="secondary">{monthlyData.lastMonthName}: {formatMinutesToHoursMinutes(monthlyData.lastMonthTotal)}</Text>
        </div>
      }
    >
      <div style={{ height: 400, marginBottom: '20px' }}>
        <ResponsiveContainer>
          <LineChart 
            data={monthlyData.chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="day"
              type="number"
              domain={[1, 'dataMax']}
              tickCount={10}
            />
            <YAxis 
              tickFormatter={(value) => `${Math.floor(value / 60)}h`}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone"
              dataKey="currentMonth"
              name={monthlyData.currentMonthName}
              stroke="#1890ff"
              strokeWidth={2}
              dot={true}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
            <Line 
              type="monotone"
              dataKey="lastMonth"
              name={monthlyData.lastMonthName}
              stroke="#d9d9d9"
              strokeWidth={2}
              dot={true}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default MonthlyProgressChart; 