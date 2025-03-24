import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import SpeechControls from './SpeechControls';

const SeverityDistributionChart = ({ data }) => {
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.1;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="#1F2937" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  // Filter out items with zero value
  const filteredData = data.filter(item => item.value > 0);
  
  // Calculate total
  const total = filteredData.reduce((sum, item) => sum + item.value, 0);
  
  // Prepare speech segments
  const speechSegments = [
    {
      title: '圖表概覽',
      text: `問題嚴重性分布圖顯示了不同嚴重程度問題的分布比例，總共有${total}個問題。`,
      type: 'heading'
    },
    ...filteredData.map(item => ({
      title: `${item.name} - ${((item.value / total) * 100).toFixed(1)}%`,
      text: `${item.name}問題佔比${((item.value / total) * 100).toFixed(1)}%，總共有${item.value}個問題。`,
      type: item.name === '嚴重' ? 'stat' : 'detail'
    })),
    {
      title: '總結',
      text: `總結來說，${filteredData[0]?.name || ''}問題佔了最大比例，需要優先解決。`,
      type: 'heading'
    }
  ];

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h2 className="chart-title">問題嚴重性分布</h2>
        <SpeechControls 
          segments={speechSegments}
          title="嚴重性分布語音導覽"
        />
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} 個問題`, '數量']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SeverityDistributionChart;