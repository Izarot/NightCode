export const auth = {
  isAuthenticated: () => !!localStorage.getItem('token'),
  login: (username, password) => {
    // In real app, verify credentials; here just set a token
    localStorage.setItem('token', 'fake-token');
    return true;
  },
  logout: () => {
    localStorage.removeItem('token');
  }
};