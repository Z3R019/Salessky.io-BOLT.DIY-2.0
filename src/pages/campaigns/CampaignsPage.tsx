import React, { useState, useEffect } from 'react';
import { Plus, Mail, Calendar, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'running' | 'completed';
  recipients: number;
  sentEmails: number;
  openRate: number;
  clickRate: number;
  createdAt: string;
  scheduledFor?: string;
}

const CampaignsPage: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCampaigns();
    }
  }, [user]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          id, 
          name, 
          status, 
          scheduled_for, 
          created_at,
          group_id,
          lead_groups!inner(id),
          campaign_emails!inner(id, status, opened_at, clicked_at)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Process and format the campaign data
      const formattedCampaigns = data?.map(campaign => {
        const emails = campaign.campaign_emails || [];
        const totalEmails = emails.length;
        const sentEmails = emails.filter(email => email.status === 'sent').length;
        const openedEmails = emails.filter(email => email.opened_at).length;
        const clickedEmails = emails.filter(email => email.clicked_at).length;
        
        const openRate = totalEmails > 0 ? Math.round((openedEmails / totalEmails) * 100) : 0;
        const clickRate = totalEmails > 0 ? Math.round((clickedEmails / totalEmails) * 100) : 0;

        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status as 'draft' | 'scheduled' | 'running' | 'completed',
          recipients: totalEmails,
          sentEmails,
          openRate,
          clickRate,
          createdAt: format(new Date(campaign.created_at), 'dd.MM.yyyy'),
          scheduledFor: campaign.scheduled_for 
            ? format(new Date(campaign.scheduled_for), 'dd.MM.yyyy')
            : undefined,
        };
      }) || [];

      setCampaigns(formattedCampaigns);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Fehler beim Laden der Kampagnen.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Campaign['status']) => {
    switch (status) {
      case 'draft':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Entwurf</span>;
      case 'scheduled':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Geplant</span>;
      case 'running':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Läuft</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Abgeschlossen</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Kampagnen</h1>
          <p className="text-gray-600 mt-1">Erstellen und verwalten Sie Ihre E-Mail-Kampagnen</p>
        </div>
        <Link to="/campaigns/new" className="btn btn-primary flex items-center">
          <Plus size={18} className="mr-2" />
          Neue Kampagne
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Campaigns List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Meine Kampagnen</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Daten werden geladen...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-700">Keine Kampagnen vorhanden</h3>
            <p className="mt-1 text-sm text-gray-500">Erstellen Sie Ihre erste Kampagne, um zu beginnen.</p>
            <div className="mt-6">
              <Link to="/campaigns/new" className="btn btn-primary">
                Erste Kampagne erstellen
              </Link>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empfänger
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Öffnungsrate
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Klickrate
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Erstellt am
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{campaign.name}</div>
                      {campaign.scheduledFor && (
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <Calendar size={12} className="mr-1" />
                          Geplant für {campaign.scheduledFor}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(campaign.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users size={16} className="text-gray-400 mr-2" />
                        <span>{campaign.recipients}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{campaign.openRate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{campaign.clickRate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{campaign.createdAt}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/campaigns/${campaign.id}`}
                        className="text-secondary-600 hover:text-secondary-900 flex items-center justify-end"
                      >
                        Details
                        <ArrowRight size={16} className="ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignsPage;
