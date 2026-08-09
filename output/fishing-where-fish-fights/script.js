import { auth } from './auth/auth.js';
import { api } from './api/api.js';
import { gameService } from './services/gameService.js';

window.addEventListener('load', () => {
  if (!auth.isAuthenticated()) {
    auth.login('player', 'pass');
  }
  gameService.init();
});