import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, MapPin, Clock, Navigation, TrendingUp, AlertTriangle } from 'lucide-react';

interface POI {
  id: string;
  name: string;
  address: string;
  is_default: boolean;
  latitude: string;
  longitude: string;
}

interface POIWithTraffic extends POI {
  traffic: {
    commute_time_minutes: number;
    traffic_level: 'low' | 'moderate' | 'heavy' | 'severe';
    last_updated: string;
  } | null;
}

export function TrafficStatusPage() {
  const navigate = useNavigate();
  const [pois, setPois] = useState<POIWithTraffic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrafficData();
    const interval = setInterval(fetchTrafficData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTrafficData = async () => {
    const { data: poisData } = await supabase
      .from('pois')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name');

    const { data: trafficData } = await supabase
      .from('poi_traffic')
      .select('*');

    if (poisData && trafficData) {
      const combined = poisData.map((poi) => {
        const traffic = trafficData.find((t) => t.poi_id === poi.id);
        return {
          ...poi,
          traffic: traffic || null,
        };
      });
      setPois(combined);
    }
    setLoading(false);
  };

  const getTrafficColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'heavy':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'severe':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-slate-100 border-slate-300 text-slate-800';
    }
  };

  const getTrafficIcon = (level: string) => {
    switch (level) {
      case 'low':
        return <TrendingUp className="text-green-600" size={20} />;
      case 'moderate':
        return <Clock className="text-yellow-600" size={20} />;
      case 'heavy':
        return <AlertTriangle className="text-orange-600" size={20} />;
      case 'severe':
        return <AlertTriangle className="text-red-600" size={20} />;
      default:
        return <Navigation className="text-slate-600" size={20} />;
    }
  };

  const getTrafficBadge = (level: string) => {
    switch (level) {
      case 'low':
        return { text: 'Light Traffic', color: 'bg-green-500' };
      case 'moderate':
        return { text: 'Moderate Traffic', color: 'bg-yellow-500' };
      case 'heavy':
        return { text: 'Heavy Traffic', color: 'bg-orange-500' };
      case 'severe':
        return { text: 'Severe Congestion', color: 'bg-red-500' };
      default:
        return { text: 'Unknown', color: 'bg-slate-500' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white shadow-xl">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 mb-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all backdrop-blur-sm"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>

          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2">Traffic Status</h1>
            <p className="text-blue-100">Real-time traffic conditions and ETA to popular destinations</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Live Traffic Updates</span>
          </h2>

          <div className="space-y-3">
            {pois.map((poi) => {
              const badge = poi.traffic ? getTrafficBadge(poi.traffic.traffic_level) : { text: 'No Data', color: 'bg-slate-500' };
              return (
                <div
                  key={poi.id}
                  className={`rounded-xl border-2 p-4 transition-all hover:shadow-lg ${
                    poi.traffic ? getTrafficColor(poi.traffic.traffic_level) : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-white/80 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="text-blue-600" size={20} />
                      </div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-bold">{poi.name}:</h3>
                        {poi.traffic ? (
                          <>
                            <span className="text-lg font-bold">{poi.traffic.commute_time_minutes} min</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${badge.color} text-white`}>
                              {badge.text}
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-500">No data available</span>
                        )}
                      </div>
                    </div>
                    {poi.traffic && getTrafficIcon(poi.traffic.traffic_level)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl">
          <h3 className="font-bold text-blue-900 mb-3 text-lg">Traffic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
              <div>
                <span className="font-semibold">Light Traffic:</span> Smooth flow, minimal delays
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mt-1"></div>
              <div>
                <span className="font-semibold">Moderate Traffic:</span> Some slowdowns expected
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full mt-1"></div>
              <div>
                <span className="font-semibold">Heavy Traffic:</span> Significant delays likely
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full mt-1"></div>
              <div>
                <span className="font-semibold">Severe Congestion:</span> Major delays, consider alternatives
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200 text-xs text-blue-700">
            <span className="font-semibold">Live Updates:</span> Data refreshes every 30 seconds · ETA calculated from university location
          </div>
        </div>
      </div>
    </div>
  );
}
