import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UsageStatsProps {
  plan: string;
  usedLeads: number;
  maxLeads: number;
  usedCampaigns: number;
  maxCampaigns: number;
}

const UsageStats: React.FC<UsageStatsProps> = ({
  plan,
  usedLeads,
  maxLeads,
  usedCampaigns,
  maxCampaigns
}) => {
  const leadsPercentage = maxLeads === Infinity ? 0 : Math.min(100, Math.round((usedLeads / maxLeads) * 100));
  const campaignsPercentage = maxCampaigns === Infinity ? 0 : Math.min(100, Math.round((usedCampaigns / maxCampaigns) * 100));

  const data = [
    {
      name: 'Leads',
      used: usedLeads,
      max: maxLeads === Infinity ? 'Unbegrenzt' : maxLeads,
      percentage: leadsPercentage
    },
    {
      name: 'Kampagnen',
      used: usedCampaigns,
      max: maxCampaigns === Infinity ? 'Unbegrenzt' : maxCampaigns,
      percentage: campaignsPercentage
    }
  ];

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('de-DE').format(num);
  };

  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-base font-medium mb-4">Nutzungsstatistik</h3>
      
      <div className="space-y-4">
        {/* Leads Usage */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Leads</span>
            <span className="text-sm text-gray-500">
              {formatNumber(usedLeads)} / {maxLeads === Infinity ? 'Unbegrenzt' : formatNumber(maxLeads)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-secondary-500 h-2.5 rounded-full" 
              style={{ width: `${leadsPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Campaigns Usage */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Kampagnen</span>
            <span className="text-sm text-gray-500">
              {usedCampaigns} / {maxCampaigns === Infinity ? 'Unbegrenzt' : maxCampaigns}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-primary-500 h-2.5 rounded-full" 
              style={{ width: `${campaignsPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value, name, props) => {
                if (name === 'used') {
                  return [formatNumber(value as number), 'Genutzt'];
                }
                return [value, name];
              }}
            />
            <Bar 
              dataKey="used" 
              fill="#2196f3" 
              name="Genutzt" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default UsageStats;
