import React from 'react';
import { Card, List, Typography, Space } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { formatMinutesToHoursMinutes } from '../../utils/timeUtils';

const { Text, Title } = Typography;

const WeeklyStudyPanel = ({ studyRecords = [] }) => {
  const getWeeklyData = () => {
    if (!Array.isArray(studyRecords)) {
      return [];
    }

    return studyRecords.reduce((acc, record) => {
      const date = new Date(record.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekKey = weekStart.toISOString();
      
      if (!acc[weekKey]) {
        acc[weekKey] = {
          startDate: weekStart,
          endDate: weekEnd,
          totalMinutes: 0
        };
      }
      
      acc[weekKey].totalMinutes += record.duration;
      return acc;
    }, {});
  };

  const weeklyData = Object.values(getWeeklyData())
    .sort((a, b) => b.startDate - a.startDate);

  return (
    <Card 
      title={<Title level={4} style={{ margin: 0 }}>Total de Horas por Semana</Title>}
      style={{ height: '100%' }}
    >
      <List
        dataSource={weeklyData}
        renderItem={week => (
          <List.Item>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>
                {week.startDate.toLocaleDateString()} - {week.endDate.toLocaleDateString()}
              </Text>
              <Space>
                <ClockCircleOutlined />
                <Text>{formatMinutesToHoursMinutes(week.totalMinutes)}</Text>
              </Space>
            </Space>
          </List.Item>
        )}
      />
    </Card>
  );
};

export default WeeklyStudyPanel;