import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Mail, 
  Send, 
  Clock, 
  CheckCircle,
  AtSign
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../../components/dashboard/StatCard';
import DateRangePicker from '../../components/dashboard/DateRangePicker';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { de } from 'date-fns/locale';

interface DashboardStats {
  totalContacts: number;
  emailAccounts: number;
  sentEmails: number;
  openedEmails: number;
  openRate: number;
  activeCampaigns: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<{start: Date | null, end: Date | null}>({
    start: subDays(new Date(), 7),
    end: new Date()
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalContacts: 0,
    emailAccounts: 0,
    sentEmails: 0,
    openedEmails: 0,
    openRate: 0,
    activeCampaigns: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && dateRange.start && dateRange.end) {
      fetchDashboardData();
    }
  }, [user, dateRange]);

  const fetchDashboardData = async () => {
    if (!dateRange.start || !dateRange.end || !user) return;
    
    try {
      setLoading(true);
      
      // Use Promise.all to fetch data in parallel
      const [
        groupsResponse,
        accountsResponse,
        campaignsResponse
      ] = await Promise.all([
        // Fetch lead groups
        supabase
          .from('lead_groups')
          .select('id')
          .eq('user_id', user.id)
          .eq('archived', false),
        
        // Fetch email accounts
        supabase
          .from('email_accounts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        // Fetch active campaigns
        supabase
          .from('campaigns')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['scheduled', 'running'])
      ]);

      if (groupsResponse.error) throw groupsResponse.error;
      if (accountsResponse.error) throw accountsResponse.error;
      if (campaignsResponse.error) throw campaignsResponse.error;

      const groups = groupsResponse.data || [];
      
      // Only fetch contacts if we have groups
      let contactsCount = 0;
      if (groups.length > 0) {
        const contactsResponse = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .in('group_id', groups.map(g => g.id) || []);
          
        if (contactsResponse.error) throw contactsResponse.error;
        contactsCount = contactsResponse.count || 0;
      }

      // Fetch email stats only if needed
      let emailStats: any[] = [];
      if (groups.length > 0) {
        const emailStatsResponse = await supabase
          .from('campaign_emails')
          .select(`
            id,
            status,
            sent_at,
            opened_at,
            clicked_at,
            campaign_id,
            campaigns!inner(user_id)
          `)
          .eq('campaigns.user_id', user.id)
          .gte('sent_at', dateRange.start.toISOString())
          .lte('sent_at', new Date(dateRange.end.getTime() + 86400000).toISOString());
          
        if (emailStatsResponse.error) throw emailStatsResponse.error;
        emailStats = emailStatsResponse.data || [];
      }

      // Process email stats
      const sentEmails = emailStats.length;
      const openedEmails = emailStats.filter(email => email.opened_at).length;
      const clickedEmails = emailStats.filter(email => email.clicked_at).length;
      
      const openRate = sentEmails > 0 ? Math.round((openedEmails / sentEmails) * 100) : 0;

      // Generate chart data for each day in the date range
      const days = eachDayOfInterval({
        start: dateRange.start,
        end: dateRange.end
      });

      const dailyData = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayEmails = emailStats.filter(email => 
          email.sent_at && email.sent_at.startsWith(dayStr)
        );
        
        return {
          name: format(day, 'EEE', { locale: de }),
          gesendet: dayEmails.length,
          geöffnet: dayEmails.filter(email => email.opened_at).length,
          angeklickt: dayEmails.filter(email => email.clicked_at).length
        };
      });

      setStats({
        totalContacts: contactsCount,
        emailAccounts: accountsResponse.count ?? 0,
        sentEmails,
        openedEmails,
        openRate,
        activeCampaigns: campaignsResponse.count ?? 0
      });

      setChartData(dailyData);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Fehler beim Laden der Dashboard-Daten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setDateRange({ start, end });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Willkommen zurück 👋</h1>
          <p className="text-gray-600 mt-1">Hier ist ein Überblick über Ihre E-Mail-Kampagnen</p>
        </div>
        <div className="mt-4 md:mt-0">
          <DateRangePicker onChange={handleDateRangeChange} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Kontakte" 
          value={stats.totalContacts.toString()} 
          icon={<Users size={24} className="text-secondary-500" />} 
        />
        <StatCard 
          title="E-Mail Accounts" 
          value={stats.emailAccounts.toString()} 
          icon={<AtSign size={24} className="text-blue-500" />} 
        />
        <StatCard 
          title="Gesendete E-Mails" 
          value={stats.sentEmails.toString()} 
          icon={<Send size={24} className="text-primary-500" />} 
        />
        <StatCard 
          title="Geöffnete E-Mails" 
          value={stats.openedEmails.toString()} 
          icon={<CheckCircle size={24} className="text-green-500" />} 
          description={`${stats.openRate}% der gesendeten E-Mails`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* E-Mail-Statistiken */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">E-Mail-Aktivität</h2>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500"></div>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="gesendet" fill="#2196f3" name="Gesendet" />
                  <Bar dataKey="geöffnet" fill="#4caf50" name="Geöffnet" />
                  <Bar dataKey="angeklickt" fill="#ff9800" name="Angeklickt" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* E-Mail-Statistiken Tabelle */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">E-Mail-Statistiken</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-secondary-500 mr-2"></div>
                <span className="text-sm text-gray-600">Erfolgreich gesendet</span>
              </div>
              <span className="font-medium">{stats.sentEmails}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
                <span className="text-sm text-gray-600">Fehlgeschlagen</span>
              </div>
              <span className="font-medium">0</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm text-gray-600">Geöffnet</span>
              </div>
              <span className="font-medium">{stats.openedEmails}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-primary-500 mr-2"></div>
                <span className="text-sm text-gray-600">Angeklickt</span>
              </div>
              <span className="font-medium">
                {chartData.reduce((sum, day) => sum + day.angeklickt, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Kampagnen */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Aktuelle Kampagnen</h2>
          <span className="text-sm text-gray-500">{stats.activeCampaigns} Kampagne{stats.activeCampaigns !== 1 ? 'n' : ''} aktiv</span>
        </div>
        {loading ? (
          <div className="py-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500"></div>
          </div>
        ) : stats.activeCampaigns === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">Keine aktiven Kampagnen vorhanden.</p>
          </div>
        ) : (
          <div className="border rounded-md p-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium">Aktive Kampagne</h3>
              <p className="text-sm text-gray-500">Läuft seit {format(new Date(), 'dd.MM.yyyy')}</p>
            </div>
            <button className="btn btn-secondary text-sm">Details</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
