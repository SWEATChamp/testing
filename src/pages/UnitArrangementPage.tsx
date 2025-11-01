import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Send, Sparkles, Calendar, BookOpen, Globe } from 'lucide-react';
import { Course, CourseModule, CourseStructure } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UserData {
  course: string;
  courseId: string;
  intake: string;
  electives: string[];
  overseas: boolean;
}

interface ModuleWithStructure extends CourseModule {
  structure: CourseStructure;
}

export function UnitArrangementPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI course advisor. I'll help you plan your academic journey. Let's start by getting to know your preferences. What course are you enrolled in?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState(0);
  const [userData, setUserData] = useState<UserData>({
    course: '',
    courseId: '',
    intake: '',
    electives: [],
    overseas: false,
  });
  const [courseMap, setCourseMap] = useState<any>(null);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [availableModules, setAvailableModules] = useState<ModuleWithStructure[]>([]);
  const [userUniversityId, setUserUniversityId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('university_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.university_id) {
      setUserUniversityId(profile.university_id);
      await loadCourses(profile.university_id);
    }
  };

  const loadCourses = async (universityId: string) => {
    const { data: courses } = await supabase
      .from('courses')
      .select('*')
      .eq('university_id', universityId)
      .order('name');

    if (courses && courses.length > 0) {
      setAvailableCourses(courses);

      if (messages.length === 1) {
        const courseOptions = courses.map((c, i) => `${i + 1}. ${c.name}`).join('\n');
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Here are the available programs at your university:\n\n${courseOptions}\n\nPlease enter the number or name of your chosen program.`,
          },
        ]);
        setStep(1);
      }
    }
  };

  const loadCourseModules = async (courseId: string) => {
    const { data: structures } = await supabase
      .from('course_structure')
      .select(`
        *,
        course_module:course_id (*)
      `)
      .eq('degree_program_id', courseId)
      .order('recommended_year')
      .order('recommended_semester');

    if (structures) {
      const modules: ModuleWithStructure[] = structures.map((s: any) => ({
        ...s.course_module,
        structure: {
          id: s.id,
          degree_program_id: s.degree_program_id,
          course_id: s.course_id,
          parent_course_id: s.parent_course_id,
          is_core: s.is_core,
          recommended_year: s.recommended_year,
          recommended_semester: s.recommended_semester,
          created_at: s.created_at,
        },
      }));
      setAvailableModules(modules);
    }
  };

  const generateCourseMap = (data: UserData, modules: ModuleWithStructure[]) => {
    const semesters: any[] = [];
    const years = Math.max(...modules.map((m) => m.structure.recommended_year));

    for (let year = 1; year <= years; year++) {
      for (let sem = 1; sem <= 2; sem++) {
        if (data.overseas && year === 3 && sem === 1) {
          semesters.push({
            year,
            semester: sem,
            name: 'Overseas Exchange Program',
            units: [
              { code: 'EXCHANGE', name: 'Study Abroad', credits: 12, type: 'Exchange' },
            ],
          });
          continue;
        }

        const semesterModules = modules.filter(
          (m) =>
            m.structure.recommended_year === year &&
            m.structure.recommended_semester === sem
        );

        if (semesterModules.length > 0) {
          semesters.push({
            year,
            semester: sem,
            name: `Year ${year} - Semester ${sem}`,
            units: semesterModules.map((m) => ({
              code: m.code,
              name: m.name,
              credits: m.credits,
              type: m.structure.is_core ? 'Core' : 'Elective',
            })),
          });
        }
      }
    }

    return semesters;
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    setTimeout(async () => {
      let assistantResponse = '';
      let newStep = step;

      if (step === 1) {
        const courseIndex = parseInt(userMessage) - 1;
        let selectedCourse: Course | undefined;

        if (!isNaN(courseIndex) && courseIndex >= 0 && courseIndex < availableCourses.length) {
          selectedCourse = availableCourses[courseIndex];
        } else {
          selectedCourse = availableCourses.find((c) =>
            c.name.toLowerCase().includes(userMessage.toLowerCase())
          );
        }

        if (selectedCourse) {
          setUserData((prev) => ({
            ...prev,
            course: selectedCourse!.name,
            courseId: selectedCourse!.id,
          }));
          await loadCourseModules(selectedCourse.id);
          assistantResponse = `Great! ${selectedCourse.name} is an excellent choice. When is your intake? (e.g., January 2025, September 2024)`;
          newStep = 2;
        } else {
          assistantResponse = 'I could not find that course. Please enter the number or name from the list above.';
          newStep = 1;
        }
      } else if (step === 2) {
        setUserData((prev) => ({ ...prev, intake: userMessage }));

        const electives = availableModules.filter((m) => !m.structure.is_core);
        if (electives.length > 0) {
          const electiveList = electives.map((e) => `${e.code} - ${e.name}`).join(', ');
          assistantResponse = `Perfect! Starting in ${userMessage}. Would you like to choose any specific electives? Available electives: ${electiveList}. (You can type "Skip" if you want to use recommended electives)`;
          newStep = 3;
        } else {
          assistantResponse = `Perfect! Starting in ${userMessage}. Are you interested in participating in an overseas exchange program? (Yes/No)`;
          newStep = 4;
        }
      } else if (step === 3) {
        const electives = userMessage.toLowerCase() === 'skip'
          ? []
          : userMessage.split(',').map((e) => e.trim());
        setUserData((prev) => ({ ...prev, electives }));
        assistantResponse = `Excellent! Are you interested in participating in an overseas exchange program? (Yes/No)`;
        newStep = 4;
      } else if (step === 4) {
        const overseas = userMessage.toLowerCase().includes('yes');
        const finalData = { ...userData, overseas };
        setUserData(finalData);

        const map = generateCourseMap(finalData, availableModules);
        setCourseMap(map);

        assistantResponse = `Perfect! I have created a personalized course map for you. Based on your preferences:\n\n• Course: ${finalData.course}\n• Intake: ${finalData.intake}\n• Overseas Program: ${overseas ? 'Yes' : 'No'}\n\nYour course map is displayed below. I have arranged your modules considering prerequisites and optimal semester loadings. ${overseas ? 'I have reserved Year 3 Semester 1 for your overseas exchange program.' : ''}`;
        newStep = 5;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantResponse }]);
      setStep(newStep);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white shadow-lg">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 mb-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Adaptive Study Planner</h1>
              <p className="text-blue-100 text-sm">Plan your academic journey with AI assistance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
                <Sparkles className="text-blue-600" size={20} />
                <span>AI Course Advisor</span>
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 p-4 rounded-2xl">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your response..."
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isTyping || step === 5}
                />
                <button
                  onClick={handleSend}
                  disabled={isTyping || !input.trim() || step === 5}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <BookOpen className="text-blue-600" size={20} />
              <span>Your Information</span>
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600 mb-1">Course</div>
                <div className="font-medium text-slate-800">{userData.course || 'Not set'}</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600 mb-1 flex items-center space-x-1">
                  <Calendar size={14} />
                  <span>Intake</span>
                </div>
                <div className="font-medium text-slate-800">{userData.intake || 'Not set'}</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600 mb-1">Preferred Electives</div>
                <div className="font-medium text-slate-800">
                  {userData.electives.length > 0 ? userData.electives.join(', ') : 'Not set'}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600 mb-1 flex items-center space-x-1">
                  <Globe size={14} />
                  <span>Overseas Program</span>
                </div>
                <div className="font-medium text-slate-800">
                  {userData.overseas ? 'Yes' : step >= 5 ? 'No' : 'Not set'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {courseMap && (
          <div className="mt-6 bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Your Personalized Course Map</h2>

            <div className="space-y-6">
              {courseMap.map((semester: any, index: number) => (
                <div key={index} className="border border-slate-200 rounded-lg p-6 bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">{semester.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {semester.units.map((unit: any, unitIndex: number) => (
                      <div
                        key={unitIndex}
                        className={`p-4 rounded-lg border-2 ${
                          unit.type === 'Core'
                            ? 'bg-blue-50 border-blue-200'
                            : unit.type === 'Elective'
                            ? 'bg-green-50 border-green-200'
                            : 'bg-amber-50 border-amber-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-slate-800">{unit.code}</div>
                          <div
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              unit.type === 'Core'
                                ? 'bg-blue-200 text-blue-800'
                                : unit.type === 'Elective'
                                ? 'bg-green-200 text-green-800'
                                : 'bg-amber-200 text-amber-800'
                            }`}
                          >
                            {unit.type}
                          </div>
                        </div>
                        <div className="text-sm text-slate-700 mb-2">{unit.name}</div>
                        <div className="text-xs text-slate-600">{unit.credits} Credits</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
