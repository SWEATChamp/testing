export interface Classroom {
  id: string;
  building: string;
  room_number: string;
  capacity: number;
  is_available: boolean;
  available_until: string | null;
  facilities: string[];
  floor: number;
  last_updated: string;
}

export interface Lift {
  id: string;
  building: string;
  lift_id: string;
  current_floor: number;
  direction: 'up' | 'down' | 'idle';
  crowd_level: number;
  estimated_wait_time: number;
  last_updated: string;
}

export interface ParkingLot {
  id: string;
  zone: string;
  total_spaces: number;
  available_spaces: number;
  last_updated: string;
}

export interface LibrarySeat {
  id: string;
  floor: number;
  zone: string;
  total_seats: number;
  available_seats: number;
  last_updated: string;
}

export interface FoodStall {
  id: string;
  name: string;
  location: string;
  total_seats: number;
  available_seats: number;
  queue_length: number;
  last_updated: string;
}

export interface POI {
  id: string;
  name: string;
  address: string;
  is_default: boolean;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface POITraffic {
  id: string;
  poi_id: string;
  commute_time_minutes: number;
  traffic_level: 'low' | 'moderate' | 'heavy' | 'severe';
  last_updated: string;
  poi?: POI;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  duration_years: number;
  total_credits: number;
  university_id: string;
  created_at: string;
}

export interface CourseModule {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester_offered: number[];
  prerequisites: string[];
  description: string;
  university_id: string;
  degree_program_id: string | null;
  parent_course_id: string | null;
  is_core: boolean;
  recommended_year: number | null;
  recommended_semester: number | null;
}
