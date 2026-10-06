import { createClient } from '@supabase/supabase-js';
import {
  WeatherStation,
  StationLocation,
  WeatherObservation,
  ReportAnalysis,
  HeatwavePrediction,
  Alert,
  User,
  UserFeedback,
  UserRole,
} from '@/types/database';
import {
  calculateHeatwaveRisk,
  fetchLiveWeatherFromOpenMeteo,
  derivePredictionAlertAndReport,
} from '@/lib/services/openmeteo';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zrvdlvqjayhewgvkyskl.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpydmRsdnFqYXloZXdndmt5c2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNzAyNjYsImV4cCI6MjA5NTk0NjI2Nn0.NHlTcmrpvEeEUD0BsEjHFzzeUSaxx2VDF7GWYLYq3Yk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Executes a promise with a fast timeout. If Supabase is unreachable or slow,
 * it fails fast without blocking the UI for minutes.
 */
async function withTimeout<T>(promiseLike: PromiseLike<T> | Promise<T>, timeoutMs = 1200): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Supabase request timeout')), timeoutMs);
  });
  return Promise.race([
    Promise.resolve(promiseLike),
    timeoutPromise,
  ]).finally(() => {
    clearTimeout(timer);
  });
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Default Indian Users
const DEFAULT_USERS: User[] = [
  {
    User_ID: 'a0000000-0000-0000-0000-000000000001',
    User_Name: 'sarthak (Chief Administrator)',
    Email: 'admin@climate-intel.in',
    Phone_no: '+91-98765-43210',
    DOB: '1988-05-15',
    Role: 'admin',
  },
  {
    User_ID: 'b0000000-0000-0000-0000-000000000002',
    User_Name: 'Rajesh Kumar (Field Climate Analyst)',
    Email: 'rajesh@climate-intel.in',
    Phone_no: '+91-98123-45678',
    DOB: '1995-09-24',
    Role: 'user',
  },
  {
    User_ID: 'c0000000-0000-0000-0000-000000000003',
    User_Name: 'Priya Sharma (Public Health Officer)',
    Email: 'priya@health.gov.in',
    Phone_no: '+91-97110-22334',
    DOB: '1992-11-05',
    Role: 'user',
  },
];

// Indian Weather Stations
const DEFAULT_STATIONS: WeatherStation[] = [
  { Station_ID: 1, Station_Code: 'ST-DEL-01', Station_Name: 'New Delhi Central Observatory', Latitude: 28.6139, Longitude: 77.2090, Status: 'Active', createdBy: undefined },
  { Station_ID: 2, Station_Code: 'ST-MUM-02', Station_Name: 'Mumbai Coastal Climate Station', Latitude: 18.9220, Longitude: 72.8347, Status: 'Active', createdBy: undefined },
  { Station_ID: 3, Station_Code: 'ST-KOL-03', Station_Name: 'Kolkata Alipore Observatory', Latitude: 22.5326, Longitude: 88.3278, Status: 'Active', createdBy: undefined },
  { Station_ID: 4, Station_Code: 'ST-CHE-04', Station_Name: 'Chennai Nungambakkam Post', Latitude: 13.0604, Longitude: 80.2496, Status: 'Active', createdBy: undefined },
  { Station_ID: 5, Station_Code: 'ST-BLR-05', Station_Name: 'Bengaluru Electronics City Unit', Latitude: 12.9716, Longitude: 77.5946, Status: 'Active', createdBy: undefined },
  { Station_ID: 6, Station_Code: 'ST-HYD-06', Station_Name: 'Hyderabad Begumpet Station', Latitude: 17.4435, Longitude: 78.4772, Status: 'Active', createdBy: undefined },
  { Station_ID: 7, Station_Code: 'ST-AHM-07', Station_Name: 'Ahmedabad Sabarmati Monitor', Latitude: 23.0225, Longitude: 72.5714, Status: 'Active', createdBy: undefined },
  { Station_ID: 8, Station_Code: 'ST-JAI-08', Station_Name: 'Jaipur Thar Fringe Observatory', Latitude: 26.9124, Longitude: 75.7873, Status: 'Active', createdBy: undefined },
];

const DEFAULT_LOCATIONS: StationLocation[] = [
  { Station_ID: 1, Location: 'Connaught Place, New Delhi, Delhi NCR, India' },
  { Station_ID: 2, Location: 'Colaba Coastal Zone, Mumbai, Maharashtra, India' },
  { Station_ID: 3, Location: 'Alipore Climate Campus, Kolkata, West Bengal, India' },
  { Station_ID: 4, Location: 'Nungambakkam Urban Post, Chennai, Tamil Nadu, India' },
  { Station_ID: 5, Location: 'Electronic City Sector 1, Bengaluru, Karnataka, India' },
  { Station_ID: 6, Location: 'Begumpet Met Office, Hyderabad, Telangana, India' },
  { Station_ID: 7, Location: 'Sabarmati Riverfront, Ahmedabad, Gujarat, India' },
  { Station_ID: 8, Location: 'Pink City Substation, Jaipur, Rajasthan, India' },
];

function initializeMockData() {
  if (typeof window === 'undefined') return;

  const cachedStations = localStorage.getItem('ci_stations');
  if (!cachedStations || cachedStations.includes('New York') || cachedStations.includes('ST-NY')) {
    localStorage.setItem('ci_stations', JSON.stringify(DEFAULT_STATIONS));
    localStorage.setItem('ci_locations', JSON.stringify(DEFAULT_LOCATIONS));
    localStorage.removeItem('ci_observations');
    localStorage.removeItem('ci_predictions');
    localStorage.removeItem('ci_alerts');
    localStorage.removeItem('ci_reports');
  }
  if (!localStorage.getItem('ci_locations')) {
    localStorage.setItem('ci_locations', JSON.stringify(DEFAULT_LOCATIONS));
  }
  if (!localStorage.getItem('ci_users')) {
    localStorage.setItem('ci_users', JSON.stringify(DEFAULT_USERS));
  }

  if (!localStorage.getItem('ci_observations')) {
    const obsList: WeatherObservation[] = [];
    const predList: HeatwavePrediction[] = [];
    const alertList: Alert[] = [];
    const reportList: ReportAnalysis[] = [];

    DEFAULT_STATIONS.forEach((station) => {
      const isHotRegion = [1, 3, 6, 7, 8].includes(station.Station_ID);
      const baseTemp = isHotRegion ? 41.0 : 32.0;

      for (let i = 5; i >= 0; i--) {
        const time = new Date(Date.now() - i * 3600 * 1000 * 4).toISOString();
        const temp = Math.round((baseTemp + (Math.random() * 5 - 2)) * 10) / 10;
        const humidity = Math.round((45 + Math.random() * 40) * 10) / 10;
        const rainfall = Math.random() > 0.85 ? Math.round(Math.random() * 15 * 10) / 10 : 0;
        const windSpeed = Math.round((6 + Math.random() * 16) * 10) / 10;

        const obsId = 1000 + obsList.length + 1;
        const obs: WeatherObservation = {
          Obs_ID: obsId,
          Station_ID: station.Station_ID,
          Recorded_At: time,
          Temperature: temp,
          Humidity: humidity,
          Rainfall: rainfall,
          Wind_Speed: windSpeed,
          Weather_Station: station,
        };
        obsList.push(obs);

        const risk = calculateHeatwaveRisk(temp, humidity, windSpeed);
        const predId = 2000 + predList.length + 1;
        const targetDate = new Date(Date.now() + (i + 1) * 86400000).toISOString();

        const pred: HeatwavePrediction = {
          Pre_ID: predId,
          Station_ID: station.Station_ID,
          Pre_Temp: risk.predictedTemp,
          Target_Data: targetDate,
          Risk_level: risk.riskLevel,
          Confidence_Percent: risk.confidencePercent,
          Weather_Station: station,
        };
        predList.push(pred);

        if (['Moderate', 'High', 'Extreme', 'Emergency'].includes(risk.riskLevel)) {
          const alertId = 3000 + alertList.length + 1;
          alertList.push({
            Alert_ID: alertId,
            Pre_ID: predId,
            Obs_ID: obsId,
            Alert_msg: `Heatwave Warning (${risk.riskLevel}): ${station.Station_Name} recorded ${temp}°C. ${risk.explanation}`,
            Severity_level: risk.riskLevel,
            Status: i === 0 ? 'Active' : 'Resolved',
            Heatwave_Prediction: pred,
            Weather_Observation: obs,
          });
        }

        reportList.push({
          R_ID: 4000 + reportList.length + 1,
          Obs_ID: obsId,
          Report_Type: `India Thermal Assessment - ${risk.riskLevel}`,
          Criteria: `Temp: ${temp}°C, RH: ${humidity}%, Heat Index: ${risk.heatIndex}°C`,
          Description: `Observation recorded at ${station.Station_Name}. ${risk.explanation}`,
          Generated_At: time,
          Weather_Observation: obs,
        });
      }
    });

    localStorage.setItem('ci_observations', JSON.stringify(obsList));
    localStorage.setItem('ci_predictions', JSON.stringify(predList));
    localStorage.setItem('ci_alerts', JSON.stringify(alertList));
    localStorage.setItem('ci_reports', JSON.stringify(reportList));
  }

  if (!localStorage.getItem('ci_feedback')) {
    const defaultFeedback: UserFeedback[] = [
      {
        F_ID: 1,
        User_ID: DEFAULT_USERS[0].User_ID,
        F_Type: 'Alert Accuracy',
        Comments: 'The early warning alert for New Delhi Connaught Place arrived 24h in advance. Highly reliable heat index model!',
        Rating: 5,
        Submitted_at: new Date(Date.now() - 86400000).toISOString(),
        User: DEFAULT_USERS[0],
      },
      {
        F_ID: 2,
        User_ID: DEFAULT_USERS[2].User_ID,
        F_Type: 'UI Request',
        Comments: 'Excellent Indian climate tracking interface. Great station analytics.',
        Rating: 5,
        Submitted_at: new Date(Date.now() - 172800000).toISOString(),
        User: DEFAULT_USERS[2],
      },
    ];
    localStorage.setItem('ci_feedback', JSON.stringify(defaultFeedback));
  }
}

export class ClimateDataService {
  static async getStations(currentUserId?: string): Promise<WeatherStation[]> {
    initializeMockData();
    let stationsList: WeatherStation[] = [];
    try {
      const { data, error } = await withTimeout(
        supabase.from('Weather_Station').select('*').order('Station_ID')
      );
      if (!error && data && data.length > 0) {
        stationsList = data.map((s: any) => ({
          ...s,
          createdBy: s.created_by || s.createdBy
        }));
      }
    } catch {}

    if (stationsList.length === 0 && typeof window !== 'undefined') {
      const local: WeatherStation[] = JSON.parse(localStorage.getItem('ci_stations') || '[]');
      if (local.length > 0) stationsList = local;
    }

    if (stationsList.length === 0) {
      stationsList = [...DEFAULT_STATIONS];
    }

    // Merge custom stations saved by the user
    if (typeof window !== 'undefined') {
      try {
        const customStations: WeatherStation[] = JSON.parse(localStorage.getItem('ci_user_custom_stations') || '[]');
        for (const cs of customStations) {
          cs.isCustom = true;
          const idx = stationsList.findIndex(s => s.Station_ID === cs.Station_ID || s.Station_Code === cs.Station_Code);
          if (idx !== -1) {
            stationsList[idx].isCustom = true;
            if (cs.createdBy) stationsList[idx].createdBy = cs.createdBy;
          } else {
            stationsList.unshift(cs);
          }
        }
      } catch (err) {
        console.error('Error loading custom stations:', err);
      }
    }

    return stationsList;
  }

  static async getLocations(): Promise<StationLocation[]> {
    initializeMockData();
    let locationsList: StationLocation[] = [];
    try {
      const { data, error } = await withTimeout(
        supabase.from('Station_Location').select('*')
      );
      if (!error && data && data.length > 0) locationsList = data;
    } catch {}

    if (locationsList.length === 0 && typeof window !== 'undefined') {
      locationsList = JSON.parse(localStorage.getItem('ci_locations') || '[]');
    }

    if (locationsList.length === 0) {
      locationsList = [...DEFAULT_LOCATIONS];
    }

    if (typeof window !== 'undefined') {
      try {
        const customLocations: StationLocation[] = JSON.parse(localStorage.getItem('ci_user_custom_locations') || '[]');
        for (const cl of customLocations) {
          if (!locationsList.some(l => l.Station_ID === cl.Station_ID && l.Location === cl.Location)) {
            locationsList.push(cl);
          }
        }
      } catch {}
    }

    return locationsList;
  }

  static async getObservations(): Promise<WeatherObservation[]> {
    initializeMockData();
    let supabaseData: WeatherObservation[] = [];
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('Weather_Observation')
          .select('*, Weather_Station(*)')
          .order('Recorded_At', { ascending: false })
      );
      if (!error && data && data.length > 0) supabaseData = data;
    } catch {}

    let localData: WeatherObservation[] = [];
    if (typeof window !== 'undefined') {
      localData = JSON.parse(localStorage.getItem('ci_observations') || '[]');
    }

    const stations = await this.getStations();
    const map = new Map<number, WeatherObservation>();

    for (const obs of supabaseData) {
      if (!obs.Weather_Station) {
        obs.Weather_Station = stations.find(s => Number(s.Station_ID) === Number(obs.Station_ID));
      }
      map.set(Number(obs.Obs_ID), obs);
    }

    for (const obs of localData) {
      if (!obs.Weather_Station) {
        obs.Weather_Station = stations.find(s => Number(s.Station_ID) === Number(obs.Station_ID));
      }
      map.set(Number(obs.Obs_ID), obs);
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.Recorded_At).getTime() - new Date(a.Recorded_At).getTime()
    );
  }

  static async getPredictions(): Promise<HeatwavePrediction[]> {
    initializeMockData();
    let supabaseData: HeatwavePrediction[] = [];
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('Heatwave_Prediction')
          .select('*, Weather_Station(*)')
          .order('Target_Data', { ascending: false })
      );
      if (!error && data && data.length > 0) supabaseData = data;
    } catch {}

    let localData: HeatwavePrediction[] = [];
    if (typeof window !== 'undefined') {
      localData = JSON.parse(localStorage.getItem('ci_predictions') || '[]');
    }

    const stations = await this.getStations();
    const map = new Map<number, HeatwavePrediction>();

    for (const p of supabaseData) {
      if (!p.Weather_Station) {
        p.Weather_Station = stations.find(s => Number(s.Station_ID) === Number(p.Station_ID));
      }
      map.set(Number(p.Pre_ID), p);
    }

    for (const p of localData) {
      if (!p.Weather_Station) {
        p.Weather_Station = stations.find(s => Number(s.Station_ID) === Number(p.Station_ID));
      }
      map.set(Number(p.Pre_ID), p);
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.Target_Data).getTime() - new Date(a.Target_Data).getTime()
    );
  }

  static async getAlerts(): Promise<Alert[]> {
    initializeMockData();
    let supabaseData: Alert[] = [];
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('Alert')
          .select('*, Heatwave_Prediction(*), Weather_Observation(*)')
          .order('Alert_ID', { ascending: false })
      );
      if (!error && data && data.length > 0) supabaseData = data;
    } catch {}

    let localData: Alert[] = [];
    if (typeof window !== 'undefined') {
      localData = JSON.parse(localStorage.getItem('ci_alerts') || '[]');
    }

    const stations = await this.getStations();
    const map = new Map<number, Alert>();

    for (const a of supabaseData) {
      if (a.Weather_Observation && !a.Weather_Observation.Weather_Station) {
        a.Weather_Observation.Weather_Station = stations.find(s => Number(s.Station_ID) === Number(a.Weather_Observation?.Station_ID));
      }
      map.set(Number(a.Alert_ID), a);
    }

    for (const a of localData) {
      if (a.Weather_Observation && !a.Weather_Observation.Weather_Station) {
        a.Weather_Observation.Weather_Station = stations.find(s => Number(s.Station_ID) === Number(a.Weather_Observation?.Station_ID));
      }
      map.set(Number(a.Alert_ID), a);
    }

    return Array.from(map.values()).sort((a, b) => Number(b.Alert_ID) - Number(a.Alert_ID));
  }

  static async getReports(): Promise<ReportAnalysis[]> {
    initializeMockData();
    let supabaseData: ReportAnalysis[] = [];
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('Report_Analysis')
          .select('*, Weather_Observation(*)')
          .order('Generated_At', { ascending: false })
      );
      if (!error && data && data.length > 0) supabaseData = data;
    } catch {}

    let localData: ReportAnalysis[] = [];
    if (typeof window !== 'undefined') {
      localData = JSON.parse(localStorage.getItem('ci_reports') || '[]');
    }

    const stations = await this.getStations();
    const map = new Map<number, ReportAnalysis>();

    for (const r of supabaseData) {
      if (r.Weather_Observation && !r.Weather_Observation.Weather_Station) {
        r.Weather_Observation.Weather_Station = stations.find(s => Number(s.Station_ID) === Number(r.Weather_Observation?.Station_ID));
      }
      map.set(Number(r.R_ID), r);
    }

    for (const r of localData) {
      if (r.Weather_Observation && !r.Weather_Observation.Weather_Station) {
        r.Weather_Observation.Weather_Station = stations.find(s => Number(s.Station_ID) === Number(r.Weather_Observation?.Station_ID));
      }
      map.set(Number(r.R_ID), r);
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.Generated_At).getTime() - new Date(a.Generated_At).getTime()
    );
  }

  static async getFeedbacks(): Promise<UserFeedback[]> {
    initializeMockData();
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('User_Feedback')
          .select('*, User(*)')
          .order('Submitted_at', { ascending: false }),
        4000
      );
      if (!error && data && data.length > 0) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('ci_feedback', JSON.stringify(data));
        }
        return data;
      }
    } catch (err) {
      console.warn('Supabase feedback fetch error:', err);
    }
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('ci_feedback') || '[]');
    }
    return [];
  }

  static async getUsers(): Promise<User[]> {
    initializeMockData();
    try {
      const { data, error } = await withTimeout(
        supabase.from('User').select('*').order('Role', { ascending: true }),
        4000
      );
      if (!error && data && data.length > 0) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('ci_users', JSON.stringify(data));
        }
        return data;
      }
    } catch {}
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('ci_users') || '[]');
    }
    return DEFAULT_USERS;
  }

  static async submitFeedback(
    user_id: string,
    f_type: string,
    comments: string,
    rating: number,
    userInfo?: { name?: string; email?: string }
  ): Promise<UserFeedback> {
    let validUserId = user_id;
    if (!validUserId || !validUserId.includes('-') || validUserId.length < 32) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        validUserId = crypto.randomUUID();
      } else {
        validUserId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      }
    }

    const users = await this.getUsers();
    let activeUser = users.find(u => u.User_ID === user_id || u.User_ID === validUserId);

    if (!activeUser) {
      const shortSuffix = validUserId.replace(/-/g, '').slice(0, 8);
      activeUser = {
        User_ID: validUserId,
        User_Name: userInfo?.name || 'Visitor',
        Email: userInfo?.email || `visitor_${shortSuffix}@climate-intel.local`,
        Phone_no: null,
        DOB: null,
        Role: 'user',
      };
    }

    const feedbackItem: UserFeedback = {
      F_ID: Math.floor(Math.random() * 900000) + 500000,
      User_ID: activeUser.User_ID,
      F_Type: f_type,
      Comments: comments,
      Rating: rating,
      Submitted_at: new Date().toISOString(),
      User: activeUser,
    };

    try {
      await withTimeout(
        supabase.from('User').upsert([
          {
            User_ID: activeUser.User_ID,
            User_Name: activeUser.User_Name,
            Email: activeUser.Email,
            Phone_no: activeUser.Phone_no,
            DOB: activeUser.DOB,
            Role: activeUser.Role,
          },
        ]),
        4000
      );

      const { data, error } = await withTimeout(
        supabase.from('User_Feedback').insert([
          {
            User_ID: activeUser.User_ID,
            F_Type: f_type,
            Comments: comments,
            Rating: rating,
          },
        ]).select('*, User(*)'),
        4000
      );

      if (error) {
        console.error('Supabase User_Feedback Insert Error:', error.message);
      } else if (data && data[0]) {
        feedbackItem.F_ID = data[0].F_ID;
        if (data[0].Submitted_at) feedbackItem.Submitted_at = data[0].Submitted_at;
        if (data[0].User) feedbackItem.User = data[0].User;
      }
    } catch (err) {
      console.error('Supabase submission exception:', err);
    }

    if (typeof window !== 'undefined') {
      const current = JSON.parse(localStorage.getItem('ci_feedback') || '[]');
      current.unshift(feedbackItem);
      localStorage.setItem('ci_feedback', JSON.stringify(current));
    }
    return feedbackItem;
  }

  static async addObservationAndAnalyze(obs: Partial<WeatherObservation>): Promise<{ obs: WeatherObservation; pred: HeatwavePrediction; alert: Alert | null; report: ReportAnalysis }> {
    const stations = await this.getStations();
    const station = stations.find(s => Number(s.Station_ID) === Number(obs.Station_ID)) || stations[0];

    const newObs: WeatherObservation = {
      Obs_ID: Math.floor(Math.random() * 900000) + 100000,
      Station_ID: Number(station.Station_ID),
      Recorded_At: obs.Recorded_At || new Date().toISOString(),
      Temperature: obs.Temperature !== undefined ? obs.Temperature : 28.0,
      Humidity: obs.Humidity !== undefined ? obs.Humidity : 55.0,
      Rainfall: obs.Rainfall !== undefined ? obs.Rainfall : 0.0,
      Wind_Speed: obs.Wind_Speed !== undefined ? obs.Wind_Speed : 10.0,
      Weather_Station: station,
    };

    const derived = derivePredictionAlertAndReport(newObs);

    try {
      await withTimeout(
        supabase.from('Weather_Observation').insert([
          {
            Station_ID: newObs.Station_ID,
            Recorded_At: newObs.Recorded_At,
            Temperature: newObs.Temperature,
            Humidity: newObs.Humidity,
            Rainfall: newObs.Rainfall,
            Wind_Speed: newObs.Wind_Speed,
          },
        ]),
        1000
      );
    } catch {}

    if (typeof window !== 'undefined') {
      const observations = JSON.parse(localStorage.getItem('ci_observations') || '[]');
      const predictions = JSON.parse(localStorage.getItem('ci_predictions') || '[]');
      const alerts = JSON.parse(localStorage.getItem('ci_alerts') || '[]');
      const reports = JSON.parse(localStorage.getItem('ci_reports') || '[]');

      observations.unshift(newObs);
      predictions.unshift(derived.prediction);
      if (derived.alert) alerts.unshift(derived.alert);
      reports.unshift(derived.report);

      localStorage.setItem('ci_observations', JSON.stringify(observations.slice(0, 100)));
      localStorage.setItem('ci_predictions', JSON.stringify(predictions.slice(0, 100)));
      localStorage.setItem('ci_alerts', JSON.stringify(alerts.slice(0, 100)));
      localStorage.setItem('ci_reports', JSON.stringify(reports.slice(0, 100)));
    }

    return { obs: newObs, pred: derived.prediction, alert: derived.alert, report: derived.report };
  }

  static async refreshLiveWeatherForStation(stationId: number) {
    const stations = await this.getStations();
    const station = stations.find(s => Number(s.Station_ID) === Number(stationId));
    if (!station) return;

    const liveData = await fetchLiveWeatherFromOpenMeteo(station.Latitude, station.Longitude);
    if (!liveData || !liveData.current) return;

    const temp = Math.round(liveData.current.temperature_2m * 10) / 10;
    const humidity = Math.round(liveData.current.relative_humidity_2m);
    const rainfall = Math.round((liveData.current.precipitation ?? 0) * 10) / 10;
    const wind = Math.round((liveData.current.wind_speed_10m ?? 10) * 10) / 10;

    // Fast batch seed recent history points without sequential network blocking
    if (typeof window !== 'undefined' && liveData.hourly && Array.isArray(liveData.hourly.time)) {
      const allObs: WeatherObservation[] = JSON.parse(localStorage.getItem('ci_observations') || '[]');
      const stationObs = allObs.filter(o => Number(o.Station_ID) === Number(stationId));
      if (stationObs.length < 3) {
        const times: string[] = liveData.hourly.time;
        const temps: number[] = liveData.hourly.temperature_2m;
        const humidities: number[] = liveData.hourly.relative_humidity_2m;
        const precipitations: number[] = liveData.hourly.precipitation;
        const winds: number[] = liveData.hourly.wind_speed_10m;

        let currentIndex = times.findIndex(t => new Date(t).getTime() > Date.now());
        if (currentIndex === -1) currentIndex = Math.min(24, times.length - 1);
        const startIndex = Math.max(0, currentIndex - 5);

        for (let i = startIndex; i < currentIndex; i++) {
          const obsItem: WeatherObservation = {
            Obs_ID: Math.floor(Math.random() * 900000) + 100000,
            Station_ID: station.Station_ID,
            Recorded_At: new Date(times[i]).toISOString(),
            Temperature: temps[i] ?? temp,
            Humidity: humidities[i] ?? humidity,
            Rainfall: precipitations[i] ?? 0,
            Wind_Speed: winds[i] ?? wind,
            Weather_Station: station,
          };
          const derived = derivePredictionAlertAndReport(obsItem);
          allObs.unshift(obsItem);
          const predictions = JSON.parse(localStorage.getItem('ci_predictions') || '[]');
          const alerts = JSON.parse(localStorage.getItem('ci_alerts') || '[]');
          const reports = JSON.parse(localStorage.getItem('ci_reports') || '[]');
          predictions.unshift(derived.prediction);
          if (derived.alert) alerts.unshift(derived.alert);
          reports.unshift(derived.report);
          localStorage.setItem('ci_predictions', JSON.stringify(predictions.slice(0, 100)));
          localStorage.setItem('ci_alerts', JSON.stringify(alerts.slice(0, 100)));
          localStorage.setItem('ci_reports', JSON.stringify(reports.slice(0, 100)));
        }
        localStorage.setItem('ci_observations', JSON.stringify(allObs.slice(0, 100)));
      }
    }

    return await this.addObservationAndAnalyze({
      Station_ID: station.Station_ID,
      Recorded_At: new Date().toISOString(),
      Temperature: temp,
      Humidity: humidity,
      Rainfall: rainfall,
      Wind_Speed: wind,
    });
  }

  static async updateAlertStatus(alertId: number, status: 'Active' | 'Resolved' | 'Dismissed') {
    try {
      await withTimeout(
        supabase.from('Alert').update({ Status: status }).eq('Alert_ID', alertId),
        1200
      );
    } catch {}

    if (typeof window !== 'undefined') {
      const alerts: Alert[] = JSON.parse(localStorage.getItem('ci_alerts') || '[]');
      const idx = alerts.findIndex(a => a.Alert_ID === alertId);
      if (idx !== -1) {
        alerts[idx].Status = status;
        localStorage.setItem('ci_alerts', JSON.stringify(alerts));
      }
    }
  }

  static async addStation(
    code: string,
    name: string,
    lat: number,
    lon: number,
    location: string,
    isCustom: boolean = true,
    userId?: string
  ): Promise<WeatherStation> {
    const stations = await this.getStations();
    const maxId = stations.reduce((max, s) => Math.max(max, Number(s.Station_ID) || 0), 0);
    let assignedId = Math.max(100, maxId + 1);

    const newStation: WeatherStation = {
      Station_ID: assignedId,
      Station_Code: code,
      Station_Name: name,
      Latitude: lat,
      Longitude: lon,
      Status: 'Active',
      isCustom,
      createdBy: userId,
    };

    try {
      const { data, error } = await withTimeout(
        supabase.from('Weather_Station').insert([
          {
            Station_Code: code,
            Station_Name: name,
            Latitude: lat,
            Longitude: lon,
            Status: 'Active',
            created_by: userId || null,
          },
        ]).select(),
        1500
      );

      if (!error && data && data[0]) {
        assignedId = Number(data[0].Station_ID);
        newStation.Station_ID = assignedId;
        newStation.createdBy = data[0].created_by || userId;
        await withTimeout(
          supabase.from('Station_Location').insert([
            {
              Station_ID: assignedId,
              Location: location,
            },
          ]),
          1500
        );
      }
    } catch (e) {
      console.warn('Supabase addStation fallback to local storage:', e);
    }

    if (typeof window !== 'undefined') {
      const currentStations: WeatherStation[] = JSON.parse(localStorage.getItem('ci_stations') || '[]');
      if (!currentStations.some(s => s.Station_ID === newStation.Station_ID)) {
        currentStations.push(newStation);
        localStorage.setItem('ci_stations', JSON.stringify(currentStations));
      }

      const currentLocations: StationLocation[] = JSON.parse(localStorage.getItem('ci_locations') || '[]');
      if (!currentLocations.some(l => l.Station_ID === newStation.Station_ID)) {
        currentLocations.push({ Station_ID: newStation.Station_ID, Location: location });
        localStorage.setItem('ci_locations', JSON.stringify(currentLocations));
      }

      if (isCustom) {
        const customStations: WeatherStation[] = JSON.parse(localStorage.getItem('ci_user_custom_stations') || '[]');
        if (!customStations.some(s => s.Station_ID === newStation.Station_ID || s.Station_Code === newStation.Station_Code)) {
          customStations.unshift(newStation);
          localStorage.setItem('ci_user_custom_stations', JSON.stringify(customStations));
        }

        const customLocations: StationLocation[] = JSON.parse(localStorage.getItem('ci_user_custom_locations') || '[]');
        if (!customLocations.some(l => l.Station_ID === newStation.Station_ID)) {
          customLocations.unshift({ Station_ID: newStation.Station_ID, Location: location });
          localStorage.setItem('ci_user_custom_locations', JSON.stringify(customLocations));
        }
      }
    }

    return newStation;
  }

  static async deleteStation(stationId: number): Promise<boolean> {
    try {
      await withTimeout(
        Promise.all([
          supabase.from('Weather_Station').delete().eq('Station_ID', stationId),
          supabase.from('Station_Location').delete().eq('Station_ID', stationId),
        ]),
        1500
      );
    } catch {}

    if (typeof window !== 'undefined') {
      const customStations: WeatherStation[] = JSON.parse(localStorage.getItem('ci_user_custom_stations') || '[]');
      localStorage.setItem('ci_user_custom_stations', JSON.stringify(customStations.filter(s => s.Station_ID !== stationId)));

      const customLocations: StationLocation[] = JSON.parse(localStorage.getItem('ci_user_custom_locations') || '[]');
      localStorage.setItem('ci_user_custom_locations', JSON.stringify(customLocations.filter(l => l.Station_ID !== stationId)));

      const currentStations: WeatherStation[] = JSON.parse(localStorage.getItem('ci_stations') || '[]');
      localStorage.setItem('ci_stations', JSON.stringify(currentStations.filter(s => s.Station_ID !== stationId)));

      const currentLocations: StationLocation[] = JSON.parse(localStorage.getItem('ci_locations') || '[]');
      localStorage.setItem('ci_locations', JSON.stringify(currentLocations.filter(l => l.Station_ID !== stationId)));

      const selected = localStorage.getItem('ci_selected_station_id');
      if (selected && Number(selected) === stationId) {
        localStorage.removeItem('ci_selected_station_id');
      }
    }

    return true;
  }

  static async updateUserRole(userId: string, newRole: UserRole) {
    try {
      await withTimeout(
        supabase.from('User').update({ Role: newRole }).eq('User_ID', userId),
        1500
      );
    } catch {}

    if (typeof window !== 'undefined') {
      const users: User[] = JSON.parse(localStorage.getItem('ci_users') || '[]');
      const idx = users.findIndex(u => u.User_ID === userId);
      if (idx !== -1) {
        users[idx].Role = newRole;
        localStorage.setItem('ci_users', JSON.stringify(users));
      }
    }
  }
}