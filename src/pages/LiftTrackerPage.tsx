import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Search, Users, Clock, TrendingUp, TrendingDown, Minus, MapPin, Building2 } from 'lucide-react';

interface Lift {
  id: string;
  building: string;
  lift_id: string;
  current_floor: number;
  direction: string;
  queue_count: number;
  current_occupancy: number;
  capacity: number;
  estimated_wait_time: number;
}

interface Classroom {
  building: string;
  floor: number;
  room_number: string;
}

export function LiftTrackerPage() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [currentFloor, setCurrentFloor] = useState(1);
  const [lifts, setLifts] = useState<Lift[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<Classroom[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<Classroom | null>(null);
  const [recommendedLifts, setRecommendedLifts] = useState<(Lift & { score: number; reasoning: string })[]>([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (destination.trim()) {
      const filtered = classrooms.filter(
        (room) =>
          room.room_number.toLowerCase().includes(destination.toLowerCase()) ||
          room.building.toLowerCase().includes(destination.toLowerCase())
      );
      setSearchResults(filtered.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  }, [destination, classrooms]);

  useEffect(() => {
    if (selectedDestination) {
      updateRecommendations(selectedDestination, currentFloor);
    }
  }, [currentFloor, lifts]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('university_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.university_id) {
      setLoading(false);
      return;
    }

    const [liftsData, classroomsData] = await Promise.all([
      supabase.from('lifts').select('*').eq('university_id', profile.university_id).order('building', { ascending: true }),
      supabase.from('classrooms').select('building, floor, room_number').eq('university_id', profile.university_id).order('building', { ascending: true }),
    ]);

    if (liftsData.data) setLifts(liftsData.data);
    if (classroomsData.data) setClassrooms(classroomsData.data);
    setLoading(false);
  };

  const calculateLiftScore = (lift: Lift, targetFloor: number, targetBuilding: string, currentFloor: number) => {
    let score = 100;
    let reasoning = [];

    if (lift.building !== targetBuilding) {
      score -= 20;
      reasoning.push('Different building');
    } else {
      reasoning.push('Same building');
    }

    const floorDistance = Math.abs(lift.current_floor - currentFloor);
    score -= floorDistance * 5;
    reasoning.push(`${floorDistance} floors away`);

    const occupancyRate = (lift.current_occupancy / lift.capacity) * 100;
    if (occupancyRate > 80) {
      score -= 30;
      reasoning.push('Nearly full');
    } else if (occupancyRate > 50) {
      score -= 15;
      reasoning.push('Moderately occupied');
    } else {
      reasoning.push('Good space available');
    }

    if (lift.queue_count > 5) {
      score -= lift.queue_count * 3;
      reasoning.push(`${lift.queue_count} people waiting`);
    } else if (lift.queue_count > 0) {
      score -= lift.queue_count * 2;
      reasoning.push(`${lift.queue_count} in queue`);
    } else {
      reasoning.push('No queue');
    }

    const isGoingTowardsYou =
      (lift.direction === 'up' && lift.current_floor < currentFloor) ||
      (lift.direction === 'down' && lift.current_floor > currentFloor);

    const isGoingYourDirection =
      (lift.direction === 'up' && targetFloor > currentFloor) ||
      (lift.direction === 'down' && targetFloor < currentFloor);

    if (lift.direction === 'idle') {
      score += 15;
      reasoning.push('Idle and ready');
    } else if (isGoingTowardsYou && isGoingYourDirection) {
      score += 20;
      reasoning.push('Coming your way');
    } else if (!isGoingYourDirection) {
      score -= 10;
      reasoning.push('Wrong direction');
    }

    return { score: Math.max(0, score), reasoning: reasoning.join(', ') };
  };

  const updateRecommendations = (room: Classroom, floor: number) => {
    const scoredLifts = lifts.map((lift) => {
      const { score, reasoning } = calculateLiftScore(lift, room.floor, room.building, floor);
      return { ...lift, score, reasoning };
    });

    scoredLifts.sort((a, b) => b.score - a.score);
    setRecommendedLifts(scoredLifts.slice(0, 6));
  };

  const handleSelectDestination = (room: Classroom) => {
    setSelectedDestination(room);
    setDestination('');
    setSearchResults([]);
    updateRecommendations(room, currentFloor);
  };

  const getDirectionIcon = (direction: string) => {
    if (direction === 'up') return <TrendingUp className="text-green-600" size={20} />;
    if (direction === 'down') return <TrendingDown className="text-blue-600" size={20} />;
    return <Minus className="text-slate-400" size={20} />;
  };

  const getOccupancyColor = (occupancy: number, capacity: number) => {
    const rate = (occupancy / capacity) * 100;
    if (rate > 80) return 'text-red-600';
    if (rate > 50) return 'text-orange-600';
    return 'text-green-600';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 text-green-900';
    if (score >= 60) return 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-400 text-blue-900';
    if (score >= 40) return 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-400 text-orange-900';
    return 'bg-gradient-to-br from-red-50 to-rose-50 border-red-400 text-red-900';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { text: 'Excellent', color: 'bg-green-500' };
    if (score >= 60) return { text: 'Good', color: 'bg-blue-500' };
    if (score >= 40) return { text: 'Fair', color: 'bg-orange-500' };
    return { text: 'Poor', color: 'bg-red-500' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-white shadow-xl">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 mb-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all backdrop-blur-sm"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>

          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2">Smart Lift Recommender</h1>
            <p className="text-teal-100">Find the optimal lift for your journey with AI-powered recommendations</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 relative">
              <label className="block text-sm font-semibold text-white/90 mb-2">Destination</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={20} />
                <input
                  type="text"
                  placeholder="Search for classroom or location..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:bg-white/25 focus:border-white/50 transition-all"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-72 overflow-y-auto z-20">
                  {searchResults.map((room, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectDestination(room)}
                      className="w-full px-4 py-3.5 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                          <MapPin className="text-teal-600" size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{room.room_number}</div>
                          <div className="text-sm text-slate-600 flex items-center space-x-2">
                            <Building2 size={14} />
                            <span>{room.building} · Floor {room.floor}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-white/90 mb-2">Your Current Floor</label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentFloor(Math.max(1, currentFloor - 1))}
                  className="w-12 h-12 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white font-bold hover:bg-white/25 transition-all"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={currentFloor}
                  onChange={(e) => setCurrentFloor(parseInt(e.target.value) || 1)}
                  className="flex-1 px-4 py-3.5 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white text-center text-lg font-bold focus:outline-none focus:bg-white/25 focus:border-white/50 transition-all"
                />
                <button
                  onClick={() => setCurrentFloor(Math.min(20, currentFloor + 1))}
                  className="w-12 h-12 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white font-bold hover:bg-white/25 transition-all"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {recommendedLifts.length > 0 && selectedDestination && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 rounded-t-2xl text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Recommended Lifts</h2>
                  <p className="text-teal-100">
                    Going to <span className="font-semibold">{selectedDestination.room_number}</span> · Floor {selectedDestination.floor} · {selectedDestination.building}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-teal-100">From Floor</div>
                  <div className="text-3xl font-bold">{currentFloor}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-b-2xl shadow-xl border-x border-b border-slate-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedLifts.map((lift, index) => {
                  const badge = getScoreBadge(lift.score);
                  return (
                    <div
                      key={lift.id}
                      className={`border-3 rounded-2xl p-5 transition-all hover:shadow-lg ${getScoreColor(lift.score)} ${
                        index === 0 ? 'ring-4 ring-yellow-400 ring-opacity-50 scale-105' : ''
                      }`}
                    >
                      {index === 0 && (
                        <div className="mb-3 px-4 py-1.5 bg-gradient-to-r from-yellow-400 to-amber-400 text-yellow-900 rounded-full text-xs font-bold inline-flex items-center space-x-1">
                          <span>⭐</span>
                          <span>BEST CHOICE</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold">{lift.lift_id}</h3>
                        <div className="flex items-center space-x-2">
                          {getDirectionIcon(lift.direction)}
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.color} text-white`}>
                            {badge.text}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">Current Floor</span>
                          <span className="text-xl font-bold">Floor {lift.current_floor}</span>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium flex items-center space-x-1">
                            <Users size={14} />
                            <span>Occupancy</span>
                          </span>
                          <span className={`font-bold ${getOccupancyColor(lift.current_occupancy, lift.capacity)}`}>
                            {lift.current_occupancy}/{lift.capacity}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">Queue Length</span>
                          <span className="font-bold">
                            {lift.queue_count === 0 ? 'None' : `${lift.queue_count} waiting`}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium flex items-center space-x-1">
                            <Clock size={14} />
                            <span>Est. Wait</span>
                          </span>
                          <span className="font-bold">{lift.estimated_wait_time}s</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t-2 border-current/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold">Score</span>
                          <div className="flex items-center space-x-2">
                            <div className="h-2 w-20 bg-white/50 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${badge.color} transition-all duration-500`}
                                style={{ width: `${lift.score}%` }}
                              ></div>
                            </div>
                            <span className="text-2xl font-bold">{lift.score}</span>
                          </div>
                        </div>
                        <p className="text-xs opacity-75 italic">{lift.reasoning}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Status - All Lifts</span>
          </h2>

          <div className="space-y-4">
            {Object.entries(
              lifts.reduce((acc, lift) => {
                if (!acc[lift.building]) acc[lift.building] = [];
                acc[lift.building].push(lift);
                return acc;
              }, {} as Record<string, Lift[]>)
            ).map(([building, buildingLifts]) => (
              <div key={building} className="border-2 border-slate-200 rounded-xl p-5 bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
                  <Building2 className="text-teal-600" size={20} />
                  <span>{building}</span>
                  <span className="text-sm text-slate-500 font-normal">({buildingLifts.length} lifts)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {buildingLifts.map((lift) => (
                    <div key={lift.id} className="bg-white rounded-xl p-4 border-2 border-slate-200 hover:border-teal-300 transition-all hover:shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-slate-800 text-lg">{lift.lift_id}</h4>
                        {getDirectionIcon(lift.direction)}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Floor</span>
                          <span className="font-bold text-slate-800">{lift.current_floor}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 flex items-center space-x-1">
                            <Users size={14} />
                            <span>Inside</span>
                          </span>
                          <span className={`font-bold ${getOccupancyColor(lift.current_occupancy, lift.capacity)}`}>
                            {lift.current_occupancy}/{lift.capacity}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Queue</span>
                          <span className="font-bold text-slate-800">{lift.queue_count}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 flex items-center space-x-1">
                            <Clock size={14} />
                            <span>Wait</span>
                          </span>
                          <span className="font-bold text-slate-800">{lift.estimated_wait_time}s</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl">
          <h3 className="font-bold text-blue-900 mb-3 text-lg">How Our Smart Recommendation Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
              <span>Analyzes lift locations and prioritizes your building</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
              <span>Calculates distance from your current floor</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
              <span>Considers current occupancy and queue length</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
              <span>Factors in direction and movement patterns</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200 text-xs text-blue-700">
            <span className="font-semibold">Live Updates:</span> Data refreshes every 10 seconds · Recommendations update automatically when you change floors
          </div>
        </div>
      </div>
    </div>
  );
}
