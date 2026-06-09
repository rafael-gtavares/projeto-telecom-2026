import huaweiLogo from '../assets/logo-huawei.svg'
import ciscoLogo from '../assets/logo-cisco.svg'
import mikrotikLogo from '../assets/logo-mikrotik.svg'
import telcoLogo from '../assets/logo-telco.svg'

// Fallback usado quando a API não responde — mesmo formato do backend
// (startDate/endDate, scheduleType, scheduleConfig, modality, location, instructor...)
export const mockCourses = [
  {
    _id: '1', title: 'Redes de Telecomunicações',
    description: 'Fundamentos de redes de dados, protocolos TCP/IP, topologias e infraestrutura de telecomunicações modernas.',
    startDate: '2026-08-15', endDate: '2026-08-15',
    scheduleType: 'single',
    scheduleConfig: [{ date: '2026-08-15', startTime: '19:00', endTime: '22:00' }],
    modality: 'presencial', location: 'Campus Maracanã — Lab 305',
    professor: { _id: 'p1', name: 'Prof. Carlos Mendes' }, instructor: 'Prof. Carlos Mendes',
    maxSlots: 30, enrolledCount: 18, availableSlots: 12, status: 'published', imageUrl: null, isEnrolled: false,
  },
  {
    _id: '2', title: 'Sistemas Embarcados',
    description: 'Programação de microcontroladores, sensores IoT e desenvolvimento de sistemas embarcados para aplicações industriais.',
    startDate: '2026-08-22', endDate: '2026-08-22',
    scheduleType: 'single',
    scheduleConfig: [{ date: '2026-08-22', startTime: '14:00', endTime: '17:00' }],
    modality: 'palestra', location: 'Auditório Principal',
    professor: { _id: 'p2', name: 'Profa. Ana Lucia' }, instructor: 'Profa. Ana Lucia',
    maxSlots: 25, enrolledCount: 25, availableSlots: 0, status: 'published', imageUrl: null, isEnrolled: false,
  },
  {
    _id: '3', title: 'Segurança em Redes',
    description: 'Cibersegurança, criptografia, firewall, VPN e boas práticas para proteção de infraestrutura de TI.',
    startDate: '2026-09-05', endDate: '2026-10-24',
    scheduleType: 'weekly',
    scheduleConfig: [
      { weekday: 2, startTime: '18:30', endTime: '21:00' },
      { weekday: 4, startTime: '18:30', endTime: '21:00' },
    ],
    modality: 'semi_presencial', location: 'Campus Maracanã — Lab 210',
    professor: { _id: 'p1', name: 'Prof. Carlos Mendes' }, instructor: 'Prof. Carlos Mendes',
    maxSlots: 20, enrolledCount: 7, availableSlots: 13, status: 'published', imageUrl: null, isEnrolled: false,
  },
  {
    _id: '4', title: 'Comunicações Ópticas',
    description: 'Fibra óptica, multiplexação WDM, amplificadores ópticos e sistemas de transmissão de alta velocidade.',
    startDate: '2026-09-12', endDate: '2026-09-12',
    scheduleType: 'single',
    scheduleConfig: [{ date: '2026-09-12', startTime: '09:00', endTime: '12:00' }],
    modality: 'workshop', location: 'Campus Maracanã — Lab 110',
    professor: { _id: 'p3', name: 'Prof. Ricardo Alves' }, instructor: 'Prof. Ricardo Alves',
    maxSlots: 15, enrolledCount: 3, availableSlots: 12, status: 'published', imageUrl: null, isEnrolled: false,
  },
  {
    _id: '5', title: 'Antenas e Propagação',
    description: 'Teoria de antenas, propagação de ondas eletromagnéticas, projeto de sistemas de comunicação sem fio.',
    startDate: '2026-09-20', endDate: '2026-09-27',
    scheduleType: 'custom',
    scheduleConfig: [
      { date: '2026-09-20', startTime: '16:00', endTime: '19:00' },
      { date: '2026-09-27', startTime: '16:00', endTime: '19:00' },
    ],
    modality: 'ead', location: 'Online — Google Meet',
    professor: { _id: 'p2', name: 'Profa. Ana Lucia' }, instructor: 'Profa. Ana Lucia',
    maxSlots: 20, enrolledCount: 11, availableSlots: 9, status: 'published', imageUrl: null, isEnrolled: false,
  },
  {
    _id: '6', title: 'Processamento de Sinais',
    description: 'Análise de Fourier, filtros digitais, processamento de áudio e vídeo e aplicações em telecomunicações.',
    startDate: '2026-10-01', endDate: '2026-10-01',
    scheduleType: 'single',
    scheduleConfig: [{ date: '2026-10-01', startTime: '18:00', endTime: '21:00' }],
    modality: 'presencial', location: 'Campus Maracanã — Lab 305',
    professor: { _id: 'p3', name: 'Prof. Ricardo Alves' }, instructor: 'Prof. Ricardo Alves',
    maxSlots: 30, enrolledCount: 5, availableSlots: 25, status: 'published', imageUrl: null, isEnrolled: false,
  },
]

export const mockPartners = [
  {
    name: 'Huawei',
    logo: huaweiLogo,
  },
  {
    name: 'Cisco',
    logo: ciscoLogo,
  },
  {
    name: 'Mikrotik',
    logo: mikrotikLogo,
  },
  {
    name: 'Telco',
    logo: telcoLogo,
  },
]