// src/utils/api.js
// Centralised API helper — all backend calls go through here

const BASE = 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
}

function headers(withAuth = true) {
  const h = { 'Content-Type': 'application/json' };
  if (withAuth) h['Authorization'] = 'Bearer ' + getToken();
  return h;
}

async function request(method, path, body = null, auth = true) {
  const opts = { method, headers: headers(auth) };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(BASE + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login:       (body) => request('POST', '/auth/login',    body, false),
  register:    (body) => request('POST', '/auth/register', body, false),
  clubsList:   ()     => request('GET',  '/auth/clubs-list', null, false),

  // Clubs
  getClubs:        ()       => request('GET',  '/clubs'),
  getClub:         (id)     => request('GET',  `/clubs/${id}`),
  createClub:      (body)   => request('POST', '/clubs', body),
  registerClub:    (clubId) => request('POST', '/clubs/register', { clubId }),

  // Events
  getEvents:       ()       => request('GET',  '/events'),
  createEvent:     (body)   => request('POST', '/events', body),
  registerEvent:   (eventId)=> request('POST', '/events/register', { eventId }),
  deleteEvent:     (id)     => request('DELETE', `/events/${id}`),

  // Interests
  getInterests:    ()         => request('GET',  '/interests/my'),
  saveInterests:   (interests)=> request('POST', '/interests/save', { interests }),
  getRecommended:  ()         => request('GET',  '/interests/recommendations'),

  // Registrations
  getMyRequests:   ()              => request('GET',   '/registrations/my'),
  getClubRequests: ()              => request('GET',   '/registrations/club-requests'),
  updateStatus:    (id, status)    => request('PATCH', `/registrations/${id}/status`, { status }),


  // Update Profile - Change this
  updateProfile: (data) => request('PUT', '/auth/profile', data),
};

