export const mockCourses = [
  {
    _id: '1', title: 'Redes de Telecomunicações', description: 'Fundamentos de redes de dados, protocolos TCP/IP, topologias e infraestrutura de telecomunicações modernas.',
    date: '2025-08-15', time: '19:00', professor: { _id: 'p1', name: 'Prof. Carlos Mendes' },
    maxSlots: 30, enrolledCount: 18, availableSlots: 12, status: 'published', imageUrl: null,
  },
  {
    _id: '2', title: 'Sistemas Embarcados', description: 'Programação de microcontroladores, sensores IoT e desenvolvimento de sistemas embarcados para aplicações industriais.',
    date: '2025-08-22', time: '14:00', professor: { _id: 'p2', name: 'Profa. Ana Lucia' },
    maxSlots: 25, enrolledCount: 25, availableSlots: 0, status: 'published', imageUrl: null,
  },
  {
    _id: '3', title: 'Segurança em Redes', description: 'Cibersegurança, criptografia, firewall, VPN e boas práticas para proteção de infraestrutura de TI.',
    date: '2025-09-05', time: '18:30', professor: { _id: 'p1', name: 'Prof. Carlos Mendes' },
    maxSlots: 20, enrolledCount: 7, availableSlots: 13, status: 'published', imageUrl: null,
  },
  {
    _id: '4', title: 'Comunicações Ópticas', description: 'Fibra óptica, multiplexação WDM, amplificadores ópticos e sistemas de transmissão de alta velocidade.',
    date: '2025-09-12', time: '09:00', professor: { _id: 'p3', name: 'Prof. Ricardo Alves' },
    maxSlots: 15, enrolledCount: 3, availableSlots: 12, status: 'published', imageUrl: null,
  },
  {
    _id: '5', title: 'Antenas e Propagação', description: 'Teoria de antenas, propagação de ondas eletromagnéticas, projeto de sistemas de comunicação sem fio.',
    date: '2025-09-20', time: '16:00', professor: { _id: 'p2', name: 'Profa. Ana Lucia' },
    maxSlots: 20, enrolledCount: 11, availableSlots: 9, status: 'published', imageUrl: null,
  },
  {
    _id: '6', title: 'Processamento de Sinais', description: 'Análise de Fourier, filtros digitais, processamento de áudio e vídeo e aplicações em telecomunicações.',
    date: '2025-10-01', time: '18:00', professor: { _id: 'p3', name: 'Prof. Ricardo Alves' },
    maxSlots: 30, enrolledCount: 5, availableSlots: 25, status: 'published', imageUrl: null,
  },
]

export const mockPartners = [
  'Embratel', 'Claro', 'Ericsson', 'Huawei', 'Cisco', 'Nokia', 'Anatel', 'TIM', 'Vivo', 'OI Telecom',
]
