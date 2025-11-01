import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserCircle2, School, ArrowUpDown, Car, ParkingSquare, BookOpen, Utensils, CalendarDays } from 'lucide-react';
import { VoiceAssistant } from './VoiceAssistant';

export function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Auri - SmartU
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/account')}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg"
                title="My Account"
              >
                <UserCircle2 size={24} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Campus Overview</h2>
            <p className="text-slate-600">Quick access to campus facilities</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button
              onClick={() => navigate('/classrooms')}
              className="bg-white rounded-xl shadow-lg p-8 border border-slate-200 hover:shadow-xl hover:scale-105 transition-all group"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-cyan-200 transition-all">
                  <School className="text-blue-600" size={48} />
                </div>
                <span className="text-xl font-bold text-slate-800">Smart Classroom Finder</span>
              </div>
            </button>

            <button
              onClick={() => navigate('/lift-tracker')}
              className="bg-white rounded-xl shadow-lg p-8 border border-slate-200 hover:shadow-xl hover:scale-105 transition-all group"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-24 h-24 bg-gradient-to-br from-teal-100 to-green-100 rounded-2xl flex items-center justify-center group-hover:from-teal-200 group-hover:to-green-200 transition-all">
                  <ArrowUpDown className="text-teal-600" size={48} />
                </div>
                <span className="text-xl font-bold text-slate-800">Lift Recommender</span>
              </div>
            </button>

            <button className="bg-white rounded-xl shadow-lg p-8 border border-slate-200 hover:shadow-xl hover:scale-105 transition-all group">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl flex items-center justify-center group-hover:from-orange-200 group-hover:to-red-200 transition-all">
                  <Car className="text-orange-600" size={48} />
                </div>
                <span className="text-xl font-bold text-slate-800">Traffic Status</span>
              </div>
            </button>

            <button className="bg-white rounded-xl shadow-lg p-8 border border-slate-200 hover:shadow-xl hover:scale-105 transition-all group">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-24 h-24 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center group-hover:from-violet-200 group-hover:to-purple-200 transition-all">
                  <ParkingSquare className="text-violet-600" size={48} />
                </div>
                <span className="text-xl font-bold text-slate-800">Parking</span>
              </div>
            </button>

            <button className="bg-white rounded-xl shadow-lg p-8 border border-slate-200 hover:shadow-xl hover:scale-105 transition-all group">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl flex items-center justify-center group-hover:from-amber-200 group-hover:to-yellow-200 transition-all">
                  <BookOpen className="text-amber-600" size={48} />
                </div>
                <span className="text-xl font-bold text-slate-800">Library Seats</span>
              </div>
            </button>

            <button className="bg-white rounded-xl shadow-lg p-8 border border-slate-200 hover:shadow-xl hover:scale-105 transition-all group">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-24 h-24 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl flex items-center justify-center group-hover:from-rose-200 group-hover:to-pink-200 transition-all">
                  <Utensils className="text-rose-600" size={48} />
                </div>
                <span className="text-xl font-bold text-slate-800">Canteen Seats</span>
              </div>
            </button>

            <button
              onClick={() => navigate('/unit-arrangement')}
              className="bg-white rounded-xl shadow-lg p-8 border border-slate-200 hover:shadow-xl hover:scale-105 transition-all group"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl flex items-center justify-center group-hover:from-indigo-200 group-hover:to-blue-200 transition-all">
                  <CalendarDays className="text-indigo-600" size={48} />
                </div>
                <span className="text-xl font-bold text-slate-800">Adaptive Study Planner</span>
              </div>
            </button>
          </div>
        </div>
      </main>

      <VoiceAssistant onCommand={(cmd) => {
        if (cmd === 'classroom') navigate('/classrooms');
      }} />
    </div>
  );
}
