import axios from 'axios';

const http = axios.create({ baseURL: '/api', timeout: 10000 });

export const fetchSkills = (params = {}) => http.get('/skills', { params }).then(r => r.data);
export const fetchSkill = (slug) => http.get(`/skills/${slug}`).then(r => r.data);
export const fetchStages = () => http.get('/meta/stages').then(r => r.data.stages);
export const fetchLabels = () => http.get('/meta/labels').then(r => r.data.labels);
