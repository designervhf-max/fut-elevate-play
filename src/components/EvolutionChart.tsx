import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Loader2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EvolutionChartProps {
  userId: string;
}

type ChartData = {
  date: string;
  overall: number;
  attack: number;
  defense: number;
  skill: number;
  strength: number;
};

type AttributeKey = 'overall' | 'attack' | 'defense' | 'skill' | 'strength';

const ATTRIBUTES: { key: AttributeKey; label: string; color: string }[] = [
  { key: 'overall', label: 'OVR', color: 'hsl(var(--primary))' },
  { key: 'attack', label: 'ATA', color: '#22c55e' },
  { key: 'defense', label: 'DEF', color: '#3b82f6' },
  { key: 'skill', label: 'HAB', color: '#a855f7' },
  { key: 'strength', label: 'FOR', color: '#f59e0b' },
];

const EvolutionChart = ({ userId }: EvolutionChartProps) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttribute, setSelectedAttribute] = useState<AttributeKey>('overall');

  useEffect(() => {
    const fetchEvolution = async () => {
      const { data: history, error } = await supabase
        .from('rating_history')
        .select('created_at, overall_after, attack_after, defense_after, skill_after, strength_after')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (!error && history) {
        const chartData: ChartData[] = history.map((entry) => ({
          date: new Date(entry.created_at || '').toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
          }),
          overall: entry.overall_after,
          attack: entry.attack_after,
          defense: entry.defense_after,
          skill: entry.skill_after,
          strength: entry.strength_after,
        }));
        setData(chartData);
      }
      setLoading(false);
    };

    fetchEvolution();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhum dado de evolução ainda</p>
        <p className="text-sm mt-1">Participe de jogos para ver sua evolução</p>
      </div>
    );
  }

  const selectedAttr = ATTRIBUTES.find(a => a.key === selectedAttribute)!;
  const latestValue = data[data.length - 1]?.[selectedAttribute] || 0;
  const firstValue = data[0]?.[selectedAttribute] || 0;
  const totalChange = latestValue - firstValue;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-display tracking-wider text-muted-foreground uppercase">
          Evolução
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {totalChange >= 0 ? '+' : ''}{totalChange} pts
          </span>
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: selectedAttr.color }}
          />
        </div>
      </div>

      {/* Attribute Selector */}
      <div className="flex gap-1 flex-wrap">
        {ATTRIBUTES.map((attr) => (
          <Button
            key={attr.key}
            variant={selectedAttribute === attr.key ? 'sport' : 'outline'}
            size="sm"
            onClick={() => setSelectedAttribute(attr.key)}
            className="text-xs px-2 py-1 h-7"
          >
            {attr.label}
          </Button>
        ))}
      </div>

      {/* Chart */}
      <div className="fifa-card p-4">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
            />
            <YAxis 
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Line
              type="monotone"
              dataKey={selectedAttribute}
              stroke={selectedAttr.color}
              strokeWidth={2}
              dot={{ fill: selectedAttr.color, strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: selectedAttr.color }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EvolutionChart;
