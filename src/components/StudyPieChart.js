import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A569BD", "#DC7633"];

export default function StudyPieChart({ studyCycle }) {
  const subjectData = studyCycle.map((item) => ({ name: item.subject, value: item.time }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={subjectData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label>
          {subjectData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
