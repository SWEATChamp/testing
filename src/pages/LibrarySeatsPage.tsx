import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, BookOpen, CheckCircle, AlertCircle, Layers, Zap } from 'lucide-react';

interface LibrarySeat {
  id: string;
  floor: number;
  zone: string;
  total_seats: number;
  available_seats: number;
  has_charging_port: boolean;
  last_updated: string;
  university_id: string;
}

export function LibrarySeatsPage() {
  const navigate = useNavigate();
  const [librarySeats, setLibrarySeats] = useState<LibrarySeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendedZone, setRecommendedZone] = useState<LibrarySeat | null>(null);

  useEffect(() => {
    fetchLibraryData();
    const interval = setInterval(fetchLibraryData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchLibraryData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('university_id')
      .eq('id', user.id)
      .single();

    if (profile) {
      const { data } = await supabase
        .from('library_seats')
        .select('*')
        .eq('university_id', profile.university_id)
        .order('floor')
        .order('zone');

      if (data) {
        setLibrarySeats(data);
        const best = data.reduce((prev, current) => {
          const prevRate = prev.available_seats / prev.total_seats;
          const currentRate = current.available_seats / current.total_seats;
          return currentRate > prevRate ? current : prev;
        });
        setRecommendedZone(best);
      }
    }
    setLoading(false);
  };

  const getAvailabilityColor = (available: number, total: number) => {
    const rate = (available / total) * 100;
    if (rate > 50) return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 text-green-900';
    if (rate > 25) return 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-400 text-yellow-900';
    if (rate > 0) return 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-400 text-orange-900';
    return 'bg-gradient-to-br from-red-50 to-rose-50 border-red-400 text-red-900';
  };

  const getAvailabilityBadge = (available: number, total: number) => {
    const rate = (available / total) * 100;
    if (rate > 50) return { text: 'Plenty Available', color: 'bg-green-500', icon: <CheckCircle size={16} /> };
    if (rate > 25) return { text: 'Moderate', color: 'bg-yellow-500', icon: <AlertCircle size={16} /> };
    if (rate > 0) return { text: 'Limited', color: 'bg-orange-500', icon: <AlertCircle size={16} /> };
    return { text: 'Full', color: 'bg-red-500', icon: <AlertCircle size={16} /> };
  };

  const groupByFloor = (seats: LibrarySeat[]) => {
    return seats.reduce((acc, seat) => {
      if (!acc[seat.floor]) acc[seat.floor] = [];
      acc[seat.floor].push(seat);
      return acc;
    }, {} as Record<number, LibrarySeat[]>);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  const floorGroups = groupByFloor(librarySeats);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6 text-white shadow-xl">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 mb-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all backdrop-blur-sm"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>

          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2">Library Seats</h1>
            <p className="text-amber-100">Find available study spaces in the library</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {recommendedZone && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-t-2xl text-white">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">Recommended Study Area</h2>
                  <p className="text-green-100">Most available seats right now</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-b-2xl shadow-xl border-x border-b border-slate-200 p-6">
              <div className={`border-3 rounded-2xl p-6 ${getAvailabilityColor(recommendedZone.available_seats, recommendedZone.total_seats)}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Layers size={28} className="opacity-70" />
                      <div>
                        <h3 className="text-2xl font-bold">{recommendedZone.zone}</h3>
                        <p className="text-sm opacity-75">Floor {recommendedZone.floor}</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-1.5 bg-gradient-to-r from-yellow-400 to-amber-400 text-yellow-900 rounded-full text-xs font-bold inline-flex items-center space-x-1">
                    <span>⭐</span>
                    <span>BEST CHOICE</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-white/50 rounded-xl">
                    <div className="text-sm font-medium opacity-75 mb-1">Available Seats</div>
                    <div className="text-4xl font-bold">{recommendedZone.available_seats}</div>
                  </div>
                  <div className="p-4 bg-white/50 rounded-xl">
                    <div className="text-sm font-medium opacity-75 mb-1">Total Capacity</div>
                    <div className="text-4xl font-bold">{recommendedZone.total_seats}</div>
                  </div>
                </div>

                {recommendedZone.has_charging_port && (
                  <div className="mb-4 p-3 bg-white/50 rounded-xl flex items-center space-x-2">
                    <Zap className="text-amber-600" size={20} />
                    <span className="font-semibold">Charging ports available</span>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                  <span className="font-semibold">Occupancy Rate</span>
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-32 bg-white/70 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${((recommendedZone.total_seats - recommendedZone.available_seats) / recommendedZone.total_seats) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xl font-bold">
                      {Math.round(((recommendedZone.total_seats - recommendedZone.available_seats) / recommendedZone.total_seats) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center space-x-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <span>All Library Zones</span>
          </h2>

          <div className="space-y-6">
            {Object.entries(floorGroups).map(([floor, zones]) => (
              <div key={floor} className="border-2 border-slate-200 rounded-xl p-5 bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
                  <Layers className="text-amber-600" size={20} />
                  <span>Floor {floor}</span>
                  <span className="text-sm text-slate-500 font-normal">({zones.length} zones)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {zones.map((zone) => {
                    const badge = getAvailabilityBadge(zone.available_seats, zone.total_seats);
                    const occupancyRate = ((zone.total_seats - zone.available_seats) / zone.total_seats) * 100;

                    return (
                      <div
                        key={zone.id}
                        className={`border-2 rounded-2xl p-5 transition-all hover:shadow-lg ${getAvailabilityColor(zone.available_seats, zone.total_seats)}`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-bold">{zone.zone}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.color} text-white flex items-center space-x-1`}>
                            {badge.icon}
                            <span>{badge.text}</span>
                          </span>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Available</span>
                            <span className="text-3xl font-bold">{zone.available_seats}</span>
                          </div>

                          <div className="flex justify-between items-center text-sm">
                            <span className="font-medium opacity-75">Total Seats</span>
                            <span className="font-bold">{zone.total_seats}</span>
                          </div>

                          {zone.has_charging_port && (
                            <div className="flex items-center space-x-2 text-sm pt-2">
                              <Zap className="text-amber-600" size={16} />
                              <span className="font-medium">Charging available</span>
                            </div>
                          )}

                          <div className="pt-3 border-t border-current/20">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-medium">Occupancy</span>
                              <span className="text-lg font-bold">{Math.round(occupancyRate)}%</span>
                            </div>
                            <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${badge.color} transition-all duration-500`}
                                style={{ width: `${occupancyRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="text-xs opacity-70 text-center pt-3 border-t border-current/20">
                          Updated: {new Date(zone.last_updated).toLocaleTimeString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl">
          <h3 className="font-bold text-amber-900 mb-3 text-lg">Study Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-amber-800">
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
              <span>Silent study zones are perfect for focused work and exam preparation</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
              <span>Higher floors tend to be quieter during peak hours</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
              <span>Check the recommended zone for the best seat availability</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
              <span>Real-time updates every 15 seconds ensure accurate availability</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
