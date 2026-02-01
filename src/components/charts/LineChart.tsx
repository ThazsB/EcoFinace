import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface LineChartData {
  month: string;
  income: number;
  expense: number;
}

interface LineChartProps {
  data: LineChartData[];
}

export function LineChart({ data }: LineChartProps) {
  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'Receitas',
        data: data.map(item => item.income),
        borderColor: '#34d399',
        tension: 0.4,
        backgroundColor: 'transparent',
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#34d399',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Despesas',
        data: data.map(item => item.expense),
        borderColor: '#F4A261',
        tension: 0.4,
        backgroundColor: 'transparent',
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#F4A261',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#D1D5DB',
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: R$ ${value.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        grid: {
          color: '#333',
          drawBorder: false,
        },
        ticks: {
          color: '#9CA3AF',
          callback: function (value: any) {
            return 'R$ ' + value.toLocaleString();
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9CA3AF',
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
}
